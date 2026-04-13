/**
 * SmartBus — Surveillance & Ticket Integrity System
 * script.js
 *
 * Modules:
 *  1. Data definitions (stops, buses, seats)
 *  2. App state
 *  3. Navigation
 *  4. Step 1: Route selection
 *  5. Step 2: Passenger details
 *  6. Step 3: Bus & seat assignment
 *  7. Step 4: Payment
 *  8. Step 5: Ticket display
 *  9. Dashboard / Surveillance
 * 10. QR Scanner & fraud detection
 * 11. Utilities (modal, QR generation)
 */

'use strict';

/* ══════════════════════════════════════════════
   1. DATA DEFINITIONS
══════════════════════════════════════════════ */

/** Five predefined bus stops with names and icons */
const BUS_STOPS = [
  { id: 1, name: 'Central Station',  icon: '🏛️' },
  { id: 2, name: 'Tech Park',         icon: '💻' },
  { id: 3, name: 'Old City',          icon: '🕌' },
  { id: 4, name: 'Airport Terminal',  icon: '✈️' },
  { id: 5, name: 'University Gate',   icon: '🎓' },
];

/** Fare per stop-distance (in ₹) */
const FARE_PER_STOP = 12;

/**
 * Available buses — seats array:
 * null = available, 'M' = male passenger, 'F' = female passenger
 */
const BUSES_DATA = [
  {
    id: 'BUS-07',
    route: 'Circular Route A',
    seats: ['M','F','M',null,'F',null,null,'M',null,null,'F',null,'M',null,null,null],
    status: 'ON TIME',
  },
  {
    id: 'BUS-12',
    route: 'Express Route B',
    seats: ['M','M',null,null,'F','F',null,'M',null,null,null,'M',null,null,'F',null],
    status: 'BOARDING',
  },
  {
    id: 'BUS-03',
    route: 'Local Route C',
    seats: [null,null,'F','M','M',null,null,null,'F',null,'M','M',null,null,null,null],
    status: 'DELAYED',
  },
];

/* ══════════════════════════════════════════════
   2. APP STATE
══════════════════════════════════════════════ */

const state = {
  currentStep: 1,
  fromStop: null,      // BUS_STOPS object
  toStop: null,        // BUS_STOPS object
  fare: 0,
  passenger: {
    name: '',
    gender: 'male',
    phone: '',
  },
  selectedBus: null,   // BUSES_DATA object (cloned)
  assignedSeat: null,  // seat index
  ticketId: '',
  ticketData: null,    // full ticket payload
  paymentDone: false,
  scannedTickets: {},  // { ticketId: scanCount } — fraud detection
};

/* ══════════════════════════════════════════════
   3. NAVIGATION — view switching
══════════════════════════════════════════════ */

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.view;

    // Update nav button states
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Show the right view
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(`view-${target}`).classList.add('active');

    // Refresh dashboard when switched to
    if (target === 'dashboard') renderDashboard();
  });
});

/* ══════════════════════════════════════════════
   4. STEP 1 — ROUTE SELECTION
══════════════════════════════════════════════ */

/** Render the 5 stop buttons */
function renderStops() {
  const grid = document.getElementById('stopsGrid');
  grid.innerHTML = '';

  BUS_STOPS.forEach(stop => {
    const btn = document.createElement('button');
    btn.className = 'stop-btn';
    btn.innerHTML = `
      <span class="stop-num">STOP ${stop.id}</span>
      <span class="stop-name">${stop.icon} ${stop.name}</span>
    `;
    btn.dataset.id = stop.id;

    // Two-tap logic: first tap = FROM, second tap (different stop) = TO
    btn.addEventListener('click', () => handleStopSelect(stop));
    grid.appendChild(btn);
  });
}

