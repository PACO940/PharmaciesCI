/**
 * Configuration OpenAI pour la génération de contenu IA
 */

const { OpenAI } = require('openai');

// Initialisation du client OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Génère des titres viraux basés sur un sujet donné
 * @param {string} subject - Le sujet de la vidéo
 * @param {string} tone - Le ton souhaité (viral, polémique, éducatif, etc.)
 * @param {string} audience - L'audience cible
 * @returns {Promise<Array>} - Liste des titres générés avec scores
 */
const generateTitles = async (subject, tone = 'viral', audience = 'grand public') => {
  try {
    const prompt = `Tu es un expert en marketing viral et SEO YouTube/TikTok.
    
Génère 10 titres accrocheurs et viraux pour une vidéo sur le sujet: "${subject}"
Ton: ${tone}
Audience cible: ${audience}

Pour chaque titre, fournis:
- Le titre lui-même (max 60 caractères)
- Un score de viralité (0-100%)
- Une brève explication de pourquoi ça marche

Format de réponse JSON attendu:
{
  "titles": [
    {
      "text": "Titre exemple",
      "viralityScore": 85,
      "reason": "Utilise la curiosité et l'urgence"
    }
  ]
}

Critères à utiliser:
- Curiosité (créer un gap d'information)
- Émotion (surprise, peur, joie, colère)
- Urgence (FOMO - Fear Of Missing Out)
- Chiffres et listes
- Mots puissants (incroyable, choquant, secret, etc.)
- Questions provocantes`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: 'Tu es un expert en création de contenu viral pour YouTube et TikTok.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 1500,
      response_format: { type: 'json_object' }
    });

    const response = JSON.parse(completion.choices[0].message.content);
    return response.titles;
  } catch (error) {
    console.error('Erreur lors de la génération des titres:', error.message);
    throw new Error('Échec de la génération des titres IA');
  }
};

/**
 * Génère des idées de miniatures
 * @param {string} subject - Le sujet de la vidéo
 * @param {string} title - Le titre choisi
 * @returns {Promise<Object>} - Suggestions pour la miniature
 */
const generateThumbnailIdeas = async (subject, title) => {
  try {
    const prompt = `Tu es un designer expert en miniatures YouTube/TikTok virales.
    
Pour une vidéo sur: "${subject}"
Avec le titre: "${title}"

Propose 3 concepts de miniatures incluant:
- Description visuelle détaillée
- Couleurs recommandées (avec codes hex)
- Texte à afficher (max 5 mots)
- Éléments graphiques (flèches, emojis, badges)
- Émotion à transmettre

Format JSON:
{
  "ideas": [
    {
      "description": "Description visuelle",
      "colors": ["#FF0000", "#000000"],
      "text": "TEXTE COURT",
      "elements": ["flèche", "emoji 🔥"],
      "emotion": "excitation"
    }
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: 'Expert en design de miniatures virales.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: 'json_object' }
    });

    const response = JSON.parse(completion.choices[0].message.content);
    return response.ideas;
  } catch (error) {
    console.error('Erreur lors de la génération des idées thumbnail:', error.message);
    throw new Error('Échec de la génération des idées thumbnail');
  }
};

/**
 * Analyse SEO d'un titre
 * @param {string} title - Le titre à analyser
 * @param {string} subject - Le sujet principal
 * @returns {Promise<Object>} - Score et recommandations SEO
 */
const analyzeTitleSEO = async (title, subject) => {
  try {
    const prompt = `Analyse SEO professionnelle pour ce titre YouTube/TikTok: "${title}"
Sujet principal: ${subject}

Évalue:
- Longueur optimale (40-60 caractères)
- Présence de mots-clés
- Potentiel de clic (CTR)
- Score global (0-100)
- 3 recommandations d'amélioration
- Mots-clés tendances suggérés

Format JSON:
{
  "score": 85,
  "length": 45,
  "hasKeywords": true,
  "ctrPotential": "high",
  "recommendations": ["Ajouter un chiffre", "Utiliser plus d'émotion"],
  "suggestedKeywords": ["mot-clé 1", "mot-clé 2"]
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: 'Expert SEO YouTube et TikTok.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.5,
      max_tokens: 800,
      response_format: { type: 'json_object' }
    });

    const response = JSON.parse(completion.choices[0].message.content);
    return response;
  } catch (error) {
    console.error('Erreur lors de l\'analyse SEO:', error.message);
    throw new Error('Échec de l\'analyse SEO');
  }
};

module.exports = {
  openai,
  generateTitles,
  generateThumbnailIdeas,
  analyzeTitleSEO
};
