/**
 * Middleware de gestion d'erreurs
 * Centralise la gestion des erreurs pour toute l'application
 */

/**
 * Classe d'erreur personnalisée
 * Permet de créer des erreurs avec un statut HTTP spécifique
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Middleware global de gestion des erreurs
 * Doit être le dernier middleware enregistré dans Express
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log l'erreur pour le débogage (seulement en développement)
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Erreur:', err);
  }

  // Erreur Mongoose - Mauvais ID
  if (err.name === 'CastError') {
    const message = 'Ressource non trouvée';
    error = new AppError(message, 404);
  }

  // Erreur Mongoose - Violation de contrainte d'unicité
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} existe déjà`;
    error = new AppError(message, 400);
  }

  // Erreur Mongoose - Validation
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new AppError(message, 400);
  }

  // Erreur JWT
  if (err.name === 'JsonWebTokenError') {
    const message = 'Token JWT invalide';
    error = new AppError(message, 401);
  }

  // Token JWT expiré
  if (err.name === 'TokenExpiredError') {
    const message = 'Token JWT expiré';
    error = new AppError(message, 401);
  }

  // Erreur OpenAI
  if (err.message?.includes('OpenAI')) {
    const message = 'Erreur lors de la génération IA';
    error = new AppError(message, 503);
  }

  // Réponse finale
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Erreur serveur interne',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * Middleware pour les routes non trouvées (404)
 * Doit être placé après toutes les routes
 */
const notFound = (req, res, next) => {
  const error = new AppError(`Route non trouvée - ${req.originalUrl}`, 404);
  next(error);
};

module.exports = {
  AppError,
  errorHandler,
  notFound
};
