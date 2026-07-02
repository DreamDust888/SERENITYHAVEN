/*
 * SERENITY HAVEN RESORT & SPA
 * Booking Engine & Checkout Wizard Controller
 */

// Local duplicate of database to remain modular and self-contained
const BOOKING_ROOMS_DATA = [
  { id: 'deluxe', name: 'Deluxe Room', price: 350, image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=400&q=80', description: 'Amalfi stone accents, private lemon grove view balcony.' },
  { id: 'cottage', name: 'Garden Cottage', price: 480, image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=400&q=80', description: 'Secluded olive garden stone house with log fireplace.' },
  { id: 'suite', name: 'Premium Suite', price: 720, image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=400&q=80', description: 'Marble lounge, private cliff plunge pool.' },
  { id: 'pool-villa', name: 'Pool Villa', price: 1100, image: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=400&q=80', description: '15m infinity pool, wine cellar, ocean deck.' }
];

const ADDONS_DATA = [
  { id: 'airport', name: 'Private Airport Pickup', price: 80, desc: 'Luxury chauffeured transport from Naples International (NAP)' },
  { id: 'spa', name: 'Thermal Spa Treatment', price: 150, desc: '90-minute customized volcanic clay oil massage' },
  { id: 'dinner', name: 'Private Beach Dinner', price: 200, desc: 'Secluded candlelight dining with personal sommelier' },
  { id: 'trekking', name: 'Ravello Guided Hike', price: 50, desc: 'Guided cliff trekking along historical panoramas' }
];

// Checkout State variables
let bookingState = {
  checkin: '',
  checkout: '',
  guests: '2',
  selectedRoomId: '',
  selectedAddons: [],
  promoCode: '',
  discountPercentage: 0,
  paymentMethod: 'card',
  guestName: '',
  guestEmail: '',
  guestPhone: '',
  guestRequests: ''
};

document.addEventListener('DOMContentLoaded', () => {
  syncAdminRoomPrices();
  parseQueryParams();
  initBookingDateListeners();
  renderRoomChoices();
  renderAddonChoices();
  initWizardNavigation();
  initPaymentSelectors();
  initCouponEngine();
  recalculateCheckoutPricing();
});

function syncAdminRoomPrices() {
  const customPrices = JSON.parse(localStorage.getItem('resort_room_prices'));
  if (customPrices) {
    BOOKING_ROOMS_DATA.forEach(room => {
      if (customPrices[room.id] !== undefined) {
        room.price = parseFloat(customPrices[room.id]);
      }
    });
  }
}

/* 1. QUERY PARAMETERS PARSER */
function parseQueryParams() {
  const params = new URLSearchParams(window.location.search);
  
  if (params.get('checkin')) bookingState.checkin = params.get('checkin');
  if (params.get('checkout')) bookingState.checkout = params.get('checkout');
  if (params.get('guests')) bookingState.guests = params.get('guests');
  if (params.get('roomType')) bookingState.selectedRoomId = params.get('roomType');
  if (params.get('promo')) {
    bookingState.promoCode = params.get('promo').toUpperCase();
    if (bookingState.promoCode === 'LUXURY20') bookingState.discountPercentage = 20;
    if (bookingState.promoCode === 'HONEYMOON') bookingState.discountPercentage = 10;
  }
}

/* 2. DATES SETUP */
function initBookingDateListeners() {
  const checkinInput = document.getElementById('booking-checkin');
  const checkoutInput = document.getElementById('booking-checkout');
  const guestsSelect = document.getElementById('booking-guests');

  if (checkinInput && checkoutInput) {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 3);

    // Initial value mappings
    checkinInput.value = bookingState.checkin || tomorrow.toISOString().split('T')[0];
    checkoutInput.value = bookingState.checkout || dayAfter.toISOString().split('T')[0];
    checkinInput.min = today.toISOString().split('T')[0];
    
    // Initial sync
    bookingState.checkin = checkinInput.value;
    bookingState.checkout = checkoutInput.value;

    checkinInput.addEventListener('change', () => {
      bookingState.checkin = checkinInput.value;
      const minCheck = new Date(checkinInput.value);
      minCheck.setDate(minCheck.getDate() + 1);
      checkoutInput.value = minCheck.toISOString().split('T')[0];
      checkoutInput.min = minCheck.toISOString().split('T')[0];
      bookingState.checkout = checkoutInput.value;
      recalculateCheckoutPricing();
    });

    checkoutInput.addEventListener('change', () => {
      bookingState.checkout = checkoutInput.value;
      recalculateCheckoutPricing();
    });
  }

  if (guestsSelect) {
    guestsSelect.value = bookingState.guests;
    guestsSelect.addEventListener('change', () => {
      bookingState.guests = guestsSelect.value;
      recalculateCheckoutPricing();
    });
  }
}

/* 3. ROOM CHOICES LISTING */
function renderRoomChoices() {
  const container = document.getElementById('room-selection-container');
  if (!container) return;

  container.innerHTML = BOOKING_ROOMS_DATA.map(room => `
    <div class="room-choice-card ${bookingState.selectedRoomId === room.id ? 'selected' : ''}" data-id="${room.id}">
      <img src="${room.image}" alt="${room.name}" class="room-choice-img" loading="lazy">
      <div class="room-choice-body">
        <div class="room-choice-top">
          <div>
            <h4 class="room-choice-title">${room.name}</h4>
            <p style="font-size:0.8rem; margin: 0;">${room.description}</p>
          </div>
          <div class="room-choice-rate">
            $${room.price}
            <span>/ night</span>
          </div>
        </div>
        <div style="text-align: right; margin-top: var(--spacing-sm);">
          <span class="badge ${bookingState.selectedRoomId === room.id ? 'badge-gold' : 'badge-gray'} select-status-badge">
            ${bookingState.selectedRoomId === room.id ? 'Selected' : 'Select'}
          </span>
        </div>
      </div>
    </div>
  `).join('');

  // Attach card click triggers
  container.querySelectorAll('.room-choice-card').forEach(card => {
    card.addEventListener('click', () => {
      container.querySelectorAll('.room-choice-card').forEach(el => {
        el.classList.remove('selected');
        el.querySelector('.select-status-badge').textContent = 'Select';
        el.querySelector('.select-status-badge').className = 'badge badge-gray select-status-badge';
      });
      
      card.classList.add('selected');
      card.querySelector('.select-status-badge').textContent = 'Selected';
      card.querySelector('.select-status-badge').className = 'badge badge-gold select-status-badge';
      
      bookingState.selectedRoomId = card.dataset.id;
      recalculateCheckoutPricing();
    });
  });
}

/* 4. CONCIERGE ADD-ONS RENDERING */
function renderAddonChoices() {
  const container = document.getElementById('services-addons-container');
  if (!container) return;

  container.innerHTML = ADDONS_DATA.map(addon => `
    <div class="extra-service-card" data-id="${addon.id}">
      <input type="checkbox" id="addon-chk-${addon.id}">
      <div class="extra-service-details">
        <h4>${addon.name}</h4>
        <p>${addon.desc}</p>
      </div>
      <div class="extra-service-price">+$${addon.price}</div>
    </div>
  `).join('');

  // Attach checkbox events
  container.querySelectorAll('.extra-service-card').forEach(card => {
    const chk = card.querySelector('input[type="checkbox"]');
    
    const toggleSelection = () => {
      const id = card.dataset.id;
      if (chk.checked) {
        card.classList.add('selected');
        if (!bookingState.selectedAddons.includes(id)) {
          bookingState.selectedAddons.push(id);
        }
      } else {
        card.classList.remove('selected');
        bookingState.selectedAddons = bookingState.selectedAddons.filter(a => a !== id);
      }
      recalculateCheckoutPricing();
    };

    card.addEventListener('click', (e) => {
      if (e.target !== chk) {
        chk.checked = !chk.checked;
      }
      toggleSelection();
    });
  });
}

/* 5. PRICING CALCULATIONS ENGINE */
function recalculateCheckoutPricing() {
  const room = BOOKING_ROOMS_DATA.find(r => r.id === bookingState.selectedRoomId);
  const pricingList = document.getElementById('summary-pricing-list');
  const emptyState = document.getElementById('summary-empty-state');
  
  if (!room) {
    if (pricingList) pricingList.style.display = 'none';
    if (emptyState) emptyState.style.display = 'block';
    return;
  }

  if (pricingList) pricingList.style.display = 'block';
  if (emptyState) emptyState.style.display = 'none';

  // Calculate stays nights
  const start = new Date(bookingState.checkin);
  const end = new Date(bookingState.checkout);
  const nights = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));

  // Iterate nights to apply dynamic rules
  let baseRateTotal = 0;
  let weekendPremium = 0;
  let seasonalMarkup = 0;
  
  for (let i = 0; i < nights; i++) {
    const currentDate = new Date(start);
    currentDate.setDate(currentDate.getDate() + i);
    
    let rate = room.price;
    const day = currentDate.getDay(); // 0: Sun, 5: Fri, 6: Sat
    
    // Weekend Premium: +15% Friday & Saturday
    if (day === 5 || day === 6) {
      weekendPremium += rate * 0.15;
    }

    // Seasonal Markup: Peak Festive (Dec 15 - Jan 5) +35%, Summer Peak (Jun 1 - Aug 31) +10%
    const month = currentDate.getMonth(); // 0-indexed
    const date = currentDate.getDate();
    if ((month === 11 && date >= 15) || (month === 0 && date <= 5)) {
      seasonalMarkup += rate * 0.35;
    } else if (month >= 5 && month <= 7) {
      // June, July, August
      seasonalMarkup += rate * 0.10;
    }
    
    baseRateTotal += rate;
  }

  // Calculate Add-on items
  let addonsSum = 0;
  bookingState.selectedAddons.forEach(addonId => {
    const ad = ADDONS_DATA.find(a => a.id === addonId);
    if (ad) addonsSum += ad.price;
  });

  // Calculate discounts
  let roomSubtotal = baseRateTotal + weekendPremium + seasonalMarkup;
  let discount = roomSubtotal * (bookingState.discountPercentage / 100);

  // Taxes
  let netTaxable = roomSubtotal + addonsSum - discount;
  let luxuryTax = netTaxable * 0.12;
  let serviceCharge = netTaxable * 0.05;
  let grandTotal = netTaxable + luxuryTax + serviceCharge;

  // Sidebar updates
  document.getElementById('sum-room-name').textContent = room.name;
  document.getElementById('sum-dates').textContent = `${formatDate(bookingState.checkin)} – ${formatDate(bookingState.checkout)} (${nights} Nights)`;
  document.getElementById('sum-base-label').textContent = `Base Rate (${nights} Nights)`;
  document.getElementById('sum-base-price').textContent = `$${baseRateTotal.toFixed(2)}`;

  // Surcharges display
  toggleSummaryRow('sum-season-row', 'sum-season-price', seasonalMarkup);
  toggleSummaryRow('sum-weekend-row', 'sum-weekend-price', weekendPremium);
  toggleSummaryRow('sum-addons-row', 'sum-addons-price', addonsSum);
  toggleSummaryRow('sum-discount-row', 'sum-discount-price', discount, true);

  document.getElementById('sum-tax-price').textContent = `$${luxuryTax.toFixed(2)}`;
  document.getElementById('sum-service-price').textContent = `$${serviceCharge.toFixed(2)}`;
  document.getElementById('sum-grand-total').textContent = `$${grandTotal.toFixed(2)}`;

  // Store calculated rates in state to output in the receipt invoice
  bookingState.billing = {
    nights,
    baseRateTotal,
    weekendPremium,
    seasonalMarkup,
    addonsSum,
    discount,
    luxuryTax,
    serviceCharge,
    grandTotal
  };
}

function toggleSummaryRow(rowId, valId, value, isNegative = false) {
  const row = document.getElementById(rowId);
  const field = document.getElementById(valId);
  if (value > 0) {
    row.style.display = 'flex';
    field.textContent = `${isNegative ? '-' : ''}$${value.toFixed(2)}`;
  } else {
    row.style.display = 'none';
  }
}

/* 6. WIZARD STEP NAVIGATION */
function initWizardNavigation() {
  const next1 = document.getElementById('btn-next-1');
  const next2 = document.getElementById('btn-next-2');
  const back2 = document.getElementById('btn-back-2');
  const back3 = document.getElementById('btn-back-3');
  const completeBookingBtn = document.getElementById('btn-complete-booking');

  if (next1) {
    next1.addEventListener('click', () => {
      if (!bookingState.selectedRoomId) {
        showToast('Room Required', 'Please select one of our premium havens to proceed.', 'error');
        return;
      }
      transitionToStep(2);
    });
  }

  if (next2) {
    next2.addEventListener('click', () => {
      if (validateStep2()) {
        transitionToStep(3);
      }
    });
  }

  if (back2) {
    back2.addEventListener('click', () => transitionToStep(1));
  }

  if (back3) {
    back3.addEventListener('click', () => transitionToStep(2));
  }

  if (completeBookingBtn) {
    completeBookingBtn.addEventListener('click', () => {
      if (validateStep3()) {
        processPaymentAndSubmit();
      }
    });
  }
}

function transitionToStep(stepNum) {
  // Toggle panels
  document.querySelectorAll('.wizard-step-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(`step-panel-${stepNum}`).classList.add('active');

  // Toggle dots
  document.querySelectorAll('.step-indicator .step-node').forEach((node, idx) => {
    node.className = 'step-node';
    if (idx + 1 < stepNum) {
      node.classList.add('completed');
    } else if (idx + 1 === stepNum) {
      node.classList.add('active');
    }
  });

  window.scrollTo({ top: 120, behavior: 'smooth' });
}

/* 7. STEP VALIDATIONS */
function validateStep2() {
  const name = document.getElementById('guest-name');
  const email = document.getElementById('guest-email');
  const phone = document.getElementById('guest-phone');
  let isValid = true;

  if (!name.value.trim()) {
    name.classList.add('is-invalid');
    isValid = false;
  } else {
    name.classList.remove('is-invalid');
  }

  if (!email.value.trim() || !validateEmailFormat(email.value)) {
    email.classList.add('is-invalid');
    isValid = false;
  } else {
    email.classList.remove('is-invalid');
  }

  if (!phone.value.trim()) {
    phone.classList.add('is-invalid');
    isValid = false;
  } else {
    phone.classList.remove('is-invalid');
  }

  if (isValid) {
    bookingState.guestName = name.value.trim();
    bookingState.guestEmail = email.value.trim();
    bookingState.guestPhone = phone.value.trim();
    bookingState.guestRequests = document.getElementById('guest-requests').value.trim();
  } else {
    showToast('Missing details', 'Please fill in all primary guest fields correctly.', 'error');
  }

  return isValid;
}

function validateStep3() {
  let isValid = true;

  if (bookingState.paymentMethod === 'card') {
    const num = document.getElementById('card-num');
    const expiry = document.getElementById('card-expiry');
    const cvv = document.getElementById('card-cvv');

    if (num.value.replace(/\s/g, '').length < 16) {
      num.classList.add('is-invalid');
      isValid = false;
    } else {
      num.classList.remove('is-invalid');
    }

    if (!expiry.value.includes('/') || expiry.value.length < 5) {
      expiry.classList.add('is-invalid');
      isValid = false;
    } else {
      expiry.classList.remove('is-invalid');
    }

    if (cvv.value.length < 3) {
      cvv.classList.add('is-invalid');
      isValid = false;
    } else {
      cvv.classList.remove('is-invalid');
    }
  } else {
    const vpa = document.getElementById('upi-vpa');
    if (!vpa.value.includes('@')) {
      vpa.classList.add('is-invalid');
      isValid = false;
    } else {
      vpa.classList.remove('is-invalid');
    }
  }

  const terms = document.getElementById('terms-chk');
  const termsFeedback = document.getElementById('terms-feedback');
  if (!terms.checked) {
    termsFeedback.style.display = 'block';
    isValid = false;
  } else {
    termsFeedback.style.display = 'none';
  }

  if (!isValid) {
    showToast('Validation Error', 'Verify payment details and accept resort terms.', 'error');
  }

  return isValid;
}

/* 8. PAYMENT CHANNELS SELECTORS */
function initPaymentSelectors() {
  const payCardBtn = document.getElementById('pay-card-btn');
  const payUpiBtn = document.getElementById('pay-upi-btn');
  const cardForm = document.getElementById('credit-card-form');
  const upiForm = document.getElementById('upi-payment-form');

  if (payCardBtn && payUpiBtn) {
    payCardBtn.addEventListener('click', () => {
      payCardBtn.classList.add('selected');
      payUpiBtn.classList.remove('selected');
      cardForm.style.display = 'block';
      upiForm.style.display = 'none';
      bookingState.paymentMethod = 'card';
    });

    payUpiBtn.addEventListener('click', () => {
      payUpiBtn.classList.add('selected');
      payCardBtn.classList.remove('selected');
      cardForm.style.display = 'none';
      upiForm.style.display = 'block';
      bookingState.paymentMethod = 'upi';
    });

    // Formatting credit card input automatically
    const cardInput = document.getElementById('card-num');
    if (cardInput) {
      cardInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        let formatted = '';
        for (let i = 0; i < value.length; i++) {
          if (i > 0 && i % 4 === 0) formatted += ' ';
          formatted += value[i];
        }
        e.target.value = formatted;
      });
    }
  }
}

