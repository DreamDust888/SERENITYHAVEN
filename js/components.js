/*
 * SERENITY HAVEN RESORT & SPA
 * Reusable Components Script (Ripples, Modals, Toast Alerts, & Accordions)
 */

document.addEventListener('DOMContentLoaded', () => {
  initButtonRipples();
  initAccordions();
  initModals();
  initTabs();
  initScrollAnimations();
});

/* 1. BUTTON RIPPLES */
function initButtonRipples() {
  document.body.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn');
    if (!btn) return;
    
    // Create ripple element
    const ripple = document.createElement('span');
    ripple.classList.add('ripple');
    
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    
    ripple.style.width = ripple.style.height = `${size}px`;
    
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    
    btn.appendChild(ripple);
    
    // Remove ripple after animation finishes
    ripple.addEventListener('animationend', () => {
      ripple.remove();
    });
  });
}

/* 2. FAQ ACCORDIONS */
function initAccordions() {
  document.body.addEventListener('click', (e) => {
    const header = e.target.closest('.accordion-header');
    if (!header) return;
    
    const item = header.parentElement;
    const content = header.nextElementSibling;
    const isAlreadyActive = item.classList.contains('active');
    
    // Close other accordion items in the same container
    const accordion = item.closest('.accordion');
    if (accordion) {
      accordion.querySelectorAll('.accordion-item').forEach(el => {
        el.classList.remove('active');
        el.querySelector('.accordion-content').style.maxHeight = null;
      });
    }
    
    if (!isAlreadyActive) {
      item.classList.add('active');
      content.style.maxHeight = content.scrollHeight + 'px';
    }
  });
}

/* 3. MODAL CONTROLS */
function initModals() {
  // Global close hooks
  document.body.addEventListener('click', (e) => {
    if (e.target.matches('.modal-overlay') || e.target.closest('.modal-close')) {
      const activeModal = document.querySelector('.modal-overlay.active');
      if (activeModal) {
        closeModal(activeModal.id);
      }
    }
  });
  
  // Close modal on Escape press
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const activeModal = document.querySelector('.modal-overlay.active');
      if (activeModal) {
        closeModal(activeModal.id);
      }
    }
  });
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

/* 4. TABS CONTROLLER */
function initTabs() {
  document.body.addEventListener('click', (e) => {
    const tabBtn = e.target.closest('.tab-btn');
    if (!tabBtn) return;
    
    const tabNav = tabBtn.closest('.tab-nav');
    const tabContainer = tabNav.parentElement;
    const tabId = tabBtn.dataset.tab;
    
    // Deactivate current tabs
    tabNav.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    tabContainer.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
    
    // Activate clicked tab
    tabBtn.classList.add('active');
    const activePanel = tabContainer.querySelector(`.tab-panel[data-tab="${tabId}"]`);
    if (activePanel) {
      activePanel.classList.add('active');
    }
  });
}

/* 5. TOAST ALERTS SYSTEM */
function showToast(title, message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.classList.add('toast-container');
    document.body.appendChild(container);
  }
  
  const toast = document.createElement('div');
  toast.classList.add('toast', `toast-${type}`);
  
  // Choose standard icons for success, warning/error, info
  let iconSVG = '';
  if (type === 'success') {
    iconSVG = `<svg viewBox="0 0 20 20" fill="currentColor" style="width: 20px; height: 20px; fill: var(--color-emerald);"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>`;
  } else if (type === 'error') {
    iconSVG = `<svg viewBox="0 0 20 20" fill="currentColor" style="width: 20px; height: 20px; fill: #dc2626;"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>`;
  } else {
    iconSVG = `<svg viewBox="0 0 20 20" fill="currentColor" style="width: 20px; height: 20px; fill: var(--color-gold);"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 9a1 1 0 102 0v-3a1 1 0 00-2 0v3z" clip-rule="evenodd"/></svg>`;
  }
  
  toast.innerHTML = `
    ${iconSVG}
    <div style="flex-grow: 1;">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
  `;
  
  container.appendChild(toast);
  
  // Trigger transition
  setTimeout(() => {
    toast.classList.add('active');
  }, 10);
  
  // Remove toast
  setTimeout(() => {
    toast.classList.remove('active');
    toast.addEventListener('transitionend', () => {
      toast.remove();
      if (container.children.length === 0) {
        container.remove();
      }
    });
  }, 4000);
}

/* 6. SCROLL ANIMATIONS (IntersectionObserver for fading in sections) */
function initScrollAnimations() {
  const options = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };
  
  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animated');
        observer.unobserve(entry.target);
      }
    });
  }, options);
  
  // Add animation targets in the HTML markup
  const targets = document.querySelectorAll('.animate-up, .animate-fade, .animate-left, .animate-right');
  targets.forEach(target => {
    observer.observe(target);
  });
  
  // Scroll progress bar indicator
  const scrollProgress = document.getElementById('scroll-progress');
  if (scrollProgress) {
    window.addEventListener('scroll', () => {
      const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (winScroll / height) * 100;
      scrollProgress.style.width = scrolled + '%';
    });
  }
}

// Global Exports
window.showToast = showToast;
window.openModal = openModal;
window.closeModal = closeModal;
