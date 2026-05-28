import type {CvLanguage} from './cvSections.js';

const GENERIC_TARGET_RE =
  /^(software engineer|full[\s-]?stack|web developer|frontend|backend developer|developer|programmer|generalist|it specialist|программ|хөгжүүлэгч|инженер|оюутан|мэргэжилтэн|professional)$/i;

const STUDENT_MARKERS =
  /оюутан|суралцаж\s*буй|суралцаж\s*байна|undergraduate|college\s+student|university\s+student/i;

type DomainHint = {re: RegExp; mn: string; en: string; weight?: number};

const DOMAIN_HINTS: DomainHint[] = [
  {re: /нягтлан\s*бодогч|accountant|бүртгэл\s*бодогч|ifrs|quickbooks|1c\s*бухгалтер/i, mn: 'Нягтлан бодогч', en: 'Accountant', weight: 3},
  {re: /нягтлан|accounting\s+clerk|бүртгэлийн/i, mn: 'Нягтлан бодогч', en: 'Accountant', weight: 2},
  {re: /сувилгаан|nurse|эм\s*зүйч/i, mn: 'Сувилагч', en: 'Nurse', weight: 3},
  {re: /багш|teacher|боловсролын\s*байр/i, mn: 'Багш', en: 'Teacher', weight: 2},
  {re: /худалдаа|sales\s+representative|борлуулалтын/i, mn: 'Борлуулалтын мэргэжилтэн', en: 'Sales professional', weight: 2},
  {re: /хүний\s*нөөц|human\s+resources|\bhr\b/i, mn: 'Хүний нөөцийн мэргэжилтэн', en: 'HR specialist', weight: 2},
  {re: /маркетинг|marketing\s+manager/i, mn: 'Маркетингийн мэргэжилтэн', en: 'Marketing specialist', weight: 2},
  {re: /дизайн|designer|figma|ui\/ux/i, mn: 'Дизайнер', en: 'Designer', weight: 2},
  {re: /react|node\.?js|typescript|javascript|программ\s*хангамж|software\s+engineer|full[\s-]?stack/i, mn: 'Программ хангамжийн инженер', en: 'Software Engineer', weight: 2},
  {re: /санхүү|finance\s+analyst|эдийн\s*засаг/i, mn: 'Санхүүч', en: 'Finance professional', weight: 1},
];

const TITLE_LINE_RE =
  /нягтлан|accountant|developer|engineer|багш|nurse|дизайн|сувилгаан|маркетинг|программ|санхүү/i;

function countMatches(text: string, re: RegExp): number {
  return (text.match(new RegExp(re.source, re.flags.includes('i') ? 'gi' : 'g')) || []).length;
}

export type StudentStudyProfile = {
  fieldPlain: string;
  fieldRole: string;
  school: string;
  yearLabel: string;
};

export function isStudentCv(cvText: string): boolean {
  return (
    STUDENT_MARKERS.test(cvText) ||
    /\b[1-4][\s-]?р\s*курс\b/i.test(cvText) ||
    /\b\d+\s*р\s*ангийн?\s*оюутан/i.test(cvText)
  );
}

function cleanStudyField(raw: string): string {
  return raw
    .replace(/\s*\(оюутан\)\s*$/i, '')
    .replace(/\s*оюутан\s*$/i, '')
    .replace(/\s*суралцаж.*$/i, '')
    .trim();
}

function extractSchoolLine(cvText: string): string {
  const lines = cvText.split('\n').map((l) => l.trim()).filter(Boolean);
  const eduIdx = lines.findIndex((l) => /боловсрол|education/i.test(l));
  const scan = eduIdx >= 0 ? lines.slice(eduIdx, eduIdx + 14) : lines;
  for (const line of scan) {
    if (/(их\s*сургууль|дээд\s*сургууль|college|university|институт|сургууль|МУИС|ШУТИС|АШУҮИС|NUM|ИХЭС|СЭЗИС)/i.test(line) && line.length >= 8) {
      return line.replace(/^•\s*/, '').slice(0, 72);
    }
  }
  return '';
}