function handleStopSelect(stop) {
  // Prevent selecting same stop twice
  if (state.fromStop && state.fromStop.id === stop.id) {
    // Deselect FROM
    state.fromStop = null;
  } else if (state.toStop && state.toStop.id === stop.id) {
    // Deselect TO
    state.toStop = null;
  } else if (!state.fromStop) {
    state.fromStop = stop;
  } else if (!state.toStop) {
    state.toStop = stop;
  } else {
    // Both selected — reset and start over
    state.fromStop = stop;
    state.toStop = null;
  }

  updateStopUI();
}

function updateStopUI() {
  // Update button styles
  document.querySelectorAll('.stop-btn').forEach(btn => {
    const id = parseInt(btn.dataset.id);
    btn.classList.remove('from', 'to');
    if (state.fromStop && state.fromStop.id === id) btn.classList.add('from');
    if (state.toStop && state.toStop.id === id) btn.classList.add('to');
  });

  // Update route display
  document.getElementById('fromStop').textContent =
    state.fromStop ? `${state.fromStop.icon} ${state.fromStop.name}` : '— Select a stop —';
  document.getElementById('toStop').textContent =
    state.toStop ? `${state.toStop.icon} ${state.toStop.name}` : '— Select a stop —';

  // Calculate fare if both stops selected
  if (state.fromStop && state.toStop) {
    const stops = Math.abs(state.toStop.id - state.fromStop.id);
    state.fare = stops * FARE_PER_STOP;
    document.getElementById('fareStops').textContent = `${stops} stop${stops > 1 ? 's' : ''}`;
    document.getElementById('fareAmount').textContent = `₹${state.fare}`;
    document.getElementById('farePreview').style.display = 'flex';
    document.getElementById('step1Next').disabled = false;
  } else {
    document.getElementById('farePreview').style.display = 'none';
    document.getElementById('step1Next').disabled = true;
  }
}

/** Step 1 → Step 2 */
document.getElementById('step1Next').addEventListener('click', () => goToStep(2));

/* ══════════════════════════════════════════════
   5. STEP 2 — PASSENGER DETAILS
══════════════════════════════════════════════ */

// Gender toggle
document.querySelectorAll('.gender-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.gender-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.passenger.gender = btn.dataset.gender;
  });
});

document.getElementById('step2Back').addEventListener('click', () => goToStep(1));

document.getElementById('step2Next').addEventListener('click', () => {
  const name = document.getElementById('passengerName').value.trim();
  const phone = document.getElementById('passengerPhone').value.trim();

  if (!name) return showModal('⚠️', 'Missing Info', 'Please enter your full name.');
  if (!phone) return showModal('⚠️', 'Missing Info', 'Please enter your phone number.');

  state.passenger.name = name;
  state.passenger.phone = phone;
  goToStep(3);
  renderBusList();
});

/* ══════════════════════════════════════════════
   6. STEP 3 — BUS & SEAT ASSIGNMENT
══════════════════════════════════════════════ */

/** Render available buses */
function renderBusList() {
  const list = document.getElementById('busList');
  list.innerHTML = '';

  // Deep-clone bus data so seat changes are local to this session
  const buses = BUSES_DATA.map(b => ({
    ...b,
    seats: [...b.seats],
  }));

  // Store cloned buses on state for seat manipulation
  state.availableBuses = buses;

  buses.forEach((bus, idx) => {
    const availableCount = bus.seats.filter(s => s === null).length;
    const isFull = availableCount === 0;

    const item = document.createElement('div');
    item.className = 'bus-item';
    item.innerHTML = `
      <span class="bus-item-num">${bus.id}</span>
      <span class="bus-item-info">${bus.route} · ${bus.status}</span>
      <span class="bus-item-seats ${isFull ? 'seats-low' : 'seats-ok'}">
        ${isFull ? 'FULL' : `${availableCount} seats`}
      </span>
    `;

    if (!isFull) {
      item.addEventListener('click', () => selectBus(idx, item));
    } else {
      item.style.opacity = '0.5';
      item.style.cursor = 'not-allowed';
    }

    list.appendChild(item);
  });
}

