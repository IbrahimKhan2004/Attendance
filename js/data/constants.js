export const PERIODS = [
  { slot: 'VI',   start: '11:45', end: '12:30', label: 'VI' },
  { slot: 'VII',  start: '12:30', end: '13:15', label: 'VII' },
  { slot: 'VIII', start: '13:15', end: '14:00', label: 'VIII' },
  { slot: 'IX',   start: '14:00', end: '14:45', label: 'IX (Lunch)' },
  { slot: 'X',    start: '14:45', end: '15:30', label: 'X' },
  { slot: 'XI',   start: '15:30', end: '16:15', label: 'XI' },
  { slot: 'XII',  start: '16:15', end: '17:00', label: 'XII' },
];

export const TIMETABLE = {
  1: null, // Monday OFF
  2: [ // Tuesday
    { sub: 'LAB', teacher: '' },
    { sub: 'OS', teacher: 'SSS' },
    { sub: 'PCS', teacher: 'CPA' },
    { sub: 'LUNCH', teacher: '' },
    { sub: 'LAB', teacher: '' },
    { sub: 'DECO', teacher: 'ADG' },
    { sub: 'MM', teacher: 'MST' },
  ],
  3: [ // Wednesday
    { sub: 'LAB', teacher: '' },
    { sub: 'PP', teacher: 'Su.S' },
    { sub: 'PCS', teacher: 'CPA' },
    { sub: 'LUNCH', teacher: '' },
    { sub: 'LAB', teacher: '' },
    { sub: 'DECO', teacher: 'ADG' },
    { sub: 'LIBRARY', teacher: '' },
  ],
  4: [ // Thursday
    { sub: 'OS', teacher: 'SSS' },
    { sub: 'PP', teacher: 'Su.S' },
    { sub: 'DECO', teacher: 'ADG' },
    { sub: 'LUNCH', teacher: '' },
    { sub: 'LAB', teacher: '' },
    { sub: 'MM', teacher: 'MST' },
    { sub: 'LIBRARY', teacher: '' },
  ],
  5: [ // Friday
    { sub: 'OS', teacher: 'SSS' },
    { sub: 'PP', teacher: 'Su.S' },
    { sub: 'PCS', teacher: 'CPA' },
    { sub: 'LUNCH', teacher: '' },
    { sub: 'DECO', teacher: 'ADG' },
    { sub: 'MM', teacher: 'MST' },
    { sub: 'LIBRARY', teacher: '' },
  ],
  6: [ // Saturday
    { sub: 'OS', teacher: 'SSS' },
    { sub: 'LIBRARY', teacher: '' },
    { sub: 'PCS', teacher: 'CPA' },
    { sub: 'LUNCH', teacher: '' },
    { sub: 'MM', teacher: 'MST' },
    { sub: 'LAB', teacher: '' },
    { sub: 'PP', teacher: 'Su.S' },
  ],
};

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const SUBJECTS = ['OS', 'PCS', 'PP', 'DECO', 'MM', 'LAB'];

export const HOLIDAYS = [
  { name: 'Makar Sankranti', date: '2026-01-15', day: 'Thursday' },
  { name: 'Basant Panchami', date: '2026-01-23', day: 'Friday' },
  { name: 'Republic Day 🇮🇳', date: '2026-01-26', day: 'Monday' },
  { name: 'Mahashivratri', date: '2026-02-15', day: 'Sunday' },
  { name: 'Holi 🎨', date: '2026-03-02', day: 'Monday' },
  { name: 'Holi 🎨', date: '2026-03-03', day: 'Tuesday' },
  { name: 'Holi 🎨', date: '2026-03-04', day: 'Wednesday' },
  { name: 'Id-Ul-Fitar ✨', date: '2026-03-21', day: 'Saturday' },
  { name: 'Ram Navami 🪔', date: '2026-03-27', day: 'Friday' },
  { name: 'Mahavir Jayanti', date: '2026-03-31', day: 'Tuesday' },
  { name: 'Good Friday ✝️', date: '2026-04-03', day: 'Friday' },
  { name: 'Dr. Ambedkar Jayanti', date: '2026-04-14', day: 'Tuesday' },
  { name: 'Budh Poornima 🌕', date: '2026-05-01', day: 'Friday' },
  { name: 'Bakrid (Idulzuha) ✨', date: '2026-05-27', day: 'Wednesday' },
  { name: 'Moharram ✨', date: '2026-06-26', day: 'Thursday' },
  { name: 'Independence Day 🇮🇳', date: '2026-08-15', day: 'Saturday' },
  { name: 'Id-E-Milad ✨', date: '2026-08-26', day: 'Wednesday' },
  { name: 'Raksha Bandhan 🪢', date: '2026-08-28', day: 'Friday' },
  { name: 'Janmashtami 🙏', date: '2026-09-04', day: 'Friday' },
  { name: 'Mahatma Gandhi Jayanti', date: '2026-10-02', day: 'Friday' },
  { name: 'Durga Pooja / Dussehra', date: '2026-10-19', day: 'Monday' },
  { name: 'Durga Pooja / Dussehra', date: '2026-10-20', day: 'Tuesday' },
  { name: 'Durga Pooja / Dussehra', date: '2026-10-21', day: 'Wednesday' },
  { name: 'Deepawali 🪔', date: '2026-11-07', day: 'Saturday' },
  { name: 'Deepawali 🪔', date: '2026-11-08', day: 'Sunday' },
  { name: 'Deepawali 🪔', date: '2026-11-09', day: 'Monday' },
  { name: 'Bhaidooj / Chitragupt Jayanti', date: '2026-11-11', day: 'Wednesday' },
  { name: 'Guru Nanak Jayanti 🙏', date: '2026-11-24', day: 'Tuesday' },
  { name: 'X-mas 🎄', date: '2026-12-25', day: 'Friday' },
];
