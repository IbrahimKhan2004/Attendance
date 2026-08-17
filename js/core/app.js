import { checkAuth } from './auth.js';
import { fetchWithAuth } from './api.js';
import { PageManager } from './PageManager.js';
import { ClockModule } from '../modules/ClockModule.js';
import { TimetableModule } from '../modules/TimetableModule.js';
import { HolidaysModule } from '../modules/HolidaysModule.js';
import { AttendanceModule } from '../modules/AttendanceModule.js';
import { SyllabusModule } from '../modules/SyllabusModule.js';
import { AdminModule } from '../modules/AdminModule.js';

window.globalConfig = {};

document.addEventListener('DOMContentLoaded', async () => {
  const user = checkAuth();
  if (!user) return; // Stop initialization if not logged in

  // Fetch global config
  try {
      const configRes = await fetchWithAuth('/config');
      if (configRes.ok) {
          window.globalConfig = await configRes.json();
      }
  } catch (e) {
      console.error("Failed to load global config:", e);
  }

  // Update Header
  document.getElementById('headerCollegeName').innerText = window.globalConfig.collegeName || 'College Name';
  document.getElementById('headerSectionName').innerText = `${window.globalConfig.location || ''} • ${window.globalConfig.sectionName || ''} • ${window.globalConfig.year || ''}`;

  const pageManager = new PageManager();
  const clockModule = new ClockModule();

  // Register pages
  pageManager.registerPage('timetable', new TimetableModule());
  pageManager.registerPage('holidays', new HolidaysModule());
  pageManager.registerPage('attendance', new AttendanceModule());
  pageManager.registerPage('syllabus', new SyllabusModule());

  if (user.role === 'admin') {
      const tabNav = document.getElementById('tabNav');
      const adminBtn = document.createElement('button');
      adminBtn.className = 'tab';
      adminBtn.setAttribute('data-target', 'admin');
      adminBtn.innerText = 'Admin';
      tabNav.appendChild(adminBtn);

      pageManager.registerPage('admin', new AdminModule());
  }

  // Setup tab navigation
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      const target = e.currentTarget.getAttribute('data-target');
      pageManager.showPage(target);
    });
  });

  // Start initial modules
  clockModule.init();
  pageManager.showPage('timetable'); // default tab

  // Re-render the active page periodically (e.g. every minute) to keep current periods updated
  setInterval(() => {
    if (pageManager.activePage && pageManager.activePage.render) {
      pageManager.activePage.render();
    }
  }, 60000);
});