/** Handle bus selection and seat assignment */
function selectBus(busIdx, clickedItem) {
  // Highlight selected bus
  document.querySelectorAll('.bus-item').forEach(i => i.classList.remove('selected'));
  clickedItem.classList.add('selected');

  const bus = state.availableBuses[busIdx];
  state.selectedBus = bus;

  // Auto-assign seat based on gender
  const seatIndex = assignSeat(bus, state.passenger.gender);
  state.assignedSeat = seatIndex;

  // Mark seat in data
  const genderCode = state.passenger.gender === 'female' ? 'F' : 'M';
  bus.seats[seatIndex] = genderCode;

  // Show seat map
  document.getElementById('selectedBusLabel').textContent = bus.id;
  renderSeatMap(bus, seatIndex);
  document.getElementById('seatMapWrapper').style.display = 'block';

  // Show assignment result
  document.getElementById('assignedBus').textContent = bus.id;
  document.getElementById('assignedSeat').textContent = `Seat ${seatIndex + 1}`;
  document.getElementById('assignmentResult').style.display = 'block';

  document.getElementById('step3Next').disabled = false;
}

/**
 * Seat assignment logic:
 * - Female passenger: prefer seat adjacent to another female
 * - Otherwise: first available seat
 */
function assignSeat(bus, gender) {
  const seats = bus.seats;

  if (gender === 'female') {
    // Find available seat next to an existing female
    for (let i = 0; i < seats.length; i++) {
      if (seats[i] === null) {
        // Check neighbors (same row = every 4 seats, adjacent column)
        const neighbors = [i - 1, i + 1];
        for (const n of neighbors) {
          if (n >= 0 && n < seats.length && seats[n] === 'F') {
            return i; // Seat adjacent to female found
          }
        }
      }
    }
  }

  // Default: first available seat
  return seats.findIndex(s => s === null);
}

/** Render seat map grid (4 columns = 2+aisle+2) */
function renderSeatMap(bus, assignedIdx) {
  const map = document.getElementById('seatMap');
  map.innerHTML = '';

  bus.seats.forEach((seat, i) => {
    const el = document.createElement('div');
    el.className = 'seat';

    if (i === assignedIdx) {
      el.classList.add('assigned');
      el.textContent = `${i + 1}`;
    } else if (seat === null) {
      el.classList.add('available');
      el.textContent = `${i + 1}`;
    } else if (seat === 'F') {
      el.classList.add('female');
      el.textContent = '♀';
    } else {
      el.classList.add('occupied');
      el.textContent = '♂';
    }

    // Add aisle gap after every 2 seats (columns 2 and 3)
    if ((i % 4) === 1) {
      el.style.marginRight = '14px';
    }

    map.appendChild(el);
  });
}

document.getElementById('step3Back').addEventListener('click', () => {
  document.getElementById('seatMapWrapper').style.display = 'none';
  document.getElementById('assignmentResult').style.display = 'none';
  document.getElementById('step3Next').disabled = true;
  state.selectedBus = null;
  state.assignedSeat = null;
  goToStep(2);
});

document.getElementById('step3Next').addEventListener('click', () => {
  goToStep(4);
  renderPaymentStep();
});

/* ══════════════════════════════════════════════
   7. STEP 4 — PAYMENT
══════════════════════════════════════════════ */

function renderPaymentStep() {
  // Summary
  const summary = document.getElementById('paymentSummary');
  summary.innerHTML = `
    <div class="pay-row"><span>Route</span><strong>${state.fromStop.name} → ${state.toStop.name}</strong></div>
    <div class="pay-row"><span>Bus</span><strong>${state.selectedBus.id}</strong></div>
    <div class="pay-row"><span>Seat</span><strong>Seat ${state.assignedSeat + 1}</strong></div>
    <div class="pay-row"><span>Passenger</span><strong>${state.passenger.name}</strong></div>
    <div class="pay-row"><span>Total Fare</span><strong>₹${state.fare}</strong></div>
  `;

  // Generate payment QR (contains UPI-like string)
  const paymentString = `upi://pay?pa=smartbus@upi&pn=SmartBus&am=${state.fare}&cu=INR&tn=Ticket-${state.fromStop.name}-to-${state.toStop.name}`;
  generateQR('paymentQR', paymentString, 140);

  // Reset status
  const statusEl = document.getElementById('paymentStatus');
  statusEl.className = 'payment-status';
  statusEl.style.display = 'none';
  state.paymentDone = false;
}

