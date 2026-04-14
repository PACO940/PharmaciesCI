# 🚀 Viral Content SaaS - AI Title & Thumbnail Generator

Plateforme SaaS complète pour générer des titres viraux et des miniatures professionnelles pour YouTube et TikTok.

## 📋 Fonctionnalités

### 🔥 Générateur de titres IA
- 10 titres optimisés par génération
- Options de ton (viral, polémique, éducatif, etc.)
- Score de viralité pour chaque titre
- Copie et favoris intégrés

### 🎨 Générateur de miniatures
- Upload d'images ou génération IA
- Éditeur drag & drop
- Templates YouTube (1280x720) et TikTok (1080x1920)
- Ajout de texte, flèches, emojis, badges

### 📊 Analyse & Optimisation
- Score SEO des titres
- Suggestions de mots-clés
- Historique des créations

### 💰 Monétisation
- Plan gratuit limité
- Plan premium avec Stripe

## 🛠️ Stack Technique

- **Frontend**: React.js + Tailwind CSS
- **Backend**: Node.js + Express
- **Base de données**: MongoDB
- **IA**: OpenAI API

## 📦 Installation

### Prérequis
- Node.js 18+
- MongoDB
- Clé API OpenAI

### Étapes d'installation

1. **Installer les dépendances racines**
```bash
npm install
```

2. **Installer les dépendances client**
```bash
cd client
npm install
```

3. **Installer les dépendances serveur**
```bash
cd ../server
npm install
```

4. **Configurer les variables d'environnement**

Créer un fichier `.env` dans `/server`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/viral-content-saas
JWT_SECRET=votre_secret_jwt_tres_securise
OPENAI_API_KEY=votre_cle_openai
STRIPE_SECRET_KEY=votre_cle_stripe
CLIENT_URL=http://localhost:3000
```

Créer un fichier `.env` dans `/client`:
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_STRIPE_PUBLIC_KEY=votre_cle_publique_stripe
```

## 🚀 Lancement du projet

### Mode développement (2 terminaux)

**Terminal 1 - Serveur:**
```bash
cd server
npm run dev
```

**Terminal 2 - Client:**
```bash
cd client
npm start
```

### Ou avec la commande unique (depuis la racine):
```bash
npm run dev
```

## 📁 Structure du projet

```
/workspace
├── client/          # Frontend React
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   └── public/
├── server/          # Backend API
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   └── config/
└── assets/          # Images et templates
```

## 🎯 Utilisation

1. **Inscription/Connexion**: Créez un compte utilisateur
2. **Générateur de titres**: Entrez votre sujet et choisissez le ton
3. **Générateur de miniatures**: Uploadez une image ou utilisez l'IA
4. **Export**: Téléchargez vos créations en PNG ou copiez les textes

## 💳 Plans Tarifaires

- **Gratuit**: 5 générations/jour, templates basiques
- **Premium** ($9.99/mois): Générations illimitées, templates premium, support prioritaire

## 📝 Notes

- Assurez-vous que MongoDB est en cours d'exécution
- Une clé OpenAI valide est requise pour les fonctionnalités IA
- Stripe doit être configuré pour les paiements

## 🤝 Support

Pour toute question ou problème, ouvrez une issue sur le repository.
