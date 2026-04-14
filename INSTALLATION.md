# 🚀 Viral Content SaaS - Guide d'Installation

## Application de Génération de Titres et Miniatures Virales pour YouTube & TikTok

---

## 📋 Prérequis

- **Node.js** v18+ 
- **npm** v9+
- **MongoDB** (local ou Atlas)
- **Clé API OpenAI** (pour les fonctionnalités IA)
- **Clé API Stripe** (pour les paiements)

---

## 🏗️ Structure du Projet

```
/workspace
├── client/          # Frontend React + Vite + TailwindCSS
├── server/          # Backend Node.js + Express
├── assets/          # Ressources partagées
└── README.md        # Ce fichier
```

---

## 🔧 Installation Rapide

### 1. Nettoyer l'environnement

```bash
cd /workspace
rm -rf client/node_modules server/node_modules client/dist
```

### 2. Installer les dépendances racine

```bash
npm install --omit=dev
```

### 3. Installer le frontend

```bash
cd client
npm install --omit=dev
```

### 4. Installer le backend

```bash
cd ../server
npm install --omit=dev
```

---

## ⚙️ Configuration

### Fichier .env (à créer dans /server)

```env
# Server
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Database MongoDB
MONGODB_URI=mongodb://localhost:27017/viral-content-saas

# JWT Secret
JWT_SECRET=votre_secret_jwt_tres_long_et_secu_2024

# OpenAI API
OPENAI_API_KEY=sk-votre_cle_openai

# Stripe (Paiements)
STRIPE_SECRET_KEY=sk_test_votre_cle_stripe
STRIPE_WEBHOOK_SECRET=whsec_votre_webhook_secret

# Frontend URL
VITE_API_URL=http://localhost:5000/api
VITE_STRIPE_PUBLIC_KEY=pk_test_votre_cle_publique_stripe
```

---

## 🚀 Démarrage

### Option 1: Démarrage séparé (recommandé pour dev)

**Terminal 1 - Backend:**
```bash
cd /workspace/server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd /workspace/client
npm run dev
```

### Option 2: Démarrage simultané

```bash
cd /workspace
npm run dev
```

---

## 🌐 Accès à l'Application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000
- **Santé API:** http://localhost:5000/api/health

---

## 🎯 Fonctionnalités Principales

### 1. 🔥 Générateur de Titres IA
- Input: Sujet de la vidéo
- Options: Ton, Audience, Plateforme
- 10 titres générés avec score de viralité
- Boutons: Copier, Favori, Historique

### 2. 🎨 Thumbnail Builder
- Upload d'image ou génération IA
- Éditeur drag & drop
- Templates YouTube (1280x720) & TikTok (1080x1920)
- Ajout texte, emojis, flèches, badges
- Aperçu en temps réel

### 3. 📊 Analyse & Optimisation
- Score SEO des titres
- Suggestions de mots-clés
- Analyse concurrentielle

### 4. 👤 Système Utilisateur
- Inscription/Connexion sécurisée
- Dashboard personnel
- Historique des créations
- Sauvegarde cloud

### 5. 💰 Monétisation
- Plan Gratuit (limité)
- Plan Premium (illimité)
- Intégration Stripe

---

## 🛠️ Stack Technique

### Frontend
- **React 19** - UI moderne
- **Vite** - Build ultra-rapide
- **TailwindCSS 4** - Design responsive
- **React Router** - Navigation
- **Axios** - Requêtes HTTP
- **Lucide React** - Icônes

### Backend
- **Node.js** - Runtime
- **Express** - Framework API
- **MongoDB + Mongoose** - Base de données
- **JWT** - Authentification
- **OpenAI API** - Génération IA
- **Stripe** - Paiements
- **Multer** - Upload fichiers
- **Helmet** - Sécurité
- **express-validator** - Validation

---

## 📁 Endpoints API Principaux

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Profil utilisateur

### Titres
- `POST /api/titles/generate` - Générer titres IA
- `POST /api/titles/analyze` - Analyser titre
- `GET /api/titles/history` - Historique
- `GET /api/titles/favorites` - Favoris

### Miniatures
- `POST /api/thumbnails/upload` - Upload image
- `POST /api/thumbnails/generate` - Génération IA
- `GET /api/thumbnails/templates` - Templates
- `POST /api/thumbnails/save` - Sauvegarder

### Paiement
- `POST /api/payment/create-checkout` - Créer session
- `POST /api/payment/webhook` - Webhook Stripe

---

## 🎨 Design System

- **Mode sombre** par défaut
- **Couleurs:** Palette moderne avec accent violet (#aa3bff)
- **Typography:** Inter + Poppins
- **Animations:** Transitions fluides
- **Responsive:** Mobile-first

---

## 🔒 Sécurité

- Helmet (headers sécurité)
- Rate limiting (100 req/15min)
- JWT avec expiration
- Hash bcrypt pour mots de passe
- Validation des inputs
- CORS configuré

---

## 📊 Modèle de Données

### User
```javascript
{
  email, password, name,
  plan: 'free' | 'premium',
  usage: { titles, thumbnails },
  stripeCustomerId
}
```

### Title
```javascript
{
  userId, subject, tone, audience,
  titles: [{ text, viralScore }],
  isFavorite, platform
}
```

### Thumbnail
```javascript
{
  userId, imageUrl, template,
  elements: [text, images],
  platform, dimensions
}
```

---

## 🐛 Dépannage

### Problème: Espace disque insuffisant
```bash
# Nettoyer npm cache
npm cache clean --force

# Supprimer node_modules
rm -rf client/node_modules server/node_modules

# Réinstaller
npm install --omit=dev
```

### Problème: MongoDB non connecté
```bash
# Vérifier MongoDB
mongod --version

# Ou utiliser MongoDB Atlas
# Mettre à jour MONGODB_URI dans .env
```

### Problème: Port déjà utilisé
```bash
# Changer le port dans server/.env
PORT=5001
```

---

## 📈 Roadmap

- [ ] Générateur d'idées de vidéos
- [ ] Mode "1 clic viral"
- [ ] Export PNG rapide
- [ ] Analytics avancés
- [ ] Intégration réseaux sociaux
- [ ] A/B testing titres
- [ ] Templates premium additionnels

---

## 📞 Support

Pour toute question ou problème:
- Vérifiez les logs: `server/logs/`
- Consultez la documentation API
- Ouvrez une issue GitHub

---

## 📄 License

MIT License - Utilisation commerciale autorisée

---

**Développé avec ❤️ pour les créateurs de contenu**
