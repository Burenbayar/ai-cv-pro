function dedupeSentences(text) {
    const parts = text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
    const seen = new Set();
    const out = [];
    for (const p of parts) {
        const key = p.slice(0, 50).toLowerCase();
        if (seen.has(key))
            continue;
        seen.add(key);
        out.push(p);
    }
    return out.join(' ');
}
function polish(text) {
    return text.replace(/\s+/g, ' ').replace(/\s+([,.])/g, '$1').trim();
}
function pickGoalSentence(opts) {
    const goals = opts.careerGoals?.trim();
    if (goals && goals.length > 12)
        return goals.endsWith('.') ? goals : `${goals}.`;
    const fromCv = opts.narratives.find((n) => /зорилго|сонирхол|чиглэл|хүсэлтэй|aspir|looking to/i.test(n));
    if (fromCv)
        return fromCv.endsWith('.') ? fromCv : `${fromCv}.`;
    return opts.language === 'mn'
        ? 'Төгсөлтийн дараа мэргэжлийн түвшинд ажиллах, бодит ажлын орчинд мэдлэгээ хэрэгжүүлэх зорилготой.'
        : 'I aim to apply my studies in a professional role after graduation.';
}
export function buildStudentProfessionalAbout(profile, opts) {
    const lang = opts.language;
    const goal = pickGoalSentence(opts);
    const interest = opts.narratives
        .filter((n) => n.length > 30 && !/зорилго|objective/i.test(n))
        .slice(0, 1)
        .map((n) => (n.endsWith('.') ? n : `${n}.`))[0] || '';
    if (lang === 'mn') {
        const schoolPart = profile.school ? `${profile.school}-д` : 'дээд сургуульд';
        const yearPart = profile.yearLabel ? ` ${profile.yearLabel}` : '';
        const parts = [
            `Миний бие ${schoolPart} ${profile.fieldPlain} мэргэжлээр${yearPart} суралцаж буй оюутан.`,
            `${profile.fieldPlain} чиглэлээр онол, практик мэдлэгээ тасралтгүй сайжруулж, сурлагын ажил, төсөлд идэвхтэй оролцдог.`,
            interest,
            goal,
        ].filter(Boolean);
        return polish(dedupeSentences(parts.join(' ')));
    }
    const schoolPart = profile.school || 'university';
    const yearPart = profile.yearLabel ? `, ${profile.yearLabel}` : '';
    const parts = [
        `I am a${yearPart} ${profile.fieldPlain} student at ${schoolPart}, building academic and practical foundations in my field.`,
        interest,
        goal,
    ].filter(Boolean);
    return polish(dedupeSentences(parts.join(' ')));
}
