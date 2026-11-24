// ==========================================================================
// ReportLoop - Konstanta aplikasi
// Semua nilai tetap dikumpulkan di sini supaya mudah dipindah ke
// src/config/constants.js saat migrasi ke React.
// ==========================================================================

export const CAMPUS_CENTER = [-6.4085, 108.2815];
// Alamat backend bisa diganti tanpa ubah kode: localStorage.setItem('reportloop.apiBase', 'https://api.contoh.id')
function resolveApiBase() {
  try {
    const custom = localStorage.getItem('reportloop.apiBase');
    if (custom && /^https?:\/\//.test(custom)) return custom.replace(/\/+$/, '');
  } catch (_) {
    /* penyimpanan tidak tersedia */
  }
  return 'http://127.0.0.1:8000';
}
export const FASTAPI_BASE_URL = resolveApiBase();
export const IS_LOCAL_HOST = ['localhost', '127.0.0.1', ''].includes(window.location.hostname);

// Batas area geofencing kampus Politeknik Negeri Indramayu
export const CAMPUS_BOUNDARY = [
  [-6.4071, 108.2801],
  [-6.4071, 108.2842],
  [-6.4106, 108.2842],
  [-6.4106, 108.2801],
];

// Radius deteksi laporan duplikat (meter)
export const DUPLICATE_RADIUS_METERS = 15.0;

// Aturan kata kunci untuk simulasi klasifikasi NLP
export const NLP_RULES = {
  Infrastructure: ['keran', 'lampu', 'bocor', 'ac', 'proyektor', 'pintu', 'kursi', 'listrik', 'pipa', 'banjir', 'patah', 'mati', 'padam', 'stopkontak', 'atap', 'kamar mandi'],
  Cleanliness: ['sampah', 'kotor', 'bau', 'toilet', 'genangan', 'saluran', 'limbah', 'meluap', 'jorok', 'bersih', 'tumpuk'],
  Security: ['gembok', 'pagar', 'gelap', 'gerbang', 'kunci', 'rawan', 'cctv', 'satpam', 'hilang', 'maling', 'terbuka'],
};

// Penanda mode data di header. Titik menandai status nyata (demo atau terhubung),
// tanpa kedip. Label teks selalu menyertai warna.
export const API_MODE_STYLES = {
  live: {
    dot: 'w-2.5 h-2.5 rounded-full bg-green-300',
    label: 'Terhubung ke FastAPI',
  },
  demo: {
    dot: 'w-2.5 h-2.5 rounded-full bg-amber-300',
    label: 'Mode demo',
  },
};
