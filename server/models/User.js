/**
 * Modèle Utilisateur pour l'authentification et la gestion des comptes
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Informations de base
  email: {
    type: String,
    required: [true, 'L\'email est requis'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Veuillez entrer un email valide']
  },
  
  password: {
    type: String,
    required: [true, 'Le mot de passe est requis'],
    minlength: [8, 'Le mot de passe doit contenir au moins 8 caractères'],
    select: false // Ne pas inclure dans les requêtes par défaut
  },
  
  name: {
    type: String,
    required: [true, 'Le nom est requis'],
    trim: true
  },
  
  avatar: {
    type: String,
    default: ''
  },
  
  // Statut du compte
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  
  isVerified: {
    type: Boolean,
    default: false
  },
  
  // Abonnement et plan
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'premium'],
      default: 'free'
    },
    stripeCustomerId: {
      type: String,
      default: null
    },
    stripeSubscriptionId: {
      type: String,
      default: null
    },
    startDate: Date,
    endDate: Date,
    isActive: {
      type: Boolean,
      default: false
    }
  },
  
  // Limites d'utilisation
  usage: {
    titleGenerations: {
      count: { type: Number, default: 0 },
      limit: { type: Number, default: 5 }, // 5 pour free, illimité pour premium
      resetDate: { type: Date, default: Date.now }
    },
    thumbnailGenerations: {
      count: { type: Number, default: 0 },
      limit: { type: Number, default: 3 },
      resetDate: { type: Date, default: Date.now }
    }
  },
  
  // Préférences
  preferences: {
    defaultTone: {
      type: String,
      default: 'viral'
    },
    defaultAudience: {
      type: String,
      default: 'grand public'
    },
    darkMode: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true // Crée automatiquement createdAt et updatedAt
});

// Hash du mot de passe avant sauvegarde
userSchema.pre('save', async function(next) {
  // Seulement si le mot de passe a été modifié
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Méthode pour comparer les mots de passe
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Erreur lors de la comparaison du mot de passe');
  }
};

// Méthode pour vérifier les limites d'utilisation
userSchema.methods.canGenerateTitles = function() {
  const now = new Date();
  const resetDate = this.usage.titleGenerations.resetDate;
  
  // Réinitialiser le compteur si un jour s'est écoulé
  if (now - resetDate > 24 * 60 * 60 * 1000) {
    this.usage.titleGenerations.count = 0;
    this.usage.titleGenerations.resetDate = now;
  }
  
  // Vérifier si l'utilisateur a atteint sa limite
  if (this.subscription.plan === 'premium') {
    return true; // Illimité pour premium
  }
  
  return this.usage.titleGenerations.count < this.usage.titleGenerations.limit;
};

userSchema.methods.canGenerateThumbnails = function() {
  const now = new Date();
  const resetDate = this.usage.thumbnailGenerations.resetDate;
  
  // Réinitialiser le compteur si un jour s'est écoulé
  if (now - resetDate > 24 * 60 * 60 * 1000) {
    this.usage.thumbnailGenerations.count = 0;
    this.usage.thumbnailGenerations.resetDate = now;
  }
  
  // Vérifier si l'utilisateur a atteint sa limite
  if (this.subscription.plan === 'premium') {
    return true; // Illimité pour premium
  }
  
  return this.usage.thumbnailGenerations.count < this.usage.thumbnailGenerations.limit;
};

// Incrémenter les compteurs d'utilisation
userSchema.methods.incrementUsage = function(type) {
  if (type === 'title') {
    this.usage.titleGenerations.count += 1;
  } else if (type === 'thumbnail') {
    this.usage.thumbnailGenerations.count += 1;
  }
};

// Index pour les recherches
userSchema.index({ email: 1 });
userSchema.index({ 'subscription.plan': 1 });

module.exports = mongoose.model('User', userSchema);
