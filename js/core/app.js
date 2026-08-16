import { PageManager } from './PageManager.js';
import { ClockModule } from '../modules/ClockModule.js';
import { TimetableModule } from '../modules/TimetableModule.js';
import { HolidaysModule } from '../modules/HolidaysModule.js';
import { AttendanceModule } from '../modules/AttendanceModule.js';
import { SyllabusModule } from '../modules/SyllabusModule.js';

document.addEventListener('DOMContentLoaded', () => {
  const pageManager = new PageManager();
  const clockModule = new ClockModule();

  // Register pages
  pageManager.registerPage('timetable', new TimetableModule());
  pageManager.registerPage('holidays', new HolidaysModule());
  pageManager.registerPage('attendance', new AttendanceModule());
  pageManager.registerPage('syllabus', new SyllabusModule());

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
