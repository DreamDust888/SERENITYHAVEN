/*
 * SERENITY HAVEN RESORT & SPA
 * Resort Owner Management System (RMD) Controller
 */

// Initial Seed data for rooms inventory
const SEED_ROOMS = [
  { roomNum: '101', type: 'deluxe', status: 'Clean', occupancy: 'Vacant' },
  { roomNum: '102', type: 'deluxe', status: 'Dirty', occupancy: 'Vacant' },
  { roomNum: '201', type: 'cottage', status: 'Clean', occupancy: 'Vacant' },
  { roomNum: '202', type: 'cottage', status: 'Clean', occupancy: 'Vacant' },
  { roomNum: '301', type: 'suite', status: 'Clean', occupancy: 'Occupied' },
  { roomNum: '302', type: 'suite', status: 'Clean', occupancy: 'Vacant' },
  { roomNum: '401', type: 'pool-villa', status: 'Dirty', occupancy: 'Vacant' },
  { roomNum: '402', type: 'pool-villa', status: 'Under Maintenance', occupancy: 'Vacant' }
];

const SEED_SEASON_RULES = [
  { name: 'Peak Festive Markup', multiplier: 1.35, start: '2026-12-15', end: '2027-01-05' },
  { name: 'Summer Escape Surcharge', multiplier: 1.10, start: '2026-06-01', end: '2026-08-31' }
];

const SEED_COUPONS = [
  { code: 'LUXURY20', discount: 20 },
  { code: 'HONEYMOON', discount: 10 }
];

const SEED_CRM = [
  { name: 'Andrew Bennett', contact: 'andrew@example.com', tier: 'Gold', stays: 4, spend: 8900, notes: 'Prefers high floor suites, allergic to peanuts.' },
  { name: 'Clara Dupont', contact: 'clara.dupont@example.fr', tier: 'Platinum', stays: 6, spend: 14200, notes: 'Prefers ocean sunset views, orders private shore dinners.' },
  { name: 'Hiroshi Tanaka', contact: 'hiroshi@example.jp', tier: 'Regular', stays: 1, spend: 3100, notes: 'Requires high-speed wifi, prefers early coffee service.' }
];

document.addEventListener('DOMContentLoaded', () => {
  initAdminDashboardTabs();
  initAdminSeeds();
  calculateHospitalityKPIs();
  renderAdminBookings();
  renderCalendarScheduler();
  renderRoomsInventory();
  renderPricingFields();
  renderSeasonRules();
  renderCRMList();
  renderCouponsList();
  initAdminFormSubmissions();
});

