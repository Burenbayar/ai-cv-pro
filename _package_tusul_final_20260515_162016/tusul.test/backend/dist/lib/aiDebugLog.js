export function isAiDebugEnabled() {
    return process.env.AI_DEBUG === 'true' || process.env.NODE_ENV !== 'production';
}
export function logAiResponse(provider, label, payload) {
    if (!isAiDebugEnabled())
        return;
    const divider = '='.repeat(60);
    console.log(`\n${divider}\n[AI ${provider}] ${label}\n${divider}`);
    if (typeof payload === 'string') {
        console.log(payload);
    }
    else {
        console.log(JSON.stringify(payload, null, 2));
    }
    console.log(`${divider}\n`);
}
