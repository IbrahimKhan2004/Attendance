import { fetchWithAuth } from '../core/api.js';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export class AdminModule {
  constructor() {
    this.container = document.getElementById('adminContainer');
    this.users = [];
    this.allAttendance = [];
    this.ttDay = 1; // which day is currently open in the Timetable editor
  }

  async onShow() {
    await this.fetchData();
    this.render();
  }

  async fetchData() {
    try {
      const usersRes = await fetchWithAuth('/auth/users');
      if (usersRes.ok) this.users = await usersRes.json();

      const attRes = await fetchWithAuth('/attendance/all');
      if (attRes.ok) this.allAttendance = await attRes.json();
    } catch (e) {
      console.error('Error fetching admin data', e);
    }
  }

  render() {
    const gc = window.globalConfig || {};
    if (!gc.subjects) gc.subjects = [];
    if (!gc.periods) gc.periods = [];
    if (!gc.timetable) gc.timetable = {};
    if (!gc.syllabus) gc.syllabus = [];
    window.globalConfig = gc;

    const offDays = (gc.offDays || []).map(Number);
    gc.offDays = offDays;

    // backfill: older periods saved without a `slot` identifier broke attendance keys ("undefined (time)")
    gc.periods.forEach((p, i) => {
      if (!p.slot) p.slot = p.label || String(i + 1);
    });
    const holidays = gc.holidays || [];
    const subjects = gc.subjects;
    const periods = gc.periods;
    const syllabus = gc.syllabus;

    let holidaysHtml = holidays.map((h, i) => `
      <div style="display:flex; justify-content:space-between; align-items:center; padding: 0.5rem; border-bottom: 1px solid var(--border);">
          <div style="flex:1;">
            <input type="text" id="holidayName_${i}" value="${h.name}" style="background:var(--bg); color:white; border:1px solid var(--border); border-radius:4px; padding:4px;">
            <input type="date" id="holidayDate_${i}" value="${h.date}" style="background:var(--bg); color:white; border:1px solid var(--border); border-radius:4px; padding:4px; color-scheme: dark;">
          </div>
          <div style="display:flex; gap:0.5rem;">
            ${i > 0 ? `<button onclick="window.adminModule.swapHoliday(${i}, -1)" style="background:var(--surface); color:white; border:1px solid var(--border); padding:4px 8px; border-radius:4px;">↑</button>` : ''}
            ${i < holidays.length - 1 ? `<button onclick="window.adminModule.swapHoliday(${i}, 1)" style="background:var(--surface); color:white; border:1px solid var(--border); padding:4px 8px; border-radius:4px;">↓</button>` : ''}
            <button onclick="window.adminModule.deleteHoliday(${i})" style="background:var(--accent2); color:white; border:none; padding:4px 8px; border-radius:4px;">Del</button>
          </div>
      </div>
    `).join('');

    this.container.innerHTML = `
      <h2 style="margin-top: 1rem;">Admin Dashboard</h2>

      <div style="margin-top: 1rem;">
        <h3>Configuration</h3>

        <div style="margin-bottom: 1rem; padding: 1rem; border: 1px solid var(--border); border-radius: 8px; background: var(--surface);">
          <h4>Semester Info</h4>
          <div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-bottom: 0.5rem;">
            <input type="text" id="confCollege" value="${gc.collegeName || ''}" placeholder="College Name" style="flex:1; padding: 8px; border-radius: 4px; border: 1px solid var(--border); background: var(--bg); color: white;">
            <input type="text" id="confLocation" value="${gc.location || ''}" placeholder="Location" style="flex:1; padding: 8px; border-radius: 4px; border: 1px solid var(--border); background: var(--bg); color: white;">
          </div>
          <div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-bottom: 0.5rem;">
            <input type="text" id="confSection" value="${gc.sectionName || ''}" placeholder="Section" style="flex:1; padding: 8px; border-radius: 4px; border: 1px solid var(--border); background: var(--bg); color: white;">
            <input type="text" id="confYear" value="${gc.year || ''}" placeholder="Year" style="flex:1; padding: 8px; border-radius: 4px; border: 1px solid var(--border); background: var(--bg); color: white;">
          </div>
        </div>

        <div style="margin-bottom: 1rem; padding: 1rem; border: 1px solid var(--border); border-radius: 8px; background: var(--surface);">
          <h4>Off Days (Check to set as OFF)</h4>
          <div style="display:flex; gap:1rem; flex-wrap:wrap; margin-top: 0.5rem;">
            ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => `
              <label style="display:flex; align-items:center; gap:0.25rem;">
                <input type="checkbox" id="offDay_${i}" value="${i}" ${offDays.includes(i) ? 'checked' : ''} onchange="window.adminModule.toggleOffDay(${i}, this.checked)">
                ${d}
              </label>
            `).join('')}
          </div>
        </div>

        <div style="margin-bottom: 1rem; padding: 1rem; border: 1px solid var(--border); border-radius: 8px; background: var(--surface);">
          <h4>Holidays</h4>
          <button onclick="window.adminModule.addHoliday()" style="background:var(--surface); border:1px solid var(--border); color:white; padding:4px 8px; border-radius:4px; margin-bottom: 0.5rem;">+ Add Holiday</button>
          <div id="holidaysList" style="margin-top:0.5rem;">
            ${holidaysHtml}
          </div>
        </div>

        <div style="margin-bottom: 1rem; padding: 1rem; border: 1px solid var(--border); border-radius: 8px; background: var(--surface);">
          <h4>Subjects</h4>
          <div id="subjectsChips" style="display:flex; gap:0.5rem; flex-wrap:wrap; margin: 0.5rem 0;">
            ${subjects.map((s, i) => `
              <span style="display:flex; align-items:center; gap:6px; background:var(--bg); border:1px solid var(--border); padding:4px 8px; border-radius:16px; font-size:0.85rem;">
                ${s}
                <button onclick="window.adminModule.deleteSubject(${i})" style="background:none; border:none; color:var(--accent2); cursor:pointer; font-weight:700; padding:0;">✕</button>
              </span>
            `).join('')}
          </div>
          <div style="display:flex; gap:0.5rem;">
            <input type="text" id="newSubjectInput" placeholder="e.g. DBMS" style="flex:1; padding:8px; border-radius:4px; border:1px solid var(--border); background:var(--bg); color:white;">
            <button onclick="window.adminModule.addSubject()" style="background:var(--accent); color:white; border:none; padding:8px 12px; border-radius:8px; font-weight:600;">+ Add</button>
          </div>
        </div>

        <div style="margin-bottom: 1rem; padding: 1rem; border: 1px solid var(--border); border-radius: 8px; background: var(--surface);">
          <h4>Periods (time slots, same every day)</h4>
          <div id="periodsList" style="margin-top:0.5rem;">
            ${periods.map((p, i) => `
              <div style="display:flex; gap:0.5rem; align-items:center; margin-bottom:0.5rem;">
                <input type="text" id="pdLabel_${i}" value="${p.label ?? (i+1)}" placeholder="#" style="width:40px; padding:6px; border-radius:4px; border:1px solid var(--border); background:var(--bg); color:white; text-align:center;">
                <input type="time" id="pdStart_${i}" value="${p.start || ''}" style="flex:1; padding:6px; border-radius:4px; border:1px solid var(--border); background:var(--bg); color:white; color-scheme: dark;">
                <span style="color:var(--muted);">to</span>
                <input type="time" id="pdEnd_${i}" value="${p.end || ''}" style="flex:1; padding:6px; border-radius:4px; border:1px solid var(--border); background:var(--bg); color:white; color-scheme: dark;">
                <button onclick="window.adminModule.deletePeriod(${i})" style="background:var(--accent2); color:white; border:none; padding:6px 10px; border-radius:4px;">Del</button>
              </div>
            `).join('')}
          </div>
          <button onclick="window.adminModule.addPeriod()" style="background:var(--surface); border:1px solid var(--border); color:white; padding:6px 10px; border-radius:4px;">+ Add Period</button>
        </div>

        <div style="margin-bottom: 1rem; padding: 1rem; border: 1px solid var(--border); border-radius: 8px; background: var(--surface);">
          <h4>Timetable</h4>
          <p style="font-size:0.8rem; color:var(--muted); margin-bottom:0.5rem;">Pick a subject for each period, per day. Add periods above first.</p>
          <div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-bottom:0.75rem;">
            ${DAY_NAMES.map((d, i) => offDays.includes(i) ? '' : `
              <button onclick="window.adminModule.selectTTDay(${i})" style="background:${i === this.ttDay ? 'var(--accent)' : 'var(--bg)'}; color:white; border:1px solid var(--border); padding:6px 10px; border-radius:6px; font-size:0.8rem;">${d}</button>
            `).join('')}
          </div>
          <div id="ttDayEditor">
            ${offDays.includes(this.ttDay) ? `<p style="color:var(--muted); font-size:0.85rem;">This day is OFF.</p>` : this.renderTTDayEditor(gc)}
          </div>
        </div>

        <div style="margin-bottom: 1rem; padding: 1rem; border: 1px solid var(--border); border-radius: 8px; background: var(--surface);">
          <h4>Syllabus</h4>
          <p style="font-size:0.8rem; color:var(--muted); margin-bottom:0.5rem;">Units per subject.</p>
          <div id="syllabusEditor">
            ${syllabus.map((s, si) => `
              <div style="border:1px solid var(--border); border-radius:8px; padding:0.75rem; margin-bottom:0.75rem; background:var(--bg);">
                <div style="display:flex; gap:0.5rem; margin-bottom:0.5rem;">
                  <input type="text" id="sylSubject_${si}" value="${s.subject || ''}" placeholder="Subject" style="flex:1; padding:6px; border-radius:4px; border:1px solid var(--border); background:var(--surface); color:white;">
                  <button onclick="window.adminModule.deleteSyllabusSubject(${si})" style="background:var(--accent2); color:white; border:none; padding:6px 10px; border-radius:4px;">Del</button>
                </div>
                <div id="sylUnits_${si}">
                  ${(s.units || []).map((u, ui) => `
                    <div style="display:flex; gap:0.5rem; margin-bottom:0.4rem;">
                      <input type="text" id="sylUnitTitle_${si}_${ui}" value="${u.title || ''}" placeholder="Unit title" style="flex:1; padding:6px; border-radius:4px; border:1px solid var(--border); background:var(--surface); color:white;">
                      <input type="text" id="sylUnitDesc_${si}_${ui}" value="${u.desc || ''}" placeholder="Description" style="flex:2; padding:6px; border-radius:4px; border:1px solid var(--border); background:var(--surface); color:white;">
                      <button onclick="window.adminModule.deleteSyllabusUnit(${si},${ui})" style="background:var(--accent2); color:white; border:none; padding:6px 10px; border-radius:4px;">✕</button>
                    </div>
                  `).join('')}
                </div>
                <button onclick="window.adminModule.addSyllabusUnit(${si})" style="background:var(--surface); border:1px solid var(--border); color:white; padding:4px 8px; border-radius:4px; font-size:0.8rem;">+ Add Unit</button>
              </div>
            `).join('')}
          </div>
          <button onclick="window.adminModule.addSyllabusSubject()" style="background:var(--surface); border:1px solid var(--border); color:white; padding:6px 10px; border-radius:4px;">+ Add Subject to Syllabus</button>
        </div>

        <button onclick="window.adminModule.saveConfig()" style="background:var(--accent); color:white; border:none; padding:8px 16px; border-radius:8px; font-weight:600; width:100%;">Save Global Config</button>
      </div>

      <div style="margin-top: 2rem;">
        <h3>Manage Students</h3>
        <div style="margin-bottom: 1rem; padding: 1rem; border: 1px solid var(--border); border-radius: 8px; background: var(--surface);">
          <h4>Add Student</h4>
          <input type="text" id="newStudentUsername" placeholder="Username" style="width: 100%; padding: 8px; margin-bottom: 0.5rem; border-radius: 4px; border: 1px solid var(--border); background: var(--bg); color: white;">
          <input type="text" id="newStudentPassword" placeholder="Password" style="width: 100%; padding: 8px; margin-bottom: 0.5rem; border-radius: 4px; border: 1px solid var(--border); background: var(--bg); color: white;">
          <button onclick="window.adminModule.addStudent()" style="background:var(--accent); color:white; border:none; padding:6px 12px; border-radius:8px; font-weight:600;">Add Student</button>
        </div>
        <div id="studentsList">
            ${this.users.map(u => `
                <div style="display:flex; justify-content:space-between; padding: 0.5rem; border-bottom: 1px solid var(--border);">
                    <span>${u.username}</span>
                    <button onclick="window.adminModule.deleteStudent('${u._id}')" style="background:var(--accent2); color:white; border:none; padding:4px 8px; border-radius:4px;">Delete</button>
                </div>
            `).join('')}
        </div>
      </div>

      <div style="margin-top: 2rem; margin-bottom: 3rem;">
        <h3>Students Attendance Overview</h3>
        <div id="adminAttendanceOverview">
          ${this.allAttendance.map(ua => {
            const totalClasses = ua.attendance.reduce((sum, d) => sum + d.records.length, 0);
            const presentClasses = ua.attendance.reduce((sum, d) => sum + d.records.filter(r => r.status === 'present').length, 0);
            const pct = totalClasses === 0 ? 0 : Math.round((presentClasses/totalClasses)*100);
            return `
              <div style="margin-bottom: 0.5rem; padding: 0.5rem; background: var(--surface); border-radius: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <strong>${ua.user.username}</strong>
                  <span style="color: ${pct < 75 ? 'var(--accent2)' : 'var(--accent)'}; font-weight: bold;">${pct}%</span>
                </div>
                <div style="font-size: 0.8rem; color: var(--muted);">Total Classes: ${totalClasses} | Present: ${presentClasses}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    window.adminModule = this;
  }

  renderTTDayEditor(gc) {
    const periods = gc.periods || [];
    const subjects = gc.subjects || [];
    if (!gc.timetable) gc.timetable = {};
    if (!gc.timetable[this.ttDay]) gc.timetable[this.ttDay] = [];
    const dayEntries = gc.timetable[this.ttDay];

    if (periods.length === 0) {
      return `<p style="color:var(--muted); font-size:0.85rem;">No periods yet — add periods above first.</p>`;
    }

    return periods.map((p, i) => {
      const current = dayEntries[i] || { sub: '', teacher: '' };
      const label = p.label || (i + 1);
      const timeStr = (p.start && p.end) ? `${p.start}–${p.end}` : '';
      return `
        <div style="display:flex; gap:0.5rem; align-items:center; margin-bottom:0.5rem;">
          <span style="width:70px; font-size:0.75rem; color:var(--muted);">P${label}<br>${timeStr}</span>
          <select id="ttSub_${i}" onchange="window.adminModule.setTTCell(${i}, 'sub', this.value)" style="flex:1; padding:6px; border-radius:4px; border:1px solid var(--border); background:var(--bg); color:white;">
            <option value="">-- OFF / Free --</option>
            <option value="LUNCH" ${current.sub === 'LUNCH' ? 'selected' : ''}>LUNCH</option>
            ${subjects.map(s => `<option value="${s}" ${current.sub === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
          <input type="text" id="ttTeacher_${i}" value="${current.teacher || ''}" placeholder="Teacher (optional)" oninput="window.adminModule.setTTCell(${i}, 'teacher', this.value)" style="flex:1; padding:6px; border-radius:4px; border:1px solid var(--border); background:var(--bg); color:white;">
        </div>
      `;
    }).join('');
  }

  toggleOffDay(dayIdx, checked) {
      dayIdx = Number(dayIdx);
      this._syncUI();
      const gc = window.globalConfig;
      if (!gc.offDays) gc.offDays = [];
      gc.offDays = gc.offDays.map(Number);
      if (checked) {
          if (!gc.offDays.includes(dayIdx)) gc.offDays.push(dayIdx);
      } else {
          gc.offDays = gc.offDays.filter(d => d !== dayIdx);
      }
      // if the currently open timetable day just became OFF, jump to the next working day
      if (gc.offDays.includes(Number(this.ttDay))) {
          const nextWorking = [1, 2, 3, 4, 5, 6, 0].find(d => !gc.offDays.includes(d));
          if (nextWorking !== undefined) this.ttDay = nextWorking;
      }
      this.render();
  }

  selectTTDay(dayIdx) {
    this.ttDay = Number(dayIdx);
    this.render();
  }

  setTTCell(periodIdx, field, value) {
    const gc = window.globalConfig;
    if (!gc.timetable[this.ttDay]) gc.timetable[this.ttDay] = [];
    if (!gc.timetable[this.ttDay][periodIdx]) gc.timetable[this.ttDay][periodIdx] = { sub: '', teacher: '' };
    gc.timetable[this.ttDay][periodIdx][field] = value;
    // no full re-render needed for teacher text input; re-render only for subject select to keep UI in sync
    if (field === 'sub') this.render();
  }

  addSubject() {
    const input = document.getElementById('newSubjectInput');
    const val = (input.value || '').trim();
    if (!val) return;
    const gc = window.globalConfig;
    if (!gc.subjects) gc.subjects = [];
    if (gc.subjects.includes(val)) return alert('Subject already exists.');
    gc.subjects.push(val);
    this.render();
  }

  deleteSubject(index) {
    const gc = window.globalConfig;
    gc.subjects.splice(index, 1);
    this.render();
  }

  addPeriod() {
    const gc = window.globalConfig;
    if (!gc.periods) gc.periods = [];
    const n = gc.periods.length + 1;
    gc.periods.push({ label: String(n), slot: String(n), start: '09:00', end: '10:00' });
    this.render();
  }

  deletePeriod(index) {
    const gc = window.globalConfig;
    gc.periods.splice(index, 1);
    // keep each day's timetable entries aligned with the removed period index
    if (gc.timetable) {
      Object.keys(gc.timetable).forEach(day => {
        if (Array.isArray(gc.timetable[day])) gc.timetable[day].splice(index, 1);
      });
    }
    this.render();
  }

  addSyllabusSubject() {
    const gc = window.globalConfig;
    if (!gc.syllabus) gc.syllabus = [];
    gc.syllabus.push({ subject: '', units: [] });
    this.render();
  }

  deleteSyllabusSubject(index) {
    const gc = window.globalConfig;
    gc.syllabus.splice(index, 1);
    this.render();
  }

  addSyllabusUnit(subjectIndex) {
    this._syncUI();
    const gc = window.globalConfig;
    if (!gc.syllabus[subjectIndex].units) gc.syllabus[subjectIndex].units = [];
    gc.syllabus[subjectIndex].units.push({ title: '', desc: '' });
    this.render();
  }

  deleteSyllabusUnit(subjectIndex, unitIndex) {
    this._syncUI();
    const gc = window.globalConfig;
    gc.syllabus[subjectIndex].units.splice(unitIndex, 1);
    this.render();
  }

  _syncUI() {
      const gc = window.globalConfig || {};

      const c1 = document.getElementById('confCollege');
      const c2 = document.getElementById('confLocation');
      const c3 = document.getElementById('confSection');
      const c4 = document.getElementById('confYear');
      if(c1) gc.collegeName = c1.value;
      if(c2) gc.location = c2.value;
      if(c3) gc.sectionName = c3.value;
      if(c4) gc.year = c4.value;

      const offDays = [];
      for (let i = 0; i < 7; i++) {
          const cb = document.getElementById('offDay_' + i);
          if (cb && cb.checked) offDays.push(i);
      }
      gc.offDays = offDays;

      if (gc.holidays) {
          for (let i = 0; i < gc.holidays.length; i++) {
              const nameInput = document.getElementById('holidayName_' + i);
              const dateInput = document.getElementById('holidayDate_' + i);
              if (nameInput) gc.holidays[i].name = nameInput.value;
              if (dateInput) {
                  gc.holidays[i].date = dateInput.value;
                  const d = new Date(gc.holidays[i].date);
                  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                  if (!isNaN(d)) gc.holidays[i].day = days[d.getDay()];
              }
          }
      }

      if (gc.periods) {
          for (let i = 0; i < gc.periods.length; i++) {
              const labelInput = document.getElementById('pdLabel_' + i);
              const startInput = document.getElementById('pdStart_' + i);
              const endInput = document.getElementById('pdEnd_' + i);
              if (labelInput) { gc.periods[i].label = labelInput.value; gc.periods[i].slot = labelInput.value; }
              if (startInput) gc.periods[i].start = startInput.value;
              if (endInput) gc.periods[i].end = endInput.value;
          }
      }

      if (gc.timetable && gc.timetable[this.ttDay] && gc.periods) {
          for (let i = 0; i < gc.periods.length; i++) {
              const teacherInput = document.getElementById('ttTeacher_' + i);
              if (teacherInput) {
                  if (!gc.timetable[this.ttDay][i]) gc.timetable[this.ttDay][i] = { sub: '', teacher: '' };
                  gc.timetable[this.ttDay][i].teacher = teacherInput.value;
              }
          }
      }

      if (gc.syllabus) {
          for (let si = 0; si < gc.syllabus.length; si++) {
              const subjInput = document.getElementById('sylSubject_' + si);
              if (subjInput) gc.syllabus[si].subject = subjInput.value;
              const units = gc.syllabus[si].units || [];
              for (let ui = 0; ui < units.length; ui++) {
                  const titleInput = document.getElementById(`sylUnitTitle_${si}_${ui}`);
                  const descInput = document.getElementById(`sylUnitDesc_${si}_${ui}`);
                  if (titleInput) units[ui].title = titleInput.value;
                  if (descInput) units[ui].desc = descInput.value;
              }
          }
      }
  }

  addHoliday() {
      this._syncUI();
      if (!window.globalConfig.holidays) window.globalConfig.holidays = [];
      window.globalConfig.holidays.push({ name: 'New Holiday', date: '2026-01-01', day: 'Monday' });
      this.render();
  }

  deleteHoliday(index) {
      this._syncUI();
      window.globalConfig.holidays.splice(index, 1);
      this.render();
  }

  swapHoliday(index, direction) {
      this._syncUI();
      const arr = window.globalConfig.holidays;
      const target = index + direction;
      if (target >= 0 && target < arr.length) {
          const temp = arr[index];
          arr[index] = arr[target];
          arr[target] = temp;
          this.render();
      }
  }

  async saveConfig() {
      try {
          this._syncUI();
          const gc = window.globalConfig || {};

          const res = await fetchWithAuth('/config', {
              method: 'PUT',
              body: JSON.stringify(gc)
          });

          if (res.ok) {
              alert('Configuration saved successfully. Reloading...');
              window.location.reload();
          } else {
              alert('Failed to save config.');
          }
      } catch (e) {
          alert('Error saving configuration.');
      }
  }

  async addStudent() {
      const username = document.getElementById('newStudentUsername').value;
      const password = document.getElementById('newStudentPassword').value;
      if (!username || !password) return alert('Username and Password are required.');

      try {
          const res = await fetchWithAuth('/auth/users', {
              method: 'POST',
              body: JSON.stringify({ username, password, role: 'student' })
          });

          if (res.ok) {
              alert('Student added successfully.');
              await this.onShow(); // Refresh data
          } else {
              const err = await res.json();
              alert(err.message || 'Failed to add student.');
          }
      } catch (e) {
          alert('Error adding student.');
      }
  }

  async deleteStudent(id) {
      if (!confirm('Are you sure you want to delete this student?')) return;

      try {
          const res = await fetchWithAuth(`/auth/users/${id}`, {
              method: 'DELETE'
          });
          if (res.ok) {
              alert('Student deleted.');
              await this.onShow();
          } else {
              alert('Failed to delete student.');
          }
      } catch (e) {
          alert('Error deleting student.');
      }
  }
}
