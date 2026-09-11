/**
 * GERALD HOLDINGS MEDICAL DIAGNOSTIC IMAGING — SPA CLIENT-SIDE ROUTER
 * Seamless page transitions, dynamic content loading, and state management
 */

class SPARouter {
  constructor() {
    this.contentArea = document.getElementById('main-content-wrapper');
    this.loader = document.getElementById('global-page-loader');
    this.initListeners();
    this.handleRoute(window.location.pathname);
  }

  initListeners() {
    document.body.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (link && link.getAttribute('href')) {
        const href = link.getAttribute('href');
        if (!href.startsWith('http') && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:') && !link.hasAttribute('download')) {
          e.preventDefault();
          this.navigateTo(href);
        }
      }
    });

    window.addEventListener('popstate', () => {
      this.handleRoute(window.location.pathname);
    });
  }

  async navigateTo(url) {
    window.history.pushState(null, null, url);
    await this.handleRoute(url);
  }

  async handleRoute(url) {
    this.showLoader(true);
    try {
      let pagePath = url;
      if (pagePath === '/' || pagePath === '' || pagePath.endsWith('/')) {
        pagePath = 'index.html';
      } else {
        if (pagePath.startsWith('/')) {
          pagePath = pagePath.substring(1);
        }
      }

      const response = await fetch(pagePath);
      if (!response.ok) throw new Error('Page not found');
      
      const rawHtml = await response.text();
      const parser = new DOMParser();
      const newDoc = parser.parseFromString(rawHtml, 'text/html');

      const newContent = newDoc.getElementById('main-content-wrapper');
      if (newContent && this.contentArea) {
        this.contentArea.innerHTML = newContent.innerHTML;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }

      document.title = newDoc.title;
      const newDesc = newDoc.querySelector('meta[name="description"]');
      const currentDesc = document.querySelector('meta[name="description"]');
      if (newDesc && currentDesc) {
        currentDesc.setAttribute('content', newDesc.getAttribute('content'));
      }

      this.reinitializeDynamicComponents();

    } catch (error) {
      console.error('SPA Route handling failed:', error);
      window.location.href = url;
    } finally {
      this.showLoader(false);
    }
  }

  showLoader(show) {
    if (!this.loader) {
      this.loader = document.getElementById('global-page-loader');
    }
    if (this.loader) {
      if (show) {
        this.loader.classList.remove('hidden');
        setTimeout(() => this.loader.classList.add('opacity-100'), 10);
      } else {
        this.loader.classList.remove('opacity-100');
        setTimeout(() => this.loader.classList.add('hidden'), 300);
      }
    }
  }

  reinitializeDynamicComponents() {
    if (typeof initNavbar === 'function') initNavbar();
    if (typeof initDarkMode === 'function') initDarkMode();
    if (typeof initModals === 'function') initModals();
    if (typeof initScrollReveal === 'function') initScrollReveal();
    if (typeof initAnatomyExplorer === 'function') initAnatomyExplorer();
    if (typeof initTechShowcase === 'function') initTechShowcase();
    if (typeof initComparisonSliders === 'function') initComparisonSliders();
    if (typeof initDicomViewer === 'function') initDicomViewer();
    if (typeof initPatientChat === 'function') initPatientChat();

    const savedLang = localStorage.getItem('gerald_lang') || 'en';
    if (typeof applyLanguage === 'function') {
      applyLanguage(savedLang);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.appRouter = new SPARouter();
});
