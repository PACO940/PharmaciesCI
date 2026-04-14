/**
 * Modèle de Titre généré par IA
 * Stocke l'historique des générations de titres
 */

const mongoose = require('mongoose');

const titleSchema = new mongoose.Schema({
  // Référence à l'utilisateur
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Sujet de la vidéo
  subject: {
    type: String,
    required: [true, 'Le sujet est requis'],
    trim: true,
    maxlength: [200, 'Le sujet ne peut pas dépasser 200 caractères']
  },
  
  // Paramètres de génération
  tone: {
    type: String,
    enum: ['viral', 'polémique', 'éducatif', 'storytelling', 'suspense', 'humoristique'],
    default: 'viral'
  },
  
  audience: {
    type: String,
    enum: ['débutant', 'intermédiaire', 'expert', 'grand public'],
    default: 'grand public'
  },
  
  // Titres générés
  generatedTitles: [{
    text: {
      type: String,
      required: true,
      maxlength: [100, 'Le titre ne peut pas dépasser 100 caractères']
    },
    viralityScore: {
      type: Number,
      min: 0,
      max: 100
    },
    reason: String,
    isFavorite: {
      type: Boolean,
      default: false
    }
  }],
  
  // Titre sélectionné par l'utilisateur
  selectedTitle: {
    text: String,
    viralityScore: Number
  },
  
  // Analyse SEO
  seoAnalysis: {
    score: Number,
    length: Number,
    hasKeywords: Boolean,
    ctrPotential: {
      type: String,
      enum: ['low', 'medium', 'high']
    },
    recommendations: [String],
    suggestedKeywords: [String]
  },
  
  // Plateforme cible
  platform: {
    type: String,
    enum: ['youtube', 'tiktok', 'both'],
    default: 'youtube'
  },
  
  // Statistiques d'utilisation
  stats: {
    views: {
      type: Number,
      default: 0
    },
    clicks: {
      type: Number,
      default: 0
    },
    ctr: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Index pour les recherches rapides
titleSchema.index({ user: 1, createdAt: -1 });
titleSchema.index({ subject: 'text' });
titleSchema.index({ 'generatedTitles.text': 'text' });

// Méthode pour marquer un titre comme favori
titleSchema.methods.favoriteTitle = function(titleText) {
  const title = this.generatedTitles.find(t => t.text === titleText);
  if (title) {
    title.isFavorite = true;
    return title;
  }
  return null;
};

// Méthode pour obtenir tous les favoris
titleSchema.methods.getFavorites = function() {
  return this.generatedTitles.filter(t => t.isFavorite);
};

// Méthode pour mettre à jour les statistiques
titleSchema.methods.updateStats = function(views, clicks) {
  this.stats.views = views;
  this.stats.clicks = clicks;
  this.stats.ctr = views > 0 ? (clicks / views) * 100 : 0;
};

module.exports = mongoose.model('Title', titleSchema);
