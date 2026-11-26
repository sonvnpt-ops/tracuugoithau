import {
  TenderRecord,
  SearchResultItem,
  FilterCriteria,
  FieldSnippet,
  SortOption,
} from '../types/tender';
import {
  normalizeSearchText,
  removeVietnameseAccents,
  parseSearchQuery,
  ParsedQuery,
} from './textNormalizer';

/**
 * Extracts a concise surrounding context snippet for the matched term.
 */
function extractSnippet(
  text: string,
  matchedTerm: string,
  maxLength = 160
): string {
  if (!text) return '';
  const lowerText = text.toLowerCase();
  const lowerNoAccText = removeVietnameseAccents(lowerText);
  const lowerTerm = matchedTerm.toLowerCase();
  const lowerNoAccTerm = removeVietnameseAccents(lowerTerm);

  let idx = lowerText.indexOf(lowerTerm);
  if (idx === -1) {
    idx = lowerNoAccText.indexOf(lowerNoAccTerm);
  }

  if (idx === -1) {
    // If exact not found, return first chunk
    return text.slice(0, maxLength) + (text.length > maxLength ? '...' : '');
  }

  const start = Math.max(0, idx - 45);
  const end = Math.min(text.length, idx + matchedTerm.length + 80);

  let snippet = text.slice(start, end).trim();
  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';

  return snippet;
}

/**
 * Checks if a given field text satisfies the parsed query.
 */
function testFieldMatches(
  rawText: string | undefined,
  normText: string,
  normNoAccent: string,
  parsedQuery: ParsedQuery
): { matched: boolean; score: number; matchedTerms: string[]; snippetText?: string } {
  if (!rawText || (!normText && !normNoAccent)) {
    return { matched: false, score: 0, matchedTerms: [] };
  }

  const matchedTerms: string[] = [];
  let score = 0;

  // 1. Check exact phrases
  for (let i = 0; i < parsedQuery.exactPhrases.length; i++) {
    const phrase = parsedQuery.exactPhrases[i];
    const phraseNoAccent = parsedQuery.exactPhrasesNoAccent[i];

    const hasAccent = normText.includes(phrase);
    const hasNoAccent = normNoAccent.includes(phraseNoAccent);

    if (hasAccent || hasNoAccent) {
      score += 120;
      matchedTerms.push(phrase);
    } else if (!parsedQuery.isOrQuery) {
      // If AND query and an exact phrase fails, the field fails this exact phrase check
      return { matched: false, score: 0, matchedTerms: [] };
    }
  }

  // 2. Check tokens
  let tokenMatchesCount = 0;
  for (let i = 0; i < parsedQuery.normalTokens.length; i++) {
    const token = parsedQuery.normalTokens[i];
    const tokenNoAccent = parsedQuery.normalTokensNoAccent[i];

    const hasAccent = normText.includes(token);
    const hasNoAccent = normNoAccent.includes(tokenNoAccent);

    if (hasAccent || hasNoAccent) {
      tokenMatchesCount++;
      matchedTerms.push(token);
      score += 25;
      // Bonus if matched with accent
      if (hasAccent) score += 10;
    }
  }

  // Determine overall field match
  let isMatched = false;
  const totalConditions = parsedQuery.exactPhrases.length + parsedQuery.normalTokens.length;

  if (totalConditions === 0) {
    // Empty query matches all
    return { matched: true, score: 0, matchedTerms: [] };
  }

  if (parsedQuery.isOrQuery) {
    isMatched = matchedTerms.length > 0;
  } else {
    // AND query: all phrases and all tokens must match
    isMatched =
      matchedTerms.length >= totalConditions &&
      tokenMatchesCount === parsedQuery.normalTokens.length;
  }

  let snippetText: string | undefined;
  if (isMatched && matchedTerms.length > 0) {
    snippetText = extractSnippet(rawText, matchedTerms[0]);
  }

  return { matched: isMatched, score, matchedTerms, snippetText };
}

/**
 * Filter record against metadata criteria (plan_no, date, provinces, etc.)
 */
