/**
 * Contrôleur de génération de titres IA
 * Gère la création, la sauvegarde et l'analyse des titres
 */

const { validationResult } = require('express-validator');
const Title = require('../models/Title');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');
const openaiService = require('../config/openai');

/**
 * Générer des titres avec IA
 * POST /api/titles/generate
 */
exports.generateTitles = async (req, res, next) => {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(errors.array().map(e => e.msg).join(', '), 400);
    }

    const { subject, tone = 'viral', audience = 'grand public', platform = 'youtube' } = req.body;

    // Vérifier les limites d'utilisation
    const user = await User.findById(req.user.id);
    
    if (!user.canGenerateTitles()) {
      throw new AppError(
        'Limite de générations atteinte. Passez à premium pour des générations illimitées!',
        403
      );
    }

    // Générer les titres avec OpenAI
    const generatedTitles = await openaiService.generateTitles(subject, tone, audience);

    // Incrémenter le compteur d'utilisation
    user.incrementUsage('title');
    await user.save();

    // Sauvegarder dans la base de données
    const titleRecord = await Title.create({
      user: req.user.id,
      subject,
      tone,
      audience,
      platform,
      generatedTitles: generatedTitles.map(t => ({
        text: t.text,
        viralityScore: t.viralityScore,
        reason: t.reason,
        isFavorite: false
      }))
    });

    res.status(200).json({
      success: true,
      message: 'Titres générés avec succès',
      data: {
        id: titleRecord._id,
        subject,
        tone,
        audience,
        titles: titleRecord.generatedTitles,
        usage: {
          used: user.usage.titleGenerations.count,
          limit: user.subscription.plan === 'premium' ? 'illimité' : user.usage.titleGenerations.limit
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Analyser un titre avec IA (SEO)
 * POST /api/titles/analyze
 */
exports.analyzeTitle = async (req, res, next) => {
  try {
    const { title, subject } = req.body;

    if (!title || !subject) {
      throw new AppError('Veuillez fournir un titre et un sujet', 400);
    }

    // Analyser le titre avec OpenAI
    const seoAnalysis = await openaiService.analyzeTitleSEO(title, subject);

    res.status(200).json({
      success: true,
      data: {
        title,
        analysis: seoAnalysis
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Marquer un titre comme favori
 * PUT /api/titles/:id/favorite
 */
exports.favoriteTitle = async (req, res, next) => {
  try {
    const { titleText } = req.body;

    if (!titleText) {
      throw new AppError('Veuillez fournir le texte du titre', 400);
    }

    const titleRecord = await Title.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!titleRecord) {
      throw new AppError('Titre non trouvé', 404);
    }

    const title = titleRecord.favoriteTitle(titleText);

    if (!title) {
      throw new AppError('Titre spécifique non trouvé', 404);
    }

    await titleRecord.save();

    res.status(200).json({
      success: true,
      message: 'Titre ajouté aux favoris',
      data: {
        title
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Sélectionner un titre
 * PUT /api/titles/:id/select
 */
exports.selectTitle = async (req, res, next) => {
  try {
    const { titleText } = req.body;

    if (!titleText) {
      throw new AppError('Veuillez fournir le texte du titre', 400);
    }

    const titleRecord = await Title.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!titleRecord) {
      throw new AppError('Titre non trouvé', 404);
    }

    const selectedTitle = titleRecord.generatedTitles.find(t => t.text === titleText);

    if (!selectedTitle) {
      throw new AppError('Titre spécifique non trouvé', 404);
    }

    titleRecord.selectedTitle = {
      text: selectedTitle.text,
      viralityScore: selectedTitle.viralityScore
    };

    await titleRecord.save();

    res.status(200).json({
      success: true,
      message: 'Titre sélectionné avec succès',
      data: {
        selectedTitle: titleRecord.selectedTitle
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtenir l'historique des titres
 * GET /api/titles/history
 */
exports.getTitleHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search } = req.query;

    const query = { user: req.user.id };
    
    if (search) {
      query.$text = { $search: search };
    }

    const titles = await Title.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const count = await Title.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        titles,
        pagination: {
          total: count,
          page: parseInt(page),
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtenir un titre spécifique
 * GET /api/titles/:id
 */
exports.getTitleById = async (req, res, next) => {
  try {
    const title = await Title.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!title) {
      throw new AppError('Titre non trouvé', 404);
    }

    res.status(200).json({
      success: true,
      data: { title }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Supprimer un titre
 * DELETE /api/titles/:id
 */
exports.deleteTitle = async (req, res, next) => {
  try {
    const title = await Title.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!title) {
      throw new AppError('Titre non trouvé', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Titre supprimé avec succès'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtenir les titres favoris
 * GET /api/titles/favorites
 */
exports.getFavoriteTitles = async (req, res, next) => {
  try {
    const titles = await Title.find({
      user: req.user.id,
      'generatedTitles.isFavorite': true
    }).lean();

    // Extraire uniquement les titres favoris
    const favoriteTitles = [];
    titles.forEach(title => {
      const favorites = title.generatedTitles.filter(t => t.isFavorite);
      favorites.forEach(fav => {
        favoriteTitles.push({
          ...fav,
          subject: title.subject,
          createdAt: title.createdAt
        });
      });
    });

    res.status(200).json({
      success: true,
      data: {
        titles: favoriteTitles
      }
    });
  } catch (error) {
    next(error);
  }
};
