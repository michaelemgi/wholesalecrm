'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ShoppingCart, User, ChevronDown, Heart, Plus, Minus,
  Truck, Clock, Star, Package, ChevronRight, ChevronLeft,
  MessageCircle, Phone, Calendar, RotateCcw, Sparkles, Tag,
  Milk, Beef, Croissant, Coffee, Wheat, Snowflake, Apple, Droplets, SprayCan,
  X, Check, AlertTriangle, History, FileText, LogOut, Settings,
  ArrowRight, Zap, Gift, TrendingUp
} from 'lucide-react';

// ─── FAKE DATA ───────────────────────────────────────────────────────────────

const CATEGORIES = [
  { name: 'Dairy & Eggs', icon: Milk },
  { name: 'Meat & Poultry', icon: Beef },
  { name: 'Bakery', icon: Croissant },
  { name: 'Beverages', icon: Coffee },
  { name: 'Dry Goods', icon: Wheat },
  { name: 'Frozen', icon: Snowflake },
  { name: 'Fresh Produce', icon: Apple },
  { name: 'Condiments', icon: Droplets },
  { name: 'Cleaning', icon: SprayCan },
];

type StockStatus = 'in-stock' | 'low-stock' | 'out-of-stock';

interface Product {
  id: number;
  name: string;
  price: number;
  unit: string;
  unitOptions: string[];
  stock: StockStatus;
  stockQty?: number;
  alternative?: string;
  lastOrdered?: string;
  isFavourite: boolean;
  category: string;
  color: string;
  icon: typeof Milk;
}

const PRODUCTS: Product[] = [
  { id: 1, name: 'Kerrygold Butter 227g', price: 24.50, unit: 'Case (12)', unitOptions: ['Case (12)', 'Each', 'Pallet (48 cases)'], stock: 'in-stock', lastOrdered: '3 days ago', isFavourite: true, category: 'Dairy & Eggs', color: '#fbbf24', icon: Milk },
  { id: 2, name: "Barry's Tea Gold Blend 600s", price: 89.99, unit: 'Case (12)', unitOptions: ['Case (12)', 'Each', 'Pallet (48 cases)'], stock: 'in-stock', lastOrdered: '1 week ago', isFavourite: true, category: 'Beverages', color: '#dc2626', icon: Coffee },
  { id: 3, name: "Flahavan's Porridge Oats 25kg", price: 34.75, unit: 'Each', unitOptions: ['Each', 'Pallet (20 bags)'], stock: 'low-stock', stockQty: 12, isFavourite: false, category: 'Dry Goods', color: '#a3a3a3', icon: Wheat },
  { id: 4, name: 'Avonmore Fresh Milk 2L', price: 18.90, unit: 'Case (12)', unitOptions: ['Case (12)', 'Each', 'Pallet (48 cases)'], stock: 'in-stock', lastOrdered: '2 days ago', isFavourite: true, category: 'Dairy & Eggs', color: '#60a5fa', icon: Milk },
  { id: 5, name: 'Brennans White Bread Sliced', price: 21.60, unit: 'Case (12)', unitOptions: ['Case (12)', 'Each'], stock: 'in-stock', isFavourite: false, category: 'Bakery', color: '#f59e0b', icon: Croissant },
  { id: 6, name: 'Ballymaloe Relish 3kg', price: 15.25, unit: 'Each', unitOptions: ['Each', 'Case (6)'], stock: 'in-stock', lastOrdered: '5 days ago', isFavourite: true, category: 'Condiments', color: '#ef4444', icon: Droplets },
  { id: 7, name: 'Galtee Rashers 2.27kg', price: 28.40, unit: 'Each', unitOptions: ['Each', 'Case (8)'], stock: 'low-stock', stockQty: 5, lastOrdered: '4 days ago', isFavourite: false, category: 'Meat & Poultry', color: '#f87171', icon: Beef },
  { id: 8, name: 'Tayto Cheese & Onion 50-pack', price: 32.00, unit: 'Case (12)', unitOptions: ['Case (12)', 'Each', 'Pallet (48 cases)'], stock: 'in-stock', isFavourite: true, category: 'Dry Goods', color: '#facc15', icon: Package },
  { id: 9, name: 'Irish Angus Striploin per kg', price: 22.90, unit: 'Each', unitOptions: ['per kg', 'per 5kg box'], stock: 'in-stock', isFavourite: false, category: 'Meat & Poultry', color: '#b91c1c', icon: Beef },
  { id: 10, name: 'Atlantic Salmon Fillets per kg', price: 19.75, unit: 'Each', unitOptions: ['per kg', 'per 3kg box'], stock: 'out-of-stock', alternative: 'Norwegian Salmon Fillets', isFavourite: false, category: 'Fresh Produce', color: '#fb923c', icon: Apple },
  { id: 11, name: 'Odlums Cream Flour 25kg', price: 26.30, unit: 'Each', unitOptions: ['Each', 'Pallet (40 bags)'], stock: 'in-stock', isFavourite: true, category: 'Dry Goods', color: '#e5e5e5', icon: Wheat },
  { id: 12, name: 'Paddy Power Coffee Beans 1kg', price: 16.80, unit: 'Each', unitOptions: ['Each', 'Case (6)', 'Pallet (120)'], stock: 'in-stock', lastOrdered: '1 day ago', isFavourite: false, category: 'Beverages', color: '#78350f', icon: Coffee },
];

