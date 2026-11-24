// ==========================================================================
// ReportLoop - Data awal laporan (mengikuti skema PostGIS)
// Dipakai sebagai data Mode Demo Interaktif.
// ==========================================================================

export const SEED_REPORTS = [
  {
    id: 'rep-001',
    title: 'Lampu lorong lantai 2 padam',
    description: 'Lampu penerangan koridor lantai 2 mati sejak kemarin malam, gelap saat mahasiswa pulang praktikum.',
    photo_url: null,
    photo_verification: 'Verified (Fresh camera photo)',
    latitude: -6.4085,
    longitude: 108.2815,
    category: 'Infrastructure',
    nlp_confidence: 0.91,
    status: 'In Progress',
    upvotes: 14,
    created_at: '2026-11-22T08:15:00+07:00',
  },
  {
    id: 'rep-002',
    title: 'Bak sampah depan gerbang penuh',
    description: 'Sampah menumpuk meluap ke jalan masuk parkiran dan menimbulkan bau tidak sedap.',
    photo_url: null,
    photo_verification: 'Verified (Fresh camera photo)',
    latitude: -6.4091,
    longitude: 108.2822,
    category: 'Cleanliness',
    nlp_confidence: 0.94,
    status: 'Received',
    upvotes: 9,
    created_at: '2026-11-22T09:40:00+07:00',
  },
  {
    id: 'rep-003',
    title: 'Gembok pagar utama rusak',
    description: 'Gembok gerbang depan macet dan tidak bisa dikunci saat tengah malam, rawan orang luar masuk.',
    photo_url: null,
    photo_verification: 'Verified (Fresh camera photo)',
    latitude: -6.4079,
    longitude: 108.2809,
    category: 'Security',
    nlp_confidence: 0.89,
    status: 'Received',
    upvotes: 17,
    created_at: '2026-11-22T10:05:00+07:00',
  },
  {
    id: '28a63b7a',
    title: 'Kamar mandi bocor & keran patah',
    description: 'Keran air di kamar mandi gedung kuliah patah dan air menggenang di lantai.',
    photo_url: null,
    photo_verification: 'Verified (Fresh camera photo)',
    latitude: -6.4095,
    longitude: 108.2830,
    category: 'Infrastructure',
    nlp_confidence: 0.86,
    status: 'Received',
    upvotes: 4,
    created_at: '2026-11-22T02:12:24+07:00',
  },
];

// Salinan dalam supaya data seed asli tidak ikut berubah
export function cloneSeedReports() {
  return JSON.parse(JSON.stringify(SEED_REPORTS));
}
