const ATTENDANCE_KEY = 'sms_att_c';

export function getAttData() {
  try {
    return JSON.parse(localStorage.getItem(ATTENDANCE_KEY) || '{}');
  } catch {
    return {};
  }
}

export function saveAttData(data) {
  localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(data));
}
