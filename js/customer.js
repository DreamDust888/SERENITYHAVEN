/*
 * SERENITY HAVEN RESORT & SPA
 * Customer Portal Controller
 */

// Initial Seed Stays (to avoid blank states)
const SEED_BOOKINGS = [
  {
    invoiceId: 'SH-2026-98104',
    issueDate: 'June 29, 2026',
    checkin: '2026-07-02',
    checkout: '2026-07-05',
    guests: '2',
    selectedRoomId: 'suite',
    selectedAddons: ['spa', 'airport'],
    promoCode: 'LUXURY20',
    discountPercentage: 20,
    paymentMethod: 'card',
    guestName: 'Andrew Bennett',
    guestEmail: 'andrew@example.com',
    guestPhone: '+1 (555) 0199',
    guestRequests: 'Early checkin requested.',
    billing: {
      nights: 3,
      baseRateTotal: 2160,
      weekendPremium: 0,
      seasonalMarkup: 216, // Summer Markup (10%)
      addonsSum: 230, // Spa $150 + Airport $80
      discount: 475.20,
      luxuryTax: 255.69,
      serviceCharge: 106.54,
      grandTotal: 2493.03
    }
  }
];

const SEED_WISHLIST = ['suite', 'pool-villa'];

const SEED_COTRAVELERS = [
  { name: 'Clara Bennett', relationship: 'Spouse', passport: 'UK-P871038' }
];

document.addEventListener('DOMContentLoaded', () => {
  initDashboardTabs();
  initLocalStorageSeeds();
  renderBookingsList();
  renderUpcomingHighlight();
  renderWishlist();
  renderCotravelers();
  initFormSubmissions();
});

