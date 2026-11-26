/**
 * Text normalization utilities for Vietnamese procurement data search.
 * Supports Unicode NFC normalization, diacritics removal, and query parsing.
 */

export function removeVietnameseAccents(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

export function normalizeSearchText(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFC')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export interface ParsedQuery {
  exactPhrases: string[];
  exactPhrasesNoAccent: string[];
  normalTokens: string[];
  normalTokensNoAccent: string[];
  isOrQuery: boolean;
}

/**
 * Parses user input query.
 * Default mode is 'phrase' (Tìm toàn văn nội dung / cụm từ nguyên khối, không tách từng từ).
 * Supports:
 * - full contiguous phrase matching: "quản lý dự án", "máy chủ ảo", "đường truyền Internet"
 * - explicit operators: CISSP OR PMP, CISSP AND PMP
 * - quoted phrases: "quản lý dự án"
 */
export function parseSearchQuery(
  query: string,
  defaultOperator: 'AND' | 'OR' = 'AND',
  mode: 'phrase' | 'words' = 'phrase'
): ParsedQuery {
  const normalized = normalizeSearchText(query);
  if (!normalized) {
    return {
      exactPhrases: [],
      exactPhrasesNoAccent: [],
      normalTokens: [],
      normalTokensNoAccent: [],
      isOrQuery: defaultOperator === 'OR',
    };
  }

  const exactPhrases: string[] = [];

  // 1. Extract explicitly quoted strings: "quản lý dự án"
  const quoteRegex = /"([^"]+)"/g;
  let match: RegExpExecArray | null;
  let textWithoutQuotes = normalized;

  while ((match = quoteRegex.exec(normalized)) !== null) {
    const phrase = match[1].trim();
    if (phrase) {
      exactPhrases.push(phrase);
    }
  }

  // Remove the quoted phrases from the remaining text
  textWithoutQuotes = normalized.replace(quoteRegex, ' ').replace(/\s+/g, ' ').trim();

  // If the query was purely quoted, return those phrases
  if (exactPhrases.length > 0 && !textWithoutQuotes) {
    return {
      exactPhrases,
      exactPhrasesNoAccent: exactPhrases.map((p) => removeVietnameseAccents(p)),
      normalTokens: [],
      normalTokensNoAccent: [],
      isOrQuery: defaultOperator === 'OR',
    };
  }

  // 2. Check for explicit OR / AND conjunction operators in text (e.g. CISSP OR PMP, CISSP AND PMP)
  const hasExplicitOr = /\b(or|hoặc)\b/i.test(textWithoutQuotes);
  const hasExplicitAnd = /\b(and|và)\b/i.test(textWithoutQuotes);

  if (hasExplicitOr) {
    const parts = textWithoutQuotes.split(/\s+(?:or|hoặc)\s+/i).map((p) => p.trim()).filter(Boolean);
    parts.forEach((p) => exactPhrases.push(p));
    return {
      exactPhrases,
      exactPhrasesNoAccent: exactPhrases.map((p) => removeVietnameseAccents(p)),
      normalTokens: [],
      normalTokensNoAccent: [],
      isOrQuery: true,
    };
  }

  if (hasExplicitAnd) {
    const parts = textWithoutQuotes.split(/\s+(?:and|và)\s+/i).map((p) => p.trim()).filter(Boolean);
    parts.forEach((p) => exactPhrases.push(p));
    return {
      exactPhrases,
      exactPhrasesNoAccent: exactPhrases.map((p) => removeVietnameseAccents(p)),
      normalTokens: [],
      normalTokensNoAccent: [],
      isOrQuery: false,
    };
  }

  // 3. Default mode: 'phrase' -> Full-text contiguous phrase matching!
  // Entire entered text in the box is treated as one complete phrase.
  if (mode === 'phrase') {
    if (textWithoutQuotes) {
      exactPhrases.push(textWithoutQuotes);
    }
    return {
      exactPhrases,
      exactPhrasesNoAccent: exactPhrases.map((p) => removeVietnameseAccents(p)),
      normalTokens: [],
      normalTokensNoAccent: [],
      isOrQuery: defaultOperator === 'OR',
    };
  }

  // 4. Fallback 'words' mode (if user explicitly chooses loose words matching)
  const rawTokens = textWithoutQuotes.split(/\s+/).filter(Boolean);
  const normalTokens: string[] = [];

  for (const token of rawTokens) {
    const lower = token.toLowerCase();
    if (lower === 'or' || lower === 'hoặc' || lower === 'and' || lower === 'và') {
      continue;
    }
    normalTokens.push(token);
  }

  return {
    exactPhrases,
    exactPhrasesNoAccent: exactPhrases.map((p) => removeVietnameseAccents(p)),
    normalTokens,
    normalTokensNoAccent: normalTokens.map((t) => removeVietnameseAccents(t)),
    isOrQuery: defaultOperator === 'OR',
  };
}
