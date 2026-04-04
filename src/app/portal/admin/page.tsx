'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Store, Users, ShoppingCart, TrendingUp, Star,
  Package, Clock, Bell, Edit3, LayoutGrid, DollarSign,
  Truck, Send, ArrowUpRight, ArrowDownRight,
  ShoppingBag, Heart, UserPlus, MessageSquare, Settings,
  ChevronRight, Activity, Plus, Upload, Image, X, Check,
  Tag, Percent, Calendar, ChevronDown, Zap, Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── TYPES ──────────────────────────────────────────────────────────────────────

type OrderStatus = 'Processing' | 'Confirmed' | 'Dispatched' | 'Delivered';

interface Order {
  id: string;
  customer: string;
  items: string;
  total: string;
  status: OrderStatus;
  time: string;
}

interface TopProduct {
  name: string;
  orders: number;
  revenue: string;
  trend: string;
  trendUp: boolean;
}

interface ActivityItem {
  icon: typeof ShoppingBag;
  text: string;
  time: string;
  color: string;
}

// ─── DATA ───────────────────────────────────────────────────────────────────────

const KPI_STATS = [
  {
    label: 'Portal Active Customers',
    value: '847',
    change: '+12%',
    sub: 'this month',
    up: true,
    icon: Users,
    color: 'from-blue-500/20 to-blue-600/5',
    iconColor: 'text-blue-400',
  },
  {
    label: 'Orders Today',
    value: '34',
    change: 'EUR 12,480',
    sub: 'revenue today',
    up: true,
    icon: ShoppingCart,
    color: 'from-emerald-500/20 to-emerald-600/5',
    iconColor: 'text-emerald-400',
  },
  {
    label: 'Avg Order Value',
    value: 'EUR 367',
    change: '+8.2%',
    sub: 'vs last month',
    up: true,
    icon: TrendingUp,
    color: 'from-violet-500/20 to-violet-600/5',
    iconColor: 'text-violet-400',
  },
  {
    label: 'Customer Satisfaction',
    value: '4.7 / 5',
    change: '142 reviews',
    sub: 'this month',
    up: true,
    icon: Star,
    color: 'from-amber-500/20 to-amber-600/5',
    iconColor: 'text-amber-400',
  },
];

const ORDERS: Order[] = [
  { id: 'ORD-4856', customer: 'The Shelbourne Hotel', items: '14 items', total: 'EUR 687.40', status: 'Processing', time: '12 min ago' },
  { id: 'ORD-4855', customer: "Fitzgerald's Pub", items: '8 items', total: 'EUR 342.15', status: 'Confirmed', time: '28 min ago' },
  { id: 'ORD-4854', customer: 'Galway Bay Hotel', items: '22 items', total: 'EUR 1,241.80', status: 'Dispatched', time: '1 hr ago' },
  { id: 'ORD-4853', customer: 'The Brazen Head', items: '6 items', total: 'EUR 198.50', status: 'Processing', time: '1 hr ago' },
  { id: 'ORD-4852', customer: 'Cafe Sol Dublin', items: '11 items', total: 'EUR 523.60', status: 'Confirmed', time: '2 hrs ago' },
  { id: 'ORD-4851', customer: 'Killarney Plaza', items: '18 items', total: 'EUR 892.30', status: 'Dispatched', time: '2 hrs ago' },
  { id: 'ORD-4850', customer: "O'Donoghue's Bar", items: '5 items', total: 'EUR 167.80', status: 'Delivered', time: '3 hrs ago' },
  { id: 'ORD-4849', customer: 'Ballymaloe House', items: '31 items', total: 'EUR 2,180.45', status: 'Delivered', time: '4 hrs ago' },
];

const STATUS_STYLES: Record<OrderStatus, string> = {
  Processing: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  Confirmed: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  Dispatched: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  Delivered: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
};

const REVENUE_DATA = [
  { day: 'Mon', value: 8400 },
  { day: 'Tue', value: 11200 },
  { day: 'Wed', value: 9800 },
  { day: 'Thu', value: 12480 },
  { day: 'Fri', value: 14200 },
  { day: 'Sat', value: 6300 },
  { day: 'Sun', value: 3800 },
];

const MAX_REVENUE = Math.max(...REVENUE_DATA.map((d) => d.value));