/** Simulate payment SUCCESS */
document.getElementById('simulatePaySuccess').addEventListener('click', () => {
  const statusEl = document.getElementById('paymentStatus');
  statusEl.className = 'payment-status success';
  statusEl.textContent = '✓ Payment Successful! Processing your ticket...';
  state.paymentDone = true;

  // Auto-advance to ticket step after 1.2 seconds
  setTimeout(() => {
    goToStep(5);
    generateTicket();
  }, 1200);
});

/** Simulate payment FAILURE */
document.getElementById('simulatePayFail').addEventListener('click', () => {
  const statusEl = document.getElementById('paymentStatus');
  statusEl.className = 'payment-status fail';
  statusEl.textContent = '✗ Payment Failed! Please try again or use another method.';
  state.paymentDone = false;
});

document.getElementById('step4Back').addEventListener('click', () => goToStep(3));

/* ══════════════════════════════════════════════
   8. STEP 5 — TICKET DISPLAY
══════════════════════════════════════════════ */

function generateTicket() {
  // Generate unique ticket ID
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  state.ticketId = `TKT-${datePart}-${randPart}`;

  // Store ticket data for scanner fraud detection
  state.ticketData = {
    id: state.ticketId,
    from: state.fromStop.name,
    to: state.toStop.name,
    bus: state.selectedBus.id,
    seat: state.assignedSeat + 1,
    fare: state.fare,
    passenger: state.passenger.name,
    gender: state.passenger.gender,
    issuedAt: new Date().toLocaleTimeString(),
  };

  // Register ticket in scanner registry (0 scans so far)
  state.scannedTickets[state.ticketId] = 0;

  // Route display
  document.getElementById('ticketRoute').textContent =
    `${state.fromStop.icon} ${state.fromStop.name}  →  ${state.toStop.icon} ${state.toStop.name}`;

  // Details grid
  document.getElementById('ticketDetails').innerHTML = `
    <div class="ticket-detail-item"><label>BUS NO.</label><span>${state.selectedBus.id}</span></div>
    <div class="ticket-detail-item"><label>SEAT</label><span>#${state.assignedSeat + 1}</span></div>
    <div class="ticket-detail-item"><label>FARE</label><span>₹${state.fare}</span></div>
    <div class="ticket-detail-item"><label>GENDER</label><span>${state.passenger.gender.toUpperCase()}</span></div>
  `;

  // Footer info
  document.getElementById('ticketFooter').textContent =
    `${state.ticketId}  ·  ${state.passenger.name}  ·  ${new Date().toLocaleDateString()}`;

  // Ticket badge
  const badge = document.getElementById('ticketStatus');
  badge.textContent = 'VALID';
  badge.className = 'ticket-badge valid';

  // Generate ticket QR (contains all ticket info as JSON string)
  const qrPayload = JSON.stringify({
    id: state.ticketId,
    from: state.fromStop.name,
    to: state.toStop.name,
    bus: state.selectedBus.id,
    seat: state.assignedSeat + 1,
    fare: state.fare,
  });

  // Clear old QR and generate new
  document.getElementById('ticketQR').innerHTML = '';
  generateQR('ticketQR', qrPayload, 150);

  // Pre-fill the scanner with this ticket ID for demo convenience
  document.getElementById('scanInput').value = state.ticketId;

  // Add a new alert to the dashboard
  addAlert('info', `🎟️ New ticket issued: ${state.ticketId} — ${state.fromStop.name} → ${state.toStop.name}`, now());
}

document.getElementById('newBooking').addEventListener('click', resetBooking);

document.getElementById('goToDashboard').addEventListener('click', () => {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('[data-view="dashboard"]').classList.add('active');
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-dashboard').classList.add('active');
  renderDashboard();
});