/* 9. PROMO CODES ENGINE */
function initCouponEngine() {
  const applyBtn = document.getElementById('btn-apply-coupon');
  const couponInput = document.getElementById('coupon-code');
  const feedback = document.getElementById('coupon-feedback');

  if (applyBtn && couponInput) {
    // Check state init
    if (bookingState.promoCode) {
      couponInput.value = bookingState.promoCode;
    }

    applyBtn.addEventListener('click', () => {
      const code = couponInput.value.trim().toUpperCase();
      if (!code) return;

      if (code === 'LUXURY20') {
        bookingState.discountPercentage = 20;
        feedback.textContent = 'Promo Applied: 20% room discount applied!';
        feedback.style.color = 'var(--color-emerald)';
        showToast('Promo Code Applied', 'LUXURY20 coupon has activated a 20% room discount.', 'success');
      } else if (code === 'HONEYMOON') {
        bookingState.discountPercentage = 10;
        feedback.textContent = 'Honeymoon Special: 10% discount + champagne bottle unlocked!';
        feedback.style.color = 'var(--color-emerald)';
        showToast('Honeymoon Offer Applied', 'HONEYMOON package applied successfully.', 'success');
      } else {
        bookingState.discountPercentage = 0;
        feedback.textContent = 'Invalid or expired promotional code.';
        feedback.style.color = '#dc2626';
        showToast('Invalid Coupon', 'Code not recognized or expired.', 'error');
      }
      bookingState.promoCode = code;
      recalculateCheckoutPricing();
    });

    // Trigger initial load application
    if (bookingState.promoCode) {
      applyBtn.click();
    }
  }
}

