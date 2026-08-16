export function timeToMins(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function formatTime12(t) {
  const [h, m] = t.split(':').map(Number);
  const hh = h % 12 || 12;
  return `${hh}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

export function getTodayDateString() {
  const now = new Date();
  // Using local timezone calculation to avoid UTC offset bugs
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
