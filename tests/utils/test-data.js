const BASE_URL = process.env.BASE_URL || 'https://qa-assessment.holywings.id';

const ACCOUNTS = {
  cashierAndi: {
    email: process.env.CASHIER_ANDI_EMAIL || 'andi@pos.test',
    password: process.env.DEFAULT_PASSWORD || 'Password123!',
    name: 'Andi Pratama',
    role: 'cashier',
  },
  cashierBudi: {
    email: process.env.CASHIER_BUDI_EMAIL || 'budi@pos.test',
    password: process.env.DEFAULT_PASSWORD || 'Password123!',
    name: 'Budi Santoso',
    role: 'cashier',
  },
  manager: {
    email: process.env.MANAGER_EMAIL || 'manager@pos.test',
    password: process.env.DEFAULT_PASSWORD || 'Password123!',
    name: 'Citra Manager',
    role: 'manager',
  },
  suspended: {
    email: process.env.SUSPENDED_EMAIL || 'suspended@pos.test',
    password: process.env.DEFAULT_PASSWORD || 'Password123!',
    role: 'cashier',
    status: 'suspended',
  },
};

const PRODUCTS = {
  mineralWater: { id: 1, sku: 'BEV-001', name: 'Mineral Water 600 ml', category: 'Beverages', price: 4000, initialStock: 100 },
  icedTea: { id: 2, sku: 'BEV-002', name: 'Iced Tea 350 ml', category: 'Beverages', price: 5000, initialStock: 80 },
  instantCoffee: { id: 3, sku: 'BEV-003', name: 'Instant Coffee (10 sachets)', category: 'Beverages', price: 25000, initialStock: 40 },
  uhtMilk: { id: 4, sku: 'BEV-004', name: 'UHT Milk 1 L', category: 'Beverages', price: 20000, initialStock: 30 },
  potatoChips: { id: 5, sku: 'SNK-001', name: 'Potato Chips 68 g', category: 'Snacks', price: 12500, initialStock: 50 },
  chocolateWafer: { id: 6, sku: 'SNK-002', name: 'Chocolate Wafer', category: 'Snacks', price: 10000, initialStock: 60 },
  roastedPeanuts: { id: 7, sku: 'SNK-003', name: 'Roasted Peanuts 250 g', category: 'Snacks', price: 15000, initialStock: 3 },
  rice: { id: 8, sku: 'GRC-001', name: 'Rice 5 kg', category: 'Groceries', price: 75000, initialStock: 20 },
  cookingOil: { id: 9, sku: 'GRC-002', name: 'Cooking Oil 2 L', category: 'Groceries', price: 38000, initialStock: 25 },
  instantNoodles: { id: 10, sku: 'GRC-003', name: 'Instant Noodles', category: 'Groceries', price: 3500, initialStock: 200 },
  sugarOutOfStock: { id: 11, sku: 'GRC-004', name: 'Granulated Sugar 1 kg', category: 'Groceries', price: 17500, initialStock: 0 },
  shampoo: { id: 12, sku: 'PRC-001', name: 'Shampoo 170 ml', category: 'Personal Care', price: 27000, initialStock: 15 },
  toothpaste: { id: 13, sku: 'PRC-002', name: 'Toothpaste 190 g', category: 'Personal Care', price: 15500, initialStock: 35 },
  dishSoap: { id: 14, sku: 'HSH-001', name: 'Dish Soap 800 ml', category: 'Household', price: 16000, initialStock: 25 },
  detergent: { id: 15, sku: 'HSH-002', name: 'Laundry Detergent 1.8 kg', category: 'Household', price: 55000, initialStock: 10 },
};

const PROMOS = {
  hemat10: { code: 'HEMAT10', rate: 0.1, minSubtotal: 50000, maxDiscount: 20000 },
  diskon5k: { code: 'DISKON5K', flat: 5000, minSubtotal: 25000 },
  expired: { code: 'LAMA2025', rate: 0.15, maxDiscount: 30000, expired: true },
  invalid: { code: 'INVALIDCODE' },
};

/**
 * Computes expected price breakdown according to /docs business rules:
 * 1. subtotal = sum(price * qty)
 * 2. discount from promo (HEMAT10: floor(10%) capped at 20,000; DISKON5K: 5,000)
 * 3. tax = Math.round((subtotal - discount) * 0.11)
 * 4. total = subtotal - discount + tax
 */
function calculateExpectedTotals(items, promoCode = null) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  let discount = 0;
  if (promoCode) {
    const code = promoCode.toUpperCase();
    if (code === 'HEMAT10' && subtotal >= PROMOS.hemat10.minSubtotal) {
      discount = Math.min(Math.floor(subtotal * PROMOS.hemat10.rate), PROMOS.hemat10.maxDiscount);
    } else if (code === 'DISKON5K' && subtotal >= PROMOS.diskon5k.minSubtotal) {
      discount = PROMOS.diskon5k.flat;
    }
  }
  const tax = Math.round((subtotal - discount) * 0.11);
  const total = subtotal - discount + tax;
  return { subtotal, discount, tax, total };
}

function formatRupiah(amount) {
  return `Rp${Number(amount).toLocaleString('id-ID')}`;
}

module.exports = {
  BASE_URL,
  ACCOUNTS,
  PRODUCTS,
  PROMOS,
  calculateExpectedTotals,
  formatRupiah,
};

