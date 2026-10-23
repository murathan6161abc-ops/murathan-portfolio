const year = document.getElementById('year');
const navbar = document.getElementById('navbar');
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');
const navAnchors = document.querySelectorAll('.nav-links a[href^="#"]');
const sections = document.querySelectorAll('main section[id]');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (year) {
  year.textContent = new Date().getFullYear();
}

requestAnimationFrame(() => document.documentElement.classList.add('loaded'));

// Split the about statement into words so they can light up while scrolling
const statement = document.getElementById('statement');
const accentWords = ['prototipe', 'test', 'dokümante'];
let statementWords = [];

if (statement) {
  const words = statement.textContent.trim().split(/\s+/);
  statement.innerHTML = words.map((word) => {
    const accent = accentWords.some((a) => word.toLowerCase().startsWith(a)) ? ' accent' : '';
    return `<span class="w${accent}">${word}</span>`;
  }).join(' ');
  statementWords = [...statement.querySelectorAll('.w')];
  if (prefersReducedMotion) statementWords.forEach((w) => w.classList.add('on'));
}

const scrollProgress = document.getElementById('scrollProgress');
const parallaxItems = document.querySelectorAll('[data-parallax]');
const marqueeTracks = [...document.querySelectorAll('.marquee-track')];
const projectCards = [...document.querySelectorAll('.project-card')];
const marqueeOffsets = marqueeTracks.map(() => 0);
let lastScroll = window.scrollY;
let velocity = 0;

function updateOnScroll() {
  const scrollTop = window.scrollY;
  const vh = window.innerHeight;

  if (scrollProgress) {
    const docHeight = document.documentElement.scrollHeight - vh;
    scrollProgress.style.transform = `scaleX(${docHeight > 0 ? scrollTop / docHeight : 0})`;
  }

  if (navbar) navbar.classList.toggle('scrolled', scrollTop > 30);

  if (prefersReducedMotion) return;

  parallaxItems.forEach((el) => {
    el.style.translate = `0 ${scrollTop * parseFloat(el.dataset.parallax)}px`;
  });

  if (statementWords.length) {
    const rect = statement.getBoundingClientRect();
    const progress = Math.min(Math.max((vh * 0.85 - rect.top) / (rect.height + vh * 0.35), 0), 1);
    const lit = Math.round(progress * statementWords.length);
    statementWords.forEach((w, i) => w.classList.toggle('on', i < lit));
  }

  // Each stacked project card shrinks and dims as the next one slides over it
  projectCards.forEach((card, i) => {
    const next = projectCards[i + 1];
    if (!next) return;
    const cardTop = card.getBoundingClientRect().top;
    const nextTop = next.getBoundingClientRect().top;
    const overlap = Math.min(Math.max(1 - (nextTop - cardTop) / card.offsetHeight, 0), 1);
    card.style.transform = `scale(${1 - overlap * 0.06})`;
    card.style.filter = `brightness(${1 - overlap * 0.25})`;
  });
}

function marqueeLoop() {
  const scrollTop = window.scrollY;
  velocity = velocity * 0.9 + (scrollTop - lastScroll) * 0.1;
  lastScroll = scrollTop;

  marqueeTracks.forEach((track, i) => {
    const dir = Number(track.dataset.dir);
    marqueeOffsets[i] += dir * (0.6 + Math.min(Math.abs(velocity) * 0.5, 12));
    const half = track.scrollWidth / 2;
    if (marqueeOffsets[i] <= -half) marqueeOffsets[i] += half;
    if (marqueeOffsets[i] > 0) marqueeOffsets[i] -= half;
    track.style.transform = `translateX(${marqueeOffsets[i]}px)`;
  });

  requestAnimationFrame(marqueeLoop);
}

let scrollTicking = false;
window.addEventListener('scroll', () => {
  if (!scrollTicking) {
    requestAnimationFrame(() => {
      updateOnScroll();
      scrollTicking = false;
    });
    scrollTicking = true;
  }
}, { passive: true });

window.addEventListener('resize', updateOnScroll);
updateOnScroll();

if (!prefersReducedMotion) {
  marqueeLoop();
}

function animateCount(el) {
  const target = Number(el.dataset.count);
  const start = performance.now();
  const duration = 1400;
  const tick = (now) => {
    const t = Math.min((now - start) / duration, 1);
    el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3)));
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

const counters = document.querySelectorAll('[data-count]');
const chartArt = document.querySelector('.art-chart');

if (prefersReducedMotion || !('IntersectionObserver' in window)) {
  counters.forEach((el) => { el.textContent = el.dataset.count; });
  if (chartArt) chartArt.classList.add('is-drawn');
} else {
  document.documentElement.classList.add('motion');

  // Stagger siblings that reveal together
  const groups = new Map();
  document.querySelectorAll('[data-reveal]').forEach((el) => {
    const siblings = groups.get(el.parentElement) || [];
    el.style.setProperty('--rd', `${Math.min(siblings.length * 90, 360)}ms`);
    siblings.push(el);
    groups.set(el.parentElement, siblings);
  });

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      entry.target.querySelectorAll('[data-count]').forEach(animateCount);
      if (entry.target === chartArt) chartArt.classList.add('is-drawn');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -6%' });

  document.querySelectorAll('[data-reveal], .contact .hl').forEach((el) => revealObserver.observe(el));
  if (chartArt) revealObserver.observe(chartArt);
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

const contactForm = document.getElementById('contactForm');
const formStatus = document.getElementById('formStatus');

if (contactForm && formStatus) {
  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submitButton = contactForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    formStatus.textContent = 'Gönderiliyor...';

    try {
      const response = await fetch(`https://formsubmit.co/ajax/${contactForm.action.split('/').pop()}`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(contactForm),
      });

      if (!response.ok) throw new Error('request-failed');

      formStatus.textContent = 'Mesajınız için teşekkürler! En kısa sürede dönüş yapacağım.';
      contactForm.reset();
    } catch (error) {
      formStatus.textContent = 'Bir şeyler ters gitti. Doğrudan murathan6161abc@gmail.com adresine yazabilirsiniz.';
    } finally {
      submitButton.disabled = false;
    }
  });
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
