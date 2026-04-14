/**
 * Middleware d'authentification JWT
 * Vérifie et valide les tokens JWT pour protéger les routes
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware de protection des routes
 * Vérifie la présence et la validité du token JWT
 */
const protect = async (req, res, next) => {
  let token;

  // Vérifier si le token est présent dans les headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Extraire le token du header "Authorization: Bearer <token>"
      token = req.headers.authorization.split(' ')[1];

      // Vérifier le token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Récupérer l'utilisateur depuis la base de données
      // .select('-password') exclut le mot de passe des résultats
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      next();
    } catch (error) {
      console.error('Erreur authentification:', error.message);

      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Token invalide'
        });
      }

      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expiré'
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de l\'authentification'
      });
    }
  }

  // Pas de token fourni
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Non autorisé - Aucun token fourni'
    });
  }
};

/**
 * Middleware pour vérifier si l'utilisateur est admin
 * Doit être utilisé après le middleware 'protect'
 */
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Accès refusé - Rights administrateur requis'
    });
  }
};

/**
 * Middleware optionnel pour les routes publiques
 * Si un token est présent, on attache l'utilisateur, sinon on continue
 */
const optionalAuth = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch (error) {
      // Token invalide ou expiré, on continue sans utilisateur
      req.user = null;
    }
  }

  next();
};

/**
 * Middleware pour vérifier les limites d'utilisation
 * Vérifie si l'utilisateur peut encore générer du contenu
 */
const checkUsageLimits = (type) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    const canGenerate = type === 'title' 
      ? req.user.canGenerateTitles()
      : req.user.canGenerateThumbnails();

    if (!canGenerate) {
      return res.status(403).json({
        success: false,
        message: 'Limite d\'utilisation atteinte. Passez à premium pour des générations illimitées!',
        upgradeUrl: '/pricing'
      });
    }

    next();
  };
};

module.exports = {
  protect,
  admin,
  optionalAuth,
  checkUsageLimits
};
