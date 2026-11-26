import React from 'react';
import { removeVietnameseAccents } from '../utils/textNormalizer';

interface HighlightTextProps {
  text: string;
  matchedTerms?: string[];
  className?: string;
}

export const HighlightText: React.FC<HighlightTextProps> = ({
  text,
  matchedTerms = [],
  className = '',
}) => {
  if (!text) return null;
  if (!matchedTerms || matchedTerms.length === 0) {
    return <span className={className}>{text}</span>;
  }

  // Filter valid terms
  const terms = matchedTerms
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
    .sort((a, b) => b.length - a.length);

  if (terms.length === 0) {
    return <span className={className}>{text}</span>;
  }

  // Find all match occurrences (both accented and unaccented)
  const lowerText = text.toLowerCase();
  const lowerNoAccText = removeVietnameseAccents(lowerText);

  interface Interval {
    start: number;
    end: number;
  }
  const intervals: Interval[] = [];

  for (const term of terms) {
    const termLower = term.toLowerCase();
    const termNoAcc = removeVietnameseAccents(termLower);

    // Scan in text
    let pos = 0;
    while (pos < text.length) {
      let idx = lowerText.indexOf(termLower, pos);
      let termLen = term.length;

      if (idx === -1) {
        idx = lowerNoAccText.indexOf(termNoAcc, pos);
        termLen = termNoAcc.length;
      }

      if (idx === -1) break;

      intervals.push({ start: idx, end: idx + termLen });
      pos = idx + 1;
    }
  }

  if (intervals.length === 0) {
    return <span className={className}>{text}</span>;
  }

  // Merge overlapping intervals
  intervals.sort((a, b) => a.start - b.start);
  const merged: Interval[] = [];
  let cur = intervals[0];

  for (let i = 1; i < intervals.length; i++) {
    const next = intervals[i];
    if (next.start <= cur.end) {
      cur.end = Math.max(cur.end, next.end);
    } else {
      merged.push(cur);
      cur = next;
    }
  }
  merged.push(cur);

  // Render sliced text
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  merged.forEach((intv, idx) => {
    if (intv.start > lastIndex) {
      parts.push(text.slice(lastIndex, intv.start));
    }
    parts.push(
      <mark
        key={idx}
        className="bg-amber-200 text-amber-950 font-semibold px-0.5 rounded shadow-xs"
      >
        {text.slice(intv.start, intv.end)}
      </mark>
    );
    lastIndex = intv.end;
  });

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <span className={className}>{parts}</span>;
};
