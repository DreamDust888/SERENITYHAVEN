/*
 * SERENITY HAVEN RESORT & SPA
 * Main Website Controller (Hero Parallax, Counter Stats, Room Filters, Gallery Lightbox, Form Submissions)
 */

// Mock Database of Accommodations
const ROOMS_DATA = [
  {
    id: 'deluxe',
    name: 'Deluxe Room',
    type: 'room',
    price: 350,
    capacity: 2,
    bed: 'King Bed',
    size: '45 m²',
    popularity: 85,
    image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80',
    description: 'Elegant bedroom decorated in Amalfi limestone styles, featuring a private balcony facing our lemon groves.',
    amenities: ['Sea view', 'Balcony', 'Minibar', 'WiFi']
  },
  {
    id: 'cottage',
    name: 'Garden Cottage',
    type: 'cottage',
    price: 480,
    capacity: 2,
    bed: 'King Bed',
    size: '60 m²',
    popularity: 90,
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
    description: 'Charming stone cottage set within private olive gardens, complete with an outdoor sun shower and log fireplace.',
    amenities: ['Garden view', 'Fireplace', 'Outdoor shower', 'WiFi']
  },
  {
    id: 'suite',
    name: 'Premium Suite',
    type: 'suite',
    price: 720,
    capacity: 3,
    bed: 'King + Sofa Bed',
    size: '85 m²',
    popularity: 98,
    image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
    description: 'Spacious high-vaulted suite with a marble lounge space and a plunge pool suspended over the coastal cliffs.',
    amenities: ['Plunge pool', 'Butler', 'Pillow menu', 'Ocean view']
  },
  {
    id: 'pool-villa',
    name: 'Pool Villa',
    type: 'villa',
    price: 1100,
    capacity: 2,
    bed: 'Super King Bed',
    size: '120 m²',
    popularity: 110,
    image: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=800&q=80',
    description: 'Ultimate privacy. Includes a private 15m infinity pool, dining loggia, ocean sun deck, and a bespoke bath.',
    amenities: ['Private pool', 'Wine cellar', 'Butler', 'Sea access']
  },
  {
    id: 'family-villa',
    name: 'Family Villa',
    type: 'villa',
    price: 1550,
    capacity: 5,
    bed: '2 King Beds',
    size: '180 m²',
    popularity: 78,
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
    description: 'Spanning two floors, this villa offers multiple master bedrooms, a full chef kitchen, and private central courtyard gardens.',
    amenities: ['Private pool', '24h Chef', 'Courtyard', '5 guests']
  }
];

