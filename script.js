// ===== script.js =====
(function() {
  'use strict';

  // Replace with the salon's real WhatsApp number (country code, no + or spaces)
  const WHATSAPP_NUMBER = '919876543210';

  const navLinks = document.querySelectorAll('nav a');
  const header = document.querySelector('header');
  const exploreBtn = document.getElementById('exploreBtn');
  const bookBtn = document.getElementById('bookApptBtn');
  const bookBtn2 = document.getElementById('bookApptBtn2');
  const whatsappBtn = document.getElementById('whatsappBtn');
  const sections = document.querySelectorAll('.section-anchor');
  const priceRows = document.querySelectorAll('.price-row');
  const enquiryForm = document.getElementById('enquiryForm');
  const enquiryTimeInput = document.getElementById('enquiryTime');

  const SALON_OPEN_MINUTES = 9 * 60;   // 9:00 AM
  const SALON_CLOSE_MINUTES = 21 * 60; // 9:00 PM

  /**
   * Convert a 24-hour "HH:MM" string into a 12-hour "h:MM AM/PM" string.
   * @param {string} time24 - e.g. "14:30"
   * @returns {string} e.g. "2:30 PM"
   */
  function formatTimeTo12Hour(time24) {
    const [hoursStr, minutesStr] = time24.split(':');
    let hours = parseInt(hoursStr, 10);
    const minutes = minutesStr;
    const period = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    if (hours === 0) hours = 12;
    return `${hours}:${minutes} ${period}`;
  }

  /**
   * Total minutes since midnight for a "HH:MM" string.
   * @param {string} time24
   */
  function timeToMinutes(time24) {
    const [h, m] = time24.split(':').map(Number);
    return h * 60 + m;
  }

  /**
   * Open WhatsApp (app on mobile, web.whatsapp.com on desktop) with a pre-filled message.
   * @param {string} message
   */
  function openWhatsApp(message) {
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener');
  }

  /**
   * Jump to a section by id, accounting for the sticky header height,
   * then play a reveal animation on that section's content.
   * @param {string} id - section id (without '#')
   */
  function scrollToSection(id) {
    const target = document.getElementById(id);
    if (!target) return;

    const headerHeight = header ? header.offsetHeight : 0;
    const targetTop = target.getBoundingClientRect().top + window.pageYOffset;
    const offset = 24; // small breathing room below the header
    const destination = Math.max(targetTop - headerHeight - offset, 0);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({
      top: destination,
      left: 0,
      behavior: prefersReducedMotion ? 'auto' : 'smooth'
    });
    playSectionAnimation(target);
  }

  /**
   * Trigger a section's entrance animation by toggling a CSS class.
   * Restarts cleanly even on rapid repeat nav clicks to the same section.
   * @param {HTMLElement} section
   */
  function playSectionAnimation(section) {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    if (section._navAnimTimeout) clearTimeout(section._navAnimTimeout);

    section.classList.remove('nav-animate');
    // Force reflow so the animation restarts even if the class was just removed
    void section.offsetWidth;
    section.classList.add('nav-animate');

    // Matches the longest animation-duration + stagger delay set in CSS (~0.84s)
    section._navAnimTimeout = setTimeout(() => {
      section.classList.remove('nav-animate');
    }, 900);
  }

  /**
   * Mark the given page id as active in the nav.
   * @param {string} pageId
   */
  function setActiveNav(pageId) {
    navLinks.forEach(link => {
      link.classList.toggle('active', link.dataset.page === pageId);
    });
  }

  // --- 1. NAV links: smooth scroll to their section ---
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const page = this.dataset.page;
      if (page) {
        scrollToSection(page);
        setActiveNav(page);
      }
    });
  });

  // --- 1b. Footer quick links: same smooth scroll behavior as the main nav ---
  const footerLinks = document.querySelectorAll('.footer-link');
  footerLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const page = this.dataset.page;
      if (page) {
        scrollToSection(page);
        setActiveNav(page);
      }
    });
  });

  // --- 2. Explore Services button -> scroll to services section ---
  if (exploreBtn) {
    exploreBtn.addEventListener('click', function(e) {
      e.preventDefault();
      scrollToSection('services');
      setActiveNav('services');
    });
  }

  // --- 3. Book Appointment / Enquire Now buttons (header + contact section) -> scroll to contact ---
  [bookBtn, bookBtn2].forEach(btn => {
    if (btn) {
      btn.addEventListener('click', function() {
        scrollToSection('contact');
        setActiveNav('contact');
      });
    }
  });

  // --- 4. WhatsApp float button -> opens a chat with a general enquiry ---
  if (whatsappBtn) {
    whatsappBtn.addEventListener('click', function(e) {
      e.preventDefault();
      openWhatsApp("Hi Amigos! I'd like to know more about your services.");
    });
  }

  // --- 4b. Price menu rows -> tapping a service opens WhatsApp with that service filled in ---
  priceRows.forEach(row => {
    row.setAttribute('role', 'button');
    row.setAttribute('tabindex', '0');

    function enquire() {
      const service = row.dataset.service || row.querySelector('.price-row-name').textContent.trim();
      const price = row.dataset.price ? ` (${row.dataset.price})` : '';
      openWhatsApp(`Hi Amigos! I'd like to enquire about *${service}*${price}.`);
    }

    row.addEventListener('click', enquire);
    row.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        enquire();
      }
    });
  });

  // --- 4c. Enquiry form -> compiles details and sends via WhatsApp ---
  if (enquiryForm) {
    // Live-validate the time as the person picks it, so they get instant feedback
    if (enquiryTimeInput) {
      enquiryTimeInput.addEventListener('input', function() {
        if (!enquiryTimeInput.value) {
          enquiryTimeInput.setCustomValidity('');
          return;
        }
        const minutes = timeToMinutes(enquiryTimeInput.value);
        if (minutes < SALON_OPEN_MINUTES || minutes > SALON_CLOSE_MINUTES) {
          enquiryTimeInput.setCustomValidity('Please choose a time between 9:00 AM and 9:00 PM.');
        } else {
          enquiryTimeInput.setCustomValidity('');
        }
      });
    }

    enquiryForm.addEventListener('submit', function(e) {
      e.preventDefault();

      const name = enquiryForm.name.value.trim();
      const phone = enquiryForm.phone.value.trim();
      const service = enquiryForm.service.value;
      const date = enquiryForm.date.value;
      const time = enquiryForm.time.value;
      const notes = enquiryForm.notes.value.trim();

      if (!name || !phone || !service) {
        enquiryForm.reportValidity();
        return;
      }

      if (time) {
        const minutes = timeToMinutes(time);
        if (minutes < SALON_OPEN_MINUTES || minutes > SALON_CLOSE_MINUTES) {
          enquiryTimeInput.setCustomValidity('Please choose a time between 9:00 AM and 9:00 PM.');
          enquiryForm.reportValidity();
          return;
        }
      }

      let message = `Hi Amigos! I'd like to send an enquiry.\n\n`;
      message += `Name: ${name}\n`;
      message += `Phone: ${phone}\n`;
      message += `Service: ${service}\n`;
      if (date) message += `Preferred Date: ${date}\n`;
      if (time) message += `Preferred Time: ${formatTimeTo12Hour(time)}\n`;
      if (notes) message += `Notes: ${notes}\n`;

      openWhatsApp(message);
    });
  }

  // --- 5. Scrollspy: highlight the nav link for whichever section is in view ---
  if ('IntersectionObserver' in window && sections.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveNav(entry.target.id);
        }
      });
    }, {
      root: null,
      rootMargin: `-${(header ? header.offsetHeight : 0) + 40}px 0px -60% 0px`,
      threshold: 0
    });

    sections.forEach(section => observer.observe(section));
  }

  // --- 5b. Scroll-reveal: fade + rise each section in the first time it's scrolled into view ---
  const prefersReducedMotionGlobal = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if ('IntersectionObserver' in window && sections.length && !prefersReducedMotionGlobal) {
    sections.forEach(section => section.classList.add('scroll-reveal'));

    const revealObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, {
      root: null,
      rootMargin: '0px 0px -10% 0px',
      threshold: 0.1
    });

    sections.forEach(section => revealObserver.observe(section));
  }

  // --- 6. Handle direct links / reloads with a hash in the URL ---
  window.addEventListener('load', function() {
    if (window.location.hash) {
      const id = window.location.hash.substring(1);
      setTimeout(() => {
        scrollToSection(id);
        setActiveNav(id);
      }, 0);
    } else {
      setActiveNav('home');
    }
  });

})();