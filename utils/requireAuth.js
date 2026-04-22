import { sendError } from './apiResponse.js';
import { verifyAuthToken } from './authToken.js';

const extractBearerToken = (req) => {
    const headerValue = req.headers?.authorization || req.headers?.Authorization;
    const raw = Array.isArray(headerValue) ? headerValue[0] : headerValue;
    if (!raw) {
        return null;
    }
    const match = String(raw).match(/^Bearer\s+(.+)$/i);
    return match ? match[1].trim() : null;
};

const requireAuth = (req, res) => {
    const token = extractBearerToken(req);
    if (!token) {
        sendError(res, 'Unauthorized.', 401);
        return { ok: false, user: null };
    }

    try {
        const verified = verifyAuthToken(token);
        if (!verified.ok) {
            sendError(res, 'Unauthorized.', 401);
            return { ok: false, user: null };
        }

        const user = verified.payload || null;
        req.authUser = user;
        return { ok: true, user };
    } catch (error) {
        console.error('Auth verification failed', error);
        sendError(res, 'Server authentication misconfigured.', 500);
        return { ok: false, user: null };
    }
};

export { requireAuth };