/* ══════════════════════════════════════════════
   9. DASHBOARD / SURVEILLANCE
══════════════════════════════════════════════ */

// Pre-populated alert log
const alertLog = [
  { type: 'danger', icon: '🚨', text: 'Duplicate QR scan detected — Bus BUS-07, Stop 2', time: '09:14' },
  { type: 'warn',   icon: '⚠️',  text: 'Route 3 running 5 min behind schedule',           time: '09:22' },
  { type: 'info',   icon: 'ℹ️',  text: 'BUS-12 departed Airport Terminal on time',        time: '09:35' },
  { type: 'danger', icon: '🚨', text: 'Unverified passenger flagged — Seat 7, BUS-03',   time: '09:41' },
  { type: 'info',   icon: '✅',  text: 'Fraud alert cleared — Inspector confirmed',        time: '09:48' },
];

function renderDashboard() {
  renderBusMonitorGrid();
  renderAlertLog();
  renderRouteMap();
  animateStats();
}

/** Render bus monitor cards */
function renderBusMonitorGrid() {
  const grid = document.getElementById('busMonitorGrid');
  grid.innerHTML = '';

  // Add extra dummy buses for dashboard display
  const dashBuses = [
    ...BUSES_DATA,
    { id: 'BUS-19', route: 'Express Route D', seats: new Array(16).fill('M').map((v,i)=>i<12?v:null), status: 'ON TIME' },
    { id: 'BUS-21', route: 'Local Route E',   seats: new Array(16).fill(null), status: 'BOARDING' },
    { id: 'BUS-05', route: 'Circular Route F', seats: new Array(16).fill('M').map((v,i)=>i<8?v:null), status: 'DELAYED' },
  ];

  dashBuses.forEach(bus => {
    const occupied = bus.seats.filter(s => s !== null).length;
    const total    = bus.seats.length;
    const pct      = Math.round((occupied / total) * 100);

    const statusClass = bus.status === 'ON TIME'  ? 'on-time'
                      : bus.status === 'BOARDING'  ? 'boarding'
                      : 'delayed';

    const card = document.createElement('div');
    card.className = 'bus-monitor-card';
    card.innerHTML = `
      <div class="bmc-top">
        <span class="bmc-num">${bus.id}</span>
        <span class="bmc-status ${statusClass}">${bus.status}</span>
      </div>
      <div class="bmc-route">${bus.route}</div>
      <div class="bmc-occupancy-bar">
        <div class="bmc-occupancy-fill" style="width:${pct}%"></div>
      </div>
      <div class="bmc-meta">
        <span>${occupied}/${total} passengers</span>
        <span>${pct}% full</span>
      </div>
    `;
    grid.appendChild(card);
  });
}

/** Render alert log */
function renderAlertLog() {
  const log = document.getElementById('alertLog');
  log.innerHTML = '';
  alertLog.forEach(alert => {
    log.appendChild(buildAlertEl(alert.type, alert.text, alert.time));
  });
}

/** Add a dynamic alert to the log */
function addAlert(type, text, time) {
  alertLog.unshift({ type, icon: type === 'danger' ? '🚨' : type === 'warn' ? '⚠️' : 'ℹ️', text, time });
  // Update alert count stat
  const dangerCount = alertLog.filter(a => a.type === 'danger').length;
  document.getElementById('statAlerts').textContent = dangerCount;
}

function buildAlertEl(type, text, time) {
  const el = document.createElement('div');
  el.className = `alert-item ${type}`;
  el.innerHTML = `
    <span class="alert-text">${text}</span>
    <span class="alert-time">${time}</span>
  `;
  return el;
}

/** Render route map visual (horizontal stop line) */
function renderRouteMap() {
  const container = document.getElementById('routeMapVisual');
  container.innerHTML = '';
  const line = document.createElement('div');
  line.className = 'route-line';

  BUS_STOPS.forEach((stop, i) => {
    const dotWrap = document.createElement('div');
    dotWrap.className = 'route-stop-dot';
    dotWrap.innerHTML = `
      <div class="route-dot ${i === 1 ? 'active' : ''}"></div>
      <span class="route-stop-name">${stop.icon} ${stop.name}</span>
    `;
    line.appendChild(dotWrap);

    if (i < BUS_STOPS.length - 1) {
      const connector = document.createElement('div');
      connector.className = 'route-connector';
      line.appendChild(connector);
    }
  });

  container.appendChild(line);
}

