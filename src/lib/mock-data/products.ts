import { Product } from "@/types";

const categories = ["Food & Beverage", "Building Materials", "Packaging", "Industrial", "Chemicals", "Agriculture", "Paper Goods"];
const warehouses = ["Warehouse A - West", "Warehouse B - Central", "Warehouse C - East"];
const suppliers = ["Global Supply Co.", "Pacific Trade Inc.", "Midwest Wholesale", "Southern Distributors", "Atlantic Imports"];

function p(id: number, sku: string, name: string, cat: string, up: number, wp: number, stock: number, rp: number, wh: string, unit: string, supplier: string, ltd: number): Product {
  const status: Product["status"] = stock === 0 ? "Out of Stock" : stock <= rp ? "Low Stock" : "Active";
  return {
    id: `prod-${id.toString().padStart(3, "0")}`, sku, name, category: cat,
    unitPrice: up, wholesalePrice: wp, tier1Price: Math.round(wp * 0.95), tier2Price: Math.round(wp * 0.9), tier3Price: Math.round(wp * 0.85), vipPrice: Math.round(wp * 0.8),
    stockLevel: stock, reorderPoint: rp, warehouseLocation: `Aisle ${Math.ceil(id / 10)}-Rack ${(id % 10) + 1}`, warehouse: wh, unit, weight: Math.round(up * 0.3), supplier, leadTimeDays: ltd,
    status, imageUrl: undefined,
  };
}

