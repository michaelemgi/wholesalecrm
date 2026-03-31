import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding PostgreSQL database...");

  // ─── CLEAR ALL TABLES (FK order) ──────────────────────────────────────────
  await prisma.customerProductPrice.deleteMany();
  await prisma.billingAgreement.deleteMany();
  await prisma.paymentCard.deleteMany();
  await prisma.communication.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.aIInsight.deleteMany();
  await prisma.monthlyFinancial.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.metaCampaign.deleteMany();
  await prisma.emailSequenceStep.deleteMany();
  await prisma.emailCampaign.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.pipelineDeal.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.standingOrderItem.deleteMany();
  await prisma.standingOrder.deleteMany();
  await prisma.purchaseOrderItem.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.supplier.deleteMany();

  console.log("Cleared all tables.");

  // ─── SUPPLIERS ────────────────────────────────────────────────────────────
  const suppliers = [
    { id: "sup-001", name: "Global Supply Co.", contactName: "Richard Hayes", email: "richard@globalsupply.com", phone: "(415) 555-9001", address: "100 Supply Chain Blvd, San Francisco, CA 94107", website: "https://globalsupply.com", category: "Food & Beverage", paymentTerms: "Net 30", leadTimeDays: 7, rating: 4.5, totalOrders: 245, totalSpend: 1250000, lastOrderDate: "2026-03-25" },
    { id: "sup-002", name: "Pacific Trade Inc.", contactName: "Kenji Yamamoto", email: "kenji@pacifictrade.com", phone: "(206) 555-9002", address: "2200 Harbor Ave, Seattle, WA 98126", website: "https://pacifictrade.com", category: "Import/Export", paymentTerms: "Net 45", leadTimeDays: 10, rating: 4.2, totalOrders: 180, totalSpend: 980000, lastOrderDate: "2026-03-22" },
    { id: "sup-003", name: "Midwest Wholesale", contactName: "Tom Bradley", email: "tom@midwestwholesale.com", phone: "(312) 555-9003", address: "500 Industrial Pkwy, Chicago, IL 60607", website: "https://midwestwholesale.com", category: "Building & Industrial", paymentTerms: "Net 30", leadTimeDays: 5, rating: 4.7, totalOrders: 320, totalSpend: 1890000, lastOrderDate: "2026-03-27" },
    { id: "sup-004", name: "Southern Distributors", contactName: "Billy Ray Carson", email: "billy@southerndist.com", phone: "(214) 555-9004", address: "800 Commerce St, Dallas, TX 75201", website: "https://southerndist.com", category: "General", paymentTerms: "Net 30", leadTimeDays: 6, rating: 4.0, totalOrders: 150, totalSpend: 720000, lastOrderDate: "2026-03-20" },
    { id: "sup-005", name: "Atlantic Imports", contactName: "Sofia Rosario", email: "sofia@atlanticimports.com", phone: "(305) 555-9005", address: "300 Biscayne Blvd, Miami, FL 33131", website: "https://atlanticimports.com", category: "Specialty Foods", paymentTerms: "Net 45", leadTimeDays: 12, rating: 4.3, totalOrders: 95, totalSpend: 540000, lastOrderDate: "2026-03-18" },
  ];

  for (const s of suppliers) {
    await prisma.supplier.create({ data: s });
  }
  console.log("Seeded 5 suppliers.");

  // ─── PRODUCTS ─────────────────────────────────────────────────────────────
  const warehouseNames = ["Warehouse A - West", "Warehouse B - Central", "Warehouse C - East"];
  const supplierNames = ["Global Supply Co.", "Pacific Trade Inc.", "Midwest Wholesale", "Southern Distributors", "Atlantic Imports"];
  const categories = ["Food & Beverage", "Building Materials", "Packaging", "Industrial", "Chemicals", "Agriculture", "Paper Goods"];

  function makeProduct(id: number, sku: string, name: string, cat: string, up: number, wp: number, stock: number, rp: number, wh: string, unit: string, supplier: string, ltd: number) {
    const status = stock === 0 ? "Out of Stock" : stock <= rp ? "Low Stock" : "Active";
    return {
      id: `prod-${id.toString().padStart(3, "0")}`,
      sku,
      name,
      category: cat,
      unitPrice: up,
      wholesalePrice: wp,
      tier1Price: Math.round(wp * 0.95),
      tier2Price: Math.round(wp * 0.9),
      tier3Price: Math.round(wp * 0.85),
      vipPrice: Math.round(wp * 0.8),
      stockLevel: stock,
      reorderPoint: rp,
      warehouseLocation: `Aisle ${Math.ceil(id / 10)}-Rack ${(id % 10) + 1}`,
      warehouse: wh,
      unit,
      weight: Math.round(up * 0.3),
      supplier,
      leadTimeDays: ltd,
      status,
    };
  }

  const productsData = [
    makeProduct(1, "SKU-1001", "Organic Olive Oil 5L", "Food & Beverage", 42, 28, 340, 50, warehouseNames[0], "bottle", supplierNames[0], 7),
    makeProduct(2, "SKU-1002", "Brown Rice 25kg", "Food & Beverage", 38, 24, 520, 100, warehouseNames[1], "bag", supplierNames[0], 5),
    makeProduct(3, "SKU-1003", "Sea Salt 10kg", "Food & Beverage", 15, 9, 890, 150, warehouseNames[0], "bag", supplierNames[2], 4),
    makeProduct(4, "SKU-1004", "All-Purpose Flour 50lb", "Food & Beverage", 22, 14, 1200, 200, warehouseNames[1], "bag", supplierNames[2], 3),
    makeProduct(5, "SKU-1005", "Sugar Granulated 50lb", "Food & Beverage", 28, 18, 980, 150, warehouseNames[1], "bag", supplierNames[2], 3),
    makeProduct(6, "SKU-1006", "Butter Unsalted 36ct", "Food & Beverage", 96, 72, 180, 40, warehouseNames[0], "case", supplierNames[0], 5),
    makeProduct(7, "SKU-1007", "EVOO Premium 5L", "Food & Beverage", 58, 42, 210, 30, warehouseNames[0], "bottle", supplierNames[4], 10),
    makeProduct(8, "SKU-1008", "Pasta Variety Case", "Food & Beverage", 36, 24, 450, 80, warehouseNames[0], "case", supplierNames[4], 8),
    makeProduct(9, "SKU-1009", "San Marzano Tomatoes 6ct", "Food & Beverage", 28, 19, 380, 60, warehouseNames[0], "case", supplierNames[4], 8),
    makeProduct(10, "SKU-1010", "Frozen Shrimp 10lb", "Food & Beverage", 85, 62, 150, 30, warehouseNames[2], "box", supplierNames[0], 7),
    makeProduct(11, "SKU-1011", "Salmon Fillet Case", "Food & Beverage", 125, 95, 80, 20, warehouseNames[2], "case", supplierNames[0], 3),
    makeProduct(12, "SKU-1012", "Premium Steak Cuts Case", "Food & Beverage", 245, 185, 65, 15, warehouseNames[2], "case", supplierNames[3], 5),
    makeProduct(13, "SKU-1013", "Mixed Greens Case", "Food & Beverage", 32, 22, 200, 50, warehouseNames[0], "case", supplierNames[0], 2),
    makeProduct(14, "SKU-1014", "Avocados 48ct", "Food & Beverage", 48, 34, 300, 80, warehouseNames[0], "case", supplierNames[0], 3),
    makeProduct(15, "SKU-1015", "Organic Quinoa 25lb", "Food & Beverage", 56, 38, 180, 30, warehouseNames[0], "bag", supplierNames[4], 10),
    makeProduct(16, "SKU-1016", "Chia Seeds 10lb", "Food & Beverage", 42, 28, 220, 40, warehouseNames[0], "bag", supplierNames[4], 10),
    makeProduct(17, "SKU-1017", "Coconut Oil 5gal", "Food & Beverage", 68, 48, 140, 25, warehouseNames[0], "bucket", supplierNames[4], 12),
    makeProduct(18, "SKU-1018", "Frozen Pizza Cases", "Food & Beverage", 52, 36, 400, 80, warehouseNames[2], "case", supplierNames[2], 5),
    makeProduct(19, "SKU-1019", "Ice Cream 3gal", "Food & Beverage", 38, 26, 250, 50, warehouseNames[2], "tub", supplierNames[2], 4),
    makeProduct(20, "SKU-1020", "Sparkling Water 24pk", "Food & Beverage", 18, 11, 600, 100, warehouseNames[1], "pack", supplierNames[3], 5),
    makeProduct(21, "SKU-2001", "Portland Cement 50lb", "Building Materials", 12, 7, 2400, 500, warehouseNames[1], "bag", supplierNames[2], 3),
    makeProduct(22, "SKU-2002", "Rebar #4 20ft", "Building Materials", 18, 11, 1800, 300, warehouseNames[1], "piece", supplierNames[2], 5),
    makeProduct(23, "SKU-2003", "Plywood 4x8 3/4in", "Building Materials", 48, 32, 900, 150, warehouseNames[1], "sheet", supplierNames[2], 4),
    makeProduct(24, "SKU-2004", "Concrete Mix 80lb", "Building Materials", 8, 5, 3200, 600, warehouseNames[1], "bag", supplierNames[2], 3),
    makeProduct(25, "SKU-2005", "Drywall 4x8 1/2in", "Building Materials", 14, 9, 1500, 300, warehouseNames[1], "sheet", supplierNames[2], 4),
    makeProduct(26, "SKU-2006", "Insulation R-13 Roll", "Building Materials", 42, 28, 650, 100, warehouseNames[1], "roll", supplierNames[2], 5),
    makeProduct(27, "SKU-2007", "PVC Pipe 4in 10ft", "Building Materials", 15, 9, 1100, 200, warehouseNames[1], "piece", supplierNames[3], 4),
    makeProduct(28, "SKU-2008", "Wire 14ga 500ft", "Building Materials", 65, 45, 320, 50, warehouseNames[1], "spool", supplierNames[3], 6),
    makeProduct(29, "SKU-2009", "Lumber 2x4 8ft", "Building Materials", 6, 4, 4500, 800, warehouseNames[1], "piece", supplierNames[2], 3),
    makeProduct(30, "SKU-2010", "Roofing Shingles Bundle", "Building Materials", 35, 24, 800, 150, warehouseNames[1], "bundle", supplierNames[2], 5),
    makeProduct(31, "SKU-3001", "Corrugated Box 12x12", "Packaging", 2, 1, 8500, 2000, warehouseNames[0], "each", supplierNames[3], 4),
    makeProduct(32, "SKU-3002", "Stretch Wrap 18in", "Packaging", 28, 18, 450, 80, warehouseNames[0], "roll", supplierNames[3], 5),
    makeProduct(33, "SKU-3003", "Kraft Paper Rolls", "Packaging", 35, 22, 12, 50, warehouseNames[0], "roll", supplierNames[3], 5),
    makeProduct(34, "SKU-3004", "Bubble Wrap 24in 250ft", "Packaging", 42, 28, 280, 50, warehouseNames[0], "roll", supplierNames[3], 6),
    makeProduct(35, "SKU-3005", "Packing Tape 6pk", "Packaging", 12, 7, 950, 200, warehouseNames[0], "pack", supplierNames[3], 3),
    makeProduct(36, "SKU-3006", "Poly Bags 1000ct", "Packaging", 22, 14, 600, 100, warehouseNames[0], "box", supplierNames[3], 4),
    makeProduct(37, "SKU-3007", "Aluminum Trays 50ct", "Packaging", 28, 18, 420, 80, warehouseNames[0], "case", supplierNames[3], 5),
    makeProduct(38, "SKU-3008", "Food Containers 500ct", "Packaging", 38, 25, 350, 60, warehouseNames[0], "case", supplierNames[3], 5),
    makeProduct(39, "SKU-3009", "Shrink Film 18in", "Packaging", 32, 21, 280, 50, warehouseNames[0], "roll", supplierNames[3], 6),
    makeProduct(40, "SKU-3010", "Disposable Plates 500ct", "Packaging", 45, 30, 200, 40, warehouseNames[0], "case", supplierNames[3], 5),
    makeProduct(41, "SKU-4001", "Steel Pipe 4in 20ft", "Industrial", 85, 58, 320, 50, warehouseNames[1], "piece", supplierNames[2], 7),
    makeProduct(42, "SKU-4002", "Safety Gloves BulkPak", "Industrial", 48, 32, 500, 100, warehouseNames[1], "case", supplierNames[2], 5),
    makeProduct(43, "SKU-4003", "Lubricant 55gal", "Industrial", 280, 195, 45, 10, warehouseNames[1], "drum", supplierNames[2], 8),
    makeProduct(44, "SKU-4004", "Power Drill Set", "Industrial", 125, 85, 120, 20, warehouseNames[1], "set", supplierNames[2], 6),
    makeProduct(45, "SKU-4005", "Safety Goggles 50pk", "Industrial", 65, 42, 380, 60, warehouseNames[1], "pack", supplierNames[2], 4),
    makeProduct(46, "SKU-4006", "Steel Sheet 4x8", "Industrial", 95, 65, 200, 30, warehouseNames[1], "sheet", supplierNames[2], 7),
    makeProduct(47, "SKU-4007", "Welding Wire 33lb", "Industrial", 55, 38, 250, 40, warehouseNames[1], "spool", supplierNames[2], 6),
    makeProduct(48, "SKU-4008", "Industrial Cleaner 5gal", "Chemicals", 42, 28, 180, 30, warehouseNames[2], "bucket", supplierNames[3], 5),
    makeProduct(49, "SKU-4009", "Sanitizer Bulk 5gal", "Chemicals", 35, 22, 220, 40, warehouseNames[2], "bucket", supplierNames[3], 4),
    makeProduct(50, "SKU-4010", "Solvent Grade A 5gal", "Chemicals", 58, 40, 90, 15, warehouseNames[2], "bucket", supplierNames[3], 7),
  ];

  function seededRandom(seed: number): number {
    const x = Math.sin(seed * 9301 + 49297) * 49297;
    return x - Math.floor(x);
  }

  for (let i = 0; i < 50; i++) {
    const idx = i + 51;
    const cat = categories[i % categories.length];
    const wh = warehouseNames[i % warehouseNames.length];
    const sup = supplierNames[i % supplierNames.length];
    const price = 10 + Math.round(seededRandom(idx) * 200);
    const wp = Math.round(price * 0.68);
    const stock = Math.round(seededRandom(idx + 1000) * 1500);
    const rp = Math.round(stock * 0.15) + 10;
    const ltd = 3 + Math.round(seededRandom(idx + 2000) * 8);
    productsData.push(
      makeProduct(idx, `SKU-${5000 + idx}`, `Product ${idx} - ${cat}`, cat, price, wp, stock, rp, wh, "each", sup, ltd)
    );
  }

  for (const p of productsData) {
    await prisma.product.create({ data: p });
  }
  console.log(`Seeded ${productsData.length} products.`);

  // ─── CUSTOMERS & CONTACTS ─────────────────────────────────────────────────
  const customersData = [
    { id: "cust-001", name: "Pacific Foods Distribution", industry: "Food & Beverage", accountTier: "Enterprise", region: "West Coast", address: "450 Market St, San Francisco, CA 94105", totalRevenue: 847250, lastOrderDate: "2026-03-25", creditLimit: 150000, outstandingBalance: 32400, assignedRep: "Sarah Mitchell", accountSince: "2023-06-15", paymentScore: 92, orderFrequencyDays: 14, topProducts: JSON.stringify(["Organic Olive Oil 5L", "Brown Rice 25kg", "Sea Salt 10kg"]), tags: JSON.stringify(["VIP", "Organic"]), contacts: [{ id: "c1", name: "Maria Chen", email: "maria@pacificfoods.com", phone: "(415) 555-0102", role: "Procurement Director", isPrimary: true }, { id: "c1b", name: "Tom Walsh", email: "tom@pacificfoods.com", phone: "(415) 555-0103", role: "Operations Manager", isPrimary: false }] },
    { id: "cust-002", name: "Metro Building Supply", industry: "Building Materials", accountTier: "Enterprise", region: "Midwest", address: "220 W Kinzie St, Chicago, IL 60654", totalRevenue: 1234500, lastOrderDate: "2026-03-27", creditLimit: 200000, outstandingBalance: 45600, assignedRep: "Mike Thompson", accountSince: "2022-01-10", paymentScore: 88, orderFrequencyDays: 7, topProducts: JSON.stringify(["Portland Cement 50lb", "Rebar #4 20ft", "Plywood 4x8"]), tags: JSON.stringify(["Preferred", "High Volume"]), contacts: [{ id: "c2", name: "James Rodriguez", email: "james@metrobuild.com", phone: "(312) 555-0204", role: "General Manager", isPrimary: true }] },
    { id: "cust-003", name: "Valley Produce Partners", industry: "Fresh Produce", accountTier: "Enterprise", region: "West Coast", address: "1800 N Chester Ave, Bakersfield, CA 93308", totalRevenue: 562800, lastOrderDate: "2026-03-26", creditLimit: 100000, outstandingBalance: 18900, assignedRep: "Sarah Mitchell", accountSince: "2023-02-20", paymentScore: 95, orderFrequencyDays: 7, topProducts: JSON.stringify(["Mixed Greens Case", "Avocados 48ct", "Tomatoes 25lb"]), tags: JSON.stringify(["Organic", "Weekly"]), contacts: [{ id: "c3", name: "Linda Park", email: "linda@valleyproduce.com", phone: "(559) 555-0301", role: "Buying Director", isPrimary: true }] },
    { id: "cust-004", name: "Harbor Industries LLC", industry: "Industrial Supply", accountTier: "Enterprise", region: "Pacific Northwest", address: "501 E Pike St, Seattle, WA 98122", totalRevenue: 945000, lastOrderDate: "2026-03-22", creditLimit: 175000, outstandingBalance: 67800, assignedRep: "David Lee", accountSince: "2021-09-05", paymentScore: 78, orderFrequencyDays: 21, topProducts: JSON.stringify(["Steel Pipe 4in", "Safety Gloves BulkPak", "Lubricant 55gal"]), tags: JSON.stringify(["Contract", "Net 60"]), contacts: [{ id: "c4", name: "Robert Kim", email: "rkim@harborind.com", phone: "(206) 555-0412", role: "Supply Chain VP", isPrimary: true }] },
    { id: "cust-005", name: "Sunrise Bakery Group", industry: "Food & Beverage", accountTier: "Mid-Market", region: "West Coast", address: "800 S Alameda St, Los Angeles, CA 90021", totalRevenue: 328700, lastOrderDate: "2026-03-24", creditLimit: 75000, outstandingBalance: 12300, assignedRep: "Sarah Mitchell", accountSince: "2024-01-15", paymentScore: 96, orderFrequencyDays: 10, topProducts: JSON.stringify(["All-Purpose Flour 50lb", "Sugar 50lb", "Butter 36ct"]), tags: JSON.stringify(["Reliable"]), contacts: [{ id: "c5", name: "Angela Torres", email: "angela@sunrisebakery.com", phone: "(213) 555-0508", role: "Head of Purchasing", isPrimary: true }] },
    { id: "cust-006", name: "Continental Packaging", industry: "Packaging", accountTier: "Mid-Market", region: "South", address: "3200 Main St, Dallas, TX 75226", totalRevenue: 412300, lastOrderDate: "2026-03-20", creditLimit: 80000, outstandingBalance: 24500, assignedRep: "Mike Thompson", accountSince: "2023-08-01", paymentScore: 85, orderFrequencyDays: 14, topProducts: JSON.stringify(["Corrugated Box 12x12", "Stretch Wrap 18in", "Kraft Paper Rolls"]), tags: JSON.stringify(["Packaging"]), contacts: [{ id: "c6", name: "Steve Morrison", email: "steve@continentalpkg.com", phone: "(214) 555-0619", role: "Operations Director", isPrimary: true }] },
    { id: "cust-007", name: "Green Valley Organics", industry: "Organic Foods", accountTier: "Mid-Market", region: "Pacific Northwest", address: "1100 NW Glisan St, Portland, OR 97209", totalRevenue: 267900, lastOrderDate: "2026-03-23", creditLimit: 60000, outstandingBalance: 8200, assignedRep: "David Lee", accountSince: "2024-03-10", paymentScore: 98, orderFrequencyDays: 12, topProducts: JSON.stringify(["Organic Quinoa 25lb", "Chia Seeds 10lb", "Coconut Oil 5gal"]), tags: JSON.stringify(["Organic", "Growing"]), contacts: [{ id: "c7", name: "Emma Williams", email: "emma@greenvalleyorg.com", phone: "(503) 555-0724", role: "CEO", isPrimary: true }] },
    { id: "cust-008", name: "Titan Construction Materials", industry: "Building Materials", accountTier: "Enterprise", region: "Southwest", address: "4400 N Central Ave, Phoenix, AZ 85012", totalRevenue: 1567000, lastOrderDate: "2026-03-27", creditLimit: 250000, outstandingBalance: 89000, assignedRep: "Mike Thompson", accountSince: "2021-04-22", paymentScore: 82, orderFrequencyDays: 7, topProducts: JSON.stringify(["Concrete Mix 80lb", "Drywall 4x8", "Insulation R-13"]), tags: JSON.stringify(["High Volume", "Net 45"]), contacts: [{ id: "c8", name: "Frank DiMaggio", email: "frank@titanconst.com", phone: "(602) 555-0831", role: "Procurement Manager", isPrimary: true }] },
    { id: "cust-009", name: "Coastal Seafood Co.", industry: "Food & Beverage", accountTier: "Mid-Market", region: "Southeast", address: "200 S Biscayne Blvd, Miami, FL 33131", totalRevenue: 389400, lastOrderDate: "2026-03-21", creditLimit: 90000, outstandingBalance: 15600, assignedRep: "Sarah Mitchell", accountSince: "2023-11-01", paymentScore: 91, orderFrequencyDays: 10, topProducts: JSON.stringify(["Frozen Shrimp 10lb", "Salmon Fillet Case", "Tuna Steaks 5lb"]), tags: JSON.stringify(["Seafood", "Perishable"]), contacts: [{ id: "c9", name: "Hiroshi Tanaka", email: "hiroshi@coastalseafood.com", phone: "(305) 555-0942", role: "Buying Manager", isPrimary: true }] },
    { id: "cust-010", name: "Pinnacle Hospitality Group", industry: "Hospitality", accountTier: "Enterprise", region: "West", address: "3600 Las Vegas Blvd S, Las Vegas, NV 89109", totalRevenue: 723600, lastOrderDate: "2026-03-26", creditLimit: 125000, outstandingBalance: 41200, assignedRep: "David Lee", accountSince: "2022-07-18", paymentScore: 86, orderFrequencyDays: 7, topProducts: JSON.stringify(["Premium Steak Cuts Case", "Wine Selection Mix", "Napkins Bulk"]), tags: JSON.stringify(["Hospitality", "High Volume"]), contacts: [{ id: "c10", name: "Diana Reeves", email: "diana@pinnaclehosp.com", phone: "(702) 555-1055", role: "F&B Director", isPrimary: true }] },
    { id: "cust-011", name: "Redwood Paper Products", industry: "Paper & Packaging", accountTier: "SMB", region: "West Coast", address: "1515 K St, Sacramento, CA 95814", totalRevenue: 98400, lastOrderDate: "2026-03-18", creditLimit: 25000, outstandingBalance: 4200, assignedRep: "Alex Rivera", accountSince: "2025-01-05", paymentScore: 94, orderFrequencyDays: 21, topProducts: JSON.stringify(["Copy Paper A4 Case", "Paper Towels Bulk", "Tissue Roll 96ct"]), tags: JSON.stringify(["New"]), contacts: [{ id: "c11", name: "Nancy Chen", email: "nancy@redwoodpaper.com", phone: "(916) 555-1108", role: "Supply Manager", isPrimary: true }] },
    { id: "cust-012", name: "Midwest Grain Traders", industry: "Agriculture", accountTier: "Enterprise", region: "Midwest", address: "600 Grand Ave, Des Moines, IA 50309", totalRevenue: 2134000, lastOrderDate: "2026-03-27", creditLimit: 300000, outstandingBalance: 126000, assignedRep: "Mike Thompson", accountSince: "2020-03-12", paymentScore: 80, orderFrequencyDays: 5, topProducts: JSON.stringify(["Wheat Flour 50lb Bulk", "Corn Starch Industrial", "Soybean Oil 55gal"]), tags: JSON.stringify(["Bulk", "Contract", "Top Account"]), contacts: [{ id: "c12", name: "Bill Henderson", email: "bill@midwestgrain.com", phone: "(515) 555-1215", role: "Trading Director", isPrimary: true }] },
    { id: "cust-013", name: "Blue Ridge Beverages", industry: "Beverages", accountTier: "Mid-Market", region: "Southeast", address: "45 S French Broad Ave, Asheville, NC 28801", totalRevenue: 245600, lastOrderDate: "2026-03-19", creditLimit: 50000, outstandingBalance: 8900, assignedRep: "Alex Rivera", accountSince: "2024-06-20", paymentScore: 93, orderFrequencyDays: 14, topProducts: JSON.stringify(["Sparkling Water 24pk", "Craft Soda Variety", "Cold Brew Coffee 12pk"]), tags: JSON.stringify(["Beverages"]), contacts: [{ id: "c13", name: "Kevin O'Brien", email: "kevin@blueridgebev.com", phone: "(828) 555-1322", role: "Distribution Manager", isPrimary: true }] },
    { id: "cust-014", name: "Summit Chemical Supply", industry: "Chemicals", accountTier: "Enterprise", region: "South", address: "1200 Smith St, Houston, TX 77002", totalRevenue: 678900, lastOrderDate: "2026-03-25", creditLimit: 120000, outstandingBalance: 34500, assignedRep: "David Lee", accountSince: "2022-11-08", paymentScore: 87, orderFrequencyDays: 14, topProducts: JSON.stringify(["Industrial Cleaner 5gal", "Sanitizer Bulk", "Solvent Grade A"]), tags: JSON.stringify(["Chemicals", "HAZMAT"]), contacts: [{ id: "c14", name: "Patricia Liu", email: "patricia@summitchem.com", phone: "(713) 555-1430", role: "VP Operations", isPrimary: true }] },
    { id: "cust-015", name: "Heritage Restaurant Group", industry: "Restaurant", accountTier: "Mid-Market", region: "Northeast", address: "375 Park Ave, New York, NY 10152", totalRevenue: 456200, lastOrderDate: "2026-03-26", creditLimit: 85000, outstandingBalance: 19800, assignedRep: "Sarah Mitchell", accountSince: "2023-04-15", paymentScore: 90, orderFrequencyDays: 7, topProducts: JSON.stringify(["EVOO Premium 5L", "Pasta Variety Case", "San Marzano Tomatoes"]), tags: JSON.stringify(["Restaurant", "Italian"]), contacts: [{ id: "c15", name: "Marco Rossi", email: "marco@heritagerest.com", phone: "(212) 555-1538", role: "Executive Chef", isPrimary: true }] },
    { id: "cust-016", name: "Atlas Hardware Wholesale", industry: "Hardware", accountTier: "Mid-Market", region: "Southeast", address: "191 Peachtree St NE, Atlanta, GA 30303", totalRevenue: 312400, lastOrderDate: "2026-03-22", creditLimit: 70000, outstandingBalance: 11200, assignedRep: "Mike Thompson", accountSince: "2024-02-28", paymentScore: 89, orderFrequencyDays: 14, topProducts: JSON.stringify(["Power Drill Set", "PVC Pipe 4in 10ft", "Wire 14ga 500ft"]), tags: JSON.stringify(["Hardware"]), contacts: [{ id: "c16", name: "Greg Porter", email: "greg@atlashw.com", phone: "(404) 555-1645", role: "Purchasing Director", isPrimary: true }] },
    { id: "cust-017", name: "Evergreen Catering Co.", industry: "Catering", accountTier: "SMB", region: "Pacific Northwest", address: "2015 2nd Ave, Seattle, WA 98121", totalRevenue: 134500, lastOrderDate: "2026-03-20", creditLimit: 30000, outstandingBalance: 5400, assignedRep: "Alex Rivera", accountSince: "2025-02-10", paymentScore: 97, orderFrequencyDays: 10, topProducts: JSON.stringify(["Disposable Plates 500ct", "Napkins Premium", "Aluminum Trays"]), tags: JSON.stringify(["Catering", "New"]), contacts: [{ id: "c17", name: "Susan Park", email: "susan@evergreencater.com", phone: "(206) 555-1752", role: "Operations Manager", isPrimary: true }] },
    { id: "cust-018", name: "Golden State Distributors", industry: "Distribution", accountTier: "Enterprise", region: "West Coast", address: "1901 Harrison St, Oakland, CA 94612", totalRevenue: 1890000, lastOrderDate: "2026-03-28", creditLimit: 280000, outstandingBalance: 95000, assignedRep: "David Lee", accountSince: "2020-08-01", paymentScore: 83, orderFrequencyDays: 5, topProducts: JSON.stringify(["Mixed Snack Pallet", "Beverage Variety Pallet", "Frozen Goods Mix"]), tags: JSON.stringify(["Top Account", "Distribution"]), contacts: [{ id: "c18", name: "David Nguyen", email: "david@goldenstate.com", phone: "(510) 555-1860", role: "GM", isPrimary: true }] },
    { id: "cust-019", name: "Prairie Farms Supply", industry: "Agriculture", accountTier: "SMB", region: "Midwest", address: "150 N Main St, Wichita, KS 67202", totalRevenue: 87600, lastOrderDate: "2026-03-15", creditLimit: 20000, outstandingBalance: 2800, assignedRep: "Alex Rivera", accountSince: "2025-06-01", paymentScore: 100, orderFrequencyDays: 30, topProducts: JSON.stringify(["Animal Feed 50lb", "Fertilizer Bulk", "Seeds Variety"]), tags: JSON.stringify(["Farm", "Small"]), contacts: [{ id: "c19", name: "Martha Johnson", email: "martha@prairiefarms.com", phone: "(316) 555-1978", role: "Owner", isPrimary: true }] },
    { id: "cust-020", name: "NorthStar Frozen Foods", industry: "Frozen Foods", accountTier: "Enterprise", region: "Midwest", address: "800 Nicollet Mall, Minneapolis, MN 55402", totalRevenue: 1023000, lastOrderDate: "2026-03-26", creditLimit: 180000, outstandingBalance: 52000, assignedRep: "Sarah Mitchell", accountSince: "2022-05-14", paymentScore: 84, orderFrequencyDays: 10, topProducts: JSON.stringify(["Frozen Pizza Cases", "Ice Cream 3gal", "Frozen Vegetables Bulk"]), tags: JSON.stringify(["Frozen", "Cold Chain"]), contacts: [{ id: "c20", name: "Erik Johansson", email: "erik@northstarfrozen.com", phone: "(612) 555-2085", role: "VP Sourcing", isPrimary: true }] },
  ];

  for (const c of customersData) {
    const { contacts, ...customerFields } = c;
    await prisma.customer.create({
      data: {
        ...customerFields,
        contacts: {
          create: contacts,
        },
      },
    });
  }
  console.log(`Seeded ${customersData.length} customers with contacts.`);

  // ─── ORDERS & ORDER ITEMS ─────────────────────────────────────────────────
  const customerIds = customersData.map((c) => c.id);
  const customerNames = customersData.map((c) => c.name);
  const orderStatuses = ["Draft", "Confirmed", "Processing", "Picking", "Packed", "Shipped", "Delivered", "Returned"];
  const paymentStatusOptions = ["Unpaid", "Partial", "Paid", "Overdue"];
  const reps = ["Sarah Mitchell", "Mike Thompson", "David Lee", "Alex Rivera"];
  const terms = ["Net 15", "Net 30", "Net 45", "Net 60"];
  const methods = ["FedEx Ground", "UPS Standard", "LTL Freight", "Local Delivery", "Customer Pickup"];

  const productItems = [
    { productId: "prod-001", productName: "Organic Olive Oil 5L", sku: "SKU-1001", unitPrice: 28 },
    { productId: "prod-004", productName: "All-Purpose Flour 50lb", sku: "SKU-1004", unitPrice: 14 },
    { productId: "prod-021", productName: "Portland Cement 50lb", sku: "SKU-2001", unitPrice: 7 },
    { productId: "prod-031", productName: "Corrugated Box 12x12", sku: "SKU-3001", unitPrice: 1 },
    { productId: "prod-010", productName: "Frozen Shrimp 10lb", sku: "SKU-1010", unitPrice: 62 },
    { productId: "prod-023", productName: "Plywood 4x8 3/4in", sku: "SKU-2003", unitPrice: 32 },
    { productId: "prod-006", productName: "Butter Unsalted 36ct", sku: "SKU-1006", unitPrice: 72 },
    { productId: "prod-012", productName: "Premium Steak Cuts Case", sku: "SKU-1012", unitPrice: 185 },
    { productId: "prod-041", productName: "Steel Pipe 4in 20ft", sku: "SKU-4001", unitPrice: 58 },
    { productId: "prod-048", productName: "Industrial Cleaner 5gal", sku: "SKU-4008", unitPrice: 28 },
  ];

  for (let i = 0; i < 55; i++) {
    const custIndex = i % 20;
    const custId = customerIds[custIndex];
    const custName = customerNames[custIndex];

    const numItems = 2 + Math.floor(seededRandom(i * 7 + 1) * 4);
    const items = [];
    for (let j = 0; j < numItems; j++) {
      const itemIdx = Math.floor(seededRandom(i * 13 + j * 3 + 2) * productItems.length);
      const item = productItems[itemIdx];
      const qty = 5 + Math.floor(seededRandom(i * 11 + j * 5 + 3) * 50);
      items.push({
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        quantity: qty,
        unitPrice: item.unitPrice,
        total: item.unitPrice * qty,
      });
    }

    const subtotal = items.reduce((s, item) => s + item.total, 0);
    const tax = Math.round(subtotal * 0.08);
    const shipping = Math.round(200 + seededRandom(i * 17 + 4) * 800);
    const hasDiscount = seededRandom(i * 19 + 5) > 0.7;
    const discount = hasDiscount ? Math.round(subtotal * 0.05) : 0;
    const total = subtotal + tax + shipping - discount;
    const statusIdx = Math.floor(seededRandom(i * 23 + 6) * orderStatuses.length);
    const status = orderStatuses[statusIdx];
    const payStatus = status === "Delivered" || status === "Returned" ? "Paid" : paymentStatusOptions[Math.floor(seededRandom(i * 29 + 7) * paymentStatusOptions.length)];
    const dayOffset = Math.floor(seededRandom(i * 31 + 8) * 60);
    const date = new Date(2026, 2, 28 - dayOffset);
    const trackingNumber = status === "Shipped" || status === "Delivered" ? `TRK${100000 + i}` : undefined;
    const deliveryDate = status === "Delivered" ? new Date(date.getTime() + 86400000 * (3 + Math.floor(seededRandom(i * 37 + 9) * 7))).toISOString() : undefined;
    const notes = i % 5 === 0 ? "Rush order — priority handling required" : undefined;

    await prisma.order.create({
      data: {
        id: `ord-${(i + 1).toString().padStart(3, "0")}`,
        orderNumber: `ORD-${2800 + i}`,
        customerId: custId,
        customerName: custName,
        status,
        subtotal,
        tax,
        shipping,
        discount,
        total,
        paymentTerms: terms[i % terms.length],
        paymentStatus: payStatus,
        shippingMethod: methods[i % methods.length],
        trackingNumber,
        deliveryDate,
        assignedRep: reps[i % reps.length],
        notes,
        createdAt: date,
        items: {
          create: items.map((item, idx) => ({
            id: `oi-${(i + 1).toString().padStart(3, "0")}-${(idx + 1).toString().padStart(2, "0")}`,
            productId: item.productId,
            productName: item.productName,
            sku: item.sku,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
          })),
        },
      },
    });
  }
  console.log("Seeded 55 orders with items.");

  // ─── LEADS ────────────────────────────────────────────────────────────────
  const leadsData = [
    { id: "lead-001", companyName: "ABC Foods International", contactName: "Michael Torres", email: "michael@abcfoods.com", phone: "(415) 555-3001", linkedIn: "linkedin.com/in/mtorres", website: "abcfoods.com", industry: "Food Distribution", location: "San Francisco, CA", employeeCount: 250, estimatedRevenue: 45000000, score: 87, status: "Hot", source: "AI Scraper", assignedRep: "Sarah Mitchell", tags: JSON.stringify(["High Value", "Food"]), enrichedData: JSON.stringify({ techStack: ["SAP", "Salesforce", "Shopify"], recentNews: ["Expanded to 3 new markets in Q1"], fundingStage: "Series C" }), lastContactedAt: "2026-03-26T14:00:00Z" },
    { id: "lead-002", companyName: "BuildRight Construction", contactName: "Karen Phillips", email: "karen@buildright.com", phone: "(312) 555-3002", linkedIn: "linkedin.com/in/kphillips", website: "buildright.com", industry: "Construction", location: "Chicago, IL", employeeCount: 180, estimatedRevenue: 32000000, score: 74, status: "Warm", source: "Cold Email", assignedRep: "Mike Thompson", tags: JSON.stringify(["Construction"]), enrichedData: JSON.stringify({ techStack: ["Oracle", "Procore"], recentNews: ["Won $12M government contract"], fundingStage: "Private" }), lastContactedAt: "2026-03-24T11:00:00Z" },
    { id: "lead-003", companyName: "FreshDirect Wholesale", contactName: "Jason Lee", email: "jason@freshdirectws.com", phone: "(212) 555-3003", website: "freshdirectws.com", industry: "Produce", location: "New York, NY", employeeCount: 95, estimatedRevenue: 18000000, score: 92, status: "Hot", source: "Meta Ads", assignedRep: "Sarah Mitchell", tags: JSON.stringify(["Organic", "Urgent"]), enrichedData: JSON.stringify({ techStack: ["NetSuite", "Slack"], recentNews: ["Looking for new bulk supplier per LinkedIn post"], fundingStage: "Series B" }), lastContactedAt: "2026-03-27T09:00:00Z" },
    { id: "lead-004", companyName: "Sterling Packaging Group", contactName: "Amanda Wright", email: "amanda@sterlingpkg.com", phone: "(214) 555-3004", website: "sterlingpkg.com", industry: "Packaging", location: "Dallas, TX", employeeCount: 320, estimatedRevenue: 58000000, score: 65, status: "Warm", source: "Referral", tags: JSON.stringify(["Packaging", "Enterprise"]), enrichedData: JSON.stringify({ techStack: ["Microsoft Dynamics", "Power BI"], recentNews: ["Acquired competitor last quarter"], fundingStage: "Private" }) },
    { id: "lead-005", companyName: "Mountain View Catering", contactName: "Roberto Garcia", email: "roberto@mvccatering.com", phone: "(303) 555-3005", website: "mvccatering.com", industry: "Catering", location: "Denver, CO", employeeCount: 45, estimatedRevenue: 5200000, score: 58, status: "Warm", source: "Website", tags: JSON.stringify(["Small"]) },
    { id: "lead-006", companyName: "Pacific Rim Trading", contactName: "Yuki Nakamura", email: "yuki@pacificrimtrade.com", phone: "(206) 555-3006", website: "pacificrimtrade.com", industry: "Import/Export", location: "Seattle, WA", employeeCount: 150, estimatedRevenue: 28000000, score: 81, status: "Hot", source: "AI Scraper", assignedRep: "David Lee", tags: JSON.stringify(["International", "High Value"]), enrichedData: JSON.stringify({ techStack: ["SAP", "Tableau"], recentNews: ["New warehouse opened in Portland"], fundingStage: "Private" }), lastContactedAt: "2026-03-25T15:00:00Z" },
    { id: "lead-007", companyName: "Heartland Grain Co.", contactName: "Bob Williams", email: "bob@heartlandgrain.com", phone: "(515) 555-3007", website: "heartlandgrain.com", industry: "Agriculture", location: "Des Moines, IA", employeeCount: 80, estimatedRevenue: 22000000, score: 42, status: "Cold", source: "Trade Show", tags: JSON.stringify(["Agriculture"]) },
    { id: "lead-008", companyName: "Coastal Beverage Distributors", contactName: "Nicole Adams", email: "nicole@coastalbev.com", phone: "(305) 555-3008", website: "coastalbev.com", industry: "Beverages", location: "Miami, FL", employeeCount: 200, estimatedRevenue: 35000000, score: 78, status: "Warm", source: "Cold Email", assignedRep: "Alex Rivera", tags: JSON.stringify(["Beverages", "Growing"]), enrichedData: JSON.stringify({ techStack: ["HubSpot", "Shopify Plus"], recentNews: ["Hiring 50+ distribution staff"], fundingStage: "Series A" }), lastContactedAt: "2026-03-23T10:00:00Z" },
    { id: "lead-009", companyName: "Apex Industrial Solutions", contactName: "Derek Johnson", email: "derek@apexindustrial.com", phone: "(713) 555-3009", website: "apexindustrial.com", industry: "Industrial Supply", location: "Houston, TX", employeeCount: 420, estimatedRevenue: 72000000, score: 88, status: "Hot", source: "AI Scraper", assignedRep: "Mike Thompson", tags: JSON.stringify(["Enterprise", "Industrial", "High Priority"]), enrichedData: JSON.stringify({ techStack: ["Oracle", "Salesforce", "ServiceNow"], recentNews: ["Current supplier contract expiring in 60 days"], fundingStage: "Public" }), lastContactedAt: "2026-03-27T16:00:00Z" },
    { id: "lead-010", companyName: "Green Earth Organics", contactName: "Sophie Chen", email: "sophie@greenearthorg.com", phone: "(503) 555-3010", website: "greenearthorg.com", industry: "Organic Foods", location: "Portland, OR", employeeCount: 60, estimatedRevenue: 8500000, score: 71, status: "Warm", source: "Meta Ads", tags: JSON.stringify(["Organic"]) },
    { id: "lead-011", companyName: "Tri-State Paper Products", contactName: "Mark Davis", email: "mark@tristatepaper.com", phone: "(609) 555-3011", website: "tristatepaper.com", industry: "Paper & Packaging", location: "Trenton, NJ", employeeCount: 110, estimatedRevenue: 15000000, score: 35, status: "Cold", source: "Cold Email", tags: JSON.stringify(["Paper"]) },
    { id: "lead-012", companyName: "Southwest Chemical Corp", contactName: "Diana Martinez", email: "diana@swchemcorp.com", phone: "(602) 555-3012", website: "swchemcorp.com", industry: "Chemicals", location: "Phoenix, AZ", employeeCount: 175, estimatedRevenue: 41000000, score: 83, status: "Hot", source: "Referral", assignedRep: "David Lee", tags: JSON.stringify(["Chemicals", "Warm Intro"]), enrichedData: JSON.stringify({ techStack: ["SAP", "Tableau", "Monday.com"], recentNews: ["Seeking new bulk chemical supplier"], fundingStage: "Private" }), lastContactedAt: "2026-03-27T11:00:00Z" },
  ];

  for (const l of leadsData) {
    await prisma.lead.create({ data: l });
  }
  console.log("Seeded 12 leads.");

  // ─── PIPELINE DEALS ───────────────────────────────────────────────────────
  const dealsData = [
    { id: "deal-001", companyName: "ABC Foods International", contactName: "Michael Torres", value: 125000, stage: "Negotiation", assignedRep: "Sarah Mitchell", leadSource: "AI Scraper", daysInStage: 4, nextActionDate: "2026-03-30", winProbability: 75, notes: "Pricing negotiation in progress. They want volume discount." },
    { id: "deal-002", companyName: "BuildRight Construction", contactName: "Karen Phillips", value: 85000, stage: "Proposal Sent", assignedRep: "Mike Thompson", leadSource: "Cold Email", daysInStage: 6, nextActionDate: "2026-03-29", winProbability: 55 },
    { id: "deal-003", companyName: "FreshDirect Wholesale", contactName: "Jason Lee", value: 210000, stage: "Qualified", assignedRep: "Sarah Mitchell", leadSource: "Meta Ads", daysInStage: 3, nextActionDate: "2026-03-31", winProbability: 60 },
    { id: "deal-004", companyName: "Sterling Packaging Group", contactName: "Amanda Wright", value: 175000, stage: "Contacted", assignedRep: "David Lee", leadSource: "Referral", daysInStage: 8, nextActionDate: "2026-03-28", winProbability: 35 },
    { id: "deal-005", companyName: "Pacific Rim Trading", contactName: "Yuki Nakamura", value: 340000, stage: "Proposal Sent", assignedRep: "David Lee", leadSource: "AI Scraper", daysInStage: 2, nextActionDate: "2026-04-01", winProbability: 50 },
    { id: "deal-006", companyName: "Apex Industrial Solutions", contactName: "Derek Johnson", value: 520000, stage: "Negotiation", assignedRep: "Mike Thompson", leadSource: "AI Scraper", daysInStage: 1, nextActionDate: "2026-03-29", winProbability: 80, notes: "Contract review by their legal team. Expect signature next week." },
    { id: "deal-007", companyName: "Southwest Chemical Corp", contactName: "Diana Martinez", value: 145000, stage: "Qualified", assignedRep: "David Lee", leadSource: "Referral", daysInStage: 2, nextActionDate: "2026-03-30", winProbability: 65 },
    { id: "deal-008", companyName: "Coastal Beverage Distributors", contactName: "Nicole Adams", value: 92000, stage: "Contacted", assignedRep: "Alex Rivera", leadSource: "Cold Email", daysInStage: 5, nextActionDate: "2026-03-28", winProbability: 30 },
    { id: "deal-009", companyName: "Green Earth Organics", contactName: "Sophie Chen", value: 68000, stage: "New Lead", assignedRep: "Alex Rivera", leadSource: "Meta Ads", daysInStage: 4, nextActionDate: "2026-03-29", winProbability: 20 },
    { id: "deal-010", companyName: "Mountain View Catering", contactName: "Roberto Garcia", value: 35000, stage: "New Lead", assignedRep: "Jennifer Clark", leadSource: "Website", daysInStage: 7, nextActionDate: "2026-03-28", winProbability: 15 },
    { id: "deal-011", companyName: "Harbor Industries LLC", contactName: "Robert Kim", value: 420000, stage: "Won", assignedRep: "Sarah Mitchell", leadSource: "AI Scraper", daysInStage: 0, nextActionDate: "", winProbability: 100 },
    { id: "deal-012", companyName: "Heartland Grain Co.", contactName: "Bob Williams", value: 55000, stage: "Lost", assignedRep: "Mike Thompson", leadSource: "Trade Show", daysInStage: 0, nextActionDate: "", winProbability: 0, notes: "Lost to competitor on pricing." },
    { id: "deal-013", companyName: "NorthStar Frozen Foods", contactName: "Erik Johansson", value: 280000, stage: "Won", assignedRep: "Mike Thompson", leadSource: "Referral", daysInStage: 0, nextActionDate: "", winProbability: 100 },
    { id: "deal-014", companyName: "Tri-State Paper Products", contactName: "Mark Davis", value: 42000, stage: "Contacted", assignedRep: "Jennifer Clark", leadSource: "Cold Email", daysInStage: 12, nextActionDate: "2026-03-29", winProbability: 25 },
    { id: "deal-015", companyName: "Golden State Distributors", contactName: "David Nguyen", value: 650000, stage: "Proposal Sent", assignedRep: "David Lee", leadSource: "AI Scraper", daysInStage: 3, nextActionDate: "2026-04-02", winProbability: 45 },
  ];

  for (const d of dealsData) {
    await prisma.pipelineDeal.create({ data: d });
  }
  console.log("Seeded 15 pipeline deals.");

  // ─── TEAM MEMBERS ─────────────────────────────────────────────────────────
  const teamData = [
    { id: "tm-001", name: "Sarah Mitchell", email: "sarah@wholesale-co.com", role: "Closer", activeDeals: 12, revenueGenerated: 485000, activityScore: 94, dealsClosedMTD: 8, callsMade: 145, emailsSent: 320, meetingsHeld: 28, targetRevenue: 500000, commissionRate: 8, commissionEarned: 38800, joinDate: "2022-03-15" },
    { id: "tm-002", name: "Mike Thompson", email: "mike@wholesale-co.com", role: "Closer", activeDeals: 15, revenueGenerated: 612000, activityScore: 97, dealsClosedMTD: 11, callsMade: 198, emailsSent: 285, meetingsHeld: 34, targetRevenue: 550000, commissionRate: 8, commissionEarned: 48960, joinDate: "2021-08-20" },
    { id: "tm-003", name: "David Lee", email: "david@wholesale-co.com", role: "Account Manager", activeDeals: 8, revenueGenerated: 378000, activityScore: 88, dealsClosedMTD: 5, callsMade: 112, emailsSent: 245, meetingsHeld: 22, targetRevenue: 400000, commissionRate: 6, commissionEarned: 22680, joinDate: "2023-01-10" },
    { id: "tm-004", name: "Alex Rivera", email: "alex@wholesale-co.com", role: "SDR", activeDeals: 3, revenueGenerated: 45000, activityScore: 91, dealsClosedMTD: 2, callsMade: 280, emailsSent: 520, meetingsHeld: 15, targetRevenue: 100000, commissionRate: 4, commissionEarned: 1800, joinDate: "2025-11-01" },
    { id: "tm-005", name: "Jennifer Clark", email: "jennifer@wholesale-co.com", role: "SDR", activeDeals: 5, revenueGenerated: 62000, activityScore: 86, dealsClosedMTD: 3, callsMade: 245, emailsSent: 480, meetingsHeld: 12, targetRevenue: 100000, commissionRate: 4, commissionEarned: 2480, joinDate: "2025-08-15" },
    { id: "tm-006", name: "Carlos Mendez", email: "carlos@wholesale-co.com", role: "Account Manager", activeDeals: 10, revenueGenerated: 425000, activityScore: 92, dealsClosedMTD: 7, callsMade: 135, emailsSent: 210, meetingsHeld: 26, targetRevenue: 450000, commissionRate: 6, commissionEarned: 25500, joinDate: "2022-06-01" },
    { id: "tm-007", name: "Rachel Green", email: "rachel@wholesale-co.com", role: "Operations", activeDeals: 0, revenueGenerated: 0, activityScore: 89, dealsClosedMTD: 0, callsMade: 45, emailsSent: 180, meetingsHeld: 8, targetRevenue: 0, commissionRate: 0, commissionEarned: 0, joinDate: "2023-09-12" },
    { id: "tm-008", name: "Brian Foster", email: "brian@wholesale-co.com", role: "Closer", activeDeals: 9, revenueGenerated: 356000, activityScore: 85, dealsClosedMTD: 6, callsMade: 165, emailsSent: 290, meetingsHeld: 24, targetRevenue: 450000, commissionRate: 8, commissionEarned: 28480, joinDate: "2023-04-01" },
    { id: "tm-009", name: "Lisa Wang", email: "lisa@wholesale-co.com", role: "Operations", activeDeals: 0, revenueGenerated: 0, activityScore: 93, dealsClosedMTD: 0, callsMade: 60, emailsSent: 150, meetingsHeld: 10, targetRevenue: 0, commissionRate: 0, commissionEarned: 0, joinDate: "2024-02-20" },
    { id: "tm-010", name: "James Donovan", email: "james@wholesale-co.com", role: "Admin", activeDeals: 0, revenueGenerated: 0, activityScore: 100, dealsClosedMTD: 0, callsMade: 30, emailsSent: 95, meetingsHeld: 18, targetRevenue: 0, commissionRate: 0, commissionEarned: 0, joinDate: "2020-01-05" },
    { id: "tm-011", name: "Amanda Price", email: "amanda@wholesale-co.com", role: "SDR", activeDeals: 4, revenueGenerated: 38000, activityScore: 82, dealsClosedMTD: 1, callsMade: 210, emailsSent: 390, meetingsHeld: 9, targetRevenue: 80000, commissionRate: 4, commissionEarned: 1520, joinDate: "2026-01-15" },
  ];

  for (const t of teamData) {
    await prisma.teamMember.create({ data: t });
  }
  console.log("Seeded 11 team members.");

  // ─── EMAIL CAMPAIGNS & STEPS ──────────────────────────────────────────────
  const emailCampaignsData = [
    {
      id: "ec-001", name: "Q1 Food Distributors Outreach", status: "Active", type: "Cold Outreach", totalContacts: 450, sent: 380, opened: 152, replied: 34, bounced: 12, positiveReplies: 18, startDate: "2026-02-15",
      steps: [
        { id: "es-001", type: "email", subject: "Bulk pricing that beats your current supplier", body: "Hi {{first_name}},\n\nI noticed {{company}} has been expanding..." },
        { id: "es-002", type: "wait", waitDays: 3 },
        { id: "es-003", type: "email", subject: "Quick question about your supply chain", body: "Hi {{first_name}},\n\nFollowing up on my last note..." },
        { id: "es-004", type: "wait", waitDays: 4 },
        { id: "es-005", type: "email", subject: "Last one from me — special intro offer", body: "Hi {{first_name}},\n\nI know you're busy so I'll keep this brief..." },
      ],
    },
    {
      id: "ec-002", name: "Building Materials — New Product Launch", status: "Active", type: "Cold Outreach", totalContacts: 280, sent: 210, opened: 98, replied: 22, bounced: 8, positiveReplies: 12, startDate: "2026-03-01",
      steps: [
        { id: "es-006", type: "email", subject: "New eco-friendly building materials — 20% lighter", body: "Hi {{first_name}},\n\nWe just launched a new line..." },
        { id: "es-007", type: "wait", waitDays: 2 },
        { id: "es-008", type: "email", subject: "Case study: How {{competitor}} saved 15% on materials", body: "Hi {{first_name}},\n\nI wanted to share..." },
        { id: "es-009", type: "wait", waitDays: 3 },
        { id: "es-010", type: "email", subject: "Free sample for {{company}}", body: "Hi {{first_name}},\n\nSince I haven't heard back..." },
      ],
    },
    {
      id: "ec-003", name: "Re-engagement — Inactive Accounts", status: "Active", type: "Re-engagement", totalContacts: 120, sent: 120, opened: 45, replied: 8, bounced: 3, positiveReplies: 5, startDate: "2026-03-10",
      steps: [
        { id: "es-011", type: "email", subject: "We miss you, {{first_name}} — here's what's new", body: "Hi {{first_name}},\n\nIt's been a while..." },
        { id: "es-012", type: "wait", waitDays: 5 },
        { id: "es-013", type: "email", subject: "Exclusive 10% comeback discount for {{company}}", body: "Hi {{first_name}},\n\nWe'd love to earn your business back..." },
      ],
    },
    {
      id: "ec-004", name: "Restaurant Suppliers — Holiday Season Prep", status: "Paused", type: "Cold Outreach", totalContacts: 350, sent: 180, opened: 72, replied: 15, bounced: 6, positiveReplies: 8, startDate: "2026-02-20",
      steps: [
        { id: "es-014", type: "email", subject: "Get ahead of holiday orders — bulk pricing inside", body: "Hi {{first_name}},\n\nThe holiday rush is coming..." },
        { id: "es-015", type: "wait", waitDays: 3 },
        { id: "es-016", type: "email", subject: "Your competitors are already stocking up", body: "Hi {{first_name}},\n\nJust a heads up..." },
      ],
    },
    {
      id: "ec-005", name: "Industrial Supply — Q1 Newsletter", status: "Completed", type: "Newsletter", totalContacts: 800, sent: 795, opened: 318, replied: 42, bounced: 5, positiveReplies: 28, startDate: "2026-01-15", endDate: "2026-01-30",
      steps: [
        { id: "es-017", type: "email", subject: "Q1 Product Updates & Industry Insights", body: "Dear {{first_name}},\n\nHere's what's new..." },
      ],
    },
  ];

  for (const ec of emailCampaignsData) {
    const { steps, ...campaignFields } = ec;
    await prisma.emailCampaign.create({
      data: {
        ...campaignFields,
        steps: {
          create: steps.map((s: Record<string, unknown>) => ({
            id: s.id as string,
            type: s.type as string,
            subject: (s.subject as string) ?? null,
            body: (s.body as string) ?? null,
            waitDays: (s.waitDays as number) ?? null,
          })),
        },
      },
    });
  }
  console.log("Seeded 5 email campaigns with steps.");

  // ─── META CAMPAIGNS ───────────────────────────────────────────────────────
  const metaCampaignsData = [
    { id: "mc-001", name: "Food Wholesale — Lead Gen", status: "Active", objective: "Lead Generation", spend: 4520, budget: 8000, impressions: 185000, clicks: 3240, ctr: 1.75, cpc: 1.40, cpl: 12.80, leads: 353, roas: 8.2, startDate: "2026-03-01", audiences: JSON.stringify(["Restaurant Owners", "Food Service Managers", "Catering Companies"]) },
    { id: "mc-002", name: "Building Materials — Contractor Leads", status: "Active", objective: "Lead Generation", spend: 3180, budget: 6000, impressions: 142000, clicks: 2480, ctr: 1.75, cpc: 1.28, cpl: 15.90, leads: 200, roas: 6.5, startDate: "2026-03-05", audiences: JSON.stringify(["General Contractors", "Construction Companies", "Home Builders"]) },
    { id: "mc-003", name: "Brand Awareness — WholesaleOS Platform", status: "Active", objective: "Brand Awareness", spend: 1850, budget: 3000, impressions: 420000, clicks: 5880, ctr: 1.40, cpc: 0.31, cpl: 0, leads: 0, roas: 0, startDate: "2026-03-10", audiences: JSON.stringify(["Business Owners", "Supply Chain Professionals", "Procurement Managers"]) },
    { id: "mc-004", name: "Retargeting — Website Visitors", status: "Paused", objective: "Conversions", spend: 980, budget: 2000, impressions: 65000, clicks: 1820, ctr: 2.80, cpc: 0.54, cpl: 8.20, leads: 120, roas: 12.4, startDate: "2026-02-15", audiences: JSON.stringify(["Website Visitors 30d", "Cart Abandoners"]) },
  ];

  for (const mc of metaCampaignsData) {
    await prisma.metaCampaign.create({ data: mc });
  }
  console.log("Seeded 4 meta campaigns.");

  // ─── INVOICES ─────────────────────────────────────────────────────────────
  const invoicesData = [
    { id: "inv-001", invoiceNumber: "INV-1901", customerId: "cust-001", customerName: "Pacific Foods Distribution", orderId: "ord-001", status: "Paid", amount: 14250, paidAmount: 14250, dueDate: "2026-03-15", issuedDate: "2026-02-28", paidDate: "2026-03-12", paymentTerms: "Net 15" },
    { id: "inv-002", invoiceNumber: "INV-1902", customerId: "cust-002", customerName: "Metro Building Supply", orderId: "ord-002", status: "Paid", amount: 28750, paidAmount: 28750, dueDate: "2026-03-20", issuedDate: "2026-02-20", paidDate: "2026-03-18", paymentTerms: "Net 30" },
    { id: "inv-003", invoiceNumber: "INV-1910", customerId: "cust-003", customerName: "Valley Produce Partners", orderId: "ord-003", status: "Overdue", amount: 8900, paidAmount: 0, dueDate: "2026-03-10", issuedDate: "2026-02-25", paymentTerms: "Net 15" },
    { id: "inv-004", invoiceNumber: "INV-1915", customerId: "cust-004", customerName: "Harbor Industries LLC", orderId: "ord-004", status: "Sent", amount: 42000, paidAmount: 0, dueDate: "2026-04-15", issuedDate: "2026-03-15", paymentTerms: "Net 30" },
    { id: "inv-005", invoiceNumber: "INV-1920", customerId: "cust-008", customerName: "Titan Construction Materials", orderId: "ord-005", status: "Viewed", amount: 67500, paidAmount: 0, dueDate: "2026-04-10", issuedDate: "2026-03-10", paymentTerms: "Net 30" },
    { id: "inv-006", invoiceNumber: "INV-1924", customerId: "cust-002", customerName: "Metro Building Supply", orderId: "ord-006", status: "Paid", amount: 8750, paidAmount: 8750, dueDate: "2026-03-25", issuedDate: "2026-03-10", paidDate: "2026-03-28", paymentTerms: "Net 15" },
    { id: "inv-007", invoiceNumber: "INV-1928", customerId: "cust-012", customerName: "Midwest Grain Traders", orderId: "ord-007", status: "Partial", amount: 126000, paidAmount: 80000, dueDate: "2026-04-20", issuedDate: "2026-03-20", paymentTerms: "Net 30" },
    { id: "inv-008", invoiceNumber: "INV-1930", customerId: "cust-010", customerName: "Pinnacle Hospitality Group", orderId: "ord-008", status: "Sent", amount: 34500, paidAmount: 0, dueDate: "2026-04-25", issuedDate: "2026-03-25", paymentTerms: "Net 30" },
    { id: "inv-009", invoiceNumber: "INV-1891", customerId: "cust-003", customerName: "Valley Produce Partners", orderId: "ord-009", status: "Overdue", amount: 12400, paidAmount: 0, dueDate: "2026-03-01", issuedDate: "2026-02-14", paymentTerms: "Net 15" },
    { id: "inv-010", invoiceNumber: "INV-1935", customerId: "cust-018", customerName: "Golden State Distributors", orderId: "ord-010", status: "Draft", amount: 95000, paidAmount: 0, dueDate: "2026-05-01", issuedDate: "2026-03-28", paymentTerms: "Net 30" },
  ];

  for (const inv of invoicesData) {
    await prisma.invoice.create({ data: inv });
  }
  console.log("Seeded 10 invoices.");

  // ─── EXPENSES ─────────────────────────────────────────────────────────────
  const expensesData = [
    { id: "exp-001", category: "COGS", description: "Supplier payment — Global Supply Co.", amount: 245000, vendor: "Global Supply Co.", date: "2026-03-25", status: "Paid" },
    { id: "exp-002", category: "COGS", description: "Supplier payment — Pacific Trade Inc.", amount: 185000, vendor: "Pacific Trade Inc.", date: "2026-03-22", status: "Paid" },
    { id: "exp-003", category: "Shipping", description: "FedEx monthly freight charges", amount: 28500, vendor: "FedEx", date: "2026-03-20", status: "Paid" },
    { id: "exp-004", category: "Shipping", description: "UPS ground shipping", amount: 15200, vendor: "UPS", date: "2026-03-18", status: "Paid" },
    { id: "exp-005", category: "Marketing", description: "Meta Ads — March campaigns", amount: 10530, vendor: "Meta Platforms", date: "2026-03-28", status: "Pending" },
    { id: "exp-006", category: "Marketing", description: "Instantly cold email platform", amount: 297, vendor: "Instantly.ai", date: "2026-03-01", status: "Paid" },
    { id: "exp-007", category: "Payroll", description: "March payroll — 11 employees", amount: 142000, vendor: "ADP Payroll", date: "2026-03-28", status: "Pending" },
    { id: "exp-008", category: "Overhead", description: "Warehouse A rent — March", amount: 18500, vendor: "West Coast Properties", date: "2026-03-01", status: "Paid" },
    { id: "exp-009", category: "Overhead", description: "Warehouse B rent — March", amount: 22000, vendor: "Central Storage Inc.", date: "2026-03-01", status: "Paid" },
    { id: "exp-010", category: "Utilities", description: "Electric & gas — all warehouses", amount: 8400, vendor: "Pacific Gas & Electric", date: "2026-03-15", status: "Paid" },
    { id: "exp-011", category: "Software", description: "WholesaleOS Enterprise subscription", amount: 2499, vendor: "WholesaleOS", date: "2026-03-01", status: "Paid" },
    { id: "exp-012", category: "Software", description: "Salesforce CRM", amount: 1500, vendor: "Salesforce", date: "2026-03-01", status: "Paid" },
    { id: "exp-013", category: "COGS", description: "Midwest Wholesale inventory restock", amount: 156000, vendor: "Midwest Wholesale", date: "2026-03-15", status: "Paid" },
    { id: "exp-014", category: "Shipping", description: "LTL freight — bulk orders", amount: 12800, vendor: "XPO Logistics", date: "2026-03-12", status: "Paid" },
    { id: "exp-015", category: "Marketing", description: "Trade show registration — Q2", amount: 5000, vendor: "FoodExpo Inc.", date: "2026-03-20", status: "Approved" },
  ];

  for (const exp of expensesData) {
    await prisma.expense.create({ data: exp });
  }
  console.log("Seeded 15 expenses.");

  // ─── MONTHLY FINANCIALS ───────────────────────────────────────────────────
  const financialsData = [
    { id: "mf-001", month: "Oct 2025", revenue: 1245000, expenses: 892000, profit: 353000, ordersCount: 342, newCustomers: 8 },
    { id: "mf-002", month: "Nov 2025", revenue: 1380000, expenses: 945000, profit: 435000, ordersCount: 378, newCustomers: 12 },
    { id: "mf-003", month: "Dec 2025", revenue: 1520000, expenses: 1020000, profit: 500000, ordersCount: 410, newCustomers: 6 },
    { id: "mf-004", month: "Jan 2026", revenue: 1180000, expenses: 865000, profit: 315000, ordersCount: 298, newCustomers: 10 },
    { id: "mf-005", month: "Feb 2026", revenue: 1340000, expenses: 920000, profit: 420000, ordersCount: 356, newCustomers: 14 },
    { id: "mf-006", month: "Mar 2026", revenue: 1485000, expenses: 985000, profit: 500000, ordersCount: 392, newCustomers: 11 },
  ];

  for (const mf of financialsData) {
    await prisma.monthlyFinancial.create({ data: mf });
  }
  console.log("Seeded 6 monthly financials.");

  // ─── AI INSIGHTS ──────────────────────────────────────────────────────────
  const insightsData = [
    { id: "ai-001", type: "revenue", title: "Revenue trending 12% above Q1 forecast", description: "Based on current trajectory, March revenue will exceed projections by $178K. Consider increasing inventory for top-selling products to maintain momentum.", impact: "high", actionLabel: "View Revenue Forecast", createdAt: new Date("2026-03-28T08:00:00Z") },
    { id: "ai-002", type: "churn", title: "3 accounts at risk of churning", description: "Valley Produce Partners, Blue Ridge Beverages, and Redwood Paper Products show declining order frequency. Valley Produce hasn't ordered in 45 days (avg: 7 days).", impact: "high", actionLabel: "View At-Risk Accounts", createdAt: new Date("2026-03-28T07:30:00Z") },
    { id: "ai-003", type: "inventory", title: "Optimal reorder point for SKU-4421", description: "Based on demand patterns, Kraft Paper Rolls should be reordered by Thursday to avoid stockout. Current stock: 12 units, predicted weekly demand: 45 units.", impact: "high", actionLabel: "Create Purchase Order", createdAt: new Date("2026-03-28T07:00:00Z") },
    { id: "ai-004", type: "lead", title: "Lead score for ABC Foods increased 22%", description: "ABC Foods International engagement signals spiked: opened 3 emails, visited pricing page twice, and connected on LinkedIn. Score: 87 (was 65).", impact: "medium", actionLabel: "View Lead Profile", createdAt: new Date("2026-03-27T16:00:00Z") },
    { id: "ai-005", type: "email", title: "3 cold email sequences have <2% reply rate", description: "Restaurant Suppliers Holiday Prep, Tri-State Paper outreach, and Heartland Grain follow-up are underperforming. Consider A/B testing subject lines or pausing.", impact: "medium", actionLabel: "Review Sequences", createdAt: new Date("2026-03-27T14:00:00Z") },
    { id: "ai-006", type: "optimization", title: "Optimal send time: Tuesday 9:15 AM", description: "Analysis of 2,400+ emails shows highest open rates on Tuesday mornings between 9-10 AM EST. Current campaigns send at 8 AM — shifting could improve opens by 18%.", impact: "medium", actionLabel: "Update Schedule", createdAt: new Date("2026-03-27T12:00:00Z") },
    { id: "ai-007", type: "revenue", title: "Top 5 underperforming products identified", description: "Solvent Grade A, Ice Cream 3gal, Wire 14ga, PVC Pipe, and Copy Paper show declining margins despite steady volume. Recommend renegotiating supplier pricing.", impact: "medium", actionLabel: "View Products", createdAt: new Date("2026-03-27T10:00:00Z") },
    { id: "ai-008", type: "alert", title: "Supplier lead time spike detected", description: "Pacific Trade Inc. average lead time increased 23% this month (from 7 to 8.6 days). This affects 15 products across 3 categories. Consider alternative suppliers.", impact: "high", actionLabel: "View Suppliers", createdAt: new Date("2026-03-27T09:00:00Z") },
    { id: "ai-009", type: "lead", title: "Apex Industrial contract expiring in 60 days", description: "Their current supplier contract expires May 27. Derek Johnson showed high engagement. This is a $520K opportunity — recommend prioritizing outreach.", impact: "high", actionLabel: "View Deal", createdAt: new Date("2026-03-26T15:00:00Z") },
    { id: "ai-010", type: "optimization", title: "Cross-sell opportunity: Packaging + Food accounts", description: "8 food distribution customers don't purchase packaging from us. Estimated incremental revenue: $180K/year based on industry benchmarks.", impact: "medium", actionLabel: "View Opportunities", createdAt: new Date("2026-03-26T11:00:00Z") },
    { id: "ai-011", type: "churn", title: "Customer payment pattern anomaly", description: "Harbor Industries payment velocity slowed 40% this quarter. Outstanding balance: $67,800 (credit limit: $175,000). Payment score dropped from 85 to 78.", impact: "medium", actionLabel: "Review Account", createdAt: new Date("2026-03-26T09:00:00Z") },
    { id: "ai-012", type: "inventory", title: "Seasonal demand spike predicted", description: "Based on prior year data, building materials demand will increase 35% in April. Current stock levels for cement and lumber may be insufficient.", impact: "high", actionLabel: "Review Inventory", createdAt: new Date("2026-03-25T14:00:00Z") },
    { id: "ai-013", type: "email", title: "Subject line A/B test winner found", description: "\"Bulk pricing that beats your current supplier\" outperformed \"Special wholesale rates inside\" by 42% in open rate. Recommend using winning variant across campaigns.", impact: "low", actionLabel: "Apply to Campaigns", createdAt: new Date("2026-03-25T10:00:00Z") },
    { id: "ai-014", type: "optimization", title: "Pipeline bottleneck: Proposal stage", description: "Average time in 'Proposal Sent' stage is 8.2 days — 60% longer than industry benchmark. 4 deals totaling $1.1M are stuck. Recommend follow-up cadence review.", impact: "high", actionLabel: "View Pipeline", createdAt: new Date("2026-03-25T08:00:00Z") },
    { id: "ai-015", type: "revenue", title: "Meta Ads ROAS exceeding benchmark", description: "Food Wholesale Lead Gen campaign is delivering 8.2x ROAS vs 4.5x industry average. Consider scaling budget by 20% while performance holds.", impact: "medium", actionLabel: "View Campaign", createdAt: new Date("2026-03-24T16:00:00Z") },
    { id: "ai-016", type: "alert", title: "Duplicate supplier invoices detected", description: "2 potential duplicate invoices from Global Supply Co. totaling $12,400. Amounts and dates match within 48 hours. Manual review recommended.", impact: "medium", actionLabel: "Review Invoices", createdAt: new Date("2026-03-24T11:00:00Z") },
  ];

  for (const ins of insightsData) {
    await prisma.aIInsight.create({ data: ins });
  }
  console.log("Seeded 16 AI insights.");

  // ─── NOTIFICATIONS ────────────────────────────────────────────────────────
  const notificationsData = [
    { id: "n1", title: "New order from Pacific Foods Co.", description: "Order #ORD-2847 worth $14,250 placed", type: "order", read: false, createdAt: new Date("2026-03-28T09:15:00Z") },
    { id: "n2", title: "Lead score increased", description: "ABC Foods lead score jumped to 87 (+22)", type: "lead", read: false, createdAt: new Date("2026-03-28T08:45:00Z") },
    { id: "n3", title: "Payment received", description: "Metro Building Supply paid Invoice #INV-1924 — $8,750", type: "payment", read: false, createdAt: new Date("2026-03-28T08:20:00Z") },
    { id: "n4", title: "Low stock alert", description: "SKU-4421 (Kraft Paper Rolls) below reorder point", type: "alert", read: false, createdAt: new Date("2026-03-28T07:30:00Z") },
    { id: "n5", title: "Deal won!", description: "Sarah closed $42,000 deal with Harbor Industries", type: "team", read: true, createdAt: new Date("2026-03-27T16:00:00Z") },
    { id: "n6", title: "AI Insight", description: "3 accounts at risk of churn detected", type: "ai", read: true, createdAt: new Date("2026-03-27T14:30:00Z") },
    { id: "n7", title: "Sequence reply", description: "Positive reply from contact@greenvalley.com", type: "lead", read: true, createdAt: new Date("2026-03-27T11:00:00Z") },
    { id: "n8", title: "Invoice overdue", description: "Invoice #INV-1891 for Valley Produce is 15 days overdue", type: "alert", read: true, createdAt: new Date("2026-03-27T09:00:00Z") },
    { id: "n9", title: "Campaign completed", description: "Q1 Re-engagement sequence finished — 12.4% reply rate", type: "lead", read: true, createdAt: new Date("2026-03-26T17:00:00Z") },
    { id: "n10", title: "New team member", description: "Alex Rivera joined as SDR", type: "team", read: true, createdAt: new Date("2026-03-26T10:00:00Z") },
  ];

  for (const n of notificationsData) {
    await prisma.notification.create({ data: n });
  }
  console.log("Seeded 10 notifications.");

  console.log("\nDatabase seeding complete!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
