// ==========================================================================
// ReportLoop - Util escapeHtml
// Mengamankan teks dari pengguna sebelum disisipkan ke innerHTML.
// Di React fungsi ini tidak diperlukan karena JSX sudah meng-escape otomatis.
// ==========================================================================

export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
