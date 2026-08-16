import { SUBJECTS, PERIODS, TIMETABLE, HOLIDAYS, DAY_NAMES } from '../data/constants.js';
import { getAttData, saveAttData } from '../utils/storageUtils.js';
import { getTodayDateString, formatTime12 } from '../utils/timeUtils.js';

export class AttendanceModule {
  constructor() {
    this.bindEvents();
  }

  onShow() {
    this.render();
  }

  bindEvents() {
    // Expose methods to global window for inline onclick handlers in modal
    window.openAddModal = () => this.openAddModal();
    window.closeModal = () => this.closeModal();
    window.saveAttendance = () => this.saveAttendance();
    window.toggleModalBtn = (key) => this.toggleModalBtn(key);
    window.togglePeriod = (dateKey, pKey) => this.togglePeriod(dateKey, pKey);
    window.fillModalPeriods = (dateStr, overrideDay) => this.fillModalPeriods(dateStr, overrideDay);

    // Modal date change listener
    document.addEventListener('DOMContentLoaded', () => {
      const modalDate = document.getElementById('modalDate');
      if (modalDate) {
        modalDate.addEventListener('change', (e) => this.fillModalPeriods(e.target.value));
      }
    });
  }

  calcStats(data) {
    let total = 0, present = 0;
    const subTotals = {};
    const subPresent = {};
    SUBJECTS.forEach(s => { subTotals[s] = 0; subPresent[s] = 0; });

    for (const dateKey in data) {
      const day = data[dateKey];
      for (const pKey in day) {
        const sub = pKey.split('_')[0];
        if (!SUBJECTS.includes(sub)) continue;
        total++;
        subTotals[sub] = (subTotals[sub] || 0) + 1;
        if (day[pKey] === 'P') {
          present++;
          subPresent[sub] = (subPresent[sub] || 0) + 1;
        }
      }
    }
    return { total, present, subTotals, subPresent };
  }

  render() {
    const data = getAttData();
    const { total, present, subTotals, subPresent } = this.calcStats(data);
    const pct = total === 0 ? 0 : Math.round((present / total) * 100);

    // Ring (Apple Activity rings style)
    const circumference = 377;
    const offset = circumference - (pct / 100) * circumference;
    const ring = document.getElementById('ringFg');
    if (ring) {
      ring.style.strokeDashoffset = offset;
      ring.style.stroke = pct >= 75 ? 'var(--green)' : pct >= 60 ? 'var(--yellow)' : 'var(--red)';
    }

    const pctElem = document.getElementById('ringPct');
    if (pctElem) {
      pctElem.textContent = pct + '%';
      pctElem.style.color = pct >= 75 ? 'var(--green)' : pct >= 60 ? 'var(--yellow)' : 'var(--red)';
    }

    // Summary
    const needed = total > 0 ? Math.max(0, Math.ceil(0.75 * total) - present) : 0;
    const canMiss = total > 0 ? Math.floor(present - 0.75 * total) : 0;

    const summaryElem = document.getElementById('attSummary');
    if (summaryElem) {
      summaryElem.innerHTML = `
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1.5rem;">
          <div class="ios-card" style="text-align:center; padding:1rem;">
            <div style="font-size:2rem; font-weight:700; color:var(--text);">${total}</div>
            <div style="font-size:0.75rem; color:var(--muted); text-transform:uppercase;">Total</div>
          </div>
          <div class="ios-card" style="text-align:center; padding:1rem;">
            <div style="font-size:2rem; font-weight:700; color:var(--green);">${present}</div>
            <div style="font-size:0.75rem; color:var(--muted); text-transform:uppercase;">Present</div>
          </div>
        </div>
        ${pct < 75 && total > 0 ? `<div class="ios-card" style="text-align:center; padding:0.75rem; margin-bottom:1rem;"><span style="color:var(--yellow); font-weight:600;">${needed}</span> more needed for 75%</div>` : ''}
        ${pct >= 75 && canMiss > 0 ? `<div class="ios-card" style="text-align:center; padding:0.75rem; margin-bottom:1rem;"><span style="color:var(--green); font-weight:600;">${canMiss}</span> safe to miss 😅</div>` : ''}
      `;
    }

    // Subject rows
    const subHtml = SUBJECTS.map(sub => {
      const t = subTotals[sub] || 0;
      const p = subPresent[sub] || 0;
      const sp = t === 0 ? 0 : Math.round((p / t) * 100);
      const color = sp >= 75 ? 'var(--green)' : sp >= 60 ? 'var(--yellow)' : 'var(--red)';
      return `<div class="ios-list-item" style="display:flex; align-items:center; gap:1rem;">
        <div style="font-weight:600; width:50px;">${sub}</div>
        <div style="flex:1; background:var(--border); height:6px; border-radius:10px; overflow:hidden;">
          <div style="height:100%; width:${sp}%; background:${color}; border-radius:10px;"></div>
        </div>
        <div style="font-family:var(--font-mono); font-size:0.8rem; color:${color}; min-width:40px; text-align:right;">${sp}%</div>
      </div>`;
    }).join('');

    const rowsElem = document.getElementById('subjectAttRows');
    if (rowsElem) {
      rowsElem.innerHTML = `<div class="ios-list">${subHtml}</div>`;
    }

    // Log
    this.renderLog(data);
  }

