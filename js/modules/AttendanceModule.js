import { getTodayDateString, formatTime12 } from '../utils/timeUtils.js';
import { fetchWithAuth } from '../core/api.js';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export class AttendanceModule {
  constructor() {
    this.bindEvents();
  }

  async onShow() {
    await this.fetchData();
    this.render();
  }

  async fetchData() {
    try {
      const res = await fetchWithAuth('/attendance');
      if (res.ok) {
        const list = await res.json();
        // Convert array to internal map format { "YYYY-MM-DD": { "SUB_SLOT": "P"|"A" } }
        this.attData = {};
        list.forEach(item => {
           this.attData[item.date] = {};
           item.records.forEach((r, i) => {
               // mock a slot name like SUB_I
               this.attData[item.date][`${r.subject}_S${i}`] = r.status === 'present' ? 'P' : 'A';
           });
        });
      }
    } catch (e) {
      console.error(e);
      this.attData = {};
    }
  }

  bindEvents() {
    // Expose methods to global window for inline onclick handlers in modal
    window.openAddModal = () => this.openAddModal();
    window.closeModal = () => this.closeModal();
    window.saveAttendance = () => this.saveAttendance();
    window.toggleModalBtn = (key) => this.toggleModalBtn(key);
    window.togglePeriod = (dateKey, pKey) => this.togglePeriod(dateKey, pKey);
    window.fillModalPeriods = (dateStr, overrideDay) => this.fillModalPeriods(dateStr, overrideDay);

    // Modal date change listener.
    // Module scripts are deferred, so DOMContentLoaded has usually already
    // fired by the time this runs — attach directly instead of waiting on it.
    const modalDate = document.getElementById('modalDate');
    if (modalDate) {
      modalDate.addEventListener('change', (e) => this.fillModalPeriods(e.target.value));
    }
  }

  calcStats(data) {
    let total = 0, present = 0;
    const subTotals = {};
    const subPresent = {};
    const dayTotals = {};   // dateKey -> { total, present }
    const { subjects: SUBJECTS } = window.globalConfig;
    if (SUBJECTS) {
        SUBJECTS.forEach(s => { subTotals[s] = 0; subPresent[s] = 0; });
    }

    for (const dateKey in data) {
      const day = data[dateKey];
      let dTotal = 0, dPresent = 0;
      for (const pKey in day) {
        const sub = pKey.split('_')[0];
        if (SUBJECTS && !SUBJECTS.includes(sub)) continue;
        total++;
        dTotal++;
        subTotals[sub] = (subTotals[sub] || 0) + 1;
        if (day[pKey] === 'P') {
          present++;
          dPresent++;
          subPresent[sub] = (subPresent[sub] || 0) + 1;
        }
      }
      if (dTotal > 0) dayTotals[dateKey] = { total: dTotal, present: dPresent };
    }
    return { total, present, subTotals, subPresent, dayTotals };
  }

  // Consecutive-day "full attendance" streak, counting back from the most recent marked day.
  calcStreak(dayTotals) {
    const sortedDates = Object.keys(dayTotals).sort().reverse();
    let streak = 0;
    for (const dateKey of sortedDates) {
      const d = dayTotals[dateKey];
      if (d.present === d.total && d.total > 0) streak++;
      else break;
    }
    return streak;
  }

  render() {
    const { subjects: SUBJECTS } = window.globalConfig;
    if (!SUBJECTS) return;

    const data = this.attData || {};
    const { total, present, subTotals, subPresent, dayTotals } = this.calcStats(data);
    const absent = total - present;
    const pct = total === 0 ? 0 : Math.round((present / total) * 100);
    const streak = this.calcStreak(dayTotals);

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

    const ringTarget = document.getElementById('ringTarget');
    if (ringTarget) ringTarget.setAttribute('stroke', 'var(--muted)');

    // Summary
    const needed = total > 0 ? Math.max(0, Math.ceil(0.75 * total) - present) : 0;
    const canMiss = total > 0 ? Math.floor(present - 0.75 * total) : 0;

    const summaryElem = document.getElementById('attSummary');
    if (summaryElem) {
      summaryElem.innerHTML = `
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; margin-bottom:1rem;">
          <div class="ios-card" style="text-align:center; padding:0.85rem;">
            <div style="font-size:1.5rem; font-weight:700; color:var(--text);">${total}</div>
            <div style="font-size:0.7rem; color:var(--muted); text-transform:uppercase;">Total</div>
          </div>
          <div class="ios-card" style="text-align:center; padding:0.85rem;">
            <div style="font-size:1.5rem; font-weight:700; color:var(--green);">${present}</div>
            <div style="font-size:0.7rem; color:var(--muted); text-transform:uppercase;">Present</div>
          </div>
          <div class="ios-card" style="text-align:center; padding:0.85rem;">
            <div style="font-size:1.5rem; font-weight:700; color:var(--red);">${absent}</div>
            <div style="font-size:0.7rem; color:var(--muted); text-transform:uppercase;">Absent</div>
          </div>
          <div class="ios-card" style="text-align:center; padding:0.85rem;">
            <div style="font-size:1.5rem; font-weight:700; color:var(--accent);">${streak}</div>
            <div style="font-size:0.7rem; color:var(--muted); text-transform:uppercase;">Streak</div>
          </div>
        </div>
        ${pct < 75 && total > 0 ? `<div class="ios-card" style="text-align:center; padding:0.75rem; margin-bottom:1rem;"><span style="color:var(--yellow); font-weight:600;">${needed}</span> more needed for 75%<div style="font-size:0.7rem; color:var(--muted); margin-top:0.25rem;">Attend the next ${needed} classes in a row (no misses) to reach 75%</div></div>` : ''}
        ${pct >= 75 && canMiss > 0 ? `<div class="ios-card" style="text-align:center; padding:0.75rem; margin-bottom:1rem;"><span style="color:var(--green); font-weight:600;">${canMiss}</span> safe to miss overall 😅</div>` : ''}
      `;
    }

    // Weakest subject alert
    const alertElem = document.getElementById('attAlert');
    if (alertElem) {
      let worst = null;
      SUBJECTS.forEach(sub => {
        const t = subTotals[sub] || 0;
        if (t === 0) return;
        const p = subPresent[sub] || 0;
        const sp = (p / t) * 100;
        if (sp < 75 && (worst === null || sp < worst.pct)) worst = { sub, pct: sp, t, p };
      });
      if (worst) {
        const need = Math.max(0, Math.ceil(0.75 * worst.t) - worst.p);
        alertElem.innerHTML = `<div class="ios-card" style="text-align:center; padding:0.75rem; margin-bottom:1rem;">
          <span style="color:var(--yellow); font-weight:600;">${worst.sub}</span> is your weakest subject at ${Math.round(worst.pct)}% — attend <span style="color:var(--red); font-weight:600;">${need}</span> more in a row to clear 75%
        </div>`;
      } else {
        alertElem.innerHTML = '';
      }
    }

    // Subject rows — with present/total count and per-subject safe-to-miss / need-more
    const subHtml = SUBJECTS.map(sub => {
      const t = subTotals[sub] || 0;
      const p = subPresent[sub] || 0;
      const sp = t === 0 ? 0 : Math.round((p / t) * 100);
      const color = sp >= 75 ? 'var(--green)' : sp >= 60 ? 'var(--yellow)' : 'var(--red)';
      let subLine = '';
      if (t > 0) {
        if (sp >= 75) {
          const miss = Math.floor(p - 0.75 * t);
          subLine = miss > 0 ? `${miss} safe to miss` : `at the edge — don't miss more`;
        } else {
          const need = Math.max(0, Math.ceil(0.75 * t) - p);
          subLine = `need ${need} more for 75%`;
        }
      }
      return `<div class="ios-list-item" style="padding:0.6rem 1rem;">
        <div style="display:flex; align-items:center; gap:1rem; margin-bottom:${t > 0 ? '3px' : '0'};">
          <div style="font-weight:600; width:60px; font-size:0.85rem;">${sub}</div>
          <div style="flex:1; background:var(--border); height:6px; border-radius:10px; overflow:hidden;">
            <div style="height:100%; width:${sp}%; background:${color}; border-radius:10px;"></div>
          </div>
          <div style="font-family:var(--font-mono); font-size:0.75rem; color:${color}; min-width:70px; text-align:right;">${sp}% (${p}/${t})</div>
        </div>
        ${t > 0 ? `<div style="font-size:0.68rem; color:${sp >= 75 ? 'var(--green)' : 'var(--red)'}; margin-left:76px;">${subLine}</div>` : ''}
      </div>`;
    }).join('');

    const rowsElem = document.getElementById('subjectAttRows');
    if (rowsElem) {
      rowsElem.innerHTML = `<div class="ios-list">${subHtml}</div>`;
    }

    // Last 7 marked days trend
    this.renderTrend(dayTotals);

    // Log
    this.renderLog(data);
  }

  renderTrend(dayTotals) {
    const trendElem = document.getElementById('attTrend');
    if (!trendElem) return;

    const sortedDates = Object.keys(dayTotals).sort();
    const last7 = sortedDates.slice(-7);

    if (last7.length === 0) {
      trendElem.innerHTML = '<div style="text-align:center; padding:1rem; color:var(--muted); font-size:0.8rem;">No records yet.</div>';
      return;
    }

    const bars = last7.map(dateKey => {
      const d = dayTotals[dateKey];
      const pct = d.total === 0 ? 0 : Math.round((d.present / d.total) * 100);
      const color = pct >= 75 ? 'var(--green)' : pct >= 60 ? 'var(--yellow)' : 'var(--red)';
      const label = dateKey.slice(5).replace('-', '/');
      return `<div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:4px;">
        <div style="font-size:0.6rem; color:var(--muted);">${pct}%</div>
        <div style="width:100%; height:60px; display:flex; align-items:flex-end; background:var(--border); border-radius:4px; overflow:hidden;">
          <div style="width:100%; height:${Math.max(pct, 4)}%; background:${color};"></div>
        </div>
        <div style="font-size:0.6rem; color:var(--muted);">${label}</div>
      </div>`;
    }).join('');

    trendElem.innerHTML = `<div class="ios-card" style="padding:0.75rem; display:flex; gap:6px;">${bars}</div>`;
  }

  renderLog(data) {
    const { periods: PERIODS } = window.globalConfig || {};
    const slotStart = {};
    if (PERIODS) PERIODS.forEach(p => { slotStart[p.slot] = p.start; });

    if (!this.editingDay) this.editingDay = null;
    if (!this.openMenuDay) this.openMenuDay = null;

    const sortedDates = Object.keys(data).sort().reverse();
    const logHtml = sortedDates.map(dateKey => {
      const day = data[dateKey];
      const d = new Date(dateKey);
      const dayName = DAY_NAMES[d.getDay()];

      const keys = Object.keys(day);
      const dayPresent = keys.filter(k => day[k] === 'P').length;
      const dayTotal = keys.length;
      const dayPct = dayTotal === 0 ? 0 : Math.round((dayPresent / dayTotal) * 100);
      const dayColor = dayPct >= 75 ? 'var(--green)' : dayPct >= 60 ? 'var(--yellow)' : 'var(--red)';
      const isEditing = this.editingDay === dateKey;
      const isMenuOpen = this.openMenuDay === dateKey;

      const pBtns = keys.map(pKey => {
        const parts = pKey.split('_');
        const sub = parts[0];
        const slot = parts[1];
        const status = day[pKey];
        const isPres = status === 'P';
        const timeLabel = slotStart[slot] ? formatTime12(slotStart[slot]) : slot;
        const tag = isEditing ? 'button' : 'div';
        const clickAttr = isEditing ? ` onclick="window.togglePeriod('${dateKey}','${pKey}')"` : '';
        return `<${tag}${clickAttr}
          style="padding: 4px 10px; border-radius: 8px; border: 1px solid ${isPres ? 'var(--green)' : 'var(--red)'}; background: ${isPres ? 'rgba(48,209,88,0.1)' : 'rgba(255,69,58,0.1)'}; color: ${isPres ? 'var(--green)' : 'var(--red)'}; font-size: 0.75rem; font-weight: 600;">
          ${sub} <span style="font-size:0.65rem; opacity:0.8">${timeLabel}</span>
        </${tag}>`;
      }).join('');

      const menu = isMenuOpen ? `<div style="position:absolute; top:26px; right:0; background:var(--card); border:1px solid var(--border); border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.15); min-width:110px; overflow:hidden; z-index:10;">
            <button onclick="window.startEditDay('${dateKey}')" style="width:100%; text-align:left; padding:8px 12px; font-size:0.75rem; background:transparent; border:none; display:flex; align-items:center; gap:6px; color:var(--text);">Edit day</button>
            <button onclick="window.deleteAttendanceDay('${dateKey}')" style="width:100%; text-align:left; padding:8px 12px; font-size:0.75rem; background:transparent; border:none; display:flex; align-items:center; gap:6px; color:var(--accent2);">Delete day</button>
          </div>` : '';

      return `<div class="ios-list-item">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
          <div style="font-size:0.85rem; font-weight:600; color:var(--muted);">${dateKey.slice(5)} • ${dayName}</div>
          <div style="display:flex; align-items:center; gap:0.5rem; position:relative;">
            <span style="font-size:0.75rem; font-weight:600; color:${dayColor};">${dayPresent}/${dayTotal} • ${dayPct}%</span>
            ${isEditing ? `<button onclick="window.stopEditDay()" style="background:var(--accent); color:white; border:none; border-radius:4px; padding:2px 8px; font-size:0.7rem;">Done</button>` : `<button onclick="window.toggleDayMenu('${dateKey}')" aria-label="More options" style="background:transparent; border:none; color:var(--muted); font-size:1rem; padding:2px 6px; line-height:1;">⋮</button>`}
            ${menu}
          </div>
        </div>
        <div style="display:flex; flex-wrap:wrap; gap:0.5rem;">${pBtns}</div>
      </div>`;
    }).join('');

    window.toggleDayMenu = (dateStr) => {
      this.openMenuDay = this.openMenuDay === dateStr ? null : dateStr;
      this.renderLog(this.attData);
    };

    window.startEditDay = (dateStr) => {
      this.editingDay = dateStr;
      this.openMenuDay = null;
      this.renderLog(this.attData);
    };

    window.stopEditDay = () => {
      this.editingDay = null;
      this.renderLog(this.attData);
    };

    window.deleteAttendanceDay = async (dateStr) => {
        if(!confirm(`Delete attendance for ${dateStr}?`)) return;
        try {
            await fetchWithAuth(`/attendance/${dateStr}`, { method: 'DELETE' });
            await this.fetchData();
            this.render();
        } catch(e) { alert('Error deleting'); }
    };

    const logElem = document.getElementById('attLog');
    if (logElem) {
      logElem.innerHTML = logHtml ? `<div class="ios-list">${logHtml}</div>` : '<div style="text-align:center; padding:2rem; color:var(--muted);">No records found.</div>';
    }
  }

  async togglePeriod(dateKey, pKey) {
    const data = this.attData;
    if (!data[dateKey]) return;
    data[dateKey][pKey] = data[dateKey][pKey] === 'P' ? 'A' : 'P';

    // convert back to server format and save
    const records = Object.keys(data[dateKey]).map(k => ({
        subject: k.split('_')[0],
        status: data[dateKey][k] === 'P' ? 'present' : 'absent'
    }));

    try {
        await fetchWithAuth('/attendance', {
            method: 'POST',
            body: JSON.stringify({ date: dateKey, records })
        });
        await this.fetchData();
        this.render();
    } catch(e) { console.error(e); }
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
    const { timetable: TIMETABLE, periods: PERIODS, holidays: HOLIDAYS, offDays, subjects: SUBJECTS } = window.globalConfig;
    if (!TIMETABLE || !PERIODS) return;

    const d = new Date(dateStr);
    const dayIdx = overrideDay !== null ? parseInt(overrideDay) : d.getDay();
    const tt = TIMETABLE[dayIdx];

    const isHoliday = HOLIDAYS && HOLIDAYS.find(h => h.date === dateStr);
    if (isHoliday) {
      document.getElementById('modalPeriods').innerHTML =
        `<div style="color:var(--yellow); text-align:center; padding:1rem;">Today is ${isHoliday.name}!<br>No attendance on holidays 🎉</div>`;
      return;
    }

    const isOffDay = !TIMETABLE[d.getDay()] || (offDays && offDays.includes(d.getDay()));
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

    const existingData = this.attData[dateStr] || {};
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

  async saveAttendance() {
    const dateStr = document.getElementById('modalDate').value;
    if (!dateStr) return;

    const { timetable: TIMETABLE, periods: PERIODS, holidays: HOLIDAYS } = window.globalConfig;

    const isHoliday = HOLIDAYS && HOLIDAYS.find(h => h.date === dateStr);
    if (isHoliday) {
      this.closeModal();
      return;
    }

    const d = new Date(dateStr);
    const overrideSelect = document.getElementById('ttOverride');
    const dayIdx = (overrideSelect && overrideSelect.value) ? parseInt(overrideSelect.value) : d.getDay();
    const tt = TIMETABLE[dayIdx];
    if (!tt) { this.closeModal(); return; }

    const records = [];

    PERIODS.forEach((p, i) => {
      const sub = tt[i].sub;
      if (sub === 'LUNCH' || sub === 'LIBRARY') return;
      const key = `${p.slot}`;
      const subSelect = document.getElementById('msub_' + key);
      const btn = document.getElementById('mbtn_' + key);

      if (subSelect && btn) {
        records.push({
            subject: subSelect.value,
            status: btn.textContent.includes('Present') ? 'present' : 'absent'
        });
      }
    });

    try {
        await fetchWithAuth('/attendance', {
            method: 'POST',
            body: JSON.stringify({ date: dateStr, records })
        });
        this.closeModal();
        await this.fetchData();
        this.render();
    } catch(e) {
        alert("Failed to save attendance");
    }
  }
}
