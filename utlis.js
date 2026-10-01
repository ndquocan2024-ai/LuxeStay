const formatVND = n => new Intl.NumberFormat('vi-VN').format(n) + ' đ';

function calculateReferralPoints(id, all, seen = new Set()) {
  const c = all.find(x => x.id === id);
  if (!c || c.referredBy === null || seen.has(id)) return 0;
  return 10 + calculateReferralPoints(c.referredBy, all, seen.add(id));
}
const getDiscount = points => (points >= 20 ? 0.05 : 0);

function suggestAdjacentRooms(matrix, floorIndex, quantity) {
  if (quantity > Math.max(...matrix.map(f => f.length))) {
    throw new RangeError('The number of rooms requested is greater than the number of rooms on one floor!');
  }
  for (const floor of floorIndex == null ? matrix : [matrix[floorIndex]]) {
    for (let s = 0; s + quantity <= floor.length; s++) {
      const group = floor.slice(s, s + quantity);
      if (group.every(r => !r.isBooked)) return group;
    }
  }
  return null;
}

const totalRevenue = h => h.reduce((sum, b) => sum + b.total, 0);
const bigInvoices = h => h.filter(b => b.total > 2_000_000);
const customerNames = h => [...new Set(h.map(b => b.customerName))];
const revenueByType = h =>
  h.reduce((acc, b) => ((acc[b.roomType] += b.total), acc), { Standard: 0, VIP: 0, President: 0 });
const sortByTotal = (h, asc = true) => [...h].sort((a, b) => (asc ? a.total - b.total : b.total - a.total));

const hotelMatrix = [1, 2, 3].map(floor =>
  ROOM_TYPES.map(([type, price], i) => new Room(floor * 100 + i + 1, type, floor, price))
);