/* 1. DASHBOARD SIDEBAR TABS SWITCHER */
function initDashboardTabs() {
  const menuItems = document.querySelectorAll('.db-menu-item');
  const panels = document.querySelectorAll('.tab-panel');

  menuItems.forEach(item => {
    item.addEventListener('click', () => {
      const tabId = item.dataset.tab;
      
      menuItems.forEach(el => el.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      
      item.classList.add('active');
      const activePanel = document.querySelector(`.tab-panel[data-tab="${tabId}"]`);
      if (activePanel) {
        activePanel.classList.add('active');
      }
    });
  });
}

/* 2. LOCALSTORAGE SEED SETUP */
function initLocalStorageSeeds() {
  if (!localStorage.getItem('resort_bookings')) {
    localStorage.setItem('resort_bookings', JSON.stringify(SEED_BOOKINGS));
  }
  if (!localStorage.getItem('resort_wishlist')) {
    localStorage.setItem('resort_wishlist', JSON.stringify(SEED_WISHLIST));
  }
  if (!localStorage.getItem('resort_cotravelers')) {
    localStorage.setItem('resort_cotravelers', JSON.stringify(SEED_COTRAVELERS));
  }
}

/* 3. RENDER BOOKINGS LIST */
function renderBookingsList() {
  const tbody = document.getElementById('bookings-list-table-body');
  if (!tbody) return;

  const bookings = JSON.parse(localStorage.getItem('resort_bookings')) || [];

  if (bookings.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 40px;">No stays logged. <a href="booking.html" style="color:var(--color-gold); font-weight:600;">Reserve a Room now</a></td></tr>`;
    return;
  }

  tbody.innerHTML = bookings.map((b, idx) => {
    const roomName = getRoomNameById(b.selectedRoomId);
    const dateRange = `${formatDateShort(b.checkin)} – ${formatDateShort(b.checkout)}`;
    const totalNights = calculateNightsCount(b.checkin, b.checkout);
    
    // Calculate status dynamically based on current date
    const today = new Date().toISOString().split('T')[0];
    let statusBadge = '<span class="badge badge-gold">Upcoming</span>';
    if (b.checkout < today) {
      statusBadge = '<span class="badge badge-gray">Checked Out</span>';
    } else if (b.checkin <= today && b.checkout >= today) {
      statusBadge = '<span class="badge badge-emerald">In House</span>';
    }

    return `
      <tr>
        <td style="font-weight:700;">${b.invoiceId}</td>
        <td>${roomName}</td>
        <td>${dateRange} <span style="font-size:0.8rem; color:var(--color-text-muted);">(${totalNights} nights)</span></td>
        <td style="font-weight:600; color:var(--color-forest-green);">$${b.billing.grandTotal.toFixed(2)}</td>
        <td>${statusBadge}</td>
        <td style="text-align: right; display: flex; gap: 8px; justify-content: flex-end;">
          <button class="btn btn-outline" style="padding: 0.35rem 0.75rem; font-size: 0.75rem;" onclick="viewInvoiceDetails('${b.invoiceId}')">Invoice</button>
          ${b.checkin > today ? `<button class="btn btn-link" style="color:#dc2626; font-size: 0.8rem;" onclick="cancelBookingPrompt('${b.invoiceId}')">Cancel</button>` : ''}
        </td>
      </tr>
    `;
  }).join('');

  // Update metrics counts
  const totalNightsSum = bookings.reduce((sum, b) => sum + calculateNightsCount(b.checkin, b.checkout), 0);
  document.getElementById('stat-total-nights').textContent = totalNightsSum;
}

/* 4. UPCOMING STAY SPOTLIGHT */
function renderUpcomingHighlight() {
  const box = document.getElementById('upcoming-stay-highlight-box');
  if (!box) return;

  const bookings = JSON.parse(localStorage.getItem('resort_bookings')) || [];
  const today = new Date().toISOString().split('T')[0];
  
  // Get earliest checkin booking in future
  const upcoming = bookings
    .filter(b => b.checkin >= today)
    .sort((a, b) => new Date(a.checkin) - new Date(b.checkin))[0];

  if (!upcoming) {
    box.innerHTML = `<div style="padding: 20px; text-align: center; width: 100%;"><p>No upcoming reservations. <a href="booking.html" style="color:var(--color-gold); font-weight:600;">Reserve a Haven now &rarr;</a></p></div>`;
    document.getElementById('stat-days-countdown').textContent = '-';
    return;
  }

  const roomImage = getRoomImageById(upcoming.selectedRoomId);
  const roomName = getRoomNameById(upcoming.selectedRoomId);
  
  // Calculate countdown days
  const diffDays = Math.ceil((new Date(upcoming.checkin) - new Date()) / (1000 * 60 * 60 * 24));
  document.getElementById('stat-days-countdown').textContent = diffDays > 0 ? diffDays : '0';

  box.innerHTML = `
    <div style="width: 150px; height: 120px; border-radius: var(--radius-md); overflow:hidden;">
      <img src="${roomImage}" alt="${roomName}" style="width:100%; height:100%; object-fit:cover;">
    </div>
    <div style="flex-grow: 1;">
      <h4 style="font-family:var(--font-serif); font-size: 1.3rem; margin-bottom: 2px;">${roomName}</h4>
      <p style="font-size:0.9rem; margin-bottom: 4px;"><strong>Dates:</strong> ${formatDateShort(upcoming.checkin)} – ${formatDateShort(upcoming.checkout)} (${upcoming.billing.nights} Nights)</p>
      <p style="font-size:0.85rem; color:var(--color-text-muted);"><strong>Add-ons selected:</strong> ${upcoming.selectedAddons.length > 0 ? upcoming.selectedAddons.map(a => a.toUpperCase()).join(', ') : 'None'}</p>
      <div style="margin-top: 10px; display:flex; gap: 8px;">
        <button class="btn btn-primary" style="padding: 0.4rem 1rem; font-size: 0.75rem;" onclick="viewInvoiceDetails('${upcoming.invoiceId}')">View Invoice</button>
        <a href="booking.html?checkin=${upcoming.checkin}&checkout=${upcoming.checkout}&roomType=${upcoming.selectedRoomId}" class="btn btn-outline" style="padding: 0.4rem 1rem; font-size: 0.75rem;">Modify Stay</a>
      </div>
    </div>
  `;
}

/* 5. RENDER WISHLIST */
function renderWishlist() {
  const container = document.getElementById('wishlist-rooms-container');
  if (!container) return;

  const wishlist = JSON.parse(localStorage.getItem('resort_wishlist')) || [];

  if (wishlist.length === 0) {
    container.innerHTML = `<div style="text-align:center; width:100%; padding: 40px;"><p>No havens saved in your wishlist.</p></div>`;
    return;
  }

  // Room lookup data
  const roomData = [
    { id: 'suite', name: 'Premium Suite', price: 720, image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=400&q=80', desc: 'Plunge pool, ocean view balcony' },
    { id: 'pool-villa', name: 'Pool Villa', price: 1100, image: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=400&q=80', desc: 'Private 15m infinity pool, wine cellar' },
    { id: 'deluxe', name: 'Deluxe Room', price: 350, image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=400&q=80', desc: 'Amalfi stone design, balcony' }
  ];

  container.innerHTML = roomData.filter(r => wishlist.includes(r.id)).map(room => `
    <div class="resort-card" style="border-radius: var(--radius-sm);">
      <div class="card-img-wrapper" style="aspect-ratio:16/10;">
        <img src="${room.image}" alt="${room.name}">
        <span class="badge badge-emerald card-badge">$${room.price}/Night</span>
      </div>
      <div class="card-body" style="padding: 15px;">
        <h4 style="font-family:var(--font-serif); font-size:1.2rem; margin-bottom:4px;">${room.name}</h4>
        <p style="font-size:0.8rem; margin-bottom:12px;">${room.desc}</p>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <button class="btn btn-link" style="color:#dc2626; font-size:0.8rem;" onclick="removeFromWishlist('${room.id}')">Remove</button>
          <a href="booking.html?roomType=${room.id}" class="btn btn-primary" style="padding:0.4rem 1rem; font-size:0.75rem;">Reserve Now</a>
        </div>
      </div>
    </div>
  `).join('');
}

function removeFromWishlist(id) {
  let list = JSON.parse(localStorage.getItem('resort_wishlist')) || [];
  list = list.filter(item => item !== id);
  localStorage.setItem('resort_wishlist', JSON.stringify(list));
  renderWishlist();
  showToast('Removed from Wishlist', 'Haven removed from your wishlist list.', 'info');
}

/* 6. CO-TRAVELERS SYSTEM */
function renderCotravelers() {
  const container = document.getElementById('cotravelers-list-container');
  if (!container) return;

  const guests = JSON.parse(localStorage.getItem('resort_cotravelers')) || [];

  if (guests.length === 0) {
    container.innerHTML = `<p style="font-size:0.9rem; text-align:center; color:var(--color-text-muted); padding: 10px;">No saved guests in your registry.</p>`;
    return;
  }

  container.innerHTML = guests.map((g, idx) => `
    <div style="background-color: var(--color-warm-white); border: 1px solid var(--color-border); border-radius: var(--radius-sm); padding: 12px; display:flex; justify-content:space-between; align-items:center;">
      <div>
        <div style="font-weight:700; color:var(--color-charcoal);">${g.name}</div>
        <div style="font-size:0.8rem; color:var(--color-text-muted);">Relationship: ${g.relationship} ${g.passport ? `| Passport: ${g.passport}` : ''}</div>
      </div>
      <button class="btn btn-link" style="color:#dc2626; font-size:0.8rem; margin:0;" onclick="deleteCotraveler(${idx})">Remove</button>
    </div>
  `).join('');
}

function deleteCotraveler(idx) {
  let list = JSON.parse(localStorage.getItem('resort_cotravelers')) || [];
  list.splice(idx, 1);
  localStorage.setItem('resort_cotravelers', JSON.stringify(list));
  renderCotravelers();
  showToast('Guest Removed', 'Traveler details cleared from registry.', 'info');
}

/* 7. PROFILE & NEW GUEST FORM HANDLERS */
function initFormSubmissions() {
  const addGuestForm = document.getElementById('add-guest-form');
  const profileForm = document.getElementById('profile-settings-form');

  if (addGuestForm) {
    addGuestForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('cotrav-name').value.trim();
      const rel = document.getElementById('cotrav-rel').value;
      const passport = document.getElementById('cotrav-passport').value.trim();
      
      const newGuest = { name, relationship: rel, passport };
      let list = JSON.parse(localStorage.getItem('resort_cotravelers')) || [];
      list.push(newGuest);
      localStorage.setItem('resort_cotravelers', JSON.stringify(list));
      
      addGuestForm.reset();
      renderCotravelers();
      showToast('Guest Added', `${name} added to your co-travelers registry.`, 'success');
    });
  }

  if (profileForm) {
    profileForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('prof-name').value;
      document.getElementById('user-display-name').textContent = name;
      showToast('Profile Updated', 'Your profile adjustments have been committed successfully.', 'success');
    });
  }
}

