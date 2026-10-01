const STORAGE_KEY = 'luxestay-data';
let system, sortAsc = true, highlighted = [], maxPrice = Infinity;
const $ = id => document.getElementById(id);

function load() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return BookingSystem.restore(raw);
    } catch (e) { console.warn('Error', e); }
    return new BookingSystem(buildMockMatrix(), [], buildMockCustomers());
}
const saveData = () => localStorage.setItem(STORAGE_KEY, system.serialize());

function roomClass(room) {
    if (highlighted.includes(room)) return 'bg-highlight';
    return room.isBooked ? 'bg-red' : 'bg-green';
}
function renderHotelMap() {
    const map = $('hotel-map');
    map.innerHTML = '';
    system.matrix.forEach((floor, i) => {
        const row = document.createElement('div');
        row.className = 'floor';
        row.innerHTML = `<b>Tầng ${i + 1}</b>`;
        floor.forEach(room => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `room ${roomClass(room)}${room.basePrice > maxPrice ? ' dim' : ''}`;
            btn.innerHTML = `<span class="no">${room.id}</span><span class="ty">${room.type}</span>`;
            btn.title = formatVND(room.basePrice);
            btn.addEventListener('click', () => selectRoom(room));
            row.appendChild(btn);
        });
        map.appendChild(row);
    });
}
function selectRoom(room) {
    if (room.isBooked) return showMsg('form-msg', `Room ${room.id} has been booked`);
    $('f-room').value = room.id;
    showMsg('form-msg', '');
}
function renderRoomSelect() {
    $('f-room').innerHTML = system.rooms.filter(r => !r.isBooked)
        .map(r => `<option value="${r.id}">${r.id} - ${r.type} - ${formatVND(r.basePrice)}</option>`).join('');
}
function showMsg(id, text) { $(id).textContent = text; }

function currentDiscount() {
    const c = system.findCustomer($('f-cid').value.trim());
    return c ? getDiscount(calculateReferralPoints(c.id, system.customers)) : 0;
}
function updateDiscountMsg() {
    showMsg('discount-msg', currentDiscount() > 0 ? 'You got 5% discount ' : '');
}
function handleBooking(e) {
    e.preventDefault();
    const name = $('f-name').value.trim(), phone = $('f-phone').value.trim();
    const nights = Number($('f-nights').value), roomId = Number($('f-room').value);
    if (!name || !phone) return showMsg('form-msg', 'Please enter your full name and phone number');
    if (!/^0\d{9}$/.test(phone)) return showMsg('form-msg', 'Phone number is invalid (10 digits, starting with 0)');
    if (!roomId) return showMsg('form-msg', 'No rooms available');
    if (!(nights >= 1)) return showMsg('form-msg', 'Number of nights must be ≥ 1');
    const existing = system.findCustomer($('f-cid').value.trim());
    const customer = existing || system.addCustomer(new Customer(system.nextCustomerId(), name, phone));
    try {
        system.book(roomId, customer, nights, existing ? currentDiscount() : 0);
    } catch (err) { return showMsg('form-msg', err.message); }
    saveData();
    e.target.reset(); highlighted = [];
    showMsg('form-msg', ''); showMsg('discount-msg', `Booking successfully! Your customer ID: ${customer.id}`);
    refreshAll();
}
function handleGroup() {
    const qty = Number($('group-qty').value);
    try {
        const found = suggestAdjacentRooms(system.matrix, null, qty);
        highlighted = found || [];
        showMsg('group-msg', found ? `Suggestion: ${found.map(r => r.id).join(', ')}` : 'No rooms available');
    } catch (err) { highlighted = []; showMsg('group-msg', err.message); }
    renderHotelMap();
}

function renderHistory() {
    $('tb-history').innerHTML = sortByTotal(system.history, sortAsc).map(b =>
        `<tr><td>${b.id}</td><td>${b.roomId}</td><td>${b.roomType}</td><td>${b.customerName}</td><td>${b.nights}</td><td>${formatVND(b.total)}</td><td>${b.date}</td></tr>`).join('')
        || '<tr><td colspan="7">Chưa có giao dịch</td></tr>';
}

function renderCustomers() {
    const all = system.customers;
    $('tb-customers').innerHTML = all.map(c =>
        `<tr><td>${c.id}</td><td>${c.name}</td><td>${c.phone}</td><td>${c.referredBy ?? '-'}</td><td>${calculateReferralPoints(c.id, all)}</td></tr>`).join('');
}

function renderStats() {
    const h = system.history;
    $('st-total').textContent = formatVND(totalRevenue(h));
    $('st-big').textContent = bigInvoices(h).length;
    $('st-names').textContent = customerNames(h).join(', ') || '(trống)';
}

function renderChart() {
    const cv = $('chart'), ctx = cv.getContext('2d');
    const data = revenueByType(system.history), keys = Object.keys(data);
    const max = Math.max(...Object.values(data), 1), base = cv.height - 30, colors = ['#2e9e5b', '#e8a317', '#c8433b'];
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.font = '12px sans-serif'; ctx.textAlign = 'center';
    keys.forEach((k, i) => {
        const h = (data[k] / max) * (base - 30), x = 40 + i * 140;
        ctx.fillStyle = colors[i]; ctx.fillRect(x, base - h, 80, h);
        ctx.fillStyle = '#222'; ctx.fillText(k, x + 40, base + 16);
        ctx.fillText(formatVND(data[k]), x + 40, base - h - 6);
    });
}

function refreshAdmin() {
    renderHistory();
    renderCustomers();
    renderStats();
    renderChart();
}

function refreshAll() {
    renderHotelMap();
    renderRoomSelect();
    refreshAdmin();
}

function showView(name) {
    $('client-view').hidden = name !== 'client';
    $('admin-view').hidden = name !== 'admin';
    $('nav-client').classList.toggle('active', name === 'client');
    $('nav-admin').classList.toggle('active', name === 'admin');
    if (name === 'admin') refreshAdmin();
}
function init() {
    system = load();
    $('booking-form').addEventListener('submit', handleBooking);
    $('f-cid').addEventListener('input', updateDiscountMsg);
    $('btn-group').addEventListener('click', handleGroup);
    $('max-price').addEventListener('input', e => { maxPrice = e.target.value ? Number(e.target.value) : Infinity; renderHotelMap(); });
    $('btn-sort').addEventListener('click', () => {
        sortAsc = !sortAsc;
        $('btn-sort').textContent = `Sắp xếp theo giá trị ${sortAsc ? '↑' : '↓'}`;
        renderHistory();
    });
    $('btn-reset').addEventListener('click', () => { localStorage.removeItem(STORAGE_KEY); system = load(); highlighted = []; refreshAll(); });
    $('nav-client').addEventListener('click', e => { e.preventDefault(); showView('client'); });
    $('nav-admin').addEventListener('click', e => { e.preventDefault(); showView('admin'); });
    refreshAll();
}
document.addEventListener('DOMContentLoaded', init);