const express = require('express');
const { requireAuth } = require('../middleware/auth');
const {
  db,
  getUserById,
  updateUserPlan,
  updateUserPlanByStripeCustomer,
  getUserByStripeCustomer,
  downgradeUserByStripeCustomer,
} = require('../db/database');

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder_replace_with_real';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder_replace_with_real';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const stripe = require('stripe')(STRIPE_SECRET_KEY);

const router = express.Router();

// ── Plan definitions ────────────────────────────────────────────────────────

const PLAN_DEFS = {
  student: { productName: 'WriteVault Student', amount: 700 },
  teacher: { productName: 'WriteVault Teacher', amount: 1900 },
};

const PLAN_FEATURES = {
  free: {
    sessions: 3,
    fullAnalysis: false,
    writingDNA: false,
    pdfExport: false,
    shareTeacher: false,
    sessionHistory: 0,
    prioritySupport: false,
  },
  student: {
    sessions: Infinity,
    fullAnalysis: true,
    writingDNA: true,
    pdfExport: true,
    shareTeacher: true,
    sessionHistory: 50,
    prioritySupport: true,
  },
  teacher: {
    sessions: Infinity,
    fullAnalysis: true,
    writingDNA: true,
    pdfExport: true,
    shareTeacher: true,
    sessionHistory: 50,
    prioritySupport: true,
    bulkVerification: 200,
    classDashboard: true,
    csvExport: true,
  },
};

// In-memory store for live Stripe price IDs (populated at startup)
const PRICE_IDS = {
  student: null,
  teacher: null,
};

// ── Reverse map: price ID → plan name (kept in sync as prices are loaded) ───
const priceToPlan = () => {
  const map = {};
  for (const [plan, id] of Object.entries(PRICE_IDS)) {
    if (id) map[id] = plan;
  }
  return map;
};

// ── Stripe product/price bootstrap ──────────────────────────────────────────

async function ensureStripeProducts() {
  try {
    const products = await stripe.products.list({ limit: 100 });

    for (const [planKey, def] of Object.entries(PLAN_DEFS)) {
      let price;
      const product = products.data.find((p) => p.name === def.productName && p.active);

      if (product) {
        const prices = await stripe.prices.list({ product: product.id, active: true });
        price = prices.data.find(
          (p) => p.recurring?.interval === 'month' && p.unit_amount === def.amount
        );
      }

      if (!price) {
        const prod = product || (await stripe.products.create({ name: def.productName }));
        price = await stripe.prices.create({
          product: prod.id,
          unit_amount: def.amount,
          currency: 'usd',
          recurring: { interval: 'month' },
        });
        console.log(`Created Stripe price for ${planKey}: ${price.id}`);
      }

      PRICE_IDS[planKey] = price.id;
    }

    console.log('Stripe prices ready:', PRICE_IDS);
  } catch (e) {
    console.error('Stripe setup error:', e.message);
  }
}

// ── POST /api/payments/create-checkout ──────────────────────────────────────

router.post('/create-checkout', requireAuth, async (req, res) => {
  try {
    const { plan } = req.body;

    if (!plan || !PLAN_DEFS[plan]) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    const priceId = PRICE_IDS[plan];
    if (!priceId) {
      return res.status(503).json({ error: 'Billing not yet ready, try again in a moment' });
    }

    const user = await getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let customerId = user.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await db.run('UPDATE users SET stripe_customer_id = ? WHERE id = ?', [customerId, user.id]);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${CLIENT_URL}/pricing`,
      metadata: { userId: user.id, plan },
    });

    res.json({ checkoutUrl: session.url });
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// ── POST /api/payments/webhook ──────────────────────────────────────────────

router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: 'Invalid webhook signature' });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan;

        if (userId && plan) {
          const expiresAt = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
          await updateUserPlan(plan, session.customer, session.subscription, expiresAt, userId);
          console.log(`User ${userId} upgraded to ${plan}`);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const customerId = invoice.customer;
        const user = await getUserByStripeCustomer(customerId);
        if (user) {
          const base = Math.max(user.plan_expires_at || 0, Math.floor(Date.now() / 1000));
          const expiresAt = base + 30 * 24 * 60 * 60;
          await updateUserPlanByStripeCustomer(
            user.plan || 'student',
            user.stripe_subscription_id || invoice.subscription,
            expiresAt,
            customerId
          );
          console.log(`Customer ${customerId} renewed → expires ${expiresAt}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        await downgradeUserByStripeCustomer(customerId);
        console.log(`Customer ${customerId} subscription cancelled — downgraded to free`);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        const priceId = subscription.items?.data?.[0]?.price?.id;
        const plan = priceToPlan()[priceId];
        if (plan) {
          const expiresAt = subscription.current_period_end || null;
          await updateUserPlanByStripeCustomer(plan, subscription.id, expiresAt, customerId);
          console.log(`Customer ${customerId} subscription updated to ${plan}`);
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error('Webhook handler error:', err);
  }

  res.json({ received: true });
});

// ── GET /api/payments/portal ────────────────────────────────────────────────

router.get('/portal', requireAuth, async (req, res) => {
  try {
    const user = await getUserById(req.user.id);
    if (!user || !user.stripe_customer_id) {
      return res.status(400).json({ error: 'No billing account found. Subscribe to a plan first.' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${CLIENT_URL}/dashboard`,
    });

    res.json({ portalUrl: session.url });
  } catch (err) {
    console.error('Portal error:', err);
    res.status(500).json({ error: 'Failed to create billing portal session' });
  }
});

// ── GET /api/payments/status ────────────────────────────────────────────────

router.get('/status', requireAuth, async (req, res) => {
  const user = await getUserById(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const plan = user.plan || 'free';
  const features = PLAN_FEATURES[plan] || PLAN_FEATURES.free;
  const sessionsLimit = features.sessions === Infinity ? 'unlimited' : features.sessions;

  res.json({
    plan,
    sessionsUsed: user.sessions_used || 0,
    sessionsLimit,
    features,
    stripeCustomerId: user.stripe_customer_id || null,
    subscriptionId: user.stripe_subscription_id || null,
    planExpiresAt: user.plan_expires_at || null,
  });
});

module.exports = router;
module.exports.ensureStripeProducts = ensureStripeProducts;