/* 8. ACTIVE INVOICE VIEW OVERLAYS */
function viewInvoiceDetails(invoiceId) {
  const bookings = JSON.parse(localStorage.getItem('resort_bookings')) || [];
  const b = bookings.find(item => item.invoiceId === invoiceId);
  if (!b) return;

  const contentArea = document.getElementById('invoice-modal-content-area');
  
  // Build identical receipt structure
  const roomName = getRoomNameById(b.selectedRoomId);
  const addOnsList = b.selectedAddons.length > 0 ? b.selectedAddons.map(id => {
    if (id === 'spa') return 'Concierge service: Thermal Spa Treatment ($150.00)';
    if (id === 'airport') return 'Concierge service: Private Airport Pickup ($80.00)';
    if (id === 'dinner') return 'Concierge service: Private Beach Dinner ($200.00)';
    return `Concierge service: ${id}`;
  }) : [];

  let tableHTML = `
    <tr>
      <td>${roomName} Accommodations (${b.billing.nights} Nights)</td>
      <td style="text-align: right;">$${(b.billing.baseRateTotal / b.billing.nights).toFixed(2)}</td>
      <td style="text-align: right;">$${b.billing.baseRateTotal.toFixed(2)}</td>
    </tr>
  `;

  if (b.billing.weekendPremium > 0) {
    tableHTML += `
      <tr>
        <td>Weekend Premium surcharge</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right;">+$${b.billing.weekendPremium.toFixed(2)}</td>
      </tr>
    `;
  }

  if (b.billing.seasonalMarkup > 0) {
    tableHTML += `
      <tr>
        <td>Seasonal markup premium</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right;">+$${b.billing.seasonalMarkup.toFixed(2)}</td>
      </tr>
    `;
  }

  addOnsList.forEach(line => {
    const priceStr = line.match(/\$(\d+)/);
    const price = priceStr ? parseFloat(priceStr[1]) : 0;
    tableHTML += `
      <tr>
        <td>${line.split(' ($')[0]}</td>
        <td style="text-align: right;">$${price.toFixed(2)}</td>
        <td style="text-align: right;">$${price.toFixed(2)}</td>
      </tr>
    `;
  });

  contentArea.innerHTML = `
    <div class="invoice-container" style="border:none; padding:0;">
      <div class="invoice-header">
        <div>
          <div class="logo" style="font-size: 1.5rem; margin-bottom: 4px; color:var(--color-charcoal);">SERENITY<span>HAVEN</span></div>
          <div style="font-size:0.8rem; color:var(--color-text-muted);">Via dei Monasteri 12, Amalfi, Italy</div>
        </div>
        <div style="text-align: right;">
          <h3 style="font-family: var(--font-sans); font-weight:700; font-size: 1.1rem; text-transform: uppercase;">Invoice Statement</h3>
          <div style="font-size: 0.85rem;">Invoice #: ${b.invoiceId}</div>
          <div style="font-size: 0.85rem;">Issued: ${b.issueDate}</div>
        </div>
      </div>

      <div class="invoice-billing-details">
        <div>
          <h4 style="font-family:var(--font-sans); text-transform: uppercase; font-size:0.8rem; color:var(--color-text-muted); margin-bottom: 4px;">Primary Guest</h4>
          <div style="font-weight: 600;">${b.guestName}</div>
          <div>${b.guestEmail}</div>
          <div>${b.guestPhone}</div>
        </div>
        <div style="text-align: right;">
          <h4 style="font-family:var(--font-sans); text-transform: uppercase; font-size:0.8rem; color:var(--color-text-muted); margin-bottom: 4px;">Booking Period</h4>
          <div style="font-weight: 600;">${formatDateShort(b.checkin)} - ${formatDateShort(b.checkout)}</div>
          <div>Nights: ${b.billing.nights} Nights</div>
          <div>Haven: ${roomName}</div>
        </div>
      </div>

      <table class="invoice-table">
        <thead>
          <tr>
            <th>Description</th>
            <th style="text-align: right;">Rate / Price</th>
            <th style="text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${tableHTML}
        </tbody>
      </table>

      <div style="display:flex; justify-content: flex-end;">
        <div style="width: 250px;">
          <div class="pricing-row" style="font-size:0.9rem;">
            <span>Subtotal</span>
            <span>$${(b.billing.baseRateTotal + b.billing.weekendPremium + b.billing.seasonalMarkup + b.billing.addonsSum).toFixed(2)}</span>
          </div>
          ${b.billing.discount > 0 ? `
            <div class="pricing-row discount" style="font-size:0.9rem;">
              <span>Promo Code (${b.promoCode})</span>
              <span>-$${b.billing.discount.toFixed(2)}</span>
            </div>
          ` : ''}
          <div class="pricing-row" style="font-size:0.9rem;">
            <span>Luxury Tax (12%)</span>
            <span>$${b.billing.luxuryTax.toFixed(2)}</span>
          </div>
          <div class="pricing-row" style="font-size:0.9rem;">
            <span>Service Fee (5%)</span>
            <span>$${b.billing.serviceCharge.toFixed(2)}</span>
          </div>
          <div class="pricing-row total">
            <span>Grand Total</span>
            <span>$${b.billing.grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  `;

  openModal('invoice-modal');
}

