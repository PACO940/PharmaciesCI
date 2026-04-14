/**
 * Contrôleur de miniatures (Thumbnails)
 * Gère la création, l'édition et l'export des miniatures
 */

const path = require('path');
const fs = require('fs').promises;
const { validationResult } = require('express-validator');
const Thumbnail = require('../models/Thumbnail');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');
const openaiService = require('../config/openai');

/**
 * Générer des idées de miniatures avec IA
 * POST /api/thumbnails/generate-ideas
 */
exports.generateThumbnailIdeas = async (req, res, next) => {
  try {
    const { subject, title } = req.body;

    if (!subject || !title) {
      throw new AppError('Veuillez fournir un sujet et un titre', 400);
    }

    // Vérifier les limites d'utilisation
    const user = await User.findById(req.user.id);
    
    if (!user.canGenerateThumbnails()) {
      throw new AppError(
        'Limite de générations atteinte. Passez à premium pour des générations illimitées!',
        403
      );
    }

    // Générer les idées avec OpenAI
    const ideas = await openaiService.generateThumbnailIdeas(subject, title);

    // Incrémenter le compteur d'utilisation
    user.incrementUsage('thumbnail');
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Idées de miniatures générées avec succès',
      data: {
        ideas,
        usage: {
          used: user.usage.thumbnailGenerations.count,
          limit: user.subscription.plan === 'premium' ? 'illimité' : user.usage.thumbnailGenerations.limit
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Créer une nouvelle miniature
 * POST /api/thumbnails
 */
exports.createThumbnail = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(errors.array().map(e => e.msg).join(', '), 400);
    }

    const {
      title,
      subject,
      platform = 'youtube',
      config = {}
    } = req.body;

    // Configuration par défaut selon la plateforme
    const defaultConfig = {
      width: platform === 'tiktok' ? 1080 : 1280,
      height: platform === 'tiktok' ? 1920 : 720,
      template: platform,
      backgroundColor: '#000000',
      text: {
        content: '',
        font: 'Impact',
        fontSize: 72,
        color: '#FFFFFF',
        strokeColor: '#000000',
        strokeWidth: 3,
        shadow: {
          enabled: true,
          color: '#000000',
          blur: 10,
          offsetX: 4,
          offsetY: 4
        },
        position: {
          x: platform === 'tiktok' ? 540 : 640,
          y: platform === 'tiktok' ? 960 : 360
        },
        rotation: 0
      },
      elements: [],
      filters: {
        brightness: 100,
        contrast: 100,
        saturation: 100,
        blur: 0
      }
    };

    // Fusionner avec la configuration fournie
    const finalConfig = {
      ...defaultConfig,
      ...config,
      text: { ...defaultConfig.text, ...(config.text || {}) },
      filters: { ...defaultConfig.filters, ...(config.filters || {}) }
    };

    const thumbnail = await Thumbnail.create({
      user: req.user.id,
      title,
      subject,
      platform,
      config: finalConfig
    });

    res.status(201).json({
      success: true,
      message: 'Miniature créée avec succès',
      data: { thumbnail }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mettre à jour une miniature
 * PUT /api/thumbnails/:id
 */
exports.updateThumbnail = async (req, res, next) => {
  try {
    const { config } = req.body;

    const thumbnail = await Thumbnail.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!thumbnail) {
      throw new AppError('Miniature non trouvée', 404);
    }

    if (config) {
      // Mise à jour profonde de la configuration
      if (config.text) {
        thumbnail.config.text = { ...thumbnail.config.text, ...config.text };
      }
      if (config.elements) {
        thumbnail.config.elements = config.elements;
      }
      if (config.filters) {
        thumbnail.config.filters = { ...thumbnail.config.filters, ...config.filters };
      }
      if (config.backgroundImage !== undefined) {
        thumbnail.config.backgroundImage = config.backgroundImage;
      }
      if (config.backgroundColor !== undefined) {
        thumbnail.config.backgroundColor = config.backgroundColor;
      }
    }

    await thumbnail.save();

    res.status(200).json({
      success: true,
      message: 'Miniature mise à jour avec succès',
      data: { thumbnail }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Ajouter un élément à une miniature
 * POST /api/thumbnails/:id/elements
 */
exports.addElement = async (req, res, next) => {
  try {
    const { element } = req.body;

    if (!element || !element.type) {
      throw new AppError('Élément invalide', 400);
    }

    const thumbnail = await Thumbnail.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!thumbnail) {
      throw new AppError('Miniature non trouvée', 404);
    }

    thumbnail.addElement(element);
    await thumbnail.save();

    res.status(200).json({
      success: true,
      message: 'Élément ajouté avec succès',
      data: { thumbnail }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtenir l'historique des miniatures
 * GET /api/thumbnails/history
 */
exports.getThumbnailHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, platform } = req.query;

    const query = { user: req.user.id };
    
    if (platform) {
      query.platform = platform;
    }

    const thumbnails = await Thumbnail.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const count = await Thumbnail.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        thumbnails,
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
 * Obtenir une miniature spécifique
 * GET /api/thumbnails/:id
 */
exports.getThumbnailById = async (req, res, next) => {
  try {
    const thumbnail = await Thumbnail.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!thumbnail) {
      throw new AppError('Miniature non trouvée', 404);
    }

    res.status(200).json({
      success: true,
      data: { thumbnail }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Supprimer une miniature
 * DELETE /api/thumbnails/:id
 */
exports.deleteThumbnail = async (req, res, next) => {
  try {
    const thumbnail = await Thumbnail.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!thumbnail) {
      throw new AppError('Miniature non trouvée', 404);
    }

    // Supprimer les fichiers exportés s'ils existent
    if (thumbnail.exports.png) {
      try {
        await fs.unlink(thumbnail.exports.png);
      } catch (e) {
        // Fichier n'existe pas déjà
      }
    }

    res.status(200).json({
      success: true,
      message: 'Miniature supprimée avec succès'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Dupliquer une miniature
 * POST /api/thumbnails/:id/duplicate
 */
exports.duplicateThumbnail = async (req, res, next) => {
  try {
    const original = await Thumbnail.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!original) {
      throw new AppError('Miniature non trouvée', 404);
    }

    const duplicated = await Thumbnail.create({
      user: req.user.id,
      title: `${original.title} (copie)`,
      subject: original.subject,
      platform: original.platform,
      config: JSON.parse(JSON.stringify(original.config)),
      aiIdeas: original.aiIdeas
    });

    res.status(201).json({
      success: true,
      message: 'Miniature dupliquée avec succès',
      data: { thumbnail: duplicated }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Exporter une miniature (simulation)
 * POST /api/thumbnails/:id/export
 */
exports.exportThumbnail = async (req, res, next) => {
  try {
    const { format = 'png' } = req.body;

    const thumbnail = await Thumbnail.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!thumbnail) {
      throw new AppError('Miniature non trouvée', 404);
    }

    // Simulation d'export - dans un environnement réel, 
    // cela utiliserait une librairie comme canvas ou sharp
    const exportPath = `/exports/thumbnail-${thumbnail._id}-${Date.now()}.${format}`;
    
    thumbnail.exports[format] = exportPath;
    await thumbnail.save();

    res.status(200).json({
      success: true,
      message: `Miniature exportée en ${format.toUpperCase()}`,
      data: {
        downloadUrl: exportPath,
        format
      }
    });
  } catch (error) {
    next(error);
  }
};
