/**
 * Routes de gestion des titres
 */

const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const titleController = require('../controllers/titleController');
const { protect, checkUsageLimits } = require('../middleware/auth');

// Validation rules
const generateValidation = [
  body('subject')
    .trim()
    .notEmpty()
    .withMessage('Le sujet est requis')
    .isLength({ max: 200 })
    .withMessage('Le sujet ne peut pas dépasser 200 caractères'),
  body('tone')
    .optional()
    .isIn(['viral', 'polémique', 'éducatif', 'storytelling', 'suspense', 'humoristique'])
    .withMessage('Ton invalide'),
  body('audience')
    .optional()
    .isIn(['débutant', 'intermédiaire', 'expert', 'grand public'])
    .withMessage('Audience invalide'),
  body('platform')
    .optional()
    .isIn(['youtube', 'tiktok', 'both'])
    .withMessage('Plateforme invalide')
];

const analyzeValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Le titre est requis')
    .isLength({ max: 100 })
    .withMessage('Le titre ne peut pas dépasser 100 caractères'),
  body('subject')
    .trim()
    .notEmpty()
    .withMessage('Le sujet est requis')
];

const favoriteValidation = [
  body('titleText')
    .trim()
    .notEmpty()
    .withMessage('Le texte du titre est requis'),
  param('id')
    .isMongoId()
    .withMessage('ID invalide')
];

// Toutes les routes sont protégées
router.use(protect);

// Routes
router.post('/generate', checkUsageLimits('title'), generateValidation, titleController.generateTitles);
router.post('/analyze', analyzeValidation, titleController.analyzeTitle);
router.get('/history', query('page').optional().isInt({ min: 1 }), titleController.getTitleHistory);
router.get('/favorites', titleController.getFavoriteTitles);
router.get('/:id', param('id').isMongoId(), titleController.getTitleById);
router.put('/:id/favorite', favoriteValidation, titleController.favoriteTitle);
router.put('/:id/select', favoriteValidation, titleController.selectTitle);
router.delete('/:id', param('id').isMongoId(), titleController.deleteTitle);

module.exports = router;
