/**
 * Configuration Stripe pour les paiements
 */

const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Crée un customer Stripe
 * @param {string} email - Email de l'utilisateur
 * @param {string} userId - ID de l'utilisateur dans notre DB
 * @returns {Promise<Object>} - Customer Stripe
 */
const createCustomer = async (email, userId) => {
  try {
    const customer = await stripe.customers.create({
      email,
      metadata: {
        userId: userId
      }
    });
    return customer;
  } catch (error) {
    console.error('Erreur création customer Stripe:', error.message);
    throw new Error('Échec de la création du compte de paiement');
  }
};

/**
 * Crée une session de paiement pour un abonnement
 * @param {string} customerId - ID du customer Stripe
 * @param {string} priceId - ID du prix Stripe
 * @param {string} successUrl - URL de redirection après succès
 * @param {string} cancelUrl - URL de redirection après annulation
 * @returns {Promise<Object>} - Session de checkout
 */
const createCheckoutSession = async (customerId, priceId, successUrl, cancelUrl) => {
  try {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
    });
    return session;
  } catch (error) {
    console.error('Erreur création session checkout:', error.message);
    throw new Error('Échec de la création de la session de paiement');
  }
};

/**
 * Gère le webhook Stripe pour les événements de paiement
 * @param {string} payload - Corps de la requête
 * @param {string} signature - Signature Stripe
 * @returns {Promise<Object>} - Événement Stripe vérifié
 */
const constructWebhookEvent = (payload, signature) => {
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  try {
    const event = stripe.webhooks.constructEvent(payload, signature, endpointSecret);
    return event;
  } catch (error) {
    console.error('Erreur vérification webhook:', error.message);
    throw new Error('Webhook non vérifié');
  }
};

/**
 * Récupère les informations d'un customer
 * @param {string} customerId - ID du customer
 * @returns {Promise<Object>} - Informations du customer
 */
const getCustomer = async (customerId) => {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    return customer;
  } catch (error) {
    console.error('Erreur récupération customer:', error.message);
    throw new Error('Échec de la récupération des informations client');
  }
};

/**
 * Annule un abonnement
 * @param {string} subscriptionId - ID de l'abonnement
 * @returns {Promise<Object>} - Abonnement annulé
 */
const cancelSubscription = async (subscriptionId) => {
  try {
    const subscription = await stripe.subscriptions.cancel(subscriptionId);
    return subscription;
  } catch (error) {
    console.error('Erreur annulation abonnement:', error.message);
    throw new Error('Échec de l\'annulation de l\'abonnement');
  }
};

module.exports = {
  stripe,
  createCustomer,
  createCheckoutSession,
  constructWebhookEvent,
  getCustomer,
  cancelSubscription
};
