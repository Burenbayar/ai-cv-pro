function parseAllowedOrigins() {
    const raw = process.env.CORS_ORIGIN || process.env.CORS_ORIGINS || '';
    return raw
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean);
}
function isLocalDevOrigin(origin) {
    return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}
function isOriginAllowed(origin, allowed) {
    if (!origin)
        return true;
    if (allowed.includes(origin))
        return true;
    if (process.env.NODE_ENV !== 'production' && isLocalDevOrigin(origin))
        return true;
    return false;
}
export function applyCors(app) {
    const allowed = parseAllowedOrigins();
    app.use((req, res, next) => {
        const origin = req.headers.origin;
        if (origin && isOriginAllowed(origin, allowed)) {
            res.setHeader('Access-Control-Allow-Origin', origin);
            res.setHeader('Access-Control-Allow-Credentials', 'true');
            res.setHeader('Vary', 'Origin');
        }
        res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', req.headers['access-control-request-headers'] || 'Content-Type, Authorization');
        res.setHeader('Access-Control-Max-Age', '86400');
        if (req.method === 'OPTIONS') {
            res.sendStatus(204);
            return;
        }
        next();
    });
}
