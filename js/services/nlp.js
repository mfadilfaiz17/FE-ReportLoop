// ==========================================================================
// ReportLoop - Layanan NLP (simulasi TF-IDF + Naive Bayes)
// Klasifikasi kategori laporan berbasis kata kunci.
// Fungsi murni tanpa akses DOM, jadi gampang dipindah ke React sebagai util.
// ==========================================================================

import { NLP_RULES } from '../config/constants.js';

function matchesKeyword(text, keyword) {
  if (keyword.length <= 3) {
    return new RegExp(`\\b${keyword}\\b`).test(text);
  }
  return text.includes(keyword);
}

export function predictNlpCategory(title, description) {
  const text = `${title} ${description}`.toLowerCase();

  const scores = { Infrastructure: 0, Cleanliness: 0, Security: 0 };

  for (const [cat, keywords] of Object.entries(NLP_RULES)) {
    keywords.forEach((kw) => {
      if (matchesKeyword(text, kw)) {
        scores[cat] += 1;
      }
    });
  }

  let bestCat = 'Infrastructure';
  let maxScore = scores.Infrastructure;

  if (scores.Cleanliness > maxScore) {
    bestCat = 'Cleanliness';
    maxScore = scores.Cleanliness;
  }
  if (scores.Security > maxScore) {
    bestCat = 'Security';
    maxScore = scores.Security;
  }

  const tied = Object.values(scores).filter((s) => s === maxScore).length > 1;
  const confidence = maxScore === 0
    ? 1 / 3
    : tied
      ? 0.5
      : Math.min(0.974, 0.78 + maxScore * 0.062);

  return {
    category: bestCat,
    confidence: Number(confidence.toFixed(4)),
  };
}
