function normalizeOrigin(origin) {
    return origin.trim().replace(/\/+$/, '');
}
function parseAllowedOrigins() {
    const parts = [
        process.env.CORS_ORIGIN,
        process.env.CORS_ORIGINS,
        process.env.FRONTEND_URL,
    ]
        .filter(Boolean)
        .join(',');
    return parts
        .split(',')
        .map((o) => normalizeOrigin(o))
        .filter(Boolean);
}
function isLocalDevOrigin(origin) {
    return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
}
function matchOrigin(origin, rule) {
    const normalizedRule = normalizeOrigin(rule);
    if (normalizedRule === '*')
        return true;
    if (normalizedRule.startsWith('*.')) {
        const suffix = normalizedRule.slice(1);
        return origin.endsWith(suffix) || origin === `https://${normalizedRule.slice(2)}`;
    }
    return origin === normalizedRule;
}
function isOriginAllowed(origin, allowed) {
    if (!origin)
        return true;
    const normalized = normalizeOrigin(origin);
    if (allowed.some((rule) => matchOrigin(normalized, rule)))
        return true;
    if (process.env.NODE_ENV !== 'production' && isLocalDevOrigin(normalized))
        return true;
    return false;
}
export function getCorsAllowedOrigins() {
    return parseAllowedOrigins();
}
export function isCorsConfigured() {
    const allowed = getCorsAllowedOrigins();
    if (allowed.length > 0)
        return true;
    return process.env.NODE_ENV !== 'production';
}
export function applyCors(app) {
    const allowed = getCorsAllowedOrigins();
    const reflectAny = allowed.includes('*');
    if (process.env.NODE_ENV === 'production' && allowed.length === 0) {
        console.warn('[CORS] CORS_ORIGIN is empty — set it on Render (e.g. https://cv-pro-back.vercel.app)');
    }
    else if (allowed.length > 0) {
        console.log(`[CORS] ${allowed.length} allowed origin rule(s)`);
    }
    app.use((req, res, next) => {
        const origin = req.headers.origin;
        const allowedOrigin = origin && isOriginAllowed(origin, allowed);
        if (allowedOrigin) {
            res.setHeader('Access-Control-Allow-Origin', normalizeOrigin(origin));
            res.setHeader('Vary', 'Origin');
            if (!reflectAny) {
                res.setHeader('Access-Control-Allow-Credentials', 'true');
            }
        }
        res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', req.headers['access-control-request-headers'] || 'Content-Type, Authorization');
        res.setHeader('Access-Control-Max-Age', '86400');
        if (req.method === 'OPTIONS') {
            res.sendStatus(allowedOrigin || !origin ? 204 : 403);
            return;
        }
        next();
    });
}