interface CartItem {
  product: Product;
  qty: number;
  unitPrice: number;
}

// ─── CUSTOMER PRICE LIST ─────────────────────────────────────────────────────
// The Shelbourne Hotel has negotiated pricing — different from retail
// Key = product id, value = customer-specific price
const CUSTOMER_PRICES: Record<number, { price: number; tier: string; discount: string }> = {
  1:  { price: 21.50, tier: 'Gold', discount: '12%' },
  2:  { price: 79.99, tier: 'Gold', discount: '11%' },
  3:  { price: 31.00, tier: 'Gold', discount: '11%' },
  4:  { price: 16.50, tier: 'Gold', discount: '13%' },
  5:  { price: 19.80, tier: 'Silver', discount: '8%' },
  6:  { price: 13.50, tier: 'Gold', discount: '11%' },
  7:  { price: 25.90, tier: 'Silver', discount: '9%' },
  9:  { price: 20.50, tier: 'Gold', discount: '10%' },
  12: { price: 14.90, tier: 'Gold', discount: '11%' },
};

const INITIAL_CART: CartItem[] = [
  { product: PRODUCTS[0], qty: 4, unitPrice: CUSTOMER_PRICES[1].price },
  { product: PRODUCTS[1], qty: 2, unitPrice: CUSTOMER_PRICES[2].price },
  { product: PRODUCTS[5], qty: 6, unitPrice: CUSTOMER_PRICES[6].price },
];

const ORDER_HISTORY = [
  { id: 'ORD-4821', date: '01 Apr 2026', items: 14, total: 687.40, status: 'Delivered' },
  { id: 'ORD-4790', date: '28 Mar 2026', items: 9, total: 423.15, status: 'Delivered' },
  { id: 'ORD-4756', date: '25 Mar 2026', items: 22, total: 1241.80, status: 'Delivered' },
  { id: 'ORD-4712', date: '21 Mar 2026', items: 7, total: 312.60, status: 'Delivered' },
  { id: 'ORD-4688', date: '18 Mar 2026', items: 16, total: 894.25, status: 'Delivered' },
];

