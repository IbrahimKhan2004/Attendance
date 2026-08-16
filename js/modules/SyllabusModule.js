import { SYLLABUS_DATA } from '../data/syllabusData.js';

export class SyllabusModule {
  constructor() {
    this.containerId = 'syllabusContainer';
  }

  onShow() {
    this.render();
    this.attachListeners();
  }

  render() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    const html = SYLLABUS_DATA.map((subject, index) => {
      const unitsHtml = subject.units.map(u => `
        <div style="padding: 1rem; border-bottom: 1px solid var(--border);">
          <div style="font-size: 0.85rem; font-weight: 600; color: var(--accent); margin-bottom: 4px;">${u.title}</div>
          <div style="font-size: 0.85rem; color: var(--muted); line-height: 1.4;">${u.desc}</div>
        </div>
      `).join('');

      return `
        <div class="ios-list" style="margin-bottom: 1rem;">
          <div class="syl-header ios-list-item" data-index="${index}" style="display:flex; justify-content:space-between; font-weight:600; cursor:pointer;">
            ${subject.subject}
            <span class="icon" style="transition: transform 0.3s;">▼</span>
          </div>
          <div class="syl-content" id="syl-content-${index}" style="display:none; background: var(--card);">
            ${unitsHtml}
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = html;
  }

  attachListeners() {
    document.querySelectorAll('.syl-header').forEach(header => {
      header.addEventListener('click', (e) => {
        const idx = e.currentTarget.getAttribute('data-index');
        const content = document.getElementById(`syl-content-${idx}`);
        const icon = e.currentTarget.querySelector('.icon');

        if (content.style.display === 'none') {
          content.style.display = 'block';
          icon.style.transform = 'rotate(180deg)';
        } else {
          content.style.display = 'none';
          icon.style.transform = 'rotate(0deg)';
        }
      });
    });
  }
}
