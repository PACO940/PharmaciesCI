/**
 * Modèle de Miniature (Thumbnail)
 * Stocke les miniatures créées et leurs configurations
 */

const mongoose = require('mongoose');

const thumbnailSchema = new mongoose.Schema({
  // Référence à l'utilisateur
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Titre associé
  title: {
    type: String,
    trim: true
  },
  
  // Sujet de la vidéo
  subject: {
    type: String,
    trim: true
  },
  
  // Configuration de la miniature
  config: {
    // Dimensions
    width: {
      type: Number,
      default: 1280
    },
    height: {
      type: Number,
      default: 720
    },
    template: {
      type: String,
      enum: ['youtube', 'tiktok', 'custom'],
      default: 'youtube'
    },
    
    // Image de fond
    backgroundImage: {
      type: String, // URL ou path
      default: ''
    },
    backgroundColor: {
      type: String,
      default: '#000000'
    },
    
    // Texte principal
    text: {
      content: String,
      font: {
        type: String,
        default: 'Impact'
      },
      fontSize: {
        type: Number,
        default: 72
      },
      color: {
        type: String,
        default: '#FFFFFF'
      },
      strokeColor: {
        type: String,
        default: '#000000'
      },
      strokeWidth: {
        type: Number,
        default: 3
      },
      shadow: {
        enabled: {
          type: Boolean,
          default: true
        },
        color: {
          type: String,
          default: '#000000'
        },
        blur: {
          type: Number,
          default: 10
        },
        offsetX: {
          type: Number,
          default: 4
        },
        offsetY: {
          type: Number,
          default: 4
        }
      },
      position: {
        x: {
          type: Number,
          default: 640
        },
        y: {
          type: Number,
          default: 360
        }
      },
      rotation: {
        type: Number,
        default: 0
      }
    },
    
    // Éléments graphiques
    elements: [{
      type: {
        type: String,
        enum: ['arrow', 'emoji', 'badge', 'shape', 'image']
      },
      content: String, // Emoji, texte du badge, URL d'image
      position: {
        x: Number,
        y: Number
      },
      size: {
        width: Number,
        height: Number
      },
      rotation: {
        type: Number,
        default: 0
      },
      color: String,
      style: String // Style de flèche, forme, etc.
    }],
    
    // Filtres et effets
    filters: {
      brightness: {
        type: Number,
        default: 100
      },
      contrast: {
        type: Number,
        default: 100
      },
      saturation: {
        type: Number,
        default: 100
      },
      blur: {
        type: Number,
        default: 0
      }
    }
  },
  
  // Idées IA utilisées
  aiIdeas: [{
    description: String,
    colors: [String],
    text: String,
    elements: [String],
    emotion: String
  }],
  
  // URLs des exports
  exports: {
    png: String,
    jpg: String,
    webp: String
  },
  
  // Statistiques
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
  },
  
  // Plateforme cible
  platform: {
    type: String,
    enum: ['youtube', 'tiktok', 'both'],
    default: 'youtube'
  },
  
  isPublic: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index pour les recherches
thumbnailSchema.index({ user: 1, createdAt: -1 });
thumbnailSchema.index({ platform: 1 });
thumbnailSchema.index({ isPublic: 1 });

// Méthode pour ajouter un élément
thumbnailSchema.methods.addElement = function(element) {
  this.config.elements.push(element);
  return this.config.elements;
};

// Méthode pour mettre à jour la position d'un élément
thumbnailSchema.methods.updateElementPosition = function(index, x, y) {
  if (this.config.elements[index]) {
    this.config.elements[index].position = { x, y };
    return this.config.elements[index];
  }
  return null;
};

// Méthode pour appliquer un filtre
thumbnailSchema.methods.applyFilter = function(filterName, value) {
  if (this.config.filters[filterName] !== undefined) {
    this.config.filters[filterName] = value;
    return true;
  }
  return false;
};

module.exports = mongoose.model('Thumbnail', thumbnailSchema);
