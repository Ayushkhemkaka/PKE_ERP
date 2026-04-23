import { sendError } from './apiResponse.js';

const normalizeOrigin = (origin) => {
  const raw = String(origin || '').trim();
  if (!raw) return '';

  try {
    const url = new URL(raw);
    const protocol = url.protocol.toLowerCase();
    const hostname = url.hostname.toLowerCase();
    const port = url.port;
    const isDefaultPort = (protocol === 'https:' && (port === '' || port === '443')) || (protocol === 'http:' && (port === '' || port === '80'));
    return `${protocol}//${hostname}${isDefaultPort ? '' : `:${port}`}`;
  } catch {
    return raw.toLowerCase().replace(/\/+$/, '');
  }
};

const parseAllowList = () => {
  const raw = String(process.env.ALLOWED_ORIGINS || '').trim();
  if (!raw) return [];
  return raw.split(',')
    .map((value) => normalizeOrigin(value))
    .filter(Boolean);
};

const getRequestOrigin = (req) => {
  const originHeader = req.headers?.origin || req.headers?.Origin;
  const origin = Array.isArray(originHeader) ? originHeader[0] : originHeader;
  return origin ? String(origin) : '';
};

const getRequestHostOrigin = (req) => {
  const protoHeader = req.headers?.['x-forwarded-proto'];
  const proto = Array.isArray(protoHeader) ? protoHeader[0] : protoHeader;
  const scheme = proto ? String(proto).split(',')[0].trim() : (process.env.NODE_ENV === 'production' ? 'https' : 'http');
  const hostHeader = req.headers?.host;
  const host = Array.isArray(hostHeader) ? hostHeader[0] : hostHeader;
  if (!host) return '';
  return `${scheme}://${String(host)}`;
};

const isOriginAllowed = (req) => {
  const allowList = parseAllowList();
  const origin = normalizeOrigin(getRequestOrigin(req));

  // Non-browser clients (or same-origin navigations) often omit Origin.
  if (!origin) {
    return true;
  }

  const hostOrigin = normalizeOrigin(getRequestHostOrigin(req));
  if (hostOrigin && origin === hostOrigin) {
    return true;
  }

  if (allowList.length === 0) {
    // If no allowlist is set, only allow same-origin.
    return false;
  }

  return allowList.includes(origin);
};

const enforceOrigin = (req, res) => {
  if (!isOriginAllowed(req)) {
    sendError(res, 'Forbidden.', 403);
    return false;
  }
  return true;
};

export { enforceOrigin };
