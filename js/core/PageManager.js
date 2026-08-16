export class PageManager {
  constructor() {
    this.pages = {};
    this.activePage = null;
  }

  registerPage(name, moduleInstance) {
    this.pages[name] = moduleInstance;
  }

  showPage(name) {
    if (this.activePage && this.activePage.onHide) {
      this.activePage.onHide();
    }

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));

    const pageElement = document.getElementById(`page-${name}`);
    if (pageElement) {
      pageElement.classList.add('active');
      pageElement.classList.add('fadeIn');
    }

    const tabElement = document.querySelector(`.tab[data-target="${name}"]`);
    if (tabElement) {
      tabElement.classList.add('active');
    }

    this.activePage = this.pages[name];
    if (this.activePage && this.activePage.onShow) {
      this.activePage.onShow();
    }
  }
}
