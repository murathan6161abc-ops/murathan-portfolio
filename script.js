const year = document.getElementById('year');
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');
const navAnchors = document.querySelectorAll('.nav-links a[href^="#"]');
const sections = document.querySelectorAll('main section[id]');

if (year) {
  year.textContent = new Date().getFullYear();
}

if ('IntersectionObserver' in window && sections.length > 0) {
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      navAnchors.forEach((link) => {
        const isActive = link.getAttribute('href') === `#${entry.target.id}`;
        link.classList.toggle('active', isActive);
        if (isActive) {
          link.setAttribute('aria-current', 'page');
        } else {
          link.removeAttribute('aria-current');
        }
      });
    });
  }, { rootMargin: '-35% 0px -55%' });

  sections.forEach((section) => sectionObserver.observe(section));
}

if (menuToggle && navLinks) {
  menuToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Menüyü kapat' : 'Menüyü aç');
  });

  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Menüyü aç');
    });
  });
}
