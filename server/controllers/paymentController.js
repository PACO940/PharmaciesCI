/**
 * Contrôleur de paiement et abonnements
 * Gère les subscriptions Stripe et les upgrades premium
 */

const { validationResult } = require('express-validator');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');
const stripeService = require('../config/stripe');

/**
 * Créer une session de checkout pour l'abonnement premium
 * POST /api/payment/create-checkout-session
 */
exports.createCheckoutSession = async (req, res, next) => {
  try {
    const { priceId } = req.body;

    if (!priceId) {
      throw new AppError('ID du prix requis', 400);
    }

    const user = await User.findById(req.user.id);

    // Vérifier si l'utilisateur a un customer Stripe
    if (!user.subscription.stripeCustomerId) {
      // Créer un nouveau customer Stripe
      const customer = await stripeService.createCustomer(user.email, user._id.toString());
      user.subscription.stripeCustomerId = customer.id;
      await user.save();
    }

    const successUrl = `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${process.env.CLIENT_URL}/pricing`;

    const session = await stripeService.createCheckoutSession(
      user.subscription.stripeCustomerId,
      priceId,
      successUrl,
      cancelUrl
    );

    res.status(200).json({
      success: true,
      data: {
        sessionId: session.id,
        url: session.url
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Webhook Stripe pour gérer les événements de paiement
 * POST /api/payment/webhook
 */
exports.handleWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['stripe-signature'];
    
    let event;
    
    try {
      event = stripeService.constructWebhookEvent(req.body, signature);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: `Erreur webhook: ${error.message}`
      });
    }

    // Gérer les différents types d'événements
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        
        // Trouver l'utilisateur via le customer ID
        const user = await User.findOne({ 
          'subscription.stripeCustomerId': session.customer 
        });

        if (user) {
          user.subscription.plan = 'premium';
          user.subscription.isActive = true;
          user.subscription.startDate = new Date();
          user.subscription.endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 jours
          user.subscription.stripeSubscriptionId = session.subscription;
          
          // Limites illimitées pour premium
          user.usage.titleGenerations.limit = 999999;
          user.usage.thumbnailGenerations.limit = 999999;
          
          await user.save();
          
          console.log(`✅ Utilisateur ${user.email} passé premium`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        
        const user = await User.findOne({ 
          'subscription.stripeSubscriptionId': subscription.id 
        });

        if (user) {
          if (subscription.status === 'active') {
            user.subscription.isActive = true;
            user.subscription.plan = 'premium';
          } else if (subscription.status === 'canceled') {
            user.subscription.isActive = false;
            user.subscription.plan = 'free';
            user.usage.titleGenerations.limit = 5;
            user.usage.thumbnailGenerations.limit = 3;
          }
          
          await user.save();
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        
        const user = await User.findOne({ 
          'subscription.stripeSubscriptionId': subscription.id 
        });

        if (user) {
          user.subscription.isActive = false;
          user.subscription.plan = 'free';
          user.subscription.stripeSubscriptionId = null;
          user.subscription.endDate = new Date();
          user.usage.titleGenerations.limit = 5;
          user.usage.thumbnailGenerations.limit = 3;
          
          await user.save();
          
          console.log(`⚠️ Abonnement de ${user.email} annulé`);
        }
        break;
      }

      default:
        console.log(`Événement Stripe non géré: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtenir le statut de l'abonnement
 * GET /api/payment/subscription-status
 */
exports.getSubscriptionStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        plan: user.subscription.plan,
        isActive: user.subscription.isActive,
        startDate: user.subscription.startDate,
        endDate: user.subscription.endDate,
        usage: {
          titleGenerations: {
            used: user.usage.titleGenerations.count,
            limit: user.subscription.plan === 'premium' ? 'illimité' : user.usage.titleGenerations.limit
          },
          thumbnailGenerations: {
            used: user.usage.thumbnailGenerations.count,
            limit: user.subscription.plan === 'premium' ? 'illimité' : user.usage.thumbnailGenerations.limit
          }
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Annuler l'abonnement
 * POST /api/payment/cancel-subscription
 */
exports.cancelSubscription = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user.subscription.stripeSubscriptionId) {
      throw new AppError('Aucun abonnement actif trouvé', 400);
    }

    // Dans un environnement réel, on utiliserait stripe.subscriptions.cancel
    // Ici on simule la suppression
    user.subscription.isActive = false;
    user.subscription.plan = 'free';
    user.subscription.stripeSubscriptionId = null;
    user.subscription.endDate = new Date();
    user.usage.titleGenerations.limit = 5;
    user.usage.thumbnailGenerations.limit = 3;
    
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Abonnement annulé avec succès. Vous restez premium jusqu\'à la fin de la période.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtenir les plans tarifaires
 * GET /api/payment/plans
 */
exports.getPlans = async (req, res, next) => {
  try {
    // Plans statiques - dans un environnement réel, on pourrait les récupérer depuis Stripe
    const plans = [
      {
        id: 'free',
        name: 'Gratuit',
        price: 0,
        currency: 'EUR',
        interval: 'month',
        features: [
          '5 générations de titres/jour',
          '3 générations de miniatures/jour',
          'Templates basiques',
          'Support par email'
        ],
        limitations: {
          titleGenerations: 5,
          thumbnailGenerations: 3,
          templates: 'basics'
        },
        popular: false
      },
      {
        id: 'premium',
        name: 'Premium',
        price: 9.99,
        currency: 'EUR',
        interval: 'month',
        features: [
          'Générations illimitées',
          'Templates premium',
          'Analyse SEO avancée',
          'Support prioritaire',
          'Export haute qualité',
          'Historique illimité'
        ],
        limitations: {
          titleGenerations: 'unlimited',
          thumbnailGenerations: 'unlimited',
          templates: 'all'
        },
        popular: true
      }
    ];

    res.status(200).json({
      success: true,
      data: { plans }
    });
  } catch (error) {
    next(error);
  }
};
