import { timeToMins, formatTime12, getTodayDateString } from '../utils/timeUtils.js';

export class ClockModule {
  constructor() {
    this.timerId = null;
  }

  init() {
    this.updateClock();
    this.timerId = setInterval(() => this.updateClock(), 1000);
  }

  onShow() {
    // Optional logic when clock view becomes active, though clock is always visible in header
  }

  onHide() {
    // Clock shouldn't hide, but we keep the method for interface consistency
  }

  updateClock() {
    const now = new Date();
    const hour = now.getHours();
    const h = String(hour % 12 || 12).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    const ampm = hour >= 12 ? 'PM' : 'AM';

    document.getElementById('clockTime').textContent = `${h}:${m}:${s} ${ampm}`;

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    document.getElementById('clockDate').textContent =
      `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;

    const dayIdx = now.getDay();
    const mins = now.getHours() * 60 + now.getMinutes();

    const currElem = document.getElementById('currentPeriod');
    const nextElem = document.getElementById('nextPeriod');
    const barElem = document.getElementById('periodBar');

    const { offDays, timetable: TIMETABLE, holidays: HOLIDAYS, periods: PERIODS } = window.globalConfig;

    if (!PERIODS || PERIODS.length === 0 || !TIMETABLE) {
        currElem.textContent = 'Configuration loading...';
        return;
    }

    if (offDays && offDays.includes(dayIdx)) {
      currElem.textContent = `🎉 Day OFF!`;
      nextElem.textContent = '';
      barElem.style.width = '0%';
      return;
    }

    if (!TIMETABLE[dayIdx]) {
      currElem.textContent = '🎉 Today is OFF!';
      nextElem.textContent = '';
      return;
    }

    const todayStr = getTodayDateString();
    const isHoliday = HOLIDAYS && HOLIDAYS.find(h => h.date === todayStr);
    if (isHoliday) {
      currElem.textContent = `🎊 ${isHoliday.name} — Holiday!`;
      nextElem.textContent = '';
      return;
    }

    let currentIdx = -1;
    for (let i = 0; i < PERIODS.length; i++) {
      const s = timeToMins(PERIODS[i].start);
      const e = timeToMins(PERIODS[i].end);
      if (mins >= s && mins < e) { currentIdx = i; break; }
    }

    if (mins < timeToMins(PERIODS[0].start)) {
      const targetMins = timeToMins(PERIODS[0].start);
      const diffSecs = (targetMins * 60) - (now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds());
      const hh = Math.floor(diffSecs / 3600);
      const mm = Math.floor((diffSecs % 3600) / 60);
      const ss = diffSecs % 60;
      const timeStr = hh > 0 ? `${hh}h ${mm}m ${ss}s` : `${mm}m ${ss}s`;
      currElem.textContent = `⏰ College starts in ${timeStr}`;
      nextElem.textContent = `First: ${TIMETABLE[dayIdx][0].sub} at ${formatTime12(PERIODS[0].start)}`;
      barElem.style.width = '0%';
      return;
    }

    if (currentIdx === -1 && mins >= timeToMins(PERIODS[PERIODS.length-1].end)) {
      currElem.textContent = '🏠 College over — Go home!';
      nextElem.textContent = 'See you tomorrow 👋';
      barElem.style.width = '100%';
      return;
    }

    if (currentIdx !== -1) {
      const pd = TIMETABLE[dayIdx][currentIdx];
      if (!pd) return; // In case of missing period in timetable
      const s = timeToMins(PERIODS[currentIdx].start);
      const e = timeToMins(PERIODS[currentIdx].end);
      const elapsed = mins - s;
      const total = e - s;
      const pct = Math.min(100, Math.round((elapsed / total) * 100));
      const remaining = e - mins;

      currElem.textContent = `Period ${PERIODS[currentIdx].label}: ${pd.sub}${pd.teacher ? ' ('+pd.teacher+')' : ''}`;
      barElem.style.width = pct + '%';

      if (currentIdx + 1 < PERIODS.length && TIMETABLE[dayIdx][currentIdx + 1]) {
        const next = TIMETABLE[dayIdx][currentIdx + 1];
        nextElem.textContent = `⏳ ${remaining} min left | Next: ${next.sub} at ${formatTime12(PERIODS[currentIdx + 1].start)}`;
      } else {
        nextElem.textContent = `⏳ ${remaining} min left | Last period!`;
      }
    }
  }
}