const TOP_PRODUCTS: TopProduct[] = [
  { name: 'Kerrygold Butter 227g', orders: 142, revenue: 'EUR 3,479', trend: '+18%', trendUp: true },
  { name: "Barry's Tea Gold 600s", orders: 89, revenue: 'EUR 8,009', trend: '+12%', trendUp: true },
  { name: 'Avonmore Fresh Milk 2L', orders: 134, revenue: 'EUR 2,533', trend: '+5%', trendUp: true },
  { name: 'Brennans White Bread', orders: 98, revenue: 'EUR 2,117', trend: '-3%', trendUp: false },
  { name: 'Ballymaloe Relish 3kg', orders: 67, revenue: 'EUR 1,022', trend: '+22%', trendUp: true },
];

const ACTIVITY_FEED: ActivityItem[] = [
  { icon: ShoppingBag, text: 'The Shelbourne Hotel placed order ORD-4856 (EUR 687.40)', time: '12 min ago', color: 'text-blue-400' },
  { icon: Heart, text: "Fitzgerald's Pub added 3 items to favourites", time: '25 min ago', color: 'text-pink-400' },
  { icon: Package, text: 'Galway Bay Hotel reordered from previous order', time: '1 hr ago', color: 'text-violet-400' },
  { icon: UserPlus, text: 'New customer signup: Cork City Hotel', time: '2 hrs ago', color: 'text-emerald-400' },
  { icon: Star, text: 'Cafe Sol Dublin left a 5-star review', time: '3 hrs ago', color: 'text-amber-400' },
  { icon: Settings, text: 'Killarney Plaza updated delivery preferences', time: '4 hrs ago', color: 'text-slate-400' },
];

const QUICK_ACTIONS = [
  { label: 'Edit Banner', icon: Edit3 },
  { label: 'Manage Categories', icon: LayoutGrid },
  { label: 'Price Lists', icon: DollarSign },
  { label: 'Delivery Schedule', icon: Truck },
  { label: 'Push Notification', icon: Send },
];

// ─── ANIMATION VARIANTS ─────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

// ─── COMPONENT ──────────────────────────────────────────────────────────────────

const CATEGORIES = [
  'Dairy & Eggs', 'Meat & Poultry', 'Bakery', 'Beverages',
  'Dry Goods', 'Frozen', 'Fresh Produce', 'Condiments', 'Cleaning',
];

const UNIT_OPTIONS = ['Each', 'Case (6)', 'Case (12)', 'Case (24)', 'per kg', 'per 5kg box', 'Pallet'];