function extractYearLabel(cvText: string, lang: CvLanguage): string {
  const m = cvText.match(/(\d)\s*[-–]?\s*р\s*курс/i) || cvText.match(/(\d)\s*р\s*ангийн?\s*оюутан/i);
  if (!m?.[1]) return '';
  const n = m[1];
  return lang === 'mn' ? `${n}-р курсын оюутан` : `Year ${n} student`;
}

export function extractStudentStudyProfile(cvText: string, lang: CvLanguage): StudentStudyProfile | null {
  if (!isStudentCv(cvText)) return null;

  const fieldPatterns = [
    /([А-ЯӨҮа-яөү][А-ЯӨҮа-яөү\s,\-]{2,55})\s+мэргэжил(ийг|ээр|ийн)?\s*(суралцаж|суралцаж\s*буй|суралцаж\s*байна)/i,
    /мэргэжил[:\s]+([А-ЯӨҮа-яөү][^\n]{3,55})/i,
    /чиглэл[:\s]+([А-ЯӨҮа-яөү][^\n]{3,55})/i,
    /суралцаж\s*буй\s*[:\-]?\s*([А-ЯӨҮа-яөү][^\n]{3,55})/i,
    /(?:studying|major(?:ing)?\s+in)\s+([A-Za-z][A-Za-z\s\-]{2,40})/i,
    /(?:specialization|field\s+of\s+study)[:\s]+([A-Za-z][A-Za-z\s\-]{2,40})/i,
  ];

  let fieldPlain = '';
  for (const re of fieldPatterns) {
    const m = cvText.match(re);
    const raw = cleanStudyField((m?.[1] || '').trim().replace(/\s{2,}/g, ' '));
    if (raw.length < 3 || raw.length > 56) continue;
    if (/оюутан|student|суралцаж/i.test(raw)) continue;
    fieldPlain = raw;
    break;
  }

  const lines = cvText.split('\n');
  const eduIdx = lines.findIndex((l) => /боловсрол|education/i.test(l));
  const eduBlock = eduIdx >= 0 ? lines.slice(eduIdx, eduIdx + 12) : lines.slice(0, 25);

  if (!fieldPlain) {
    for (const line of eduBlock) {
      const m = line.match(/([А-ЯӨҮа-яөү][А-ЯӨҮа-яөү\s,\-]{2,40})\s*(мэргэжил|чиглэл|сургалт)/i);
      if (m?.[1] && m[1].length >= 4) {
        fieldPlain = cleanStudyField(m[1].trim());
        break;
      }
    }
  }

  const school = extractSchoolLine(cvText);
  const yearLabel = extractYearLabel(cvText, lang);
  const fallbackField = lang === 'mn' ? 'мэргэжлийн' : 'degree';
  const plain = fieldPlain || fallbackField;
  const fieldRole =
    lang === 'mn'
      ? `${plain} мэргэжлийн оюутан`
      : `${plain} student`;

  return {fieldPlain: plain, fieldRole, school, yearLabel};
}

function inferStudentField(cvText: string, lang: CvLanguage): string {
  const profile = extractStudentStudyProfile(cvText, lang);
  if (!profile) return '';
  return lang === 'mn' ? `${profile.fieldPlain} (оюутан)` : `${profile.fieldPlain} (Student)`;
}

function scoreDomains(cvText: string): {mn: string; en: string; score: number}[] {
  const scores: {mn: string; en: string; score: number}[] = [];
  for (const hint of DOMAIN_HINTS) {
    const hits = countMatches(cvText, hint.re);
    if (hits <= 0) continue;
    const w = hint.weight ?? 1;
    scores.push({mn: hint.mn, en: hint.en, score: hits * w});
  }
  return scores.sort((a, b) => b.score - a.score);
}