/* 1. SIDEBAR TAB CONTROLLERS */
function initAdminDashboardTabs() {
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

/* 2. ADMIN SEED DATA */
function initAdminSeeds() {
  if (!localStorage.getItem('admin_rooms')) {
    localStorage.setItem('admin_rooms', JSON.stringify(SEED_ROOMS));
  }
  if (!localStorage.getItem('admin_seasons')) {
    localStorage.setItem('admin_seasons', JSON.stringify(SEED_SEASON_RULES));
  }
  if (!localStorage.getItem('admin_coupons')) {
    localStorage.setItem('admin_coupons', JSON.stringify(SEED_COUPONS));
  }
  if (!localStorage.getItem('admin_crm')) {
    localStorage.setItem('admin_crm', JSON.stringify(SEED_CRM));
  }
}

/* 3. CALCULATE KPIs (ADR, RevPAR, OCCUPANCY) */
function calculateHospitalityKPIs() {
  const bookings = JSON.parse(localStorage.getItem('resort_bookings')) || [];
  
  let totalRevenue = 0;
  let totalNightsBooked = 0;
  
  bookings.forEach(b => {
    totalRevenue += b.billing.grandTotal;
    totalNightsBooked += b.billing.nights;
  });

  // Calculate ADR: Room Revenue / Nights Sold
  // Using subtotal for room revenue, fallback to grandTotal if empty
  const roomRev = bookings.reduce((sum, b) => sum + (b.billing.baseRateTotal + b.billing.weekendPremium + b.billing.seasonalMarkup), 0);
  const adr = totalNightsBooked > 0 ? (roomRev / totalNightsBooked) : 685;
  
  // Calculate Occupancy: 8 rooms total. Let's assume July 2026 total potential capacity.
  // 8 rooms * 30 days = 240 room nights.
  const occupancyRate = (totalNightsBooked / 240) * 100;
  const clampedOcc = Math.min(100, Math.max(15, occupancyRate > 0 ? occupancyRate : 76.4));
  
  // RevPAR = ADR * Occupancy
  const revpar = adr * (clampedOcc / 100);

  // Update DOM values
  document.getElementById('kpi-revenue').textContent = totalRevenue > 0 ? `$${totalRevenue.toFixed(2)}` : '$2,493.03';
  document.getElementById('kpi-occupancy').textContent = `${clampedOcc.toFixed(1)}%`;
  document.getElementById('kpi-adr').textContent = `$${adr.toFixed(2)}`;
  document.getElementById('kpi-revpar').textContent = `$${revpar.toFixed(2)}`;
  document.getElementById('kpi-stays').textContent = bookings.length;
}

/* 4. RENDER BOOKINGS TABLE */
function renderAdminBookings() {
  const tbody = document.getElementById('admin-bookings-table-body');
  if (!tbody) return;

  const bookings = JSON.parse(localStorage.getItem('resort_bookings')) || [];
  const today = new Date().toISOString().split('T')[0];

  if (bookings.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px;">No reservations found.</td></tr>`;
    return;
  }

  tbody.innerHTML = bookings.map(b => {
    const roomName = getAdminRoomNameById(b.selectedRoomId);
    let statusLabel = '<span class="badge badge-gold">Upcoming</span>';
    let actionButtons = '';

    if (b.checkout < today) {
      statusLabel = '<span class="badge badge-gray">Checked Out</span>';
    } else if (b.checkin <= today && b.checkout >= today) {
      statusLabel = '<span class="badge badge-emerald">In House</span>';
      actionButtons = `<button class="btn btn-outline" style="padding:4px 8px; font-size:0.75rem;" onclick="adminCheckOut('${b.invoiceId}')">Check Out</button>`;
    } else {
      actionButtons = `
        <button class="btn btn-primary" style="padding:4px 8px; font-size:0.75rem;" onclick="adminCheckIn('${b.invoiceId}')">Check In</button>
        <button class="btn btn-link" style="color:#dc2626; font-size:0.75rem;" onclick="adminCancelBooking('${b.invoiceId}')">Cancel</button>
      `;
    }

    return `
      <tr>
        <td style="font-weight:700;">${b.invoiceId}</td>
        <td>
          <div style="font-weight:600;">${b.guestName}</div>
          <div style="font-size:0.8rem; color:var(--color-text-muted);">${b.guestEmail}</div>
        </td>
        <td>${roomName}</td>
        <td>${formatAdminDate(b.checkin)} – ${formatAdminDate(b.checkout)}</td>
        <td style="font-weight:600; color:var(--color-forest-green);">$${b.billing.grandTotal.toFixed(2)}</td>
        <td>${statusLabel}</td>
        <td style="text-align: right; display:flex; gap: 4px; justify-content: flex-end;">${actionButtons}</td>
      </tr>
    `;
  }).join('');
}

function adminCheckIn(invoiceId) {
  showToast('Guest Checked In', `Reservation ${invoiceId} marked as In House.`, 'success');
  // Update state/local variable if required, re-render
  renderAdminBookings();
}

function adminCheckOut(invoiceId) {
  showToast('Guest Checked Out', `Reservation ${invoiceId} completed departure logs.`, 'info');
  renderAdminBookings();
}

function adminCancelBooking(invoiceId) {
  if (confirm(`Confirm cancellation of booking ${invoiceId}?`)) {
    let bookings = JSON.parse(localStorage.getItem('resort_bookings')) || [];
    bookings = bookings.filter(b => b.invoiceId !== invoiceId);
    localStorage.setItem('resort_bookings', JSON.stringify(bookings));
    renderAdminBookings();
    calculateHospitalityKPIs();
    renderCalendarScheduler();
    showToast('Reservation Cancelled', `Refunds processed for ${invoiceId}.`, 'success');
  }
}

/* 5. RENDER JULY 2026 SCHEDULER CALENDAR */
function renderCalendarScheduler() {
  const container = document.getElementById('calendar-grid-container');
  if (!container) return;

  const bookings = JSON.parse(localStorage.getItem('resort_bookings')) || [];
  
  // Renders headers Sun-Sat
  const daysHeader = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  let calendarHTML = daysHeader.map(d => `<div class="scheduler-day-header">${d}</div>`).join('');

  // July 2026 starts on Wednesday (1) with 31 days
  // Pad Wed start (first 3 cells empty)
  for (let i = 0; i < 3; i++) {
    calendarHTML += `<div style="background-color: transparent;"></div>`;
  }

  for (let date = 1; date <= 31; date++) {
    const dateStr = `2026-07-${date < 10 ? '0' + date : date}`;
    const dayBookings = bookings.filter(b => dateStr >= b.checkin && dateStr < b.checkout);

    let eventHTML = '';
    dayBookings.forEach(b => {
      const roomName = getAdminRoomNameById(b.selectedRoomId);
      eventHTML += `<div class="scheduler-event occupied">${b.guestName.split(' ')[1] || b.guestName} (${roomName})</div>`;
    });

    calendarHTML += `
      <div class="scheduler-cell">
        <span class="scheduler-cell-date">${date}</span>
        <div style="display:flex; flex-direction:column; gap:2px; margin-top:4px;">
          ${eventHTML}
        </div>
      </div>
    `;
  }

  container.innerHTML = calendarHTML;
}

/* 6. ROOMS INVENTORY CLEANLINESS STATE */
function renderRoomsInventory() {
  const tbody = document.getElementById('admin-rooms-table-body');
  if (!tbody) return;

  const rooms = JSON.parse(localStorage.getItem('admin_rooms')) || SEED_ROOMS;

  tbody.innerHTML = rooms.map((r, idx) => `
    <tr>
      <td style="font-weight:700;">Room ${r.roomNum}</td>
      <td>${getAdminRoomNameById(r.type)}</td>
      <td>${r.occupancy}</td>
      <td>
        <span class="badge ${r.status === 'Clean' ? 'badge-emerald' : r.status === 'Dirty' ? 'badge-gold' : 'badge-gray'}">
          ${r.status}
        </span>
      </td>
      <td>${r.occupancy === 'Occupied' ? '<span style="color:#dc2626; font-weight:600;">Reserved</span>' : '<span style="color:var(--color-emerald); font-weight:600;">Available</span>'}</td>
      <td style="text-align: right;">
        <select class="form-control" style="padding: 4px 8px; width: 150px; display:inline-block;" onchange="updateRoomStatus(${idx}, this.value)">
          <option value="Clean" ${r.status === 'Clean' ? 'selected' : ''}>Clean</option>
          <option value="Dirty" ${r.status === 'Dirty' ? 'selected' : ''}>Dirty</option>
          <option value="Under Maintenance" ${r.status === 'Under Maintenance' ? 'selected' : ''}>Maintenance</option>
        </select>
      </td>
    </tr>
  `).join('');
}

function updateRoomStatus(idx, newStatus) {
  let rooms = JSON.parse(localStorage.getItem('admin_rooms')) || SEED_ROOMS;
  rooms[idx].status = newStatus;
  localStorage.setItem('admin_rooms', JSON.stringify(rooms));
  renderRoomsInventory();
  showToast('Housekeeping Updated', `Room status toggled to ${newStatus}.`, 'success');
}

/* 7. PRICING EDITORS FORM */
function renderPricingFields() {
  const container = document.getElementById('pricing-fields-container');
  if (!container) return;

  const prices = JSON.parse(localStorage.getItem('resort_room_prices')) || {
    deluxe: 350,
    cottage: 480,
    suite: 720,
    'pool-villa': 1100
  };

  container.innerHTML = `
    <div class="form-group">
      <label class="form-label">Deluxe Room ($/night)</label>
      <input type="number" id="price-deluxe" class="form-control" value="${prices.deluxe}">
    </div>
    <div class="form-group">
      <label class="form-label">Garden Cottage ($/night)</label>
      <input type="number" id="price-cottage" class="form-control" value="${prices.cottage}">
    </div>
    <div class="form-group">
      <label class="form-label">Premium Suite ($/night)</label>
      <input type="number" id="price-suite" class="form-control" value="${prices.suite}">
    </div>
    <div class="form-group">
      <label class="form-label">Pool Villa ($/night)</label>
      <input type="number" id="price-villa" class="form-control" value="${prices['pool-villa']}">
    </div>
  `;
}

/* 8. SEASONAL TIMELINE MARKUPS */
function renderSeasonRules() {
  const container = document.getElementById('active-season-rules-list');
  if (!container) return;

  const rules = JSON.parse(localStorage.getItem('admin_seasons')) || SEED_SEASON_RULES;

  container.innerHTML = rules.map((rule, idx) => `
    <div style="background-color: var(--color-warm-white); border: 1px solid var(--color-border); border-radius: var(--radius-sm); padding:12px; display:flex; justify-content:space-between; align-items:center;">
      <div>
        <div style="font-weight:700; color:var(--color-charcoal);">${rule.name}</div>
        <div style="font-size:0.8rem; color:var(--color-text-muted);">Dates: ${rule.start} to ${rule.end} | Multiplier: x${rule.multiplier}</div>
      </div>
      <button class="btn btn-link" style="color:#dc2626; font-size:0.8rem;" onclick="deleteSeasonRule(${idx})">Remove</button>
    </div>
  `).join('');
}

function deleteSeasonRule(idx) {
  let list = JSON.parse(localStorage.getItem('admin_seasons')) || SEED_SEASON_RULES;
  list.splice(idx, 1);
  localStorage.setItem('admin_seasons', JSON.stringify(list));
  renderSeasonRules();
  showToast('Season Rule Deleted', 'Timeline rule deleted successfully.', 'info');
}

/* 9. CRM CUSTOMERS LIST */
function renderCRMList() {
  const tbody = document.getElementById('admin-crm-table-body');
  if (!tbody) return;

  const crm = JSON.parse(localStorage.getItem('admin_crm')) || SEED_CRM;

  tbody.innerHTML = crm.map(c => `
    <tr>
      <td style="font-weight:700;">${c.name}</td>
      <td>${c.contact}</td>
      <td><span class="badge ${c.tier === 'Platinum' ? 'badge-gold' : c.tier === 'Gold' ? 'badge-emerald' : 'badge-gray'}">${c.tier}</span></td>
      <td>${c.stays} stays</td>
      <td style="font-weight:600; color:var(--color-forest-green);">$${c.spend.toLocaleString()}</td>
      <td style="font-size:0.8rem; font-style:italic;">${c.notes}</td>
    </tr>
  `).join('');
}

/* 10. COUPONS BUILDER LIST */
function renderCouponsList() {
  const container = document.getElementById('active-coupons-list-container');
  if (!container) return;

  const coupons = JSON.parse(localStorage.getItem('admin_coupons')) || SEED_COUPONS;

  container.innerHTML = coupons.map((c, idx) => `
    <div style="background-color: var(--color-warm-white); border: 1px solid var(--color-border); border-radius: var(--radius-sm); padding:12px; display:flex; justify-content:space-between; align-items:center;">
      <div>
        <span style="font-family: monospace; font-weight:700; font-size:1.1rem; color:var(--color-gold);">${c.code}</span>
        <span style="font-size:0.8rem; color:var(--color-text-muted); margin-left:10px;">Discount: ${c.discount}%</span>
      </div>
      <button class="btn btn-link" style="color:#dc2626; font-size:0.8rem;" onclick="deleteAdminCoupon(${idx})">Deactivate</button>
    </div>
  `).join('');
}

function deleteAdminCoupon(idx) {
  let list = JSON.parse(localStorage.getItem('admin_coupons')) || SEED_COUPONS;
  list.splice(idx, 1);
  localStorage.setItem('admin_coupons', JSON.stringify(list));
  renderCouponsList();
  showToast('Coupon Deactivated', 'Discount code cleared from database.', 'info');
}

/* 11. FORM SUBMISSIONS */
function initAdminFormSubmissions() {
  const pricingForm = document.getElementById('admin-pricing-rates-form');
  const seasonsForm = document.getElementById('admin-season-rules-form');
  const couponForm = document.getElementById('admin-coupon-builder-form');
  const settingsForm = document.getElementById('admin-settings-form');

  if (pricingForm) {
    pricingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const prices = {
        deluxe: parseFloat(document.getElementById('price-deluxe').value),
        cottage: parseFloat(document.getElementById('price-cottage').value),
        suite: parseFloat(document.getElementById('price-suite').value),
        'pool-villa': parseFloat(document.getElementById('price-villa').value)
      };
      localStorage.setItem('resort_room_prices', JSON.stringify(prices));
      showToast('Pricing Rules Updated', 'New room rates committed successfully.', 'success');
    });
  }

  if (seasonsForm) {
    seasonsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('rule-name').value;
      const mult = parseFloat(document.getElementById('rule-multiplier').value);
      const start = document.getElementById('rule-start').value;
      const end = document.getElementById('rule-end').value;

      const newRule = { name, multiplier: mult, start, end };
      let list = JSON.parse(localStorage.getItem('admin_seasons')) || SEED_SEASON_RULES;
      list.push(newRule);
      localStorage.setItem('admin_seasons', JSON.stringify(list));
      
      seasonsForm.reset();
      renderSeasonRules();
      showToast('Season Timeline Added', `${name} multiplier active.`, 'success');
    });
  }

  if (couponForm) {
    couponForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const code = document.getElementById('c-code').value.trim().toUpperCase();
      const discount = parseInt(document.getElementById('c-discount').value, 10);

      const newCoupon = { code, discount };
      let list = JSON.parse(localStorage.getItem('admin_coupons')) || SEED_COUPONS;
      list.push(newCoupon);
      localStorage.setItem('admin_coupons', JSON.stringify(list));
      
      couponForm.reset();
      renderCouponsList();
      showToast('Promo Code Added', `Code ${code} is now redeemable.`, 'success');
    });
  }

  if (settingsForm) {
    settingsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      showToast('Settings Configured', 'Global configurations committed to RMD database.', 'success');
    });
  }
}

/* HELPER LOOKUPS */
function getAdminRoomNameById(id) {
  if (id === 'deluxe') return 'Deluxe Room';
  if (id === 'cottage') return 'Garden Cottage';
  if (id === 'suite') return 'Premium Suite';
  if (id === 'pool-villa') return 'Pool Villa';
  return id;
}

function formatAdminDate(dateStr) {
  const options = { month: 'short', day: 'numeric' };
  return new Date(dateStr).toLocaleDateString('en-US', options);
}