// Mock Gallery Images
const GALLERY_DATA = [
  { category: 'rooms', url: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80', caption: 'Deluxe Suite Lounge' },
  { category: 'dining', url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80', caption: 'Fresh Lobster Tagliolini' },
  { category: 'nature', url: 'https://images.unsplash.com/photo-1527030280862-64139fbe04ca?auto=format&fit=crop&w=800&q=80', caption: 'Amalfi Sunrise Horizon' },
  { category: 'rooms', url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80', caption: 'Pool Villa Interior' },
  { category: 'dining', url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80', caption: 'Il Belvedere Terrace Seating' },
  { category: 'nature', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', caption: 'Private Cove Shore' }
];

document.addEventListener('DOMContentLoaded', () => {
  syncAdminRoomPrices();
  setupStickyHeader();
  setupParallaxHero();
  initDateWidgetDefaults();
  initStatsCounters();
  renderRoomsGrid();
  setupRoomFilters();
  renderGalleryGrid();
  setupGalleryFilters();
  setupTestimonialSlider();
  setupFormSubmissions();
  setupOfflineDetection();
  setupMobileMenu();
});

function syncAdminRoomPrices() {
  const customPrices = JSON.parse(localStorage.getItem('resort_room_prices'));
  if (customPrices) {
    ROOMS_DATA.forEach(room => {
      if (customPrices[room.id] !== undefined) {
        room.price = parseFloat(customPrices[room.id]);
      }
    });
  }
}

/* 1. MOBILE MENU HAMBURGER */
function setupMobileMenu() {
  const toggle = document.getElementById('mobile-menu-toggle');
  const nav = document.getElementById('nav-links');
  
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = toggle.classList.toggle('open');
      nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open);
    });

    // Close menu when link is clicked
    nav.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') {
        toggle.classList.remove('open');
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }
}

/* 2. STICKY HEADER SCROLL TRANSITION */
function setupStickyHeader() {
  const header = document.getElementById('main-header');
  const scrollOffset = 50;

  window.addEventListener('scroll', () => {
    if (window.scrollY > scrollOffset) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    
    // Active navigation scroll spy
    const sections = document.querySelectorAll('section[id]');
    let currentActive = '';
    
    sections.forEach(sec => {
      const top = sec.offsetTop - 120;
      const height = sec.offsetHeight;
      if (window.scrollY >= top && window.scrollY < top + height) {
        currentActive = sec.getAttribute('id');
      }
    });
    
    if (currentActive) {
      document.querySelectorAll('#nav-links a').forEach(a => {
        a.classList.remove('active');
        if (a.getAttribute('href') === `#${currentActive}`) {
          a.classList.add('active');
        }
      });
    }
  });
}

/* 3. PARALLAX HERO BACKGROUND */
function setupParallaxHero() {
  const parallaxBg = document.getElementById('hero-parallax');
  if (parallaxBg) {
    window.addEventListener('scroll', () => {
      const scrolled = window.pageYOffset;
      // Shift image slightly slower than text scroll rate
      parallaxBg.style.transform = `translateY(${scrolled * 0.4}px) scale(1.02)`;
    });
  }
}

/* 4. DEFAULT CHECK-IN / CHECK-OUT DATES */
function initDateWidgetDefaults() {
  const checkinInput = document.getElementById('widget-checkin');
  const checkoutInput = document.getElementById('widget-checkout');

  if (checkinInput && checkoutInput) {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 3); // 3-night default stays

    checkinInput.value = tomorrow.toISOString().split('T')[0];
    checkoutInput.value = dayAfter.toISOString().split('T')[0];

    // Restrict past dates
    checkinInput.min = today.toISOString().split('T')[0];
    checkinInput.addEventListener('change', () => {
      const checkinDate = new Date(checkinInput.value);
      const minCheckout = new Date(checkinDate);
      minCheckout.setDate(minCheckout.getDate() + 1);
      checkoutInput.value = minCheckout.toISOString().split('T')[0];
      checkoutInput.min = minCheckout.toISOString().split('T')[0];
    });
  }
}

/* 5. STATS COUNTER ANIMATION */
function initStatsCounters() {
  const stats = document.querySelectorAll('.stat-number');
  const options = { threshold: 0.8, rootMargin: '0px' };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = entry.target;
        const limit = parseInt(target.dataset.target, 10);
        let count = 0;
        const increment = limit / 30; // 30 steps animation
        const timer = setInterval(() => {
          count += increment;
          if (count >= limit) {
            target.textContent = limit;
            clearInterval(timer);
          } else {
            target.textContent = Math.floor(count);
          }
        }, 30);
        observer.unobserve(target);
      }
    });
  }, options);

  stats.forEach(stat => observer.observe(stat));
}

/* 6. RENDER ROOMS SYSTEM */
let activeFilter = 'all';
let activeSort = 'popularity';

function renderRoomsGrid() {
  const grid = document.getElementById('rooms-catalog-grid');
  if (!grid) return;

  // Filter items
  let rooms = ROOMS_DATA.filter(room => {
    return activeFilter === 'all' || room.type === activeFilter;
  });

  // Sort items
  rooms.sort((a, b) => {
    if (activeSort === 'low-high') return a.price - b.price;
    if (activeSort === 'high-low') return b.price - a.price;
    return b.popularity - a.popularity; // popularity default
  });

  // Render Skeletons first if slow, or render cards immediately
  grid.innerHTML = rooms.map(room => `
    <article class="resort-card">
      <div class="card-img-wrapper">
        <img src="${room.image}" alt="${room.name}" loading="lazy">
        <span class="badge badge-emerald card-badge">$${room.price} / Night</span>
      </div>
      <div class="card-body">
        <h3 class="card-title">${room.name}</h3>
        <p class="card-text">${room.description}</p>
        
        <div class="room-specs">
          <span>
            <svg viewBox="0 0 24 24"><path d="M7 13h10v2H7zm0-3h10v2H7zm0-3h10v2H7z"/></svg>
            ${room.size}
          </span>
          <span>
            <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 16h-2v-2h2v2zm0-4h-2V7h2v7z"/></svg>
            ${room.bed}
          </span>
          <span>
            <svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
            Up to ${room.capacity} Guests
          </span>
        </div>

        <div style="margin-top: auto; display: flex; align-items: center; justify-content: space-between;">
          <div style="display:flex; gap: 4px;">
            ${room.amenities.slice(0, 3).map(a => `<span class="badge badge-gray" style="font-size: 0.7rem; padding: 2px 6px;">${a}</span>`).join('')}
          </div>
          <a href="booking.html?roomType=${room.id}" class="btn btn-primary" style="padding: 0.5rem 1rem; font-size: 0.75rem;">Book Now</a>
        </div>
      </div>
    </article>
  `).join('');
}

