/**
 * Routes de gestion des miniatures
 */

const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const thumbnailController = require('../controllers/thumbnailController');
const { protect, checkUsageLimits } = require('../middleware/auth');

// Validation rules
const generateIdeasValidation = [
  body('subject')
    .trim()
    .notEmpty()
    .withMessage('Le sujet est requis'),
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Le titre est requis')
];

const createThumbnailValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ max: 100 }),
  body('subject')
    .optional()
    .trim(),
  body('platform')
    .optional()
    .isIn(['youtube', 'tiktok', 'custom']),
  body('config.width')
    .optional()
    .isInt({ min: 100, max: 4000 }),
  body('config.height')
    .optional()
    .isInt({ min: 100, max: 4000 })
];

const elementValidation = [
  body('element.type')
    .isIn(['arrow', 'emoji', 'badge', 'shape', 'image'])
    .withMessage('Type d\'élément invalide'),
  body('element.position.x')
    .optional()
    .isFloat(),
  body('element.position.y')
    .optional()
    .isFloat()
];

// Toutes les routes sont protégées
router.use(protect);

// Routes
router.post('/generate-ideas', checkUsageLimits('thumbnail'), generateIdeasValidation, thumbnailController.generateThumbnailIdeas);
router.post('/', createThumbnailValidation, thumbnailController.createThumbnail);
router.get('/history', query('page').optional().isInt({ min: 1 }), thumbnailController.getThumbnailHistory);
router.get('/:id', param('id').isMongoId(), thumbnailController.getThumbnailById);
router.put('/:id', param('id').isMongoId(), thumbnailController.updateThumbnail);
router.post('/:id/elements', param('id').isMongoId(), elementValidation, thumbnailController.addElement);
router.post('/:id/duplicate', param('id').isMongoId(), thumbnailController.duplicateThumbnail);
router.post('/:id/export', param('id').isMongoId(), thumbnailController.exportThumbnail);
router.delete('/:id', param('id').isMongoId(), thumbnailController.deleteThumbnail);

module.exports = router;
