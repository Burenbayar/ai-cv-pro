import { extractStudentStudyProfile, isStudentCv, isTechCv, resolveDisplayRole } from './cvProfession.js';
import { buildStudentProfessionalAbout } from './cvStudentAbout.js';
import { restoreMongolianWordSpacing } from './cvTextSpacing.js';
const SKILL_TOKEN = /\b(javascript|typescript|react|next\.?js|node\.?js|sql|postgresql|python|java|html|css|figma|mongodb|docker|aws|git|express|graphql|tailwind)\b/gi;
const INTEREST_RE = /сонирхол|зорилго|чиглэл|хүсэл|passion|objective|career goal|interested in|aim to|looking to|aspir/i;
const VAGUE_ABOUT_RE = /мэргэжлийн\s*ёс\s*зүй|хариуцлага[гтай]*\s*[,]?\s*харилцаа|professional\s*responsibility|reliable\s*delivery|clear\s*communication/i;
export function isSkillHeavyAbout(text) {
    const t = text.trim();
    if (!t)
        return false;
    const skillHits = (t.match(SKILL_TOKEN) || []).length;
    if (skillHits >= 3)
        return true;
    if (/зэрэг ур чадвартай|skills such as|with strengths in|ур чадвартай\./i.test(t))
        return true;
    if (/^.{0,80}(javascript|react|node\.js)/i.test(t) && skillHits >= 2)
        return true;
    return false;
}
export function isVagueAbout(text) {
    const t = text.trim();
    if (t.length < 100)
        return true;
    const sentences = t.split(/(?<=[.!?])\s+/).filter(Boolean);
    if (sentences.length < 2)
        return true;
    if (VAGUE_ABOUT_RE.test(t) && t.length < 220)
        return true;
    return false;
}
export function extractNarrativeFromCv(cvText) {
    const lines = cvText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
    const chunks = [];
    let capture = false;
    for (const line of lines) {
        const isProfileHeader = /^(profile|товч\s*танилцуулга|зорилго|objective|about\s*me|миний\s*тухай)$/i.test(line);
        if (isProfileHeader) {
            capture = true;
            continue;
        }
        if (capture && /^[A-ZА-ЯӨҮЁ0-9][^.]{0,48}$/.test(line) && /\d{4}|сургууль|university|college/i.test(line)) {
            capture = false;
        }
        if (capture && line.length > 30 && !isSkillHeavyAbout(line)) {
            chunks.push(line.replace(/^•\s*/g, '').trim());
        }
    }
    for (const block of cvText.split(/\n{2,}/)) {
        const t = block.trim().replace(/\s+/g, ' ');
        if (t.length < 45 || t.length > 900)
            continue;
        if (isSkillHeavyAbout(t))
            continue;
        if (!INTEREST_RE.test(t) && !/программ|инженер|developer|оюутан|хөгжүүл|нягтлан|бүртгэл|accountant|санхүү|суралцаж/i.test(t))
            continue;
        if (!chunks.some((c) => c.includes(t.slice(0, 40))))
            chunks.push(t);
    }
    return chunks.slice(0, 3);
}
function stripSkillLists(text) {
    return text
        .replace(SKILL_TOKEN, '')
        .replace(/\s*[,،]\s*[,،]+/g, ',')
        .replace(/\s{2,}/g, ' ')
        .replace(/зэрэг ур чадвартай\.?/gi, '')
        .trim();
}
function polishSentences(text) {
    return text
        .replace(/\s+/g, ' ')
        .replace(/\s+([,.])/g, '$1')
        .replace(/([а-яөүёa-z])\s*-\s*/gi, '$1 ')
        .replace(/•\s*/g, ' ')
        .trim();
}
/** «Б. Солонго нь…» → «Миний бие…» */
export function convertToFirstPersonMn(text, displayName) {
    let t = restoreMongolianWordSpacing(polishSentences(text));
    const name = displayName.trim();
    if (name) {
        const esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        t = t.replace(new RegExp(`${esc}\\s*ний?\\s*${esc}`, 'gi'), '');
        t = t.replace(new RegExp(`${esc}\\s*ний?\\s*`, 'gi'), '');
    }
    t = t.replace(/^[А-ЯӨҮЁA-Z]\.\s*[А-ЯӨҮЁA-Z]+\s*ний?\s*/u, '');
    t = t.replace(/^\S+(?:\s+\S+)?\s+нь\s+/i, '');
    t = t.trim();
    if (!/^миний\s*бие/i.test(t)) {
        t = `Миний бие ${t.replace(/^нь\s+/i, '')}`.trim();
    }
    return t.replace(/^(миний\s*бие\s+){2,}/i, 'Миний бие ').trim();
}
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
function buildMnHeuristic(opts, role) {
    const goals = opts.careerGoals?.trim();
    if (/нягтлан|бүртгэл|accountant/i.test(opts.cvText)) {
        const parts = [
            `Миний бие ${role} мэргэжлээр ажилладаг. Санхүүгийн тайлан, данс бүртгэл, төлбөр тооцооны ажилд туршлагатай.`,
            `Үнэнч шударга, эмх цэгцтэй ажиллах зарчмыг баримталж, багийн ажилд идэвхтэй оролцдог.`,
        ];
        if (goals)
            parts.push(goals.endsWith('.') ? goals : `${goals}.`);
        return polishSentences(dedupeSentences(parts.join(' ')));
    }
    if (isTechCv(opts.cvText)) {
        const parts = [
            `Миний бие ${role} чиглэлд ажилладаг. Бодит төсөл, багийн хамтын ажиллагаанд оролцож, хэрэглэгчид үнэ цэн бүтээхэд чиглэсэн.`,
            `Шинэ технологи сурах, кодын чанарыг сайжруулахад тогтмол анхаардаг.`,
        ];
        if (goals)
            parts.push(goals.endsWith('.') ? goals : `${goals}.`);
        return polishSentences(parts.join(' '));
    }
    const parts = [
        `Миний бие ${role} мэргэжлээр ажилладаг.`,
        `Мэргэжлийн хариуцлага, багийн хамтын ажиллагаа, үр дүнгийн чанарт анхаарч, өөрийн чадвараа тасралтгүй хөгжүүлдэг.`,
    ];
    if (goals)
        parts.push(goals.endsWith('.') ? goals : `${goals}.`);
    return polishSentences(dedupeSentences(parts.join(' ')));
}
function buildEnHeuristic(opts, role) {
    const goals = opts.careerGoals?.trim();
    const parts = [
        `${opts.displayName.trim()} is a ${role} focused on quality work, collaboration, and continuous learning.`,
        `Committed to applying expertise responsibly and delivering measurable value in professional settings.`,
    ];
    if (goals)
        parts.push(goals.endsWith('.') ? goals : `${goals}.`);
    return polishSentences(dedupeSentences(parts.join(' ')));
}
export function buildProfessionalAbout(opts) {
    const finish = (text) => {
        const out = opts.language === 'mn' ? convertToFirstPersonMn(text, opts.displayName) : polishSentences(text);
        return dedupeSentences(out).slice(0, 560);
    };
    const role = resolveDisplayRole(opts.targetRole, opts.cvText, opts.language);
    const narratives = extractNarrativeFromCv(opts.cvText)
        .map((n) => polishSentences(stripSkillLists(n)))
        .filter((n) => n.length > 35 && !isSkillHeavyAbout(n));
    const studentProfile = extractStudentStudyProfile(opts.cvText, opts.language);
    if (studentProfile || isStudentCv(opts.cvText)) {
        const profile = studentProfile || {
            fieldPlain: role.replace(/\s*\(оюутан\)\s*$/i, '').trim() || 'мэргэжлийн',
            fieldRole: role,
            school: '',
            yearLabel: '',
        };
        const studentAbout = buildStudentProfessionalAbout(profile, {
            cvText: opts.cvText,
            careerGoals: opts.careerGoals,
            language: opts.language,
            narratives,
        });
        if (studentAbout.length >= 80)
            return finish(studentAbout);
    }
    const existing = polishSentences(stripSkillLists(opts.existingAbout || ''));
    const existingUsable = existing.length > 50 && !isSkillHeavyAbout(existing) && !isVagueAbout(existing);
    if (existingUsable) {
        const mentionsRole = existing.toLowerCase().includes(role.slice(0, 12).toLowerCase()) ||
            (studentProfile && existing.includes(studentProfile.fieldPlain.slice(0, 8)));
        if (mentionsRole || !studentProfile)
            return finish(existing);
    }
    if (narratives.length >= 2) {
        const merged = polishSentences(narratives.join(' '));
        if (merged.length > 100)
            return finish(merged);
    }
    if (narratives.length === 1) {
        const extra = opts.language === 'mn'
            ? buildMnHeuristic(opts, role).split(/(?<=[.!?])\s+/).slice(1).join(' ')
            : buildEnHeuristic(opts, role).split(/(?<=[.!?])\s+/).slice(1).join(' ');
        const merged = polishSentences(`${narratives[0]} ${extra}`.trim());
        if (merged.length > 100)
            return finish(merged);
    }
    return finish(opts.language === 'mn' ? buildMnHeuristic(opts, role) : buildEnHeuristic(opts, role));
}
