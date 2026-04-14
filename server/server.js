/**
 * Serveur principal de l'application
 * Point d'entrée de l'API Express
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Import des configurations
const connectDB = require('./config/database');

// Import des middlewares
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Import des routes
const authRoutes = require('./routes/authRoutes');
const titleRoutes = require('./routes/titleRoutes');
const thumbnailRoutes = require('./routes/thumbnailRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

// Initialisation de l'application Express
const app = express();

// Connexion à la base de données
connectDB();

// ============================================
// MIDDLEWARES GLOBAUX
// ============================================

// Security headers avec Helmet
app.use(helmet({
  contentSecurityPolicy: false, // Désactivé pour le développement
  crossOriginEmbedderPolicy: false
}));

// CORS - Configuration pour autoriser le frontend
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser - JSON
app.use(express.json({ limit: '10mb' }));

// Body parser - URL encoded
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting - Protection contre les attaques par force brute
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limite de 100 requêtes par IP
  message: 'Trop de requêtes depuis cette adresse IP, veuillez réessayer plus tard'
});
app.use('/api', limiter);

// ============================================
// ROUTES API
// ============================================

app.use('/api/auth', authRoutes);
app.use('/api/titles', titleRoutes);
app.use('/api/thumbnails', thumbnailRoutes);
app.use('/api/payment', paymentRoutes);

// Route de santé pour vérifier que l'API fonctionne
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API Viral Content SaaS est opérationnelle',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Route racine
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Bienvenue sur l\'API Viral Content SaaS',
    documentation: '/api/health',
    endpoints: {
      auth: '/api/auth',
      titles: '/api/titles',
      thumbnails: '/api/thumbnails',
      payment: '/api/payment'
    }
  });
});

// ============================================
// GESTION DES ERREURS
// ============================================

// Middleware 404 - Doit être après toutes les routes
app.use(notFound);

// Middleware global de gestion des erreurs - Toujours en dernier
app.use(errorHandler);

// ============================================
// DÉMARRAGE DU SERVEUR
// ============================================

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════╗
║   🚀 VIRAL CONTENT SAAS - API SERVER         ║
╠═══════════════════════════════════════════════╣
║   ✅ Serveur démarré avec succès             ║
║   📡 Port: ${PORT}                            
║   🔗 URL: http://localhost:${PORT}            
║   🌍 Mode: ${process.env.NODE_ENV || 'development'}                        
╚═══════════════════════════════════════════════╝
  `);
});

// Gestion des erreurs non capturées
process.on('unhandledRejection', (err) => {
  console.error('❌ Erreur non gérée:', err.message);
  console.error('Stack:', err.stack);
  
  // Fermer proprement le serveur
  server.close(() => {
    process.exit(1);
  });
});

process.on('uncaughtException', (err) => {
  console.error('❌ Exception non capturée:', err.message);
  console.error('Stack:', err.stack);
  
  process.exit(1);
});

module.exports = app;