export const mockProducts: Product[] = [
  p(1, "SKU-1001", "Organic Olive Oil 5L", "Food & Beverage", 42, 28, 340, 50, warehouses[0], "bottle", suppliers[0], 7),
  p(2, "SKU-1002", "Brown Rice 25kg", "Food & Beverage", 38, 24, 520, 100, warehouses[1], "bag", suppliers[0], 5),
  p(3, "SKU-1003", "Sea Salt 10kg", "Food & Beverage", 15, 9, 890, 150, warehouses[0], "bag", suppliers[2], 4),
  p(4, "SKU-1004", "All-Purpose Flour 50lb", "Food & Beverage", 22, 14, 1200, 200, warehouses[1], "bag", suppliers[2], 3),
  p(5, "SKU-1005", "Sugar Granulated 50lb", "Food & Beverage", 28, 18, 980, 150, warehouses[1], "bag", suppliers[2], 3),
  p(6, "SKU-1006", "Butter Unsalted 36ct", "Food & Beverage", 96, 72, 180, 40, warehouses[0], "case", suppliers[0], 5),
  p(7, "SKU-1007", "EVOO Premium 5L", "Food & Beverage", 58, 42, 210, 30, warehouses[0], "bottle", suppliers[4], 10),
  p(8, "SKU-1008", "Pasta Variety Case", "Food & Beverage", 36, 24, 450, 80, warehouses[0], "case", suppliers[4], 8),
  p(9, "SKU-1009", "San Marzano Tomatoes 6ct", "Food & Beverage", 28, 19, 380, 60, warehouses[0], "case", suppliers[4], 8),
  p(10, "SKU-1010", "Frozen Shrimp 10lb", "Food & Beverage", 85, 62, 150, 30, warehouses[2], "box", suppliers[0], 7),
  p(11, "SKU-1011", "Salmon Fillet Case", "Food & Beverage", 125, 95, 80, 20, warehouses[2], "case", suppliers[0], 3),
  p(12, "SKU-1012", "Premium Steak Cuts Case", "Food & Beverage", 245, 185, 65, 15, warehouses[2], "case", suppliers[3], 5),
  p(13, "SKU-1013", "Mixed Greens Case", "Food & Beverage", 32, 22, 200, 50, warehouses[0], "case", suppliers[0], 2),
  p(14, "SKU-1014", "Avocados 48ct", "Food & Beverage", 48, 34, 300, 80, warehouses[0], "case", suppliers[0], 3),
  p(15, "SKU-1015", "Organic Quinoa 25lb", "Food & Beverage", 56, 38, 180, 30, warehouses[0], "bag", suppliers[4], 10),
  p(16, "SKU-1016", "Chia Seeds 10lb", "Food & Beverage", 42, 28, 220, 40, warehouses[0], "bag", suppliers[4], 10),
  p(17, "SKU-1017", "Coconut Oil 5gal", "Food & Beverage", 68, 48, 140, 25, warehouses[0], "bucket", suppliers[4], 12),
  p(18, "SKU-1018", "Frozen Pizza Cases", "Food & Beverage", 52, 36, 400, 80, warehouses[2], "case", suppliers[2], 5),
  p(19, "SKU-1019", "Ice Cream 3gal", "Food & Beverage", 38, 26, 250, 50, warehouses[2], "tub", suppliers[2], 4),
  p(20, "SKU-1020", "Sparkling Water 24pk", "Food & Beverage", 18, 11, 600, 100, warehouses[1], "pack", suppliers[3], 5),
  p(21, "SKU-2001", "Portland Cement 50lb", "Building Materials", 12, 7, 2400, 500, warehouses[1], "bag", suppliers[2], 3),
  p(22, "SKU-2002", "Rebar #4 20ft", "Building Materials", 18, 11, 1800, 300, warehouses[1], "piece", suppliers[2], 5),
  p(23, "SKU-2003", "Plywood 4x8 3/4in", "Building Materials", 48, 32, 900, 150, warehouses[1], "sheet", suppliers[2], 4),
  p(24, "SKU-2004", "Concrete Mix 80lb", "Building Materials", 8, 5, 3200, 600, warehouses[1], "bag", suppliers[2], 3),
  p(25, "SKU-2005", "Drywall 4x8 1/2in", "Building Materials", 14, 9, 1500, 300, warehouses[1], "sheet", suppliers[2], 4),
  p(26, "SKU-2006", "Insulation R-13 Roll", "Building Materials", 42, 28, 650, 100, warehouses[1], "roll", suppliers[2], 5),
  p(27, "SKU-2007", "PVC Pipe 4in 10ft", "Building Materials", 15, 9, 1100, 200, warehouses[1], "piece", suppliers[3], 4),
  p(28, "SKU-2008", "Wire 14ga 500ft", "Building Materials", 65, 45, 320, 50, warehouses[1], "spool", suppliers[3], 6),
  p(29, "SKU-2009", "Lumber 2x4 8ft", "Building Materials", 6, 4, 4500, 800, warehouses[1], "piece", suppliers[2], 3),
  p(30, "SKU-2010", "Roofing Shingles Bundle", "Building Materials", 35, 24, 800, 150, warehouses[1], "bundle", suppliers[2], 5),
  p(31, "SKU-3001", "Corrugated Box 12x12", "Packaging", 2, 1, 8500, 2000, warehouses[0], "each", suppliers[3], 4),
  p(32, "SKU-3002", "Stretch Wrap 18in", "Packaging", 28, 18, 450, 80, warehouses[0], "roll", suppliers[3], 5),
  p(33, "SKU-3003", "Kraft Paper Rolls", "Packaging", 35, 22, 12, 50, warehouses[0], "roll", suppliers[3], 5),
  p(34, "SKU-3004", "Bubble Wrap 24in 250ft", "Packaging", 42, 28, 280, 50, warehouses[0], "roll", suppliers[3], 6),
  p(35, "SKU-3005", "Packing Tape 6pk", "Packaging", 12, 7, 950, 200, warehouses[0], "pack", suppliers[3], 3),
  p(36, "SKU-3006", "Poly Bags 1000ct", "Packaging", 22, 14, 600, 100, warehouses[0], "box", suppliers[3], 4),
  p(37, "SKU-3007", "Aluminum Trays 50ct", "Packaging", 28, 18, 420, 80, warehouses[0], "case", suppliers[3], 5),
  p(38, "SKU-3008", "Food Containers 500ct", "Packaging", 38, 25, 350, 60, warehouses[0], "case", suppliers[3], 5),
  p(39, "SKU-3009", "Shrink Film 18in", "Packaging", 32, 21, 280, 50, warehouses[0], "roll", suppliers[3], 6),
  p(40, "SKU-3010", "Disposable Plates 500ct", "Packaging", 45, 30, 200, 40, warehouses[0], "case", suppliers[3], 5),
  p(41, "SKU-4001", "Steel Pipe 4in 20ft", "Industrial", 85, 58, 320, 50, warehouses[1], "piece", suppliers[2], 7),
  p(42, "SKU-4002", "Safety Gloves BulkPak", "Industrial", 48, 32, 500, 100, warehouses[1], "case", suppliers[2], 5),
  p(43, "SKU-4003", "Lubricant 55gal", "Industrial", 280, 195, 45, 10, warehouses[1], "drum", suppliers[2], 8),
  p(44, "SKU-4004", "Power Drill Set", "Industrial", 125, 85, 120, 20, warehouses[1], "set", suppliers[2], 6),
  p(45, "SKU-4005", "Safety Goggles 50pk", "Industrial", 65, 42, 380, 60, warehouses[1], "pack", suppliers[2], 4),
  p(46, "SKU-4006", "Steel Sheet 4x8", "Industrial", 95, 65, 200, 30, warehouses[1], "sheet", suppliers[2], 7),
  p(47, "SKU-4007", "Welding Wire 33lb", "Industrial", 55, 38, 250, 40, warehouses[1], "spool", suppliers[2], 6),
  p(48, "SKU-4008", "Industrial Cleaner 5gal", "Chemicals", 42, 28, 180, 30, warehouses[2], "bucket", suppliers[3], 5),
  p(49, "SKU-4009", "Sanitizer Bulk 5gal", "Chemicals", 35, 22, 220, 40, warehouses[2], "bucket", suppliers[3], 4),
  p(50, "SKU-4010", "Solvent Grade A 5gal", "Chemicals", 58, 40, 90, 15, warehouses[2], "bucket", suppliers[3], 7),
  // Generate remaining 50 products programmatically
  ...Array.from({ length: 50 }, (_, i) => {
    const idx = i + 51;
    const cat = categories[i % categories.length];
    const wh = warehouses[i % warehouses.length];
    const sup = suppliers[i % suppliers.length];
    const price = 10 + Math.round(Math.random() * 200);
    const wp = Math.round(price * 0.68);
    const stock = Math.round(Math.random() * 1500);
    const rp = Math.round(stock * 0.15) + 10;
    return p(idx, `SKU-${5000 + idx}`, `Product ${idx} - ${cat}`, cat, price, wp, stock, rp, wh, "each", sup, 3 + Math.round(Math.random() * 8));
  }),
];