/** Animate stat counters */
function animateStats() {
  const targets = {
    statBuses: 6,
    statPassengers: 134,
    statOccupancy: null, // skip, it's a %
    statAlerts: alertLog.filter(a => a.type === 'danger').length,
    statTickets: 312 + Object.keys(state.scannedTickets).length,
  };

  // Animate numeric stats
  Object.entries(targets).forEach(([id, target]) => {
    if (target === null) return;
    const el = document.getElementById(id);
    let start = 0;
    const step = Math.ceil(target / 20);
    const interval = setInterval(() => {
      start = Math.min(start + step, target);
      el.textContent = start;
      if (start >= target) clearInterval(interval);
    }, 40);
  });
}

/* ══════════════════════════════════════════════
   10. QR SCANNER & FRAUD DETECTION
══════════════════════════════════════════════ */

document.getElementById('scanBtn').addEventListener('click', handleScan);
document.getElementById('scanInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') handleScan();
});

function handleScan() {
  const input = document.getElementById('scanInput').value.trim();
  if (!input) return;

  const resultCard = document.getElementById('scanResultCard');
  const resultEl   = document.getElementById('scanResult');
  const historyEl  = document.getElementById('scanHistory');

  resultCard.style.display = 'block';

  // Check if ticket is in our registry
  if (input in state.scannedTickets) {
    const scanCount = state.scannedTickets[input];
    state.scannedTickets[input]++;

    if (scanCount === 0) {
      // First scan — VALID
      const td = state.ticketData;
      resultEl.innerHTML = `
        <div class="scan-valid">✓</div>
        <div class="scan-title" style="color:var(--green)">Ticket Valid</div>
        <div class="scan-detail">
          ${td.from} → ${td.to}<br>
          ${td.bus} · Seat ${td.seat}<br>
          Passenger: ${td.passenger}<br>
          Fare: ₹${td.fare}<br>
          Issued: ${td.issuedAt}
        </div>
      `;
      addScanToHistory(input, 'valid');
    } else {
      // Second (or more) scan — FRAUD
      resultEl.innerHTML = `
        <div class="scan-invalid">⛔</div>
        <div class="scan-title" style="color:var(--red)">Invalid Ticket</div>
        <div class="scan-detail">
          This QR code has already been scanned ${scanCount} time(s).<br>
          Ticket ID: ${input}<br>
          <strong style="color:var(--red)">Possible fraud detected!</strong>
        </div>
      `;
      addScanToHistory(input, 'invalid');
      // Log fraud alert to dashboard
      addAlert('danger', `🚨 Duplicate QR scan — Ticket ${input} scanned ${scanCount + 1}x`, now());
    }
  } else {
    // Ticket not found
    resultEl.innerHTML = `
      <div class="scan-invalid">❓</div>
      <div class="scan-title" style="color:var(--red)">Ticket Not Found</div>
      <div class="scan-detail">
        No ticket found with ID:<br><strong>${input}</strong><br>
        This may be a counterfeit or expired ticket.
      </div>
    `;
    addScanToHistory(input, 'invalid');
    addAlert('warn', `⚠️ Unknown ticket scanned: ${input}`, now());
  }
}

/** Add entry to scan history sidebar */
function addScanToHistory(ticketId, result) {
  const historyEl = document.getElementById('scanHistory');

  // Remove empty message if present
  const empty = historyEl.querySelector('.empty-msg');
  if (empty) empty.remove();

  const item = document.createElement('div');
  item.className = `scan-history-item ${result === 'valid' ? 'valid-scan' : 'invalid-scan'}`;
  item.innerHTML = `
    <span style="font-family:var(--font-mono);font-size:0.75rem">${ticketId}</span>
    <span style="color:${result === 'valid' ? 'var(--green)' : 'var(--red)'}">
      ${result === 'valid' ? '✓ VALID' : '✗ INVALID'}
    </span>
  `;
  historyEl.prepend(item);
}