export default function PortalAdminPage() {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'All'>('All');
  const [formTab, setFormTab] = useState<'product' | 'sale'>('product');
  const [showSuccess, setShowSuccess] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '', sku: '', category: '', price: '', costPrice: '',
    unit: 'Each', unitOptions: ['Each'],
    stock: 'in-stock' as 'in-stock' | 'low-stock' | 'out-of-stock',
    stockQty: '', description: '', supplier: '', weight: '', barcode: '',
    image: null as string | null,
  });
  const [saleForm, setSaleForm] = useState({
    name: '', type: 'Percentage Off' as string, value: '',
    applyTo: 'All Products', category: '', products: '',
    startDate: '', endDate: '', banner: '', featured: true,
    image: null as string | null,
  });
  const [additionalUnits, setAdditionalUnits] = useState<string[]>([]);

  const handleProductSubmit = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
    setProductForm({
      name: '', sku: '', category: '', price: '', costPrice: '',
      unit: 'Each', unitOptions: ['Each'],
      stock: 'in-stock', stockQty: '', description: '', supplier: '',
      weight: '', barcode: '', image: null,
    });
    setAdditionalUnits([]);
  };

  const handleSaleSubmit = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
    setSaleForm({
      name: '', type: 'Percentage Off', value: '',
      applyTo: 'All Products', category: '', products: '',
      startDate: '', endDate: '', banner: '', featured: true, image: null,
    });
  };

  const toggleUnit = (unit: string) => {
    setAdditionalUnits(prev =>
      prev.includes(unit) ? prev.filter(u => u !== unit) : [...prev, unit]
    );
  };

  const filteredOrders =
    selectedStatus === 'All' ? ORDERS : ORDERS.filter((o) => o.status === selectedStatus);

  return (
    <div className="min-h-screen bg-[#050510] text-white">
      <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">
        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Store className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Customer Portal{' '}
                <span className="text-white/40 font-normal">&mdash; Admin</span>
              </h1>
              <p className="text-sm text-white/40">
                Manage your B2B storefront, orders, and customer experience
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative h-9 w-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
              <Bell className="h-4 w-4 text-white/60" />
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-blue-500 text-[10px] font-bold flex items-center justify-center">
                3
              </span>
            </button>
            <a
              href="/portal"
              className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2 transition-colors"
            >
              View Storefront
              <ChevronRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </motion.div>

        {/* ── KPI Stats Row ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {KPI_STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              custom={i}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className={cn(
                'relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a14] p-5',
                'hover:border-white/15 transition-colors'
              )}
            >
              <div
                className={cn(
                  'absolute inset-0 bg-gradient-to-br opacity-60 pointer-events-none',
                  stat.color
                )}
              />
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-white/50 uppercase tracking-wider">
                    {stat.label}
                  </span>
                  <stat.icon className={cn('h-4 w-4', stat.iconColor)} />
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={cn(
                      'text-xs font-semibold',
                      stat.up ? 'text-emerald-400' : 'text-red-400'
                    )}
                  >
                    {stat.change}
                  </span>
                  <span className="text-xs text-white/30">{stat.sub}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Main Grid ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* LEFT COL: Orders Table + Revenue Chart */}
          <div className="xl:col-span-2 space-y-6">
            {/* Recent Portal Orders */}
            <motion.div
              custom={4}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="rounded-2xl border border-white/10 bg-[#0a0a14] overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-blue-400" />
                  <h2 className="font-semibold text-sm">Recent Portal Orders</h2>
                  <span className="ml-1 text-xs text-white/30">{ORDERS.length} orders</span>
                </div>
                <div className="flex gap-1">
                  {(['All', 'Processing', 'Confirmed', 'Dispatched', 'Delivered'] as const).map(
                    (s) => (
                      <button
                        key={s}
                        onClick={() => setSelectedStatus(s)}
                        className={cn(
                          'px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors',
                          selectedStatus === s
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'text-white/40 hover:text-white/60 hover:bg-white/5'
                        )}
                      >
                        {s}
                      </button>
                    )
                  )}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-t border-white/5 text-white/30 text-xs uppercase tracking-wider">
                      <th className="text-left px-5 py-3 font-medium">Order</th>
                      <th className="text-left px-5 py-3 font-medium">Customer</th>
                      <th className="text-left px-5 py-3 font-medium">Items</th>
                      <th className="text-left px-5 py-3 font-medium">Total</th>
                      <th className="text-left px-5 py-3 font-medium">Status</th>
                      <th className="text-right px-5 py-3 font-medium">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order, i) => (
                      <motion.tr
                        key={order.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="border-t border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer group"
                      >
                        <td className="px-5 py-3.5 font-mono text-blue-400 text-xs">
                          {order.id}
                        </td>
                        <td className="px-5 py-3.5 font-medium text-white/90 group-hover:text-white">
                          {order.customer}
                        </td>
                        <td className="px-5 py-3.5 text-white/50">{order.items}</td>
                        <td className="px-5 py-3.5 font-medium text-white/80">{order.total}</td>
                        <td className="px-5 py-3.5">
                          <span
                            className={cn(
                              'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border',
                              STATUS_STYLES[order.status]
                            )}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right text-white/30 text-xs">
                          <div className="flex items-center justify-end gap-1.5">
                            <Clock className="h-3 w-3" />
                            {order.time}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredOrders.length === 0 && (
                <div className="px-5 py-10 text-center text-white/30 text-sm">
                  No orders with status &ldquo;{selectedStatus}&rdquo;
                </div>
              )}
            </motion.div>

            {/* Revenue Chart */}
            <motion.div
              custom={5}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="rounded-2xl border border-white/10 bg-[#0a0a14] p-5"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-400" />
                  <h2 className="font-semibold text-sm">Portal Revenue — Last 7 Days</h2>
                </div>
                <span className="text-xs text-white/30">
                  Total: EUR{' '}
                  {REVENUE_DATA.reduce((a, b) => a + b.value, 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-end gap-3 h-48">
                {REVENUE_DATA.map((d, i) => {
                  const heightPct = (d.value / MAX_REVENUE) * 100;
                  const isToday = d.day === 'Thu';
                  return (
                    <div key={d.day} className="flex-1 flex flex-col items-center gap-2 group">
                      <span className="text-[10px] font-medium text-white/40 opacity-0 group-hover:opacity-100 transition-opacity">
                        EUR {d.value.toLocaleString()}
                      </span>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${heightPct}%` }}
                        transition={{ delay: 0.3 + i * 0.08, duration: 0.5, ease: 'easeOut' }}
                        className={cn(
                          'w-full rounded-lg transition-colors',
                          isToday
                            ? 'bg-blue-500 shadow-lg shadow-blue-500/20'
                            : 'bg-white/10 group-hover:bg-white/15'
                        )}
                      />
                      <span
                        className={cn(
                          'text-[11px] font-medium',
                          isToday ? 'text-blue-400' : 'text-white/30'
                        )}
                      >
                        {d.day}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Top Ordered Products */}
            <motion.div
              custom={6}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="rounded-2xl border border-white/10 bg-[#0a0a14] overflow-hidden"
            >
              <div className="flex items-center gap-2 px-5 pt-5 pb-3">
                <TrendingUp className="h-4 w-4 text-blue-400" />
                <h2 className="font-semibold text-sm">Top Ordered Products</h2>
                <span className="ml-1 text-xs text-white/30">this week</span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-t border-white/5 text-white/30 text-xs uppercase tracking-wider">
                    <th className="text-left px-5 py-3 font-medium">Product</th>
                    <th className="text-left px-5 py-3 font-medium">Orders</th>
                    <th className="text-left px-5 py-3 font-medium">Revenue</th>
                    <th className="text-right px-5 py-3 font-medium">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {TOP_PRODUCTS.map((product, i) => (
                    <tr
                      key={product.name}
                      className="border-t border-white/5 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center">
                            <Package className="h-3.5 w-3.5 text-white/40" />
                          </div>
                          <span className="font-medium text-white/90">{product.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-white/60">
                        {product.orders} orders
                      </td>
                      <td className="px-5 py-3.5 font-medium text-white/80">
                        {product.revenue}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 text-xs font-semibold',
                            product.trendUp ? 'text-emerald-400' : 'text-red-400'
                          )}
                        >
                          {product.trendUp ? (
                            <ArrowUpRight className="h-3 w-3" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3" />
                          )}
                          {product.trend}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          </div>

          {/* RIGHT COL: Activity Feed + Quick Actions */}
          <div className="space-y-6">
            {/* Customer Activity Feed */}
            <motion.div
              custom={5}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="rounded-2xl border border-white/10 bg-[#0a0a14] p-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="h-4 w-4 text-blue-400" />
                <h2 className="font-semibold text-sm">Customer Activity</h2>
              </div>
              <div className="space-y-0">
                {ACTIVITY_FEED.map((item, i) => (
                  <motion.div
                    key={i}
                    custom={6 + i}
                    initial="hidden"
                    animate="visible"
                    variants={fadeUp}
                    className="flex items-start gap-3 py-3.5 border-b border-white/5 last:border-0"
                  >
                    <div
                      className={cn(
                        'h-8 w-8 rounded-lg bg-white/5 flex-shrink-0 flex items-center justify-center mt-0.5',
                      )}
                    >
                      <item.icon className={cn('h-3.5 w-3.5', item.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white/70 leading-snug">{item.text}</p>
                      <p className="text-[11px] text-white/25 mt-1 flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {item.time}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
              <button className="w-full mt-3 py-2 text-xs text-blue-400 hover:text-blue-300 bg-blue-500/5 hover:bg-blue-500/10 rounded-lg border border-blue-500/10 transition-colors font-medium">
                View All Activity
              </button>
            </motion.div>

            {/* Portal Settings Quick Actions */}
            <motion.div
              custom={7}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="rounded-2xl border border-white/10 bg-[#0a0a14] p-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <Settings className="h-4 w-4 text-blue-400" />
                <h2 className="font-semibold text-sm">Portal Settings</h2>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {QUICK_ACTIONS.map((action, i) => (
                  <motion.button
                    key={action.label}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 hover:bg-white/[0.05] transition-all text-left group"
                  >
                    <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                      <action.icon className="h-3.5 w-3.5 text-blue-400" />
                    </div>
                    <span className="text-sm font-medium text-white/70 group-hover:text-white/90 transition-colors">
                      {action.label}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-white/20 ml-auto group-hover:text-white/40 transition-colors" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
        {/* ── Add to Storefront Section ──────────────────────────────────── */}
        <motion.div
          custom={8}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="rounded-2xl border border-white/10 bg-[#0a0a14] overflow-hidden"
        >
          {/* Section Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Plus className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Add to Storefront</h2>
                <p className="text-sm text-white/40">Add a new product or sale — auto-published to customer view</p>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
              <button
                onClick={() => setFormTab('product')}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  formTab === 'product' ? 'bg-blue-500/20 text-blue-400' : 'text-white/40 hover:text-white/60'
                )}
              >
                <Package className="h-4 w-4 inline mr-1.5" />
                Add Product
              </button>
              <button
                onClick={() => setFormTab('sale')}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  formTab === 'sale' ? 'bg-emerald-500/20 text-emerald-400' : 'text-white/40 hover:text-white/60'
                )}
              >
                <Tag className="h-4 w-4 inline mr-1.5" />
                Add Sale
              </button>
            </div>
          </div>

          {/* Success Toast */}
          <AnimatePresence>
            {showSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mx-6 mt-4 flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3"
              >
                <Check className="h-5 w-5 text-emerald-400" />
                <p className="text-sm text-emerald-400 font-medium">
                  {formTab === 'product' ? 'Product added to storefront!' : 'Sale published to storefront!'}
                  {' '}Visible to customers now.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="p-6">
            <AnimatePresence mode="wait">
              {/* ── ADD PRODUCT FORM ──────────────────────────────────────── */}
              {formTab === 'product' && (
                <motion.div
                  key="product-form"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                >
                  {/* Left Column - Main Details */}
                  <div className="lg:col-span-2 space-y-5">
                    {/* Product Name & SKU */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-sm text-white/50 mb-1.5">Product Name *</label>
                        <input
                          type="text"
                          placeholder="e.g. Kerrygold Butter 227g"
                          value={productForm.name}
                          onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-white/50 mb-1.5">SKU</label>
                        <input
                          type="text"
                          placeholder="e.g. KB-227"
                          value={productForm.sku}
                          onChange={e => setProductForm({ ...productForm, sku: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 transition-colors"
                        />
                      </div>
                    </div>

                    {/* Category & Supplier */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-white/50 mb-1.5">Category *</label>
                        <div className="relative">
                          <select
                            value={productForm.category}
                            onChange={e => setProductForm({ ...productForm, category: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-colors appearance-none cursor-pointer"
                          >
                            <option value="" className="bg-[#0a0a14]">Select category</option>
                            {CATEGORIES.map(c => <option key={c} value={c} className="bg-[#0a0a14]">{c}</option>)}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm text-white/50 mb-1.5">Supplier</label>
                        <input
                          type="text"
                          placeholder="e.g. Kerrygold Ireland"
                          value={productForm.supplier}
                          onChange={e => setProductForm({ ...productForm, supplier: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 transition-colors"
                        />
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm text-white/50 mb-1.5">Description</label>
                      <textarea
                        placeholder="Product description visible to customers..."
                        value={productForm.description}
                        onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                        rows={3}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 transition-colors resize-none"
                      />
                    </div>

                    {/* Pricing */}
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm text-white/50 mb-1.5">Selling Price (EUR) *</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={productForm.price}
                          onChange={e => setProductForm({ ...productForm, price: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-white/50 mb-1.5">Cost Price (EUR)</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={productForm.costPrice}
                          onChange={e => setProductForm({ ...productForm, costPrice: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-white/50 mb-1.5">Margin</label>
                        <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm">
                          {productForm.price && productForm.costPrice ? (
                            <span className="text-emerald-400 font-medium">
                              {(((parseFloat(productForm.price) - parseFloat(productForm.costPrice)) / parseFloat(productForm.price)) * 100).toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-white/20">—</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Units */}
                    <div>
                      <label className="block text-sm text-white/50 mb-1.5">Default Unit *</label>
                      <div className="relative mb-3">
                        <select
                          value={productForm.unit}
                          onChange={e => setProductForm({ ...productForm, unit: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-colors appearance-none cursor-pointer"
                        >
                          {UNIT_OPTIONS.map(u => <option key={u} value={u} className="bg-[#0a0a14]">{u}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                      </div>
                      <label className="block text-xs text-white/40 mb-1.5">Additional unit options for customer</label>
                      <div className="flex flex-wrap gap-2">
                        {UNIT_OPTIONS.filter(u => u !== productForm.unit).map(u => (
                          <button
                            key={u}
                            onClick={() => toggleUnit(u)}
                            className={cn(
                              'px-3 py-1.5 rounded-lg text-xs transition-colors border',
                              additionalUnits.includes(u)
                                ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                : 'bg-white/5 text-white/40 border-white/10 hover:text-white/60'
                            )}
                          >
                            {additionalUnits.includes(u) && <Check className="w-3 h-3 inline mr-1" />}
                            {u}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Stock & Weight */}
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm text-white/50 mb-1.5">Stock Status</label>
                        <div className="relative">
                          <select
                            value={productForm.stock}
                            onChange={e => setProductForm({ ...productForm, stock: e.target.value as 'in-stock' | 'low-stock' | 'out-of-stock' })}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-colors appearance-none cursor-pointer"
                          >
                            <option value="in-stock" className="bg-[#0a0a14]">In Stock</option>
                            <option value="low-stock" className="bg-[#0a0a14]">Low Stock</option>
                            <option value="out-of-stock" className="bg-[#0a0a14]">Out of Stock</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm text-white/50 mb-1.5">Stock Quantity</label>
                        <input
                          type="number"
                          placeholder="e.g. 250"
                          value={productForm.stockQty}
                          onChange={e => setProductForm({ ...productForm, stockQty: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-white/50 mb-1.5">Weight / Size</label>
                        <input
                          type="text"
                          placeholder="e.g. 227g, 2L, 25kg"
                          value={productForm.weight}
                          onChange={e => setProductForm({ ...productForm, weight: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 transition-colors"
                        />
                      </div>
                    </div>

                    {/* Barcode */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-white/50 mb-1.5">Barcode / EAN</label>
                        <input
                          type="text"
                          placeholder="e.g. 5011038123456"
                          value={productForm.barcode}
                          onChange={e => setProductForm({ ...productForm, barcode: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Image & Preview */}
                  <div className="space-y-5">
                    {/* Image Upload */}
                    <div>
                      <label className="block text-sm text-white/50 mb-1.5">Product Photo</label>
                      <div className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center hover:border-blue-500/30 transition-colors cursor-pointer group">
                        {productForm.image ? (
                          <div className="relative">
                            <div className="w-full h-48 bg-white/5 rounded-lg flex items-center justify-center">
                              <Image className="h-16 w-16 text-blue-400" />
                            </div>
                            <button
                              onClick={() => setProductForm({ ...productForm, image: null })}
                              className="absolute top-2 right-2 h-6 w-6 bg-red-500/80 rounded-full flex items-center justify-center"
                            >
                              <X className="h-3 w-3 text-white" />
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => setProductForm({ ...productForm, image: 'uploaded' })}
                          >
                            <Upload className="h-10 w-10 text-white/20 mx-auto mb-3 group-hover:text-blue-400 transition-colors" />
                            <p className="text-sm text-white/40 group-hover:text-white/60 transition-colors">
                              Click to upload product photo
                            </p>
                            <p className="text-xs text-white/20 mt-1">PNG, JPG up to 5MB</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Live Preview */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Eye className="h-4 w-4 text-blue-400" />
                        <span className="text-sm font-medium text-white/60">Storefront Preview</span>
                      </div>
                      <div className="bg-[#0f1629] border border-white/10 rounded-xl p-4 space-y-3">
                        <div className="w-full h-28 bg-white/5 rounded-lg flex items-center justify-center">
                          {productForm.image ? (
                            <Image className="h-10 w-10 text-blue-400/50" />
                          ) : (
                            <Package className="h-10 w-10 text-white/10" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white truncate">
                            {productForm.name || 'Product Name'}
                          </p>
                          <p className="text-xs text-white/30 mt-0.5">
                            {productForm.category || 'Category'} &middot; {productForm.unit}
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-white">
                            {productForm.price ? `EUR ${parseFloat(productForm.price).toFixed(2)}` : 'EUR 0.00'}
                          </span>
                          <span className={cn(
                            'text-xs px-2 py-0.5 rounded-full',
                            productForm.stock === 'in-stock' ? 'bg-emerald-500/20 text-emerald-400' :
                            productForm.stock === 'low-stock' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-red-500/20 text-red-400'
                          )}>
                            {productForm.stock === 'in-stock' ? 'In Stock' : productForm.stock === 'low-stock' ? 'Low Stock' : 'Out of Stock'}
                          </span>
                        </div>
                        <button className="w-full py-2 bg-blue-600 rounded-lg text-sm font-medium text-white opacity-70 cursor-default">
                          + Add to Cart
                        </button>
                      </div>
                    </div>

                    {/* Submit */}
                    <button
                      onClick={handleProductSubmit}
                      disabled={!productForm.name || !productForm.price || !productForm.category}
                      className={cn(
                        'w-full py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2',
                        productForm.name && productForm.price && productForm.category
                          ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                          : 'bg-white/5 text-white/20 cursor-not-allowed'
                      )}
                    >
                      <Zap className="h-4 w-4" />
                      Publish to Storefront
                    </button>
                    <p className="text-xs text-white/30 text-center">
                      Product will be instantly visible on the customer portal
                    </p>
                  </div>
                </motion.div>
              )}

              {/* ── ADD SALE FORM ─────────────────────────────────────────── */}
              {formTab === 'sale' && (
                <motion.div
                  key="sale-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                >
                  {/* Left Column */}
                  <div className="lg:col-span-2 space-y-5">
                    {/* Sale Name */}
                    <div>
                      <label className="block text-sm text-white/50 mb-1.5">Sale / Offer Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Spring Dairy Sale, Weekend Flash Deal"
                        value={saleForm.name}
                        onChange={e => setSaleForm({ ...saleForm, name: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 transition-colors"
                      />
                    </div>

                    {/* Type & Value */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-white/50 mb-1.5">Discount Type *</label>
                        <div className="relative">
                          <select
                            value={saleForm.type}
                            onChange={e => setSaleForm({ ...saleForm, type: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-colors appearance-none cursor-pointer"
                          >
                            {['Percentage Off', 'Fixed Amount Off', 'Buy X Get Y Free', 'Free Delivery', 'Bundle Price'].map(t => (
                              <option key={t} value={t} className="bg-[#0a0a14]">{t}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm text-white/50 mb-1.5">
                          {saleForm.type === 'Percentage Off' ? 'Discount (%)' :
                           saleForm.type === 'Fixed Amount Off' ? 'Amount Off (EUR)' :
                           saleForm.type === 'Free Delivery' ? 'Min Order (EUR)' :
                           saleForm.type === 'Bundle Price' ? 'Bundle Price (EUR)' : 'Value'} *
                        </label>
                        <input
                          type="text"
                          placeholder={saleForm.type === 'Percentage Off' ? 'e.g. 15' : 'e.g. 25.00'}
                          value={saleForm.value}
                          onChange={e => setSaleForm({ ...saleForm, value: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 transition-colors"
                        />
                      </div>
                    </div>

                    {/* Apply To */}
                    <div>
                      <label className="block text-sm text-white/50 mb-1.5">Apply To</label>
                      <div className="flex items-center gap-2">
                        {['All Products', 'Category', 'Specific Products'].map(opt => (
                          <button
                            key={opt}
                            onClick={() => setSaleForm({ ...saleForm, applyTo: opt })}
                            className={cn(
                              'px-3 py-1.5 rounded-lg text-xs transition-colors border',
                              saleForm.applyTo === opt
                                ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                : 'bg-white/5 text-white/40 border-white/10 hover:text-white/60'
                            )}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Category selector */}
                    {saleForm.applyTo === 'Category' && (
                      <div>
                        <label className="block text-sm text-white/50 mb-1.5">Select Category</label>
                        <div className="flex flex-wrap gap-2">
                          {CATEGORIES.map(cat => (
                            <button
                              key={cat}
                              onClick={() => setSaleForm({ ...saleForm, category: cat })}
                              className={cn(
                                'px-3 py-1.5 rounded-lg text-xs transition-colors border',
                                saleForm.category === cat
                                  ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                  : 'bg-white/5 text-white/40 border-white/10 hover:text-white/60'
                              )}
                            >
                              {saleForm.category === cat && <Check className="w-3 h-3 inline mr-1" />}
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Product names */}
                    {saleForm.applyTo === 'Specific Products' && (
                      <div>
                        <label className="block text-sm text-white/50 mb-1.5">Product Names (comma-separated)</label>
                        <input
                          type="text"
                          placeholder="e.g. Kerrygold Butter 227g, Barry's Tea Gold Blend"
                          value={saleForm.products}
                          onChange={e => setSaleForm({ ...saleForm, products: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 transition-colors"
                        />
                      </div>
                    )}

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-white/50 mb-1.5">Start Date *</label>
                        <input
                          type="date"
                          value={saleForm.startDate}
                          onChange={e => setSaleForm({ ...saleForm, startDate: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-white/50 mb-1.5">End Date *</label>
                        <input
                          type="date"
                          value={saleForm.endDate}
                          onChange={e => setSaleForm({ ...saleForm, endDate: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
                        />
                      </div>
                    </div>

                    {/* Banner Text */}
                    <div>
                      <label className="block text-sm text-white/50 mb-1.5">Storefront Banner Text</label>
                      <input
                        type="text"
                        placeholder="e.g. Spring Sale — 15% off all Dairy this week only!"
                        value={saleForm.banner}
                        onChange={e => setSaleForm({ ...saleForm, banner: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 transition-colors"
                      />
                    </div>

                    {/* Featured toggle */}
                    <div className="flex items-center justify-between bg-white/5 rounded-lg px-4 py-3 border border-white/10">
                      <div className="flex items-center gap-3">
                        <Star className="w-5 h-5 text-amber-400" />
                        <div>
                          <p className="text-sm text-white font-medium">Featured on Homepage</p>
                          <p className="text-xs text-white/40">Show as hero banner on customer portal</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSaleForm({ ...saleForm, featured: !saleForm.featured })}
                        className={cn(
                          'relative w-11 h-6 rounded-full transition-colors',
                          saleForm.featured ? 'bg-blue-500' : 'bg-white/10'
                        )}
                      >
                        <motion.div
                          animate={{ x: saleForm.featured ? 20 : 2 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          className="absolute top-1 w-4 h-4 rounded-full bg-white"
                        />
                      </button>
                    </div>
                  </div>

                  {/* Right Column - Image & Preview */}
                  <div className="space-y-5">
                    {/* Sale Image */}
                    <div>
                      <label className="block text-sm text-white/50 mb-1.5">Sale Banner Image</label>
                      <div className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center hover:border-emerald-500/30 transition-colors cursor-pointer group">
                        {saleForm.image ? (
                          <div className="relative">
                            <div className="w-full h-36 bg-gradient-to-r from-emerald-600/30 to-blue-600/30 rounded-lg flex items-center justify-center">
                              <Image className="h-12 w-12 text-emerald-400" />
                            </div>
                            <button
                              onClick={() => setSaleForm({ ...saleForm, image: null })}
                              className="absolute top-2 right-2 h-6 w-6 bg-red-500/80 rounded-full flex items-center justify-center"
                            >
                              <X className="h-3 w-3 text-white" />
                            </button>
                          </div>
                        ) : (
                          <div onClick={() => setSaleForm({ ...saleForm, image: 'uploaded' })}>
                            <Upload className="h-10 w-10 text-white/20 mx-auto mb-3 group-hover:text-emerald-400 transition-colors" />
                            <p className="text-sm text-white/40 group-hover:text-white/60 transition-colors">
                              Upload sale banner image
                            </p>
                            <p className="text-xs text-white/20 mt-1">Recommended: 1200x400px</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Preview */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Eye className="h-4 w-4 text-emerald-400" />
                        <span className="text-sm font-medium text-white/60">Customer Banner Preview</span>
                      </div>
                      <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 rounded-xl p-5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                        <div className="relative z-10">
                          <div className="flex items-center gap-2 mb-2">
                            <Tag className="h-4 w-4 text-emerald-200" />
                            <span className="text-xs font-semibold text-emerald-200 uppercase tracking-wider">
                              {saleForm.type === 'Percentage Off' && saleForm.value ? `${saleForm.value}% Off` :
                               saleForm.type === 'Fixed Amount Off' && saleForm.value ? `EUR ${saleForm.value} Off` :
                               saleForm.type || 'Sale'}
                            </span>
                          </div>
                          <h3 className="text-lg font-bold text-white mb-1">
                            {saleForm.name || 'Sale Name'}
                          </h3>
                          <p className="text-sm text-emerald-100/70">
                            {saleForm.banner || 'Banner text will appear here...'}
                          </p>
                          {saleForm.startDate && saleForm.endDate && (
                            <p className="text-xs text-emerald-200/50 mt-2 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {saleForm.startDate} to {saleForm.endDate}
                            </p>
                          )}
                          <button className="mt-3 px-4 py-1.5 bg-white/20 rounded-lg text-xs font-medium text-white opacity-70 cursor-default">
                            Shop Now
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Submit */}
                    <button
                      onClick={handleSaleSubmit}
                      disabled={!saleForm.name || !saleForm.value || !saleForm.startDate || !saleForm.endDate}
                      className={cn(
                        'w-full py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2',
                        saleForm.name && saleForm.value && saleForm.startDate && saleForm.endDate
                          ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                          : 'bg-white/5 text-white/20 cursor-not-allowed'
                      )}
                    >
                      <Zap className="h-4 w-4" />
                      Publish Sale to Storefront
                    </button>
                    <p className="text-xs text-white/30 text-center">
                      Sale will appear on the customer portal immediately
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