const PREVIOUS_ORDERS = [
  { id: 'ORD-4821', date: '01 Apr 2026', itemCount: 14, total: 687.40 },
  { id: 'ORD-4790', date: '28 Mar 2026', itemCount: 9, total: 423.15 },
  { id: 'ORD-4756', date: '25 Mar 2026', itemCount: 22, total: 1241.80 },
];

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function PortalPage() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>(INITIAL_CART);
  const [cartOpen, setCartOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'shop' | 'orders' | 'prices'>('shop');
  const [favourites, setFavourites] = useState<Set<number>>(
    new Set(PRODUCTS.filter(p => p.isFavourite).map(p => p.id))
  );
  const [productQuantities, setProductQuantities] = useState<Record<number, number>>({});
  const [deliveryDay, setDeliveryDay] = useState('');
  const [priceChat, setPriceChat] = useState(false);
  const [priceChatMessages, setPriceChatMessages] = useState<{ from: 'user' | 'bot'; text: string }[]>([
    { from: 'bot', text: "Hi! I'm your pricing assistant. Ask me about getting a custom price on any product, or request to add an item to your price list." },
  ]);
  const [priceChatInput, setPriceChatInput] = useState('');
  const [requestedProduct, setRequestedProduct] = useState('');
  const categoryRef = useRef<HTMLDivElement>(null);

  const getPrice = (product: Product) => CUSTOMER_PRICES[product.id]?.price ?? product.price;

  const openPriceChatFor = (productName: string) => {
    setRequestedProduct(productName);
    setPriceChatMessages(prev => [
      ...prev,
      { from: 'user', text: `I'd like to request a custom price for ${productName}` },
      { from: 'bot', text: `Great choice! I can see ${productName} is currently at retail pricing on your account. Based on your Gold tier status and order history, I'll submit a request to your account manager for a custom quote. You'll typically hear back within 24 hours. Would you like to add any volume details to strengthen your request?` },
    ]);
    setPriceChat(true);
  };

  const sendPriceChatMessage = () => {
    if (!priceChatInput.trim()) return;
    const msg = priceChatInput.trim();
    setPriceChatInput('');
    setPriceChatMessages(prev => [...prev, { from: 'user', text: msg }]);

    setTimeout(() => {
      const responses = [
        `Thanks for that info! I've noted this down. Your account manager Ciara will review your request and get back to you within 24 hours with a custom quote.`,
        `Got it. Based on your ordering volume, I think we can get you a competitive rate. I'll flag this as priority for your account manager.`,
        `Understood! I've submitted your pricing request. You'll receive an email confirmation shortly and a response within 1 business day.`,
        `Perfect, I've added those details to your request. Our team typically offers Gold tier customers a 10-15% discount on new items. Expect a response soon!`,
      ];
      setPriceChatMessages(prev => [
        ...prev,
        { from: 'bot', text: responses[Math.floor(Math.random() * responses.length)] },
      ]);
    }, 1200);
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const deliveryFee = cartTotal >= 500 ? 0 : 12.50;
  const minimumOrder = 150;
  const shortfall = Math.max(0, minimumOrder - cartTotal);

  const toggleFavourite = (productId: number) => {
    setFavourites(prev => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  const getQty = (productId: number) => productQuantities[productId] ?? 1;

  const setQty = (productId: number, qty: number) => {
    setProductQuantities(prev => ({ ...prev, [productId]: Math.max(1, qty) }));
  };

  const addToCart = (product: Product) => {
    if (product.stock === 'out-of-stock') return;
    const qty = getQty(product.id);
    const price = getPrice(product);
    setCart(prev => {
      const existing = prev.find(c => c.product.id === product.id);
      if (existing) {
        return prev.map(c => c.product.id === product.id ? { ...c, qty: c.qty + qty } : c);
      }
      return [...prev, { product, qty, unitPrice: price }];
    });
    setCartOpen(true);
  };

  const updateCartQty = (productId: number, delta: number) => {
    setCart(prev =>
      prev
        .map(c => c.product.id === productId ? { ...c, qty: c.qty + delta } : c)
        .filter(c => c.qty > 0)
    );
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(c => c.product.id !== productId));
  };

  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoryRef.current) {
      categoryRef.current.scrollBy({ left: direction === 'left' ? -200 : 200, behavior: 'smooth' });
    }
  };

  const filteredProducts = PRODUCTS.filter(p => {
    const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !activeCategory || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const favouriteProducts = PRODUCTS.filter(p => favourites.has(p.id));

  // ─── RENDER ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0f1629] text-white">
      {/* ─── TOP BAR ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-[#131a2e] border-b border-white/10 shadow-lg">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center font-bold text-white text-lg">
                OB
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-white leading-tight">O&apos;Brien&apos;s Food Service</p>
                <p className="text-xs text-slate-400">Wholesale Supplier</p>
              </div>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#0f1629] border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                />
              </div>
            </div>

            {/* Nav Tabs */}
            <div className="hidden md:flex items-center gap-1 bg-[#0f1629] rounded-lg p-1">
              <button
                onClick={() => setActiveTab('shop')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'shop' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Shop
              </button>
              <button
                onClick={() => setActiveTab('prices')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'prices' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                My Prices
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'orders' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Orders
              </button>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-3">
              {/* Cart toggle */}
              <button
                onClick={() => setCartOpen(!cartOpen)}
                className="relative p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <ShoppingCart className="w-5 h-5 text-slate-300" />
                {cartItemCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 rounded-full text-[10px] font-bold flex items-center justify-center"
                  >
                    {cartItemCount}
                  </motion.span>
                )}
              </button>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-xs font-bold">
                    SH
                  </div>
                  <span className="hidden lg:block text-sm text-slate-300">The Shelbourne Hotel</span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="absolute right-0 top-full mt-2 w-56 bg-[#1a2238] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                    >
                      <div className="px-4 py-3 border-b border-white/10">
                        <p className="text-sm font-semibold">The Shelbourne Hotel</p>
                        <p className="text-xs text-slate-400">Account #SH-1042</p>
                      </div>
                      {[
                        { label: 'Account', icon: Settings },
                        { label: 'Orders', icon: Package },
                        { label: 'Invoices', icon: FileText },
                        { label: 'Favourites', icon: Heart },
                        { label: 'Chat', icon: MessageCircle },
                      ].map(item => (
                        <button
                          key={item.label}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <item.icon className="w-4 h-4" />
                          {item.label}
                        </button>
                      ))}
                      <div className="border-t border-white/10">
                        <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-white/5 transition-colors">
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ─── MAIN LAYOUT ─────────────────────────────────────────────────────── */}
      <div className="max-w-[1600px] mx-auto flex">
        {/* ─── LEFT CONTENT ────────────────────────────────────────────────── */}
        <div className={`flex-1 px-4 sm:px-6 lg:px-8 py-6 transition-all ${cartOpen ? 'lg:mr-[380px]' : ''}`}>
          <AnimatePresence mode="wait">
            {activeTab === 'shop' ? (
              <motion.div
                key="shop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* ─── HERO BANNER ──────────────────────────────────────────── */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 p-6 sm:p-8 mb-6"
                >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute bottom-0 left-1/2 w-48 h-48 bg-white/5 rounded-full translate-y-1/2" />
                  <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-5 h-5 text-yellow-300" />
                        <span className="text-sm font-semibold text-blue-200 uppercase tracking-wider">New This Week</span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Spring Menu Essentials</h2>
                      <p className="text-blue-100 text-sm sm:text-base max-w-lg">
                        Fresh seasonal produce now in stock. Plus 15% off all organic dairy this week only.
                      </p>
                    </div>
                    <div className="flex flex-col items-start sm:items-end gap-2">
                      <button className="px-5 py-2.5 bg-white text-blue-700 font-semibold rounded-lg hover:bg-blue-50 transition-colors text-sm">
                        Shop New Arrivals
                      </button>
                      <div className="flex items-center gap-2 text-blue-200 text-sm">
                        <Truck className="w-4 h-4" />
                        <span>Order by <strong className="text-white">6pm</strong> for next-day delivery</span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* ─── CATEGORY NAVIGATION ──────────────────────────────────── */}
                <div className="relative mb-6">
                  <button
                    onClick={() => scrollCategories('left')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-[#131a2e] border border-white/10 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:border-white/20 transition-all shadow-lg"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div
                    ref={categoryRef}
                    className="flex gap-2 overflow-x-auto scrollbar-hide px-10 py-1"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    <button
                      onClick={() => setActiveCategory(null)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all shrink-0 ${
                        !activeCategory ? 'bg-blue-600 text-white' : 'bg-[#1a2238] text-slate-400 hover:text-white hover:bg-[#1f2940]'
                      }`}
                    >
                      All Products
                    </button>
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat.name}
                        onClick={() => setActiveCategory(activeCategory === cat.name ? null : cat.name)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all shrink-0 ${
                          activeCategory === cat.name ? 'bg-blue-600 text-white' : 'bg-[#1a2238] text-slate-400 hover:text-white hover:bg-[#1f2940]'
                        }`}
                      >
                        <cat.icon className="w-4 h-4" />
                        {cat.name}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => scrollCategories('right')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-[#131a2e] border border-white/10 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:border-white/20 transition-all shadow-lg"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* ─── PRODUCT GRID ─────────────────────────────────────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-10">
                  {filteredProducts.map((product, i) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="group bg-[#1a2238] border border-white/5 rounded-xl overflow-hidden hover:border-blue-500/30 transition-all hover:shadow-lg hover:shadow-blue-500/5"
                    >
                      {/* Image placeholder */}
                      <div
                        className="relative h-36 flex items-center justify-center"
                        style={{ backgroundColor: product.color + '18' }}
                      >
                        <product.icon className="w-12 h-12" style={{ color: product.color }} />
                        {/* Favourite */}
                        <button
                          onClick={() => toggleFavourite(product.id)}
                          className="absolute top-3 right-3 p-1.5 rounded-full bg-black/30 hover:bg-black/50 transition-colors"
                        >
                          <Heart
                            className={`w-4 h-4 transition-colors ${
                              favourites.has(product.id) ? 'fill-red-500 text-red-500' : 'text-white/60'
                            }`}
                          />
                        </button>
                        {/* Stock badge */}
                        <div className="absolute bottom-2 left-2">
                          {product.stock === 'in-stock' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400">
                              <Check className="w-3 h-3" /> In Stock
                            </span>
                          )}
                          {product.stock === 'low-stock' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-400">
                              <AlertTriangle className="w-3 h-3" /> Low Stock &mdash; {product.stockQty} left
                            </span>
                          )}
                          {product.stock === 'out-of-stock' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/20 text-red-400">
                              <X className="w-3 h-3" /> Out of Stock
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Details */}
                      <div className="p-4">
                        <h3 className="text-sm font-semibold text-white mb-1 leading-tight">{product.name}</h3>

                        {product.lastOrdered && (
                          <p className="text-[11px] text-slate-500 mb-2 flex items-center gap-1">
                            <History className="w-3 h-3" /> Last ordered: {product.lastOrdered}
                          </p>
                        )}

                        {product.stock === 'out-of-stock' && product.alternative && (
                          <p className="text-[11px] text-blue-400 mb-2">
                            Try: <span className="underline cursor-pointer">{product.alternative}</span>
                          </p>
                        )}

                        {/* Unit selector */}
                        <select
                          className="w-full mb-3 px-2 py-1.5 bg-[#0f1629] border border-white/10 rounded-md text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          defaultValue={product.unit}
                        >
                          {product.unitOptions.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>

                        {/* Price row */}
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wide">Your Price</p>
                            <div className="flex items-center gap-2">
                              <p className="text-lg font-bold text-white">&euro;{getPrice(product).toFixed(2)}</p>
                              {CUSTOMER_PRICES[product.id] && (
                                <p className="text-xs text-slate-500 line-through">&euro;{product.price.toFixed(2)}</p>
                              )}
                            </div>
                            {CUSTOMER_PRICES[product.id] && (
                              <p className="text-[10px] text-emerald-400 font-medium">-{CUSTOMER_PRICES[product.id].discount} account pricing</p>
                            )}
                          </div>
                          {/* Quantity selector */}
                          <div className="flex items-center gap-1 bg-[#0f1629] rounded-lg border border-white/10">
                            <button
                              onClick={() => setQty(product.id, getQty(product.id) - 1)}
                              className="p-1.5 hover:bg-white/5 rounded-l-lg transition-colors"
                            >
                              <Minus className="w-3 h-3 text-slate-400" />
                            </button>
                            <span className="w-8 text-center text-sm font-medium">{getQty(product.id)}</span>
                            <button
                              onClick={() => setQty(product.id, getQty(product.id) + 1)}
                              className="p-1.5 hover:bg-white/5 rounded-r-lg transition-colors"
                            >
                              <Plus className="w-3 h-3 text-slate-400" />
                            </button>
                          </div>
                        </div>

                        {/* Add to cart */}
                        <button
                          onClick={() => addToCart(product)}
                          disabled={product.stock === 'out-of-stock'}
                          className={`w-full py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                            product.stock === 'out-of-stock'
                              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]'
                          }`}
                        >
                          <ShoppingCart className="w-4 h-4" />
                          {product.stock === 'out-of-stock' ? 'Unavailable' : 'Add to Cart'}
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* ─── YOUR FAVOURITES ──────────────────────────────────────── */}
                {favouriteProducts.length > 0 && (
                  <div className="mb-10">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-bold flex items-center gap-2">
                        <Heart className="w-5 h-5 text-red-400" />
                        Your Favourites
                      </h2>
                      <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors">View All</button>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                      {favouriteProducts.slice(0, 6).map(product => (
                        <motion.div
                          key={product.id}
                          whileHover={{ scale: 1.02 }}
                          className="shrink-0 w-48 bg-[#1a2238] border border-white/5 rounded-xl overflow-hidden"
                        >
                          <div
                            className="h-24 flex items-center justify-center"
                            style={{ backgroundColor: product.color + '18' }}
                          >
                            <product.icon className="w-8 h-8" style={{ color: product.color }} />
                          </div>
                          <div className="p-3">
                            <p className="text-xs font-semibold text-white truncate mb-1">{product.name}</p>
                            <div className="flex items-center gap-1.5 mb-2">
                              <p className="text-sm font-bold text-blue-400">&euro;{getPrice(product).toFixed(2)}</p>
                              {CUSTOMER_PRICES[product.id] && (
                                <p className="text-[10px] text-slate-500 line-through">&euro;{product.price.toFixed(2)}</p>
                              )}
                            </div>
                            <button
                              onClick={() => addToCart(product)}
                              className="w-full py-1.5 bg-blue-600/20 text-blue-400 rounded-md text-xs font-semibold hover:bg-blue-600/30 transition-colors flex items-center justify-center gap-1"
                            >
                              <Plus className="w-3 h-3" /> Quick Add
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ─── REORDER PREVIOUS ─────────────────────────────────────── */}
                <div className="mb-10">
                  <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <RotateCcw className="w-5 h-5 text-blue-400" />
                    Reorder Previous
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {PREVIOUS_ORDERS.map(order => (
                      <motion.div
                        key={order.id}
                        whileHover={{ scale: 1.01 }}
                        className="bg-[#1a2238] border border-white/5 rounded-xl p-4 hover:border-blue-500/30 transition-all"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-semibold text-white">{order.id}</span>
                          <span className="text-xs text-slate-500">{order.date}</span>
                        </div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs text-slate-400">{order.itemCount} items</span>
                          <span className="text-sm font-bold text-white">&euro;{order.total.toFixed(2)}</span>
                        </div>
                        <button className="w-full py-2 bg-blue-600/20 text-blue-400 rounded-lg text-sm font-semibold hover:bg-blue-600/30 transition-colors flex items-center justify-center gap-2">
                          <RotateCcw className="w-4 h-4" />
                          Reorder All
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* ─── PROMOTIONS BANNER ────────────────────────────────────── */}
                <div className="mb-10">
                  <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Tag className="w-5 h-5 text-yellow-400" />
                    This Week&apos;s Specials
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      {
                        title: '20% off all Kerrygold',
                        desc: 'Until Friday — stock up on Ireland\'s favourite butter',
                        color: 'from-yellow-600 to-amber-700',
                        icon: Zap,
                      },
                      {
                        title: 'New: Organic Range',
                        desc: 'Fresh organic dairy & produce now available to order',
                        color: 'from-emerald-600 to-green-700',
                        icon: Sparkles,
                      },
                      {
                        title: 'BBQ Bundle Pack',
                        desc: 'Everything you need for outdoor season — just \u20AC89.99',
                        color: 'from-red-600 to-orange-700',
                        icon: Gift,
                      },
                    ].map((promo, i) => (
                      <motion.div
                        key={i}
                        whileHover={{ scale: 1.02 }}
                        className={`bg-gradient-to-br ${promo.color} rounded-xl p-5 cursor-pointer relative overflow-hidden`}
                      >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                        <promo.icon className="w-8 h-8 text-white/80 mb-3" />
                        <h3 className="text-base font-bold text-white mb-1">{promo.title}</h3>
                        <p className="text-sm text-white/70">{promo.desc}</p>
                        <div className="mt-3 flex items-center gap-1 text-white/90 text-sm font-semibold">
                          Shop Now <ArrowRight className="w-4 h-4" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : activeTab === 'prices' ? (
              /* ─── MY PRICES TAB ────────────────────────────────────────── */
              <motion.div
                key="prices"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="mb-6">
                  <h1 className="text-2xl font-bold flex items-center gap-3 mb-2">
                    <Tag className="w-6 h-6 text-emerald-400" />
                    My Price List
                  </h1>
                  <p className="text-sm text-slate-400">
                    Your negotiated pricing for <span className="text-white font-medium">The Shelbourne Hotel</span> &mdash; <span className="text-emerald-400 font-medium">Gold Tier Account</span>
                  </p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="bg-[#1a2238] border border-white/5 rounded-xl p-4">
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Your Tier</p>
                    <p className="text-xl font-bold text-amber-400">Gold</p>
                    <p className="text-xs text-slate-400 mt-1">Since Jan 2024</p>
                  </div>
                  <div className="bg-[#1a2238] border border-white/5 rounded-xl p-4">
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Avg Savings</p>
                    <p className="text-xl font-bold text-emerald-400">10.8%</p>
                    <p className="text-xs text-slate-400 mt-1">vs retail pricing</p>
                  </div>
                  <div className="bg-[#1a2238] border border-white/5 rounded-xl p-4">
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Products on Your List</p>
                    <p className="text-xl font-bold text-white">{Object.keys(CUSTOMER_PRICES).length}</p>
                    <p className="text-xs text-slate-400 mt-1">custom-priced items</p>
                  </div>
                </div>

                {/* Price List Table */}
                <div className="bg-[#1a2238] border border-white/5 rounded-xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                    <p className="text-sm font-semibold text-white">Your Negotiated Prices</p>
                    <p className="text-xs text-slate-500">Prices auto-applied at checkout</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Product</th>
                          <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Category</th>
                          <th className="text-right px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Retail Price</th>
                          <th className="text-right px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Your Price</th>
                          <th className="text-right px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Saving</th>
                          <th className="text-right px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Tier</th>
                          <th className="text-right px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {PRODUCTS.map((product, i) => {
                          const cp = CUSTOMER_PRICES[product.id];
                          const saving = cp ? (product.price - cp.price) : 0;
                          return (
                            <tr key={product.id} className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${i === PRODUCTS.length - 1 ? 'border-none' : ''}`}>
                              <td className="px-6 py-3">
                                <div className="flex items-center gap-3">
                                  <div
                                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                                    style={{ backgroundColor: product.color + '18' }}
                                  >
                                    <product.icon className="w-4 h-4" style={{ color: product.color }} />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-white">{product.name}</p>
                                    <p className="text-[10px] text-slate-500">{product.unit}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-3 text-xs text-slate-400">{product.category}</td>
                              <td className="px-6 py-3 text-right text-sm text-slate-500">
                                &euro;{product.price.toFixed(2)}
                              </td>
                              <td className="px-6 py-3 text-right">
                                <span className={`text-sm font-bold ${cp ? 'text-emerald-400' : 'text-white'}`}>
                                  &euro;{(cp?.price ?? product.price).toFixed(2)}
                                </span>
                              </td>
                              <td className="px-6 py-3 text-right">
                                {cp ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400">
                                    -{cp.discount}
                                  </span>
                                ) : (
                                  <span className="text-xs text-slate-600">&mdash;</span>
                                )}
                              </td>
                              <td className="px-6 py-3 text-right">
                                {cp ? (
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                    cp.tier === 'Gold' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-500/20 text-slate-400'
                                  }`}>
                                    {cp.tier}
                                  </span>
                                ) : (
                                  <span className="text-xs text-slate-600">Retail</span>
                                )}
                              </td>
                              <td className="px-6 py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {!cp && (
                                    <button
                                      onClick={() => openPriceChatFor(product.name)}
                                      className="px-3 py-1.5 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                                    >
                                      Request Price
                                    </button>
                                  )}
                                  <button
                                    onClick={() => { addToCart(product); }}
                                    disabled={product.stock === 'out-of-stock'}
                                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                                      product.stock === 'out-of-stock'
                                        ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                        : 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30'
                                    }`}
                                  >
                                    + Add
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {/* Total Savings */}
                  <div className="px-6 py-4 border-t border-white/10 bg-emerald-500/5 flex items-center justify-between">
                    <p className="text-sm text-emerald-400 font-medium">
                      Total savings on a full catalogue order
                    </p>
                    <p className="text-lg font-bold text-emerald-400">
                      &euro;{PRODUCTS.reduce((sum, p) => sum + (CUSTOMER_PRICES[p.id] ? p.price - CUSTOMER_PRICES[p.id].price : 0), 0).toFixed(2)} saved
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* ─── ORDER HISTORY TAB ─────────────────────────────────────── */
              <motion.div
                key="orders"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <h1 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <History className="w-6 h-6 text-blue-400" />
                  Order History
                </h1>
                <div className="bg-[#1a2238] border border-white/5 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Order #</th>
                          <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</th>
                          <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Items</th>
                          <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Total</th>
                          <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                          <th className="text-right px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ORDER_HISTORY.map((order, i) => (
                          <tr key={order.id} className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${i === ORDER_HISTORY.length - 1 ? 'border-none' : ''}`}>
                            <td className="px-6 py-4 font-semibold text-blue-400">{order.id}</td>
                            <td className="px-6 py-4 text-slate-300">{order.date}</td>
                            <td className="px-6 py-4 text-slate-300">{order.items} items</td>
                            <td className="px-6 py-4 font-semibold text-white">&euro;{order.total.toFixed(2)}</td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400">
                                <Check className="w-3 h-3" /> {order.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button className="px-3 py-1.5 bg-blue-600/20 text-blue-400 rounded-md text-xs font-semibold hover:bg-blue-600/30 transition-colors">
                                  Reorder
                                </button>
                                <button className="px-3 py-1.5 bg-white/5 text-slate-400 rounded-md text-xs font-semibold hover:bg-white/10 transition-colors">
                                  View
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ─── RIGHT SIDEBAR — SHOPPING CART ─────────────────────────────── */}
        <AnimatePresence>
          {cartOpen && (
            <motion.aside
              initial={{ x: 380, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 380, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="fixed right-0 top-16 bottom-0 w-[380px] bg-[#131a2e] border-l border-white/10 overflow-y-auto z-40 hidden lg:block"
            >
              <div className="p-5">
                {/* Cart header */}
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-blue-400" />
                    Your Cart
                  </h2>
                  <button
                    onClick={() => setCartOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Minimum order notice */}
                {shortfall > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg"
                  >
                    <p className="text-xs text-amber-400 font-medium flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      Minimum order: &euro;{minimumOrder.toFixed(2)} &mdash; You need &euro;{shortfall.toFixed(2)} more
                    </p>
                  </motion.div>
                )}

                {/* Cart items */}
                <div className="space-y-3 mb-5">
                  {cart.map(item => (
                    <motion.div
                      key={item.product.id}
                      layout
                      className="bg-[#0f1629] rounded-lg p-3"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: item.product.color + '20' }}
                        >
                          <item.product.icon className="w-5 h-5" style={{ color: item.product.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{item.product.name}</p>
                          <p className="text-[11px] text-slate-500">{item.product.unit}</p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1 bg-[#1a2238] rounded-md border border-white/10">
                          <button
                            onClick={() => updateCartQty(item.product.id, -1)}
                            className="p-1 hover:bg-white/5 rounded-l-md transition-colors"
                          >
                            <Minus className="w-3 h-3 text-slate-400" />
                          </button>
                          <span className="w-7 text-center text-xs font-medium">{item.qty}</span>
                          <button
                            onClick={() => updateCartQty(item.product.id, 1)}
                            className="p-1 hover:bg-white/5 rounded-r-md transition-colors"
                          >
                            <Plus className="w-3 h-3 text-slate-400" />
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500">&euro;{item.unitPrice.toFixed(2)} ea</p>
                          <p className="text-sm font-bold text-white">&euro;{(item.qty * item.unitPrice).toFixed(2)}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Delivery day selector */}
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-slate-400 mb-2">Delivery Day</label>
                  <select
                    value={deliveryDay}
                    onChange={e => setDeliveryDay(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#0f1629] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="">Select delivery day</option>
                    <option value="mon">Monday, 6 Apr</option>
                    <option value="wed">Wednesday, 8 Apr</option>
                    <option value="fri">Friday, 10 Apr</option>
                  </select>
                  <div className="flex items-center gap-2 mt-2 text-xs text-amber-400">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>Order by <strong>6:00 PM today</strong> for Wednesday delivery</span>
                  </div>
                </div>

                {/* Totals */}
                <div className="border-t border-white/10 pt-4 space-y-2 mb-5">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Subtotal</span>
                    <span className="text-white font-medium">&euro;{cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Delivery</span>
                    {deliveryFee === 0 ? (
                      <span className="text-emerald-400 font-medium">&euro;0.00 &mdash; Free over &euro;500</span>
                    ) : (
                      <span className="text-white font-medium">&euro;{deliveryFee.toFixed(2)}</span>
                    )}
                  </div>
                  <div className="flex justify-between text-base font-bold pt-2 border-t border-white/10">
                    <span className="text-white">Total</span>
                    <span className="text-white">&euro;{(cartTotal + deliveryFee).toFixed(2)}</span>
                  </div>
                </div>

                {/* Place Order */}
                <button
                  className={`w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 mb-3 ${
                    shortfall > 0
                      ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] shadow-lg shadow-blue-600/20'
                  }`}
                  disabled={shortfall > 0}
                >
                  <Check className="w-4 h-4" />
                  Place Order
                </button>

                {/* Reorder Last */}
                <button className="w-full py-2.5 rounded-xl text-sm font-semibold bg-white/5 text-slate-300 hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                  <RotateCcw className="w-4 h-4" />
                  Reorder Last Order
                </button>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* ─── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/10 bg-[#0b1120] mt-8">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
                <MessageCircle className="w-4 h-4" />
                Need help? Chat with us
              </button>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Phone className="w-4 h-4" />
                <span>Call: 01-234-5678</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Calendar className="w-4 h-4" />
                <span>Orders: Mon&ndash;Sat 24/7</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-[8px] font-bold text-white">OB</div>
              <span>&copy; 2026 O&apos;Brien&apos;s Food Service &mdash; Powered by WholesaleOS</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ─── FLOATING PRICE REQUEST CHAT ──────────────────────────────── */}
      <AnimatePresence>
        {priceChat && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-96 bg-[#131a2e] border border-white/10 rounded-2xl shadow-2xl shadow-black/50 z-50 flex flex-col overflow-hidden"
            style={{ maxHeight: '500px' }}
          >
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Price Request</p>
                  <p className="text-[10px] text-blue-200">Typically responds in 24hrs</p>
                </div>
              </div>
              <button
                onClick={() => setPriceChat(false)}
                className="p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4 text-white/70" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: '320px' }}>
              {priceChatMessages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.from === 'user'
                      ? 'bg-blue-600 text-white rounded-br-md'
                      : 'bg-white/5 text-slate-300 border border-white/5 rounded-bl-md'
                  }`}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Input */}
            <div className="border-t border-white/10 p-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={priceChatInput}
                  onChange={e => setPriceChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendPriceChatMessage()}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                />
                <button
                  onClick={sendPriceChatMessage}
                  className="p-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shrink-0"
                >
                  <ArrowRight className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Chat Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setPriceChat(!priceChat)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg shadow-blue-500/30 flex items-center justify-center transition-colors ${
          priceChat ? 'bg-slate-700' : 'bg-gradient-to-br from-blue-500 to-indigo-600'
        }`}
      >
        {priceChat ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
      </motion.button>
    </div>
  );
}