export function matchesMetadataFilters(
  record: TenderRecord,
  filters: FilterCriteria
): boolean {
  if (filters.has_goods && !record.goods_info_str?.trim()) return false;
  if (filters.has_services && !record.services_info_str?.trim()) return false;
  if (filters.has_persons && !record.persons_info_str?.trim()) return false;

  if (filters.plan_no && !record.plan_no?.toLowerCase().includes(filters.plan_no.toLowerCase().trim())) {
    return false;
  }
  if (filters.bid_name && !record.bid_name?.toLowerCase().includes(filters.bid_name.toLowerCase().trim())) {
    return false;
  }
  if (filters.project_name && !record.project_name?.toLowerCase().includes(filters.project_name.toLowerCase().trim())) {
    return false;
  }
  if (filters.procuring_entity_name && !record.procuring_entity_name?.toLowerCase().includes(filters.procuring_entity_name.toLowerCase().trim())) {
    return false;
  }
  if (filters.investor_name && !record.investor_name?.toLowerCase().includes(filters.investor_name.toLowerCase().trim())) {
    return false;
  }
  if (filters.invest_field && record.invest_field !== filters.invest_field) {
    return false;
  }
  if (filters.contract_type && record.contract_type !== filters.contract_type) {
    return false;
  }
  if (filters.province_code && record.province_code !== filters.province_code) {
    return false;
  }

  // Date range check
  if (filters.date_from && record.original_public_date) {
    if (new Date(record.original_public_date) < new Date(filters.date_from)) {
      return false;
    }
  }
  if (filters.date_to && record.original_public_date) {
    if (new Date(record.original_public_date) > new Date(filters.date_to + 'T23:59:59')) {
      return false;
    }
  }

  return true;
}

/**
 * Main Search Execution Function
 */