/* ══════════════════════════════════════════════
   11. UTILITIES
══════════════════════════════════════════════ */

/**
 * Navigate to a specific step.
 * Updates step indicator and shows/hides the right step card.
 */
function goToStep(stepNum) {
  state.currentStep = stepNum;

  // Update step cards
  document.querySelectorAll('.step-card').forEach((card, i) => {
    card.classList.toggle('active', i + 1 === stepNum);
  });

  // Update step indicator dots
  document.querySelectorAll('.step').forEach((dot, i) => {
    dot.classList.remove('active', 'done');
    if (i + 1 < stepNum) dot.classList.add('done');
    if (i + 1 === stepNum) dot.classList.add('active');
  });

  // Scroll to top of card
  window.scrollTo({ top: 120, behavior: 'smooth' });
}

/** Reset entire booking flow */
function resetBooking() {
  state.fromStop = null;
  state.toStop = null;
  state.fare = 0;
  state.passenger = { name: '', gender: 'male', phone: '' };
  state.selectedBus = null;
  state.assignedSeat = null;
  state.ticketId = '';
  state.ticketData = null;
  state.paymentDone = false;

  // Reset form fields
  document.getElementById('passengerName').value = '';
  document.getElementById('passengerPhone').value = '';
  document.querySelectorAll('.gender-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.gender === 'male');
  });

  // Reset stop selection UI
  document.querySelectorAll('.stop-btn').forEach(b => b.classList.remove('from', 'to'));
  document.getElementById('fromStop').textContent = '— Select a stop —';
  document.getElementById('toStop').textContent = '— Select a stop —';
  document.getElementById('farePreview').style.display = 'none';
  document.getElementById('step1Next').disabled = true;

  // Reset seat map
  document.getElementById('seatMapWrapper').style.display = 'none';
  document.getElementById('assignmentResult').style.display = 'none';
  document.getElementById('step3Next').disabled = true;

  // Clear QRs
  document.getElementById('paymentQR').innerHTML = '';
  document.getElementById('ticketQR').innerHTML = '';

  // Clear scan input
  document.getElementById('scanInput').value = '';
  document.getElementById('scanResultCard').style.display = 'none';

  goToStep(1);
}

/**
 * Generate a QR code inside a container element.
 * @param {string} containerId - DOM element ID
 * @param {string} text        - Content to encode
 * @param {number} size        - Size in px
 */
function generateQR(containerId, text, size = 150) {
  const container = document.getElementById(containerId);
  container.innerHTML = ''; // Clear existing

  try {
    new QRCode(container, {
      text: text,
      width: size,
      height: size,
      colorDark: '#000000',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M,
    });
  } catch (e) {
    console.warn('QR generation error:', e);
    container.textContent = '[QR]';
  }
}

/** Show a modal dialog */
function showModal(icon, title, message) {
  document.getElementById('modalIcon').textContent = icon;
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalMsg').textContent = message;
  document.getElementById('modalOverlay').style.display = 'flex';
}

document.getElementById('modalClose').addEventListener('click', () => {
  document.getElementById('modalOverlay').style.display = 'none';
});

/** Get current time as HH:MM string */
function now() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/** Double-up ticker text so it scrolls seamlessly */
function setupTicker() {
  const track = document.getElementById('tickerTrack');
  const html = track.innerHTML;
  track.innerHTML = html + html; // Duplicate for seamless loop
}

/* ══════════════════════════════════════════════
   INIT
══════════════════════════════════════════════ */
(function init() {
  renderStops();
  setupTicker();
  renderDashboard(); // Pre-render dashboard data in background
  console.log('%c⬡ SmartBus System Online', 'color:#f5a623;font-size:14px;font-weight:bold;');
})();