  renderLog(data) {
    const sortedDates = Object.keys(data).sort().reverse();
    const logHtml = sortedDates.map(dateKey => {
      const day = data[dateKey];
      const d = new Date(dateKey);
      const dayName = DAY_NAMES[d.getDay()];
      const pBtns = Object.keys(day).map(pKey => {
        const parts = pKey.split('_');
        const sub = parts[0];
        const slot = parts[1];
        const status = day[pKey];
        const isPres = status === 'P';
        return `<button onclick="window.togglePeriod('${dateKey}','${pKey}')"
          style="padding: 4px 10px; border-radius: 8px; border: 1px solid ${isPres ? 'var(--green)' : 'var(--red)'}; background: ${isPres ? 'rgba(48,209,88,0.1)' : 'rgba(255,69,58,0.1)'}; color: ${isPres ? 'var(--green)' : 'var(--red)'}; font-size: 0.75rem; font-weight: 600;">
          ${sub} <span style="font-size:0.65rem; opacity:0.8">${slot}</span>
        </button>`;
      }).join('');
      return `<div class="ios-list-item">
        <div style="font-size:0.85rem; font-weight:600; color:var(--muted); margin-bottom:0.5rem;">${dateKey.slice(5)} • ${dayName}</div>
        <div style="display:flex; flex-wrap:wrap; gap:0.5rem;">${pBtns}</div>
      </div>`;
    }).join('');

    const logElem = document.getElementById('attLog');
    if (logElem) {
      logElem.innerHTML = logHtml ? `<div class="ios-list">${logHtml}</div>` : '<div style="text-align:center; padding:2rem; color:var(--muted);">No records found.</div>';
    }
  }

  togglePeriod(dateKey, pKey) {
    const data = getAttData();
    if (!data[dateKey]) return;
    data[dateKey][pKey] = data[dateKey][pKey] === 'P' ? 'A' : 'P';
    saveAttData(data);
    this.render();
  }

  openAddModal() {
    const today = getTodayDateString();
    document.getElementById('modalDate').value = today;
    this.fillModalPeriods(today);
    document.getElementById('modalOverlay').style.display = 'flex';
  }

  closeModal() {
    document.getElementById('modalOverlay').style.display = 'none';
  }

