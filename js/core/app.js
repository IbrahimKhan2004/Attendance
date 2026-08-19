import { checkAuth } from './auth.js';
import { fetchWithAuth } from './api.js';
import { PageManager } from './PageManager.js';
import { ClockModule } from '../modules/ClockModule.js';
import { TimetableModule } from '../modules/TimetableModule.js';
import { HolidaysModule } from '../modules/HolidaysModule.js';
import { AttendanceModule } from '../modules/AttendanceModule.js';
import { SyllabusModule } from '../modules/SyllabusModule.js';
import { AdminModule } from '../modules/AdminModule.js';
import { ProfileModule } from '../modules/ProfileModule.js';

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

  // Register Profile Module globally so header can access it
  window.pageManager = pageManager;
  window.goToProfile = () => {
    pageManager.showPage('profile');

    // Hide ended overlay if it's visible, so they can see profile
    const overlay = document.getElementById('semesterEndedOverlay');
    if (overlay) overlay.style.display = 'none';
  };

  // Register pages
  pageManager.registerPage('timetable', new TimetableModule());
  pageManager.registerPage('holidays', new HolidaysModule());
  pageManager.registerPage('attendance', new AttendanceModule());
  pageManager.registerPage('syllabus', new SyllabusModule());
  pageManager.registerPage('profile', new ProfileModule());

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

  // Check semester status before showing app content for students
  if (user.role === 'student') {
    try {
      const activeRes = await fetchWithAuth('/semester/active');
      let activeSemester = activeRes.ok ? await activeRes.json() : null;

      if (!activeSemester || activeSemester.status !== 'active') {
        // No active semester, fetch history to find the last ended one
        const historyRes = await fetchWithAuth('/semester/history');
        const history = historyRes.ok ? await historyRes.json() : [];
        const lastSemester = history.length > 0 ? history[0] : null;

        const overlay = document.getElementById('semesterEndedOverlay');
        if (overlay) {
          overlay.style.display = 'flex';

          if (lastSemester) {
             document.getElementById('semesterEndedMsg').innerText = `The ${lastSemester.sectionName} semester has officially concluded. See you in the next one!`;
             document.getElementById('semesterEndedStats').innerText = lastSemester.percentage || '--%';
          }
        }
      }
    } catch (e) {
      console.error('Failed to check semester status', e);
    }
  }

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
