const express = require('express');
const { requireAuth } = require('../middleware/auth');
const {
  db,
  getUserById,
  getUserByStripeCustomer,
  updateUserPlan,
  updateUserPlanByStripeCustomer,
  downgradeUserByStripeCustomer,
} = require('../db/database');

// Replace with real Stripe keys from dashboard.stripe.com
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder_replace_with_real';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder_replace_with_real';

const stripe = require('stripe')(STRIPE_SECRET_KEY);

const router = express.Router();

// Map Stripe price IDs to plan names
const PRICE_TO_PLAN = {
  'price_student_monthly_test': 'student',
  'price_teacher_monthly_test': 'teacher',
  'price_institution_monthly_test': 'institution',
  // Annual price IDs
  'price_student_annual_test': 'student',
  'price_teacher_annual_test': 'teacher',
  'price_institution_annual_test': 'institution',
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
  institution: {
    sessions: Infinity,
    fullAnalysis: true,
    writingDNA: true,
    pdfExport: true,
    shareTeacher: true,
    sessionHistory: Infinity,
    prioritySupport: true,
    bulkVerification: Infinity,
    classDashboard: true,
    csvExport: true,
    sso: false, // coming soon
    apiAccess: true,
    customBranding: true,
  },
};

// ── POST /api/payments/create-checkout ──────────────────────────────────────

router.post('/create-checkout', requireAuth, async (req, res) => {
  try {
    const { priceId, successUrl, cancelUrl } = req.body;

    if (!priceId) {
      return res.status(400).json({ error: 'priceId is required' });
    }

    if (!PRICE_TO_PLAN[priceId]) {
      return res.status(400).json({ error: 'Invalid priceId' });
    }

    const user = getUserById.get(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create or reuse Stripe customer
    let customerId = user.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { writevault_user_id: user.id },
      });
      customerId = customer.id;
      db.prepare('UPDATE users SET stripe_customer_id = ? WHERE id = ?').run(customerId, user.id);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl || 'http://localhost:5173/dashboard?checkout=success',
      cancel_url: cancelUrl || 'http://localhost:5173/pricing?checkout=cancelled',
      metadata: {
        writevault_user_id: user.id,
        plan: PRICE_TO_PLAN[priceId],
      },
    });

    res.json({ checkoutUrl: session.url });
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// ── POST /api/payments/webhook ──────────────────────────────────────────────

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
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
        const userId = session.metadata?.writevault_user_id;
        const plan = session.metadata?.plan;

        if (userId && plan) {
          updateUserPlan.run(
            plan,
            session.customer,
            session.subscription,
            null, // plan_expires_at — managed by Stripe
            userId
          );
          console.log(`User ${userId} upgraded to ${plan}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        downgradeUserByStripeCustomer.run(customerId);
        console.log(`Customer ${customerId} subscription cancelled — downgraded to free`);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        // Determine plan from the subscription's price
        const priceId = subscription.items?.data?.[0]?.price?.id;
        const plan = PRICE_TO_PLAN[priceId];

        if (plan) {
          const expiresAt = subscription.current_period_end || null;
          updateUserPlanByStripeCustomer.run(
            plan,
            subscription.id,
            expiresAt,
            customerId
          );
          console.log(`Customer ${customerId} subscription updated to ${plan}`);
        }
        break;
      }

      default:
        // Unhandled event type
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
    const user = getUserById.get(req.user.id);
    if (!user || !user.stripe_customer_id) {
      return res.status(400).json({ error: 'No billing account found. Subscribe to a plan first.' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: 'http://localhost:5173/dashboard',
    });

    res.json({ portalUrl: session.url });
  } catch (err) {
    console.error('Portal error:', err);
    res.status(500).json({ error: 'Failed to create billing portal session' });
  }
});

// ── GET /api/payments/status ────────────────────────────────────────────────

router.get('/status', requireAuth, (req, res) => {
  const user = getUserById.get(req.user.id);
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