  fillModalPeriods(dateStr, overrideDay = null) {
    if (!dateStr) return;
    const d = new Date(dateStr);
    const dayIdx = overrideDay !== null ? parseInt(overrideDay) : d.getDay();
    const tt = TIMETABLE[dayIdx];

    const isHoliday = HOLIDAYS.find(h => h.date === dateStr);
    if (isHoliday) {
      document.getElementById('modalPeriods').innerHTML =
        `<div style="color:var(--yellow); text-align:center; padding:1rem;">Today is ${isHoliday.name}!<br>No attendance on holidays 🎉</div>`;
      return;
    }

    const isOffDay = !TIMETABLE[d.getDay()] || d.getDay() === 0 || d.getDay() === 1;
    let offDayHtml = '';
    if (isOffDay) {
      offDayHtml = `
        <div style="background:var(--card); padding:1rem; border-radius:var(--radius-md); margin-bottom:1rem; border:1px solid var(--border);">
          <p style="font-size:0.8rem; color:var(--muted); margin-bottom:8px;">OFF Day. Proxy timetable:</p>
          <select id="ttOverride" onchange="window.fillModalPeriods('${dateStr}', this.value)" style="width:100%; padding:8px; border-radius:8px; background:var(--surface); color:white; border:1px solid var(--border);">
            <option value="" ${overrideDay === null ? 'selected' : ''}>-- Select --</option>
            <option value="2" ${overrideDay == '2' ? 'selected' : ''}>Tuesday</option>
            <option value="3" ${overrideDay == '3' ? 'selected' : ''}>Wednesday</option>
            <option value="4" ${overrideDay == '4' ? 'selected' : ''}>Thursday</option>
            <option value="5" ${overrideDay == '5' ? 'selected' : ''}>Friday</option>
            <option value="6" ${overrideDay == '6' ? 'selected' : ''}>Saturday</option>
          </select>
        </div>
      `;
    }

    if (isOffDay && overrideDay === null) {
      document.getElementById('modalPeriods').innerHTML = offDayHtml;
      return;
    }

    if (!tt) {
      document.getElementById('modalPeriods').innerHTML = offDayHtml + '<div style="text-align:center; color:var(--muted);">No classes today 🎉</div>';
      return;
    }

    const existingData = getAttData()[dateStr] || {};
    let html = overrideDay !== null ? offDayHtml : '';

    html += '<div class="ios-list">';
    html += PERIODS.map((p, i) => {
      const sub = tt[i].sub;
      if (sub === 'LUNCH' || sub === 'LIBRARY') return '';
      const key = `${p.slot}`;

      let currentSub = sub;
      let val = 'P';
      for (const k in existingData) {
        if (k.endsWith('_' + p.slot)) {
          currentSub = k.split('_')[0];
          val = existingData[k];
          break;
        }
      }

      const subOptions = SUBJECTS.map(s => `<option value="${s}" ${s === currentSub ? 'selected' : ''}>${s}</option>`).join('');

      return `<div class="ios-list-item" style="display:flex; align-items:center; gap:0.5rem; background:var(--card);">
        <div style="flex:1">
          <div style="font-size:0.7rem; color:var(--muted); margin-bottom:4px;">${p.slot} (${formatTime12(p.start)})</div>
          <select id="msub_${key}" style="width:100%; padding:6px; border-radius:6px; background:var(--surface); color:white; border:1px solid var(--border);">
            ${subOptions}
          </select>
        </div>
        <button type="button" id="mbtn_${key}" onclick="window.toggleModalBtn('${key}')"
          style="min-width:80px; padding:8px; border-radius:8px; font-weight:600; border:none; color:white; background:${val === 'P' ? 'var(--green)' : 'var(--red)'};">
          ${val === 'P' ? 'Present' : 'Absent'}
        </button>
      </div>`;
    }).filter(x => x !== '').join('');
    html += '</div>';

    document.getElementById('modalPeriods').innerHTML = html;
  }

  toggleModalBtn(key) {
    const btn = document.getElementById('mbtn_' + key);
    if (btn.textContent.includes('Present')) {
      btn.textContent = 'Absent';
      btn.style.background = 'var(--red)';
      btn.classList.add('absent');
      btn.classList.remove('present');
    } else {
      btn.textContent = 'Present';
      btn.style.background = 'var(--green)';
      btn.classList.add('present');
      btn.classList.remove('absent');
    }
  }

  saveAttendance() {
    const dateStr = document.getElementById('modalDate').value;
    if (!dateStr) return;

    const isHoliday = HOLIDAYS.find(h => h.date === dateStr);
    if (isHoliday) {
      this.closeModal();
      return;
    }

    const d = new Date(dateStr);
    const overrideSelect = document.getElementById('ttOverride');
    const dayIdx = (overrideSelect && overrideSelect.value) ? parseInt(overrideSelect.value) : d.getDay();
    const tt = TIMETABLE[dayIdx];
    if (!tt) { this.closeModal(); return; }

    const data = getAttData();
    if (!data[dateStr]) data[dateStr] = {};

    PERIODS.forEach((p, i) => {
      const sub = tt[i].sub;
      if (sub === 'LUNCH' || sub === 'LIBRARY') return;
      const key = `${p.slot}`;
      const subSelect = document.getElementById('msub_' + key);
      const btn = document.getElementById('mbtn_' + key);

      if (subSelect && btn) {
        for (const existingKey in data[dateStr]) {
          if (existingKey.endsWith('_' + p.slot)) {
            delete data[dateStr][existingKey];
          }
        }
        const selectedSub = subSelect.value;
        const actualKey = `${selectedSub}_${p.slot}`;
        // rely on textContent logic we defined above
        data[dateStr][actualKey] = btn.textContent.includes('Present') ? 'P' : 'A';
      }
    });

    saveAttData(data);
    this.closeModal();
    this.render();
  }
}
