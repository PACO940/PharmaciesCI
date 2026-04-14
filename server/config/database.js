/**
 * Configuration de la base de données MongoDB
 * Gère la connexion et la déconnexion propre
 */

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Options pour éviter les warnings de dépréciation
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB connecté: ${conn.connection.host}`);
    
    // Gestion des événements de connexion
    mongoose.connection.on('error', (err) => {
      console.error(`❌ Erreur MongoDB: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB déconnecté');
    });

    // Gestion de la fermeture propre
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🔒 MongoDB déconnecté suite à l\'arrêt du processus');
      process.exit(0);
    });

    return conn;
  } catch (error) {
    console.error(`❌ Échec de la connexion MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