export function executeSearch(
  records: TenderRecord[],
  query: string,
  filters: FilterCriteria,
  sortBy: SortOption = 'relevance'
): { results: SearchResultItem[]; matchCounts: { goods: number; services: number; persons: number; total: number } } {
  const parsedQuery = parseSearchQuery(query, filters.operator, filters.searchMode || 'phrase');
  const isQueryEmpty =
    parsedQuery.exactPhrases.length === 0 && parsedQuery.normalTokens.length === 0;

  const results: SearchResultItem[] = [];
  let goodsMatchCount = 0;
  let servicesMatchCount = 0;
  let personsMatchCount = 0;

  for (const record of records) {
    // 1. Apply metadata filters first
    if (!matchesMetadataFilters(record, filters)) {
      continue;
    }

    // Precomputed or fallback normalized strings
    const goodsNorm = record._normalized?.goods ?? normalizeSearchText(record.goods_info_str || '');
    const goodsNoAcc = record._normalized?.goods_no_accent ?? removeVietnameseAccents(goodsNorm);

    const servNorm = record._normalized?.services ?? normalizeSearchText(record.services_info_str || '');
    const servNoAcc = record._normalized?.services_no_accent ?? removeVietnameseAccents(servNorm);

    const persNorm = record._normalized?.persons ?? normalizeSearchText(record.persons_info_str || '');
    const persNoAcc = record._normalized?.persons_no_accent ?? removeVietnameseAccents(persNorm);

    if (isQueryEmpty) {
      // If no query, check if scope filter requires field presence
      let valid = true;
      if (filters.scope === 'goods' && !record.goods_info_str?.trim()) valid = false;
      if (filters.scope === 'services' && !record.services_info_str?.trim()) valid = false;
      if (filters.scope === 'persons' && !record.persons_info_str?.trim()) valid = false;

      if (valid) {
        results.push({
          record,
          score: 1,
          matches: {
            goods: Boolean(record.goods_info_str?.trim()),
            services: Boolean(record.services_info_str?.trim()),
            persons: Boolean(record.persons_info_str?.trim()),
            metadata: false,
          },
          snippets: [],
          matchedSummary: [],
        });
      }
      continue;
    }

    // 2. Evaluate matches based on scope
    const matchGoods =
      filters.scope === 'all' || filters.scope === 'goods'
        ? testFieldMatches(record.goods_info_str, goodsNorm, goodsNoAcc, parsedQuery)
        : { matched: false, score: 0, matchedTerms: [] };

    const matchServ =
      filters.scope === 'all' || filters.scope === 'services'
        ? testFieldMatches(record.services_info_str, servNorm, servNoAcc, parsedQuery)
        : { matched: false, score: 0, matchedTerms: [] };

    const matchPers =
      filters.scope === 'all' || filters.scope === 'persons'
        ? testFieldMatches(record.persons_info_str, persNorm, persNoAcc, parsedQuery)
        : { matched: false, score: 0, matchedTerms: [] };

    // Also check metadata (bid_name, project_name) for minor relevance boost
    const metaText = `${record.bid_name || ''} ${record.project_name || ''} ${record.plan_no || ''}`;
    const metaNorm = normalizeSearchText(metaText);
    const metaNoAcc = removeVietnameseAccents(metaNorm);
    const matchMeta = testFieldMatches(metaText, metaNorm, metaNoAcc, parsedQuery);

    const hasCoreMatch = matchGoods.matched || matchServ.matched || matchPers.matched;

    if (hasCoreMatch || (filters.scope === 'all' && matchMeta.matched)) {
      let totalScore =
        (matchGoods.matched ? matchGoods.score : 0) +
        (matchServ.matched ? matchServ.score : 0) +
        (matchPers.matched ? matchPers.score : 0) +
        (matchMeta.matched ? matchMeta.score * 0.3 : 0);

      // Multi-field match bonus
      let fieldCount = 0;
      if (matchGoods.matched) fieldCount++;
      if (matchServ.matched) fieldCount++;
      if (matchPers.matched) fieldCount++;
      if (fieldCount > 1) totalScore += fieldCount * 40;

      const snippets: FieldSnippet[] = [];
      const summaries: string[] = [];

      if (matchGoods.matched && matchGoods.snippetText) {
        snippets.push({
          field: 'goods',
          label: 'Hàng hóa',
          count: matchGoods.matchedTerms.length,
          snippet: matchGoods.snippetText,
          matchedTerms: matchGoods.matchedTerms,
        });
        summaries.push(`Khớp Hàng hóa (${matchGoods.matchedTerms.join(', ')})`);
        goodsMatchCount++;
      }

      if (matchServ.matched && matchServ.snippetText) {
        snippets.push({
          field: 'services',
          label: 'Dịch vụ',
          count: matchServ.matchedTerms.length,
          snippet: matchServ.snippetText,
          matchedTerms: matchServ.matchedTerms,
        });
        summaries.push(`Khớp Dịch vụ (${matchServ.matchedTerms.join(', ')})`);
        servicesMatchCount++;
      }

      if (matchPers.matched && matchPers.snippetText) {
        snippets.push({
          field: 'persons',
          label: 'Nhân sự',
          count: matchPers.matchedTerms.length,
          snippet: matchPers.snippetText,
          matchedTerms: matchPers.matchedTerms,
        });
        summaries.push(`Khớp Nhân sự (${matchPers.matchedTerms.join(', ')})`);
        personsMatchCount++;
      }

      results.push({
        record,
        score: totalScore,
        matches: {
          goods: matchGoods.matched,
          services: matchServ.matched,
          persons: matchPers.matched,
          metadata: matchMeta.matched,
        },
        snippets,
        matchedSummary: summaries,
      });
    }
  }

  // 3. Sorting
  const parseBidPrice = (val?: number | string): number => {
    if (val === undefined || val === null || val === '') return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : Math.trunc(val);
    let str = String(val).trim();
    str = str.replace(/\s+[A-Za-zÀ-ỹ]+$/, '');
    str = str.replace(/[.,]\d{1,2}$/, '');
    const cleaned = str.replace(/[,.\s]/g, '');
    const num = parseInt(cleaned, 10);
    return isNaN(num) ? 0 : num;
  };

  if (sortBy === 'relevance') {
    results.sort((a, b) => b.score - a.score);
  } else if (sortBy === 'price_desc') {
    results.sort((a, b) => {
      const pa = parseBidPrice(a.record.bid_price);
      const pb = parseBidPrice(b.record.bid_price);
      return pb - pa;
    });
  } else if (sortBy === 'price_asc') {
    results.sort((a, b) => {
      const pa = parseBidPrice(a.record.bid_price);
      const pb = parseBidPrice(b.record.bid_price);
      return pa - pb;
    });
  } else if (sortBy === 'date_desc') {
    results.sort((a, b) => {
      const da = a.record.original_public_date ? new Date(a.record.original_public_date).getTime() : 0;
      const db = b.record.original_public_date ? new Date(b.record.original_public_date).getTime() : 0;
      return db - da;
    });
  } else if (sortBy === 'date_asc') {
    results.sort((a, b) => {
      const da = a.record.original_public_date ? new Date(a.record.original_public_date).getTime() : 0;
      const db = b.record.original_public_date ? new Date(b.record.original_public_date).getTime() : 0;
      return da - db;
    });
  } else if (sortBy === 'bid_name_asc') {
    results.sort((a, b) => (a.record.bid_name || '').localeCompare(b.record.bid_name || '', 'vi'));
  }

  return {
    results,
    matchCounts: {
      goods: goodsMatchCount,
      services: servicesMatchCount,
      persons: personsMatchCount,
      total: results.length,
    },
  };
}
