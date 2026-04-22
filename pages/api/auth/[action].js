import { changePassword, login, signup } from '../../../controllers/auth.js';

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

  await methodHandler(req, res);
}
