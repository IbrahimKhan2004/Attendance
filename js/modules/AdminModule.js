import { fetchWithAuth } from '../core/api.js';

export class AdminModule {
  constructor() {
    this.container = document.getElementById('adminContainer');
    this.users = [];
    this.allAttendance = [];
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
    const offDays = gc.offDays || [];
    const holidays = gc.holidays || [];

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
                <input type="checkbox" id="offDay_${i}" value="${i}" ${offDays.includes(i) ? 'checked' : ''}>
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
          <h4>Advanced Settings (JSON)</h4>
          <p style="font-size:0.8rem; color:var(--muted); margin-bottom:0.5rem;">Use this to configure Syllabus, Timetable and Subjects</p>
          <textarea id="configJson" style="width: 100%; height: 150px; background: var(--bg); color: white; border: 1px solid var(--border); padding: 0.5rem; font-family: monospace;">${JSON.stringify({timetable: gc.timetable, periods: gc.periods, subjects: gc.subjects, syllabus: gc.syllabus}, null, 2)}</textarea>
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

      const txt = document.getElementById('configJson');
      if (txt) {
          try {
              const advJson = JSON.parse(txt.value);
              gc.timetable = advJson.timetable;
              gc.periods = advJson.periods;
              gc.subjects = advJson.subjects;
              gc.syllabus = advJson.syllabus;
          } catch(e) {}
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
          alert('Invalid JSON in Advanced Settings format.');
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
