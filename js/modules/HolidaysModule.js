import { getTodayDateString } from '../utils/timeUtils.js';

const DAY_HEADERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export class HolidaysModule {
  constructor() {
    this.containerId = 'holidayList';
    this.viewYear = null;
    this.viewMonth = null; // 0-11

    window.holidaysModule = this;
    window.holCalPrevMonth = () => this.changeMonth(-1);
    window.holCalNextMonth = () => this.changeMonth(1);
    window.holCalDayTap = (dateStr) => this.showDayPopup(dateStr);
    window.holCalClosePopup = () => this.closePopup();
  }

  async onShow() {
    if (this.viewYear === null) {
      const today = new Date();
      this.viewYear = today.getFullYear();
      this.viewMonth = today.getMonth();
    }
    const attMod = window.attendanceModule;
    if (attMod && !attMod.attData) {
      await attMod.fetchData();
    }
    this.render();
  }

  changeMonth(delta) {
    this.viewMonth += delta;
    if (this.viewMonth < 0) { this.viewMonth = 11; this.viewYear--; }
    if (this.viewMonth > 11) { this.viewMonth = 0; this.viewYear++; }
    this.render();
  }

  dateStr(y, m, d) {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  // Returns { type: 'holiday'|'green'|'red', holiday? } for a given date.
  getDayStatus(dateStr, todayStr) {
    const { holidays: HOLIDAYS } = window.globalConfig || {};
    const holiday = HOLIDAYS && HOLIDAYS.find(h => h.date === dateStr);
    if (holiday) return { type: 'holiday', holiday };

    const attMod = window.attendanceModule;
    const dayData = attMod && attMod.attData ? attMod.attData[dateStr] : null;

    if (dayData) {
      const hasAbsent = Object.values(dayData).includes('A');
      if (dateStr < todayStr && hasAbsent) return { type: 'red' };
    }
    return { type: 'green' };
  }

  render() {
    const list = document.getElementById(this.containerId);
    if (!list) return;

    const todayStr = getTodayDateString();
    const y = this.viewYear, m = this.viewMonth;
    const firstDay = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();

    let cellsHtml = '';
    for (let i = 0; i < firstDay; i++) {
      cellsHtml += `<div class="holcal-cell holcal-empty"></div>`;
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = this.dateStr(y, m, d);
      const status = this.getDayStatus(ds, todayStr);
      const isToday = ds === todayStr;
      let cls = 'holcal-cell';
      if (status.type === 'holiday') cls += ' holcal-holiday';
      else if (status.type === 'red') cls += ' holcal-red';
      else cls += ' holcal-green';
      if (isToday) cls += ' holcal-today';

      cellsHtml += `<div class="${cls}" onclick="window.holCalDayTap('${ds}')">${d}</div>`;
    }

    list.innerHTML = `
      <div class="holcal-header">
        <span class="holcal-nav" onclick="window.holCalPrevMonth()">&lsaquo;</span>
        <span class="holcal-title">${MONTH_NAMES[m]} ${y}</span>
        <span class="holcal-nav" onclick="window.holCalNextMonth()">&rsaquo;</span>
      </div>
      <div class="holcal-grid holcal-weekdays">
        ${DAY_HEADERS.map(h => `<div class="holcal-weekday">${h}</div>`).join('')}
      </div>
      <div class="holcal-grid">${cellsHtml}</div>
      <div class="holcal-legend">
        <span><i class="holcal-dot holcal-dot-holiday"></i>holiday</span>
        <span><i class="holcal-dot holcal-dot-green"></i>present</span>
        <span><i class="holcal-dot holcal-dot-red"></i>missed</span>
      </div>
      <div id="holcalPopupWrap"></div>
    `;
  }

  showDayPopup(dateStr) {
    const wrap = document.getElementById('holcalPopupWrap');
    if (!wrap) return;

    const todayStr = getTodayDateString();
    const status = this.getDayStatus(dateStr, todayStr);
    const d = new Date(dateStr);
    const displayDate = d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });

    let title, body;
    if (status.type === 'holiday') {
      const daysUntil = Math.ceil((new Date(dateStr) - new Date(todayStr)) / 86400000);
      title = status.holiday.name;
      let remaining;
      if (daysUntil > 0) remaining = `${daysUntil} day${daysUntil === 1 ? '' : 's'} remaining`;
      else if (daysUntil === 0) remaining = 'Today';
      else remaining = `${Math.abs(daysUntil)} day${Math.abs(daysUntil) === 1 ? '' : 's'} ago`;
      body = `
        <div class="holcal-popup-badge holcal-popup-badge-holiday">${remaining}</div>
        <div class="holcal-popup-note">No attendance on this day. Excluded from your percentage.</div>
      `;
    } else if (status.type === 'red') {
      title = 'Attendance';
      body = `
        <div class="holcal-popup-badge holcal-popup-badge-red">Missed</div>
        <div class="holcal-popup-note">At least one subject was marked absent this day.</div>
      `;
    } else {
      title = 'Attendance';
      const isFuture = dateStr > todayStr;
      body = `
        <div class="holcal-popup-badge holcal-popup-badge-green">${isFuture ? 'Upcoming' : 'Present'}</div>
        <div class="holcal-popup-note">${isFuture ? "This day hasn't arrived yet." : 'No missed subjects recorded this day.'}</div>
      `;
    }

    wrap.innerHTML = `
      <div class="holcal-overlay" onclick="window.holCalClosePopup()">
        <div class="holcal-modal" onclick="event.stopPropagation()">
          <div class="holcal-modal-title">${title}</div>
          <div class="holcal-modal-date">${displayDate}</div>
          ${body}
        </div>
      </div>
    `;
  }

  closePopup() {
    const wrap = document.getElementById('holcalPopupWrap');
    if (wrap) wrap.innerHTML = '';
  }
}