/* 10. SUBMIT & INVOICE GENERATOR */
function processPaymentAndSubmit() {
  const loader = document.getElementById('payment-loader-overlay');
  if (loader) loader.style.display = 'flex';

  setTimeout(() => {
    if (loader) loader.style.display = 'none';

    // Commit to localStorage
    const invoiceId = 'SH-2026-' + Math.floor(10000 + Math.random() * 90000);
    const issueDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    
    bookingState.invoiceId = invoiceId;
    bookingState.issueDate = issueDate;
    
    // Save to global list
    let list = JSON.parse(localStorage.getItem('resort_bookings')) || [];
    list.push(bookingState);
    localStorage.setItem('resort_bookings', JSON.stringify(list));

    // Populate Invoice UI
    populateInvoiceUI();

    transitionToStep(4);
    showToast('Stay Reserved', 'We look forward to welcoming you to the Amalfi Coast.', 'success');
  }, 2200); // 2.2s simulated transaction delay
}

function populateInvoiceUI() {
  document.getElementById('invoice-id-field').textContent = `Invoice #: ${bookingState.invoiceId}`;
  document.getElementById('invoice-date-field').textContent = `Issued: ${bookingState.issueDate}`;
  document.getElementById('inv-guest-name').textContent = bookingState.guestName;
  document.getElementById('inv-guest-email').textContent = bookingState.guestEmail;
  document.getElementById('inv-guest-phone').textContent = bookingState.guestPhone;

  const room = BOOKING_ROOMS_DATA.find(r => r.id === bookingState.selectedRoomId);
  document.getElementById('inv-booking-room').textContent = `Haven: ${room.name}`;
  document.getElementById('inv-booking-dates').textContent = `${formatDate(bookingState.checkin)} - ${formatDate(bookingState.checkout)}`;
  document.getElementById('inv-booking-nights').textContent = `Nights: ${bookingState.billing.nights} Nights`;

  // Render Invoice Table rows
  const tbody = document.getElementById('invoice-items-body');
  let tableHTML = `
    <tr>
      <td>${room.name} Accommodations (${bookingState.billing.nights} Nights)</td>
      <td style="text-align: right;">$${room.price.toFixed(2)}</td>
      <td style="text-align: right;">$${bookingState.billing.baseRateTotal.toFixed(2)}</td>
    </tr>
  `;

  if (bookingState.billing.weekendPremium > 0) {
    tableHTML += `
      <tr>
        <td>Weekend Premium surcharge</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right;">+$${bookingState.billing.weekendPremium.toFixed(2)}</td>
      </tr>
    `;
  }

  if (bookingState.billing.seasonalMarkup > 0) {
    tableHTML += `
      <tr>
        <td>Seasonal markup premium</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right;">+$${bookingState.billing.seasonalMarkup.toFixed(2)}</td>
      </tr>
    `;
  }

  bookingState.selectedAddons.forEach(id => {
    const ad = ADDONS_DATA.find(a => a.id === id);
    if (ad) {
      tableHTML += `
        <tr>
          <td>Concierge service: ${ad.name}</td>
          <td style="text-align: right;">$${ad.price.toFixed(2)}</td>
          <td style="text-align: right;">$${ad.price.toFixed(2)}</td>
        </tr>
      `;
    }
  });

  tbody.innerHTML = tableHTML;

  // Invoice pricing block
  document.getElementById('inv-subtotal').textContent = `$${(bookingState.billing.baseRateTotal + bookingState.billing.weekendPremium + bookingState.billing.seasonalMarkup + bookingState.billing.addonsSum).toFixed(2)}`;
  
  const discountRow = document.getElementById('inv-discount-row');
  if (bookingState.billing.discount > 0) {
    discountRow.style.display = 'flex';
    document.getElementById('inv-discount').textContent = `-$${bookingState.billing.discount.toFixed(2)} (${bookingState.promoCode})`;
  } else {
    discountRow.style.display = 'none';
  }

  document.getElementById('inv-tax').textContent = `$${bookingState.billing.luxuryTax.toFixed(2)}`;
  document.getElementById('inv-service').textContent = `$${bookingState.billing.serviceCharge.toFixed(2)}`;
  document.getElementById('inv-total').textContent = `$${bookingState.billing.grandTotal.toFixed(2)}`;
}

/* HELPERS */
function validateEmailFormat(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function formatDate(dateStr) {
  const options = { month: 'short', day: 'numeric', year: 'numeric' };
  return new Date(dateStr).toLocaleDateString('en-US', options);
}