function cancelBookingPrompt(invoiceId) {
  if (confirm(`Are you sure you wish to request cancellation for booking ${invoiceId}?`)) {
    let bookings = JSON.parse(localStorage.getItem('resort_bookings')) || [];
    bookings = bookings.filter(b => b.invoiceId !== invoiceId);
    localStorage.setItem('resort_bookings', JSON.stringify(bookings));
    
    renderBookingsList();
    renderUpcomingHighlight();
    showToast('Cancellation Successful', 'Stay deleted, and refunds have been initiated.', 'success');
  }
}

/* HELPER LOOKUPS */
function getRoomNameById(id) {
  if (id === 'deluxe') return 'Deluxe Room';
  if (id === 'cottage') return 'Garden Cottage';
  if (id === 'suite') return 'Premium Suite';
  if (id === 'pool-villa') return 'Pool Villa';
  return id;
}

function getRoomImageById(id) {
  if (id === 'deluxe') return 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=300&q=80';
  if (id === 'cottage') return 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=300&q=80';
  if (id === 'suite') return 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=300&q=80';
  return 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=300&q=80';
}

function formatDateShort(dateStr) {
  const options = { month: 'short', day: 'numeric' };
  return new Date(dateStr).toLocaleDateString('en-US', options);
}

function calculateNightsCount(inStr, outStr) {
  const start = new Date(inStr);
  const end = new Date(outStr);
  return Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
}

// Global hook
window.viewInvoiceDetails = viewInvoiceDetails;
window.cancelBookingPrompt = cancelBookingPrompt;
window.removeFromWishlist = removeFromWishlist;
window.deleteCotraveler = deleteCotraveler;
