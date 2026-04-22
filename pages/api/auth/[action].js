import { changePassword, login, signup } from '../../../controllers/auth.js';
import { requireAuth } from '../../../utils/requireAuth.js';
import { enforceOrigin } from '../../../utils/originPolicy.js';
import { getRequestIp, shouldRateLimit } from '../../../utils/rateLimit.js';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '32kb'
    }
  }
};

const handlers = {
  login: {
    POST: login
  },
  signup: {
    POST: signup
  },
  'change-password': {
    POST: changePassword
  }
};

export default async function handler(req, res) {
  res.setTimeout(15000, () => {
    if (!res.headersSent) {
      res.status(504).json({ success: false, message: 'Request timed out.' });
    }
  });

  if (!enforceOrigin(req, res)) {
    return;
  }

  const action = Array.isArray(req.query.action) ? req.query.action[0] : req.query.action;
  const routeHandlers = handlers[action];

  if (!routeHandlers) {
    res.status(404).json({ success: false, message: 'API route not found.' });
    return;
  }

  const methodHandler = routeHandlers[req.method];
  if (!methodHandler) {
    res.status(405).json({ success: false, message: `Method ${req.method} not allowed.` });
    return;
  }

  const ip = getRequestIp(req);
  const limiterKey = `auth:${ip}:${action}:${req.method}`;
  const limiter = shouldRateLimit(limiterKey, { maxAttempts: 120, windowMs: 10 * 60 * 1000 });
  if (limiter.limited) {
    res.setHeader('Retry-After', String(limiter.retryAfterSeconds));
    res.status(429).json({ success: false, message: 'Too many requests. Please try again later.' });
    return;
  }

  if (action === 'change-password') {
    const auth = requireAuth(req, res);
    if (!auth.ok) {
      return;
    }
    const bodyEmail = (req.body?.email || '').trim().toLowerCase();
    const tokenEmail = String(auth.user?.email || '').trim().toLowerCase();
    if (bodyEmail && tokenEmail && bodyEmail !== tokenEmail) {
      res.status(403).json({ success: false, message: 'Forbidden.' });
      return;
    }
  }

  await methodHandler(req, res);
}