export function isTechCv(cvText: string): boolean {
  const t = cvText.toLowerCase();
  const hits = (t.match(/\b(react|node\.?js|typescript|javascript|python|java|sql|docker|aws)\b/g) || []).length;
  return hits >= 2;
}

export function isGenericTargetRole(role: string): boolean {
  const t = role.trim();
  if (!t) return true;
  if (GENERIC_TARGET_RE.test(t)) return true;
  if (/software engineer/i.test(t) && t.length < 40) return true;
  return false;
}

function professionMentionedInCv(role: string, cvText: string): boolean {
  const r = role.trim().toLowerCase();
  if (!r || !cvText.trim()) return false;

  for (const hint of DOMAIN_HINTS) {
    const label = hint.mn.toLowerCase();
    const labelEn = hint.en.toLowerCase();
    if (r.includes(label) || r.includes(labelEn) || label.includes(r) || labelEn.includes(r)) {
      return hint.re.test(cvText);
    }
  }

  const tokens = r.split(/[\s,()/]+/).filter((w) => w.length > 3);
  if (tokens.length === 0) return cvText.toLowerCase().includes(r);
  const matched = tokens.filter((w) => cvText.toLowerCase().includes(w));
  return matched.length >= Math.min(2, tokens.length);
}

export function inferProfessionFromCv(cvText: string, lang: CvLanguage): string {
  if (!cvText?.trim()) return '';

  const studentField = inferStudentField(cvText, lang);
  if (studentField) return studentField;

  const titleLine = cvText
    .split('\n')
    .map((l) => l.trim())
    .find((l) => TITLE_LINE_RE.test(l) && l.length < 90 && l.length > 4);
  if (titleLine) {
    const cleaned = titleLine.replace(/^[\d•\-\s]+/, '').slice(0, 56);
    if (cleaned.length > 4 && !/оюутан\s*$/i.test(cleaned)) return cleaned;
  }

  const ranked = scoreDomains(cvText);
  if (ranked.length > 0 && ranked[0].score >= 2) {
    return lang === 'mn' ? ranked[0].mn : ranked[0].en;
  }
  if (ranked.length > 0 && ranked[0].score >= 1) {
    const top = ranked[0];
    const second = ranked[1];
    if (!second || top.score >= second.score + 1) {
      return lang === 'mn' ? top.mn : top.en;
    }
  }
  return '';
}

/** Header subtitle: CV-ийн бодит мэргэжил; өмнөх ажлын байрны тайлбарыг бүү холь */
export function resolveDisplayRole(targetRole: string, cvText: string, lang: CvLanguage): string {
  const trimmed = targetRole.trim().replace(/^[\d•\-\s]+/, '');
  const inferred = inferProfessionFromCv(cvText, lang);
  const looksLikeJobBlob =
    trimmed.length > 72 ||
    /^[•\-–]/.test(trimmed) ||
    (trimmed.match(/[•\n]/g) || []).length >= 2 ||
    /сонирхолтой|шинэ төгсөгч|чиглэлд\s*ажиллах|job\s+description|requirements/i.test(trimmed);

  if (!trimmed) return inferred || (lang === 'mn' ? 'Мэргэжилтэн' : 'Professional');
  if (looksLikeJobBlob) return inferred || trimmed.split(/\n/)[0].replace(/^[•\-\s]+/, '').slice(0, 56);
  if (isGenericTargetRole(trimmed)) return inferred || trimmed;
  if (inferred && !professionMentionedInCv(trimmed, cvText)) return inferred;
  if (inferred && professionMentionedInCv(trimmed, cvText)) {
    return trimmed.length <= 56 ? trimmed : inferred;
  }
  if (trimmed.length > 56) return trimmed.split(/\n/)[0].replace(/^[•\-\s]+/, '').slice(0, 56);
  return trimmed;
}
