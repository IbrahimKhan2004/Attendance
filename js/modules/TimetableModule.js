import { TIMETABLE, PERIODS, DAY_NAMES } from '../data/constants.js';
import { timeToMins, formatTime12 } from '../utils/timeUtils.js';

export class TimetableModule {
  constructor() {
    this.containerId = 'ttContainer';
  }

  onShow() {
    this.render();
  }

  render() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    const today = new Date().getDay();
    const html = [];
    const order = [1, 2, 3, 4, 5, 6, 0];

    for (const dayIdx of order) {
      const isToday = dayIdx === today;
      const dayOff = (dayIdx === 0 || dayIdx === 1);

      html.push(`<div class="ios-list" ${isToday ? 'style="border: 2px solid var(--accent);"' : ''}>`);
      html.push(`<div class="ios-list-item" style="display:flex; justify-content:space-between; align-items:center; background: rgba(255,255,255,0.05);">
        <span style="font-weight:700;">${DAY_NAMES[dayIdx]}</span>
        ${isToday ? '<span style="font-size:0.7rem; background:var(--accent); padding:2px 8px; border-radius:10px; font-weight:600;">TODAY</span>' : ''}
      </div>`);

      if (dayOff) {
        const msg = dayIdx === 0 ? 'Sunday — Stay home!' : 'Monday — Official OFF!';
        html.push(`<div class="ios-list-item" style="text-align:center; padding: 2rem 1rem; color: var(--muted);">${msg}</div>`);
      } else {
        const periods = TIMETABLE[dayIdx];
        const mins = new Date().getHours() * 60 + new Date().getMinutes();

        html.push(`<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));">`);

        for (let i = 0; i < PERIODS.length; i++) {
          const pd = periods[i];
          const isCurrent = isToday && mins >= timeToMins(PERIODS[i].start) && mins < timeToMins(PERIODS[i].end);
          const isLunch = pd.sub === 'LUNCH';

          let bg = 'transparent';
          if (isCurrent) bg = 'rgba(10, 132, 255, 0.15)'; // Apple Blue light
          if (isLunch) bg = 'rgba(255, 214, 10, 0.1)'; // Apple Yellow light

          html.push(`<div style="padding: 1rem; border-right: 1px solid var(--border); border-bottom: 1px solid var(--border); background: ${bg};">
            <div style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--muted);">${formatTime12(PERIODS[i].start)}</div>
            <div style="font-weight: 600; margin-top: 4px;">${pd.sub}</div>
            ${pd.teacher ? `<div style="font-size: 0.7rem; color: var(--accent3); margin-top: 2px;">${pd.teacher}</div>` : ''}
          </div>`);
        }
        html.push(`</div>`);
      }
      html.push(`</div>`);
    }
    container.innerHTML = html.join('');
  }
}