function setupRoomFilters() {
  const tabs = document.querySelectorAll('.filter-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeFilter = tab.dataset.filter;
      renderRoomsGrid();
    });
  });

  const sortSelect = document.getElementById('room-sort');
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      activeSort = sortSelect.value;
      renderRoomsGrid();
    });
  }
}

/* 7. MASONRY GALLERY */
let activeGFilter = 'all';

function renderGalleryGrid() {
  const container = document.getElementById('masonry-gallery-container');
  if (!container) return;

  const items = GALLERY_DATA.filter(img => {
    return activeGFilter === 'all' || img.category === activeGFilter;
  });

  container.innerHTML = items.map(img => `
    <div class="gallery-item" data-src="${img.url}">
      <img src="${img.url}" alt="${img.caption}" loading="lazy">
      <div class="gallery-hover-overlay">
        <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
      </div>
    </div>
  `).join('');

  // Re-bind Lightbox modal triggers
  const galleryItems = document.querySelectorAll('.gallery-item');
  const lightbox = document.getElementById('gallery-lightbox');
  const lightboxImg = document.getElementById('lightbox-img-el');

  galleryItems.forEach(item => {
    item.addEventListener('click', () => {
      const src = item.dataset.src;
      if (lightbox && lightboxImg) {
        lightboxImg.src = src;
        lightboxImg.alt = item.querySelector('img').alt;
        lightbox.style.display = 'flex';
        document.body.style.overflow = 'hidden';
      }
    });
  });
}

function setupGalleryFilters() {
  const tabs = document.querySelectorAll('.gallery-filter-tabs .filter-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeGFilter = tab.dataset.gfilter;
      renderGalleryGrid();
    });
  });

  // Lightbox Close triggers
  const lightbox = document.getElementById('gallery-lightbox');
  const closeBtn = document.getElementById('lightbox-close-btn');
  
  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox || e.target === closeBtn) {
        lightbox.style.display = 'none';
        document.body.style.overflow = '';
      }
    });
  }
}

/* 8. TESTIMONIAL SLIDER CAROUSEL */
function setupTestimonialSlider() {
  const track = document.getElementById('testimonial-track');
  const dots = document.querySelectorAll('.testimonial-dot');
  
  if (track && dots.length > 0) {
    dots.forEach(dot => {
      dot.addEventListener('click', () => {
        dots.forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
        const idx = parseInt(dot.dataset.index, 10);
        track.style.transform = `translateX(-${idx * 100}%)`;
      });
    });

    // Auto rotate every 8 seconds
    let currentSlide = 0;
    setInterval(() => {
      currentSlide = (currentSlide + 1) % dots.length;
      dots[currentSlide].click();
    }, 8000);
  }
}

/* 9. MOCK FORM SUBMISSIONS */
function setupFormSubmissions() {
  const diningForm = document.getElementById('dining-res-form');
  const contactForm = document.getElementById('contact-form-node');
  const newsletterForm = document.getElementById('newsletter-form-node');

  if (diningForm) {
    diningForm.addEventListener('submit', (e) => {
      e.preventDefault();
      closeModal('dining-modal');
      showToast('Reservation Requested', 'Our restaurant manager will email your table confirmation shortly.', 'success');
      diningForm.reset();
    });
  }

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      showToast('Inquiry Submitted', 'Thank you. A guest relations manager will reach out within 2 hours.', 'success');
      contactForm.reset();
    });
  }

  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      showToast('Subscription Active', 'Welcome to Serenity Haven circles. Enjoy first priority booking codes.', 'success');
      newsletterForm.reset();
    });
  }
}

/* 10. RESILIENT OFFLINE/ONLINE STATE LISTENERS */
function setupOfflineDetection() {
  const banner = document.getElementById('offline-banner-node');
  if (!banner) return;

  const updateStatus = () => {
    if (navigator.onLine) {
      banner.classList.remove('active');
      showToast('Connection Restored', 'Syncing operations with the reservation database.', 'success');
    } else {
      banner.classList.add('active');
      showToast('Offline Mode Active', 'Reservation details will be cached locally.', 'info');
    }
  };

  window.addEventListener('online', updateStatus);
  window.addEventListener('offline', updateStatus);
  
  // Initial check
  if (!navigator.onLine) {
    banner.classList.add('active');
  }
}
