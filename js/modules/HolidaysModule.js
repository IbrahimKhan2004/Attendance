import { getTodayDateString } from '../utils/timeUtils.js';

export class HolidaysModule {
  constructor() {
    this.containerId = 'holidayList';
  }

  onShow() {
    this.render();
  }

  render() {
    const list = document.getElementById(this.containerId);
    if (!list) return;

    const todayStr = getTodayDateString();
    const { holidays: HOLIDAYS } = window.globalConfig;

    if (!HOLIDAYS) return;

    const html = HOLIDAYS.map(h => {
      const isPast = h.date < todayStr;
      const isToday = h.date === todayStr;
      const daysUntil = Math.ceil((new Date(h.date) - new Date(todayStr)) / 86400000);
      const isUpcoming = daysUntil > 0;

      let tag = '';
      if (isToday) tag = '<span style="font-size:0.7rem; background:var(--yellow); color:#000; padding:2px 8px; border-radius:10px; font-weight:700;">TODAY</span>';
      else if (isUpcoming) tag = `<span style="font-size:0.7rem; background:var(--accent2); padding:2px 8px; border-radius:10px; font-weight:600;">In ${daysUntil}d</span>`;
      else if (isPast) tag = '<span style="font-size:0.7rem; background:var(--card); color:var(--muted); padding:2px 8px; border-radius:10px;">Past</span>';

      const dateParts = h.date.split('-');
      const displayDate = `${dateParts[2]}/${dateParts[1]}`;

      return `<div class="ios-list-item" style="display:flex; align-items:center; gap:1rem; opacity: ${isPast ? '0.5' : '1'};">
        <div style="font-family:var(--font-mono); font-size:0.85rem; color:var(--accent); min-width:50px; text-align:center;">${displayDate}</div>
        <div style="flex:1;">
          <div style="font-weight:600;">${h.name}</div>
          <div style="font-size:0.75rem; color:var(--muted);">${h.day}</div>
        </div>
        <div>${tag}</div>
      </div>`;
    }).join('');

    list.innerHTML = `<div class="ios-list">${html}</div>`;
  }
}
