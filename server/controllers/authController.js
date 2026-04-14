/**
 * Contrôleur d'authentification
 * Gère l'inscription, la connexion et la gestion des utilisateurs
 */

const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');
const stripeService = require('../config/stripe');

/**
 * Génère un token JWT pour un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @returns {string} - Token JWT signé
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '30d' // Token valide 30 jours
  });
};

/**
 * Inscription d'un nouvel utilisateur
 * POST /api/auth/register
 */
exports.register = async (req, res, next) => {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(errors.array().map(e => e.msg).join(', '), 400);
    }

    const { email, password, name } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('Cet email est déjà utilisé', 400);
    }

    // Créer l'utilisateur
    const user = await User.create({
      email,
      password,
      name
    });

    // Créer un customer Stripe pour l'utilisateur
    try {
      const customer = await stripeService.createCustomer(email, user._id.toString());
      user.subscription.stripeCustomerId = customer.id;
      await user.save();
    } catch (stripeError) {
      console.error('Erreur création customer Stripe:', stripeError.message);
      // On continue même si Stripe échoue
    }

    // Générer le token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Compte créé avec succès',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          subscription: user.subscription.plan
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Connexion d'un utilisateur
 * POST /api/auth/login
 */
exports.login = async (req, res, next) => {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(errors.array().map(e => e.msg).join(', '), 400);
    }

    const { email, password } = req.body;

    // Trouver l'utilisateur avec son mot de passe
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      throw new AppError('Email ou mot de passe incorrect', 401);
    }

    // Vérifier le mot de passe
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      throw new AppError('Email ou mot de passe incorrect', 401);
    }

    // Générer le token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Connexion réussie',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          subscription: user.subscription.plan,
          usage: user.usage
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Récupérer le profil de l'utilisateur connecté
 * GET /api/auth/me
 */
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          subscription: user.subscription,
          usage: user.usage,
          preferences: user.preferences
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mettre à jour le profil utilisateur
 * PUT /api/auth/me
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, avatar, preferences } = req.body;

    const user = await User.findById(req.user.id);

    if (name) user.name = name;
    if (avatar !== undefined) user.avatar = avatar;
    if (preferences) {
      user.preferences = { ...user.preferences, ...preferences };
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profil mis à jour avec succès',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          preferences: user.preferences
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mettre à jour le mot de passe
 * PUT /api/auth/update-password
 */
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new AppError('Veuillez fournir le mot de passe actuel et le nouveau', 400);
    }

    const user = await User.findById(req.user.id).select('+password');

    // Vérifier le mot de passe actuel
    const isPasswordValid = await user.comparePassword(currentPassword);
    
    if (!isPasswordValid) {
      throw new AppError('Mot de passe actuel incorrect', 401);
    }

    // Mettre à jour le mot de passe
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Mot de passe mis à jour avec succès'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtenir les statistiques d'utilisation
 * GET /api/auth/usage
 */
exports.getUsageStats = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        subscription: user.subscription.plan,
        titleGenerations: {
          used: user.usage.titleGenerations.count,
          limit: user.subscription.plan === 'premium' ? 'illimité' : user.usage.titleGenerations.limit,
          resetDate: user.usage.titleGenerations.resetDate
        },
        thumbnailGenerations: {
          used: user.usage.thumbnailGenerations.count,
          limit: user.subscription.plan === 'premium' ? 'illimité' : user.usage.thumbnailGenerations.limit,
          resetDate: user.usage.thumbnailGenerations.resetDate
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
