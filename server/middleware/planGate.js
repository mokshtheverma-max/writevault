const { db } = require('../db/database');

const PLAN_HIERARCHY = ['free', 'student', 'teacher', 'institution'];

const PLAN_LIMITS = {
  free: { sessions: 3 },
  student: { sessions: Infinity },
  teacher: { sessions: Infinity },
  institution: { sessions: Infinity },
};

/**
 * Middleware: require user's plan to be at least `requiredPlan`.
 */
function checkPlan(requiredPlan) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userPlanIdx = PLAN_HIERARCHY.indexOf(req.user.plan);
    const requiredIdx = PLAN_HIERARCHY.indexOf(requiredPlan);

    if (userPlanIdx < requiredIdx) {
      return res.status(403).json({
        error: 'plan_required',
        message: `This feature requires the ${requiredPlan} plan or higher`,
        requiredPlan,
        currentPlan: req.user.plan,
        upgradeUrl: '/pricing',
      });
    }

    next();
  };
}

/**
 * Middleware: check if free-plan user has hit the 3-session limit.
 * Looks up the latest sessions_used from the database.
 */
function checkSessionLimit(req, res, next) {
  if (!req.user) {
    // Allow unauthenticated session submissions (backwards compat)
    return next();
  }

  const user = db.prepare('SELECT plan, sessions_used FROM users WHERE id = ?').get(req.user.id);
  if (!user) {
    return next();
  }

  const limit = PLAN_LIMITS[user.plan]?.sessions ?? 3;

  if (user.plan === 'free' && user.sessions_used >= limit) {
    return res.status(402).json({
      error: 'session_limit_reached',
      message: 'Upgrade to Student plan for unlimited sessions',
      upgradeUrl: '/pricing',
      sessionsUsed: user.sessions_used,
      sessionsLimit: limit,
    });
  }

  next();
}

module.exports = { checkPlan, checkSessionLimit, PLAN_HIERARCHY, PLAN_LIMITS };
