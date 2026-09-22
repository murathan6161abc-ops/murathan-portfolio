const year = document.getElementById('year');
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');
const navAnchors = document.querySelectorAll('.nav-links a[href^="#"]');
const sections = document.querySelectorAll('main section[id]');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

if (year) {
  year.textContent = new Date().getFullYear();
}

if (!prefersReducedMotion.matches) {
  document.documentElement.classList.add('motion-ready');

  const revealGroups = [
    document.querySelectorAll('.section-kicker, .section-title, .section-heading > p'),
    document.querySelectorAll('.about-layout, .skills, .interest-strip'),
    document.querySelectorAll('.project-card'),
    document.querySelectorAll('.focus-item'),
    document.querySelectorAll('.contact-layout > *'),
  ];

  revealGroups.forEach((group) => {
    group.forEach((element, index) => {
      element.classList.add('reveal');
      element.style.setProperty('--reveal-delay', `${Math.min(index * 90, 270)}ms`);
    });
  });

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8%' });

    document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));
  } else {
    document.querySelectorAll('.reveal').forEach((element) => element.classList.add('is-visible'));
  }
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

const hero = document.querySelector('.hero');

if (hero && !prefersReducedMotion.matches) {
  hero.addEventListener('pointermove', (event) => {
    const rect = hero.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    hero.style.setProperty('--spot-x', `${x}%`);
    hero.style.setProperty('--spot-y', `${y}%`);
  });
}

const SUPABASE_URL = 'https://ecdepmneetjbwrzsgbvi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjZGVwbW5lZXRqYndyenNnYnZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwOTY3NzAsImV4cCI6MjEwNTY3Mjc3MH0._qPx7yCPQo1yGk8xmW2ezKpDKiksouiO434YBdQKf7M';

const commentForm = document.getElementById('commentForm');
const commentList = document.getElementById('commentList');
const commentStatus = document.getElementById('commentStatus');

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));
}

function formatCommentDate(isoString) {
  return new Date(isoString).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function renderComments(comments) {
  if (!commentList) return;

  if (comments.length === 0) {
    commentList.innerHTML = '<li class="comment-empty">Henüz yorum yok, ilk yorumu sen bırak.</li>';
    return;
  }

  commentList.innerHTML = comments.map((comment) => `
    <li class="comment-item">
      <div class="comment-item-head">
        <span class="comment-author">${escapeHtml(comment.username)}</span>
        <span class="comment-date">${formatCommentDate(comment.created_at)}</span>
      </div>
      <p class="comment-message">${escapeHtml(comment.message)}</p>
    </li>
  `).join('');
}

async function loadComments() {
  if (!commentList) return;
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/comments?select=username,message,created_at&order=created_at.desc`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    });
    if (!response.ok) throw new Error('load-failed');
    renderComments(await response.json());
  } catch (error) {
    commentList.innerHTML = '<li class="comment-empty">Yorumlar yüklenemedi, sayfayı yenilemeyi dene.</li>';
  }
}

if (commentForm && commentStatus) {
  loadComments();

  commentForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submitButton = commentForm.querySelector('button[type="submit"]');
    const username = document.getElementById('commentUsername').value.trim();
    const message = document.getElementById('commentMessage').value.trim();

    if (!username || !message) return;

    submitButton.disabled = true;
    commentStatus.textContent = 'Gönderiliyor...';

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/comments`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({ username, message }),
      });

      if (!response.ok) throw new Error('submit-failed');

      commentStatus.textContent = 'Yorumun eklendi, teşekkürler!';
      commentForm.reset();
      loadComments();
    } catch (error) {
      commentStatus.textContent = 'Yorum gönderilemedi, tekrar dener misin?';
    } finally {
      submitButton.disabled = false;
    }
  });
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

      formStatus.textContent = 'Mesajın için teşekkürler! En kısa sürede dönüş yapacağım.';
      contactForm.reset();
    } catch (error) {
      formStatus.textContent = 'Bir şeyler ters gitti. Doğrudan murathan6161abc@gmail.com adresine yazabilirsin.';
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
