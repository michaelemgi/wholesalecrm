import { Customer } from "@/types";

export const mockCustomers: Customer[] = [
  {
    id: "cust-001", name: "Pacific Foods Distribution", industry: "Food & Beverage", primaryContact: { id: "c1", name: "Maria Chen", email: "maria@pacificfoods.com", phone: "(415) 555-0102", role: "Procurement Director", isPrimary: true },
    contacts: [
      { id: "c1", name: "Maria Chen", email: "maria@pacificfoods.com", phone: "(415) 555-0102", role: "Procurement Director", isPrimary: true },
      { id: "c1b", name: "Tom Walsh", email: "tom@pacificfoods.com", phone: "(415) 555-0103", role: "Operations Manager", isPrimary: false },
    ],
    accountTier: "Enterprise", region: "West Coast", address: "450 Market St, San Francisco, CA 94105", totalRevenue: 847250, lastOrderDate: "2026-03-25", creditLimit: 150000, outstandingBalance: 32400, assignedRep: "Sarah Mitchell", accountSince: "2023-06-15", paymentScore: 92, orderFrequencyDays: 14, topProducts: ["Organic Olive Oil 5L", "Brown Rice 25kg", "Sea Salt 10kg"], tags: ["VIP", "Organic"],
  },
  {
    id: "cust-002", name: "Metro Building Supply", industry: "Building Materials", primaryContact: { id: "c2", name: "James Rodriguez", email: "james@metrobuild.com", phone: "(312) 555-0204", role: "General Manager", isPrimary: true },
    contacts: [{ id: "c2", name: "James Rodriguez", email: "james@metrobuild.com", phone: "(312) 555-0204", role: "General Manager", isPrimary: true }],
    accountTier: "Enterprise", region: "Midwest", address: "220 W Kinzie St, Chicago, IL 60654", totalRevenue: 1234500, lastOrderDate: "2026-03-27", creditLimit: 200000, outstandingBalance: 45600, assignedRep: "Mike Thompson", accountSince: "2022-01-10", paymentScore: 88, orderFrequencyDays: 7, topProducts: ["Portland Cement 50lb", "Rebar #4 20ft", "Plywood 4x8"], tags: ["Preferred", "High Volume"],
  },
  {
    id: "cust-003", name: "Valley Produce Partners", industry: "Fresh Produce", primaryContact: { id: "c3", name: "Linda Park", email: "linda@valleyproduce.com", phone: "(559) 555-0301", role: "Buying Director", isPrimary: true },
    contacts: [{ id: "c3", name: "Linda Park", email: "linda@valleyproduce.com", phone: "(559) 555-0301", role: "Buying Director", isPrimary: true }],
    accountTier: "Enterprise", region: "West Coast", address: "1800 N Chester Ave, Bakersfield, CA 93308", totalRevenue: 562800, lastOrderDate: "2026-03-26", creditLimit: 100000, outstandingBalance: 18900, assignedRep: "Sarah Mitchell", accountSince: "2023-02-20", paymentScore: 95, orderFrequencyDays: 7, topProducts: ["Mixed Greens Case", "Avocados 48ct", "Tomatoes 25lb"], tags: ["Organic", "Weekly"],
  },
  {
    id: "cust-004", name: "Harbor Industries LLC", industry: "Industrial Supply", primaryContact: { id: "c4", name: "Robert Kim", email: "rkim@harborind.com", phone: "(206) 555-0412", role: "Supply Chain VP", isPrimary: true },
    contacts: [{ id: "c4", name: "Robert Kim", email: "rkim@harborind.com", phone: "(206) 555-0412", role: "Supply Chain VP", isPrimary: true }],
    accountTier: "Enterprise", region: "Pacific Northwest", address: "501 E Pike St, Seattle, WA 98122", totalRevenue: 945000, lastOrderDate: "2026-03-22", creditLimit: 175000, outstandingBalance: 67800, assignedRep: "David Lee", accountSince: "2021-09-05", paymentScore: 78, orderFrequencyDays: 21, topProducts: ["Steel Pipe 4in", "Safety Gloves BulkPak", "Lubricant 55gal"], tags: ["Contract", "Net 60"],
  },
  {
    id: "cust-005", name: "Sunrise Bakery Group", industry: "Food & Beverage", primaryContact: { id: "c5", name: "Angela Torres", email: "angela@sunrisebakery.com", phone: "(213) 555-0508", role: "Head of Purchasing", isPrimary: true },
    contacts: [{ id: "c5", name: "Angela Torres", email: "angela@sunrisebakery.com", phone: "(213) 555-0508", role: "Head of Purchasing", isPrimary: true }],
    accountTier: "Mid-Market", region: "West Coast", address: "800 S Alameda St, Los Angeles, CA 90021", totalRevenue: 328700, lastOrderDate: "2026-03-24", creditLimit: 75000, outstandingBalance: 12300, assignedRep: "Sarah Mitchell", accountSince: "2024-01-15", paymentScore: 96, orderFrequencyDays: 10, topProducts: ["All-Purpose Flour 50lb", "Sugar 50lb", "Butter 36ct"], tags: ["Reliable"],
  },
  {
    id: "cust-006", name: "Continental Packaging", industry: "Packaging", primaryContact: { id: "c6", name: "Steve Morrison", email: "steve@continentalpkg.com", phone: "(214) 555-0619", role: "Operations Director", isPrimary: true },
    contacts: [{ id: "c6", name: "Steve Morrison", email: "steve@continentalpkg.com", phone: "(214) 555-0619", role: "Operations Director", isPrimary: true }],
    accountTier: "Mid-Market", region: "South", address: "3200 Main St, Dallas, TX 75226", totalRevenue: 412300, lastOrderDate: "2026-03-20", creditLimit: 80000, outstandingBalance: 24500, assignedRep: "Mike Thompson", accountSince: "2023-08-01", paymentScore: 85, orderFrequencyDays: 14, topProducts: ["Corrugated Box 12x12", "Stretch Wrap 18in", "Kraft Paper Rolls"], tags: ["Packaging"],
  },
  {
    id: "cust-007", name: "Green Valley Organics", industry: "Organic Foods", primaryContact: { id: "c7", name: "Emma Williams", email: "emma@greenvalleyorg.com", phone: "(503) 555-0724", role: "CEO", isPrimary: true },
    contacts: [{ id: "c7", name: "Emma Williams", email: "emma@greenvalleyorg.com", phone: "(503) 555-0724", role: "CEO", isPrimary: true }],
    accountTier: "Mid-Market", region: "Pacific Northwest", address: "1100 NW Glisan St, Portland, OR 97209", totalRevenue: 267900, lastOrderDate: "2026-03-23", creditLimit: 60000, outstandingBalance: 8200, assignedRep: "David Lee", accountSince: "2024-03-10", paymentScore: 98, orderFrequencyDays: 12, topProducts: ["Organic Quinoa 25lb", "Chia Seeds 10lb", "Coconut Oil 5gal"], tags: ["Organic", "Growing"],
  },
  {
    id: "cust-008", name: "Titan Construction Materials", industry: "Building Materials", primaryContact: { id: "c8", name: "Frank DiMaggio", email: "frank@titanconst.com", phone: "(602) 555-0831", role: "Procurement Manager", isPrimary: true },
    contacts: [{ id: "c8", name: "Frank DiMaggio", email: "frank@titanconst.com", phone: "(602) 555-0831", role: "Procurement Manager", isPrimary: true }],
    accountTier: "Enterprise", region: "Southwest", address: "4400 N Central Ave, Phoenix, AZ 85012", totalRevenue: 1567000, lastOrderDate: "2026-03-27", creditLimit: 250000, outstandingBalance: 89000, assignedRep: "Mike Thompson", accountSince: "2021-04-22", paymentScore: 82, orderFrequencyDays: 7, topProducts: ["Concrete Mix 80lb", "Drywall 4x8", "Insulation R-13"], tags: ["High Volume", "Net 45"],
  },
  {
    id: "cust-009", name: "Coastal Seafood Co.", industry: "Food & Beverage", primaryContact: { id: "c9", name: "Hiroshi Tanaka", email: "hiroshi@coastalseafood.com", phone: "(305) 555-0942", role: "Buying Manager", isPrimary: true },
    contacts: [{ id: "c9", name: "Hiroshi Tanaka", email: "hiroshi@coastalseafood.com", phone: "(305) 555-0942", role: "Buying Manager", isPrimary: true }],
    accountTier: "Mid-Market", region: "Southeast", address: "200 S Biscayne Blvd, Miami, FL 33131", totalRevenue: 389400, lastOrderDate: "2026-03-21", creditLimit: 90000, outstandingBalance: 15600, assignedRep: "Sarah Mitchell", accountSince: "2023-11-01", paymentScore: 91, orderFrequencyDays: 10, topProducts: ["Frozen Shrimp 10lb", "Salmon Fillet Case", "Tuna Steaks 5lb"], tags: ["Seafood", "Perishable"],
  },
  {
    id: "cust-010", name: "Pinnacle Hospitality Group", industry: "Hospitality", primaryContact: { id: "c10", name: "Diana Reeves", email: "diana@pinnaclehosp.com", phone: "(702) 555-1055", role: "F&B Director", isPrimary: true },
    contacts: [{ id: "c10", name: "Diana Reeves", email: "diana@pinnaclehosp.com", phone: "(702) 555-1055", role: "F&B Director", isPrimary: true }],
    accountTier: "Enterprise", region: "West", address: "3600 Las Vegas Blvd S, Las Vegas, NV 89109", totalRevenue: 723600, lastOrderDate: "2026-03-26", creditLimit: 125000, outstandingBalance: 41200, assignedRep: "David Lee", accountSince: "2022-07-18", paymentScore: 86, orderFrequencyDays: 7, topProducts: ["Premium Steak Cuts Case", "Wine Selection Mix", "Napkins Bulk"], tags: ["Hospitality", "High Volume"],
  },
  {
    id: "cust-011", name: "Redwood Paper Products", industry: "Paper & Packaging", primaryContact: { id: "c11", name: "Nancy Chen", email: "nancy@redwoodpaper.com", phone: "(916) 555-1108", role: "Supply Manager", isPrimary: true },
    contacts: [{ id: "c11", name: "Nancy Chen", email: "nancy@redwoodpaper.com", phone: "(916) 555-1108", role: "Supply Manager", isPrimary: true }],
    accountTier: "SMB", region: "West Coast", address: "1515 K St, Sacramento, CA 95814", totalRevenue: 98400, lastOrderDate: "2026-03-18", creditLimit: 25000, outstandingBalance: 4200, assignedRep: "Alex Rivera", accountSince: "2025-01-05", paymentScore: 94, orderFrequencyDays: 21, topProducts: ["Copy Paper A4 Case", "Paper Towels Bulk", "Tissue Roll 96ct"], tags: ["New"],
  },
  {
    id: "cust-012", name: "Midwest Grain Traders", industry: "Agriculture", primaryContact: { id: "c12", name: "Bill Henderson", email: "bill@midwestgrain.com", phone: "(515) 555-1215", role: "Trading Director", isPrimary: true },
    contacts: [{ id: "c12", name: "Bill Henderson", email: "bill@midwestgrain.com", phone: "(515) 555-1215", role: "Trading Director", isPrimary: true }],
    accountTier: "Enterprise", region: "Midwest", address: "600 Grand Ave, Des Moines, IA 50309", totalRevenue: 2134000, lastOrderDate: "2026-03-27", creditLimit: 300000, outstandingBalance: 126000, assignedRep: "Mike Thompson", accountSince: "2020-03-12", paymentScore: 80, orderFrequencyDays: 5, topProducts: ["Wheat Flour 50lb Bulk", "Corn Starch Industrial", "Soybean Oil 55gal"], tags: ["Bulk", "Contract", "Top Account"],
  },
  {
    id: "cust-013", name: "Blue Ridge Beverages", industry: "Beverages", primaryContact: { id: "c13", name: "Kevin O'Brien", email: "kevin@blueridgebev.com", phone: "(828) 555-1322", role: "Distribution Manager", isPrimary: true },
    contacts: [{ id: "c13", name: "Kevin O'Brien", email: "kevin@blueridgebev.com", phone: "(828) 555-1322", role: "Distribution Manager", isPrimary: true }],
    accountTier: "Mid-Market", region: "Southeast", address: "45 S French Broad Ave, Asheville, NC 28801", totalRevenue: 245600, lastOrderDate: "2026-03-19", creditLimit: 50000, outstandingBalance: 8900, assignedRep: "Alex Rivera", accountSince: "2024-06-20", paymentScore: 93, orderFrequencyDays: 14, topProducts: ["Sparkling Water 24pk", "Craft Soda Variety", "Cold Brew Coffee 12pk"], tags: ["Beverages"],
  },
  {
    id: "cust-014", name: "Summit Chemical Supply", industry: "Chemicals", primaryContact: { id: "c14", name: "Patricia Liu", email: "patricia@summitchem.com", phone: "(713) 555-1430", role: "VP Operations", isPrimary: true },
    contacts: [{ id: "c14", name: "Patricia Liu", email: "patricia@summitchem.com", phone: "(713) 555-1430", role: "VP Operations", isPrimary: true }],
    accountTier: "Enterprise", region: "South", address: "1200 Smith St, Houston, TX 77002", totalRevenue: 678900, lastOrderDate: "2026-03-25", creditLimit: 120000, outstandingBalance: 34500, assignedRep: "David Lee", accountSince: "2022-11-08", paymentScore: 87, orderFrequencyDays: 14, topProducts: ["Industrial Cleaner 5gal", "Sanitizer Bulk", "Solvent Grade A"], tags: ["Chemicals", "HAZMAT"],
  },
  {
    id: "cust-015", name: "Heritage Restaurant Group", industry: "Restaurant", primaryContact: { id: "c15", name: "Marco Rossi", email: "marco@heritagerest.com", phone: "(212) 555-1538", role: "Executive Chef", isPrimary: true },
    contacts: [{ id: "c15", name: "Marco Rossi", email: "marco@heritagerest.com", phone: "(212) 555-1538", role: "Executive Chef", isPrimary: true }],
    accountTier: "Mid-Market", region: "Northeast", address: "375 Park Ave, New York, NY 10152", totalRevenue: 456200, lastOrderDate: "2026-03-26", creditLimit: 85000, outstandingBalance: 19800, assignedRep: "Sarah Mitchell", accountSince: "2023-04-15", paymentScore: 90, orderFrequencyDays: 7, topProducts: ["EVOO Premium 5L", "Pasta Variety Case", "San Marzano Tomatoes"], tags: ["Restaurant", "Italian"],
  },
  {
    id: "cust-016", name: "Atlas Hardware Wholesale", industry: "Hardware", primaryContact: { id: "c16", name: "Greg Porter", email: "greg@atlashw.com", phone: "(404) 555-1645", role: "Purchasing Director", isPrimary: true },
    contacts: [{ id: "c16", name: "Greg Porter", email: "greg@atlashw.com", phone: "(404) 555-1645", role: "Purchasing Director", isPrimary: true }],
    accountTier: "Mid-Market", region: "Southeast", address: "191 Peachtree St NE, Atlanta, GA 30303", totalRevenue: 312400, lastOrderDate: "2026-03-22", creditLimit: 70000, outstandingBalance: 11200, assignedRep: "Mike Thompson", accountSince: "2024-02-28", paymentScore: 89, orderFrequencyDays: 14, topProducts: ["Power Drill Set", "PVC Pipe 4in 10ft", "Wire 14ga 500ft"], tags: ["Hardware"],
  },
  {
    id: "cust-017", name: "Evergreen Catering Co.", industry: "Catering", primaryContact: { id: "c17", name: "Susan Park", email: "susan@evergreencater.com", phone: "(206) 555-1752", role: "Operations Manager", isPrimary: true },
    contacts: [{ id: "c17", name: "Susan Park", email: "susan@evergreencater.com", phone: "(206) 555-1752", role: "Operations Manager", isPrimary: true }],
    accountTier: "SMB", region: "Pacific Northwest", address: "2015 2nd Ave, Seattle, WA 98121", totalRevenue: 134500, lastOrderDate: "2026-03-20", creditLimit: 30000, outstandingBalance: 5400, assignedRep: "Alex Rivera", accountSince: "2025-02-10", paymentScore: 97, orderFrequencyDays: 10, topProducts: ["Disposable Plates 500ct", "Napkins Premium", "Aluminum Trays"], tags: ["Catering", "New"],
  },
  {
    id: "cust-018", name: "Golden State Distributors", industry: "Distribution", primaryContact: { id: "c18", name: "David Nguyen", email: "david@goldenstate.com", phone: "(510) 555-1860", role: "GM", isPrimary: true },
    contacts: [{ id: "c18", name: "David Nguyen", email: "david@goldenstate.com", phone: "(510) 555-1860", role: "GM", isPrimary: true }],
    accountTier: "Enterprise", region: "West Coast", address: "1901 Harrison St, Oakland, CA 94612", totalRevenue: 1890000, lastOrderDate: "2026-03-28", creditLimit: 280000, outstandingBalance: 95000, assignedRep: "David Lee", accountSince: "2020-08-01", paymentScore: 83, orderFrequencyDays: 5, topProducts: ["Mixed Snack Pallet", "Beverage Variety Pallet", "Frozen Goods Mix"], tags: ["Top Account", "Distribution"],
  },
  {
    id: "cust-019", name: "Prairie Farms Supply", industry: "Agriculture", primaryContact: { id: "c19", name: "Martha Johnson", email: "martha@prairiefarms.com", phone: "(316) 555-1978", role: "Owner", isPrimary: true },
    contacts: [{ id: "c19", name: "Martha Johnson", email: "martha@prairiefarms.com", phone: "(316) 555-1978", role: "Owner", isPrimary: true }],
    accountTier: "SMB", region: "Midwest", address: "150 N Main St, Wichita, KS 67202", totalRevenue: 87600, lastOrderDate: "2026-03-15", creditLimit: 20000, outstandingBalance: 2800, assignedRep: "Alex Rivera", accountSince: "2025-06-01", paymentScore: 100, orderFrequencyDays: 30, topProducts: ["Animal Feed 50lb", "Fertilizer Bulk", "Seeds Variety"], tags: ["Farm", "Small"],
  },
  {
    id: "cust-020", name: "NorthStar Frozen Foods", industry: "Frozen Foods", primaryContact: { id: "c20", name: "Erik Johansson", email: "erik@northstarfrozen.com", phone: "(612) 555-2085", role: "VP Sourcing", isPrimary: true },
    contacts: [{ id: "c20", name: "Erik Johansson", email: "erik@northstarfrozen.com", phone: "(612) 555-2085", role: "VP Sourcing", isPrimary: true }],
    accountTier: "Enterprise", region: "Midwest", address: "800 Nicollet Mall, Minneapolis, MN 55402", totalRevenue: 1023000, lastOrderDate: "2026-03-26", creditLimit: 180000, outstandingBalance: 52000, assignedRep: "Sarah Mitchell", accountSince: "2022-05-14", paymentScore: 84, orderFrequencyDays: 10, topProducts: ["Frozen Pizza Cases", "Ice Cream 3gal", "Frozen Vegetables Bulk"], tags: ["Frozen", "Cold Chain"],
  },
];
