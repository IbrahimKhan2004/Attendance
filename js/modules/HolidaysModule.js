import { getTodayDateString } from '../utils/timeUtils.js';
import { fetchWithAuth } from '../core/api.js';

const DAY_HEADERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export class HolidaysModule {
  constructor() {
    this.containerId = 'holidayList';
    this.viewYear = null;
    this.viewMonth = null; // 0-11
    this.semesterRanges = null; // [{start, end}] end is null for the active semester (open-ended)

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
    if (this.semesterRanges === null) {
      await this.fetchSemesterRanges();
    }
    this.render();
  }

  async fetchSemesterRanges() {
    const ranges = [];
    try {
      const activeRes = await fetchWithAuth('/semester/active');
      const active = activeRes.ok ? await activeRes.json() : null;
      if (active && active.status === 'active') {
        ranges.push({ start: active.startDate, end: null });
      }

      const historyRes = await fetchWithAuth('/semester/history');
      const history = historyRes.ok ? await historyRes.json() : [];
      history.forEach(sem => {
        const end = sem.endedAt ? new Date(sem.endedAt) : null;
        const endStr = end ? `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}` : null;
        ranges.push({ start: sem.startDate, end: endStr });
      });
    } catch (e) {
      console.error('Failed to load semester ranges', e);
    }
    this.semesterRanges = ranges;
  }

  // Whether a date falls inside any known semester's active window
  isWithinSemester(dateStr) {
    return this.semesterRanges.some(r => {
      if (dateStr < r.start) return false;
      if (r.end !== null && dateStr > r.end) return false;
      return true;
    });
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

  // Returns { type: 'holiday'|'officialoff'|'green'|'red'|'none', holiday? } for a given date.
  getDayStatus(dateStr, todayStr) {
    const { holidays: HOLIDAYS, offDays, timetable: TIMETABLE } = window.globalConfig || {};
    const holiday = HOLIDAYS && HOLIDAYS.find(h => h.date === dateStr);
    if (holiday) return { type: 'holiday', holiday };

    const dayIdx = new Date(dateStr + 'T00:00:00').getDay();
    const isOfficialOff = (offDays && offDays.includes(dayIdx)) || (TIMETABLE && !TIMETABLE[dayIdx]);
    if (isOfficialOff) return { type: 'officialoff' };

    if (!this.isWithinSemester(dateStr)) return { type: 'none' };

    const attMod = window.attendanceModule;
    const dayData = attMod && attMod.attData ? attMod.attData[dateStr] : null;

    if (dayData) {
      const statuses = Object.values(dayData);
      const allAbsent = statuses.length > 0 && statuses.every(s => s === 'A');
      if (dateStr < todayStr && allAbsent) return { type: 'red' };
      return { type: 'green' };
    }

    // No attendance recorded — whether it's a future date or a past gap, there's no data to show.
    return { type: 'none' };
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
      else if (status.type === 'officialoff') cls += ' holcal-officialoff';
      else if (status.type === 'red') cls += ' holcal-red';
      else if (status.type === 'green') cls += ' holcal-green';
      else cls += ' holcal-none';
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
        <span><i class="holcal-dot holcal-dot-officialoff"></i>official off</span>
        <span><i class="holcal-dot holcal-dot-green"></i>present</span>
        <span><i class="holcal-dot holcal-dot-red"></i>missed</span>
        <span><i class="holcal-dot holcal-dot-none"></i>no data</span>
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
    } else if (status.type === 'officialoff') {
      const dayName = d.toLocaleDateString(undefined, { weekday: 'long' });
      title = dayName;
      body = `
        <div class="holcal-popup-badge holcal-popup-badge-officialoff">Official OFF!</div>
        <div class="holcal-popup-note">This day is a weekly off. No attendance is taken.</div>
      `;
    } else if (status.type === 'red') {
      title = 'Attendance';
      body = `
        <div class="holcal-popup-badge holcal-popup-badge-red">Missed</div>
        <div class="holcal-popup-note">All subjects were marked absent this day.</div>
      `;
    } else if (status.type === 'none') {
      title = 'Attendance';
      const isFuture = dateStr > todayStr;
      body = `
        <div class="holcal-popup-badge holcal-popup-badge-none">No data</div>
        <div class="holcal-popup-note">${isFuture ? "This day hasn't arrived yet." : 'No semester was active, or no attendance was recorded this day.'}</div>
      `;
    } else {
      title = 'Attendance';
      body = `
        <div class="holcal-popup-badge holcal-popup-badge-green">Present</div>
        <div class="holcal-popup-note">At least one subject was marked present this day.</div>
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
