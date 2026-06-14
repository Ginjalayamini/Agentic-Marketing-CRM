import { connectDb } from "./db.js";
import { Campaign, Communication, CommunicationEvent, Customer, Order, Segment } from "./models.js";
import { calculateCustomerIntelligence } from "./services/intelligence.js";

const cities = ["Hyderabad", "Bengaluru", "Mumbai", "Delhi", "Pune", "Chennai", "Kolkata", "Ahmedabad"];
const genders = ["Female", "Male", "Non-binary"];
const categories = ["Fashion", "Shoes", "Beauty", "Electronics", "Home", "Grocery"];
const products = ["Sneakers", "Kurta", "Skincare Kit", "Headphones", "Coffee Maker", "Denim Jacket", "Running Shoes"];

function pick<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

await connectDb();
await Promise.all([Customer.deleteMany({}), Order.deleteMany({}), Segment.deleteMany({}), Campaign.deleteMany({}), Communication.deleteMany({}), CommunicationEvent.deleteMany({})]);

const customers = [];
for (let index = 0; index < 1000; index++) {
  const orderCount = index < 120 ? 12 : index < 400 ? 6 : index < 760 ? 3 : 1;
  const inactive = index % 5 === 0;
  const lastPurchaseDate = daysAgo(inactive ? 90 + Math.floor(Math.random() * 140) : Math.floor(Math.random() * 45) + 1);
  const customer = await Customer.create({
    name: `Customer ${index + 1}`,
    email: `customer${index + 1}@example.com`,
    phone: `+91${9000000000 + index}`,
    city: pick(cities),
    gender: pick(genders),
    age: 18 + Math.floor(Math.random() * 45),
    totalSpend: 0,
    orderCount,
    lastPurchaseDate
  });
  customers.push(customer);
}

let createdOrders = 0;
for (const customer of customers) {
  let totalSpend = 0;
  const initialOrderCount = Number(customer.orderCount ?? 0);
  for (let count = 0; count < initialOrderCount; count++) {
    const amount = 300 + Math.floor(Math.random() * 12000);
    totalSpend += amount;
    await Order.create({
      customerId: customer._id,
      amount,
      product: pick(products),
      category: pick(categories),
      date: daysAgo(Math.floor(Math.random() * 365))
    });
    createdOrders++;
  }
  customer.totalSpend = totalSpend;
  Object.assign(
    customer,
    calculateCustomerIntelligence({
      totalSpend,
      orderCount: initialOrderCount,
      lastPurchaseDate: customer.lastPurchaseDate ?? new Date()
    })
  );
  await customer.save();
}

while (createdOrders < 5000) {
  const customer = pick(customers);
  const amount = 250 + Math.floor(Math.random() * 9000);
  await Order.create({ customerId: customer._id, amount, product: pick(products), category: pick(categories), date: daysAgo(Math.floor(Math.random() * 365)) });
  customer.totalSpend = Number(customer.totalSpend ?? 0) + amount;
  customer.orderCount = Number(customer.orderCount ?? 0) + 1;
  Object.assign(
    customer,
    calculateCustomerIntelligence({
      totalSpend: Number(customer.totalSpend ?? 0),
      orderCount: Number(customer.orderCount ?? 0),
      lastPurchaseDate: customer.lastPurchaseDate ?? new Date()
    })
  );
  await customer.save();
  createdOrders++;
}

const cutoff = daysAgo(90);
const segment = await Segment.create({
  name: "Inactive high-value shoppers",
  rules: { inactiveDays: 90, minSpend: 5000 },
  audienceSize: await Customer.countDocuments({ totalSpend: { $gte: 5000 }, lastPurchaseDate: { $lte: cutoff } })
});

await Campaign.create({
  name: "Winback 90",
  objective: "Bring back customers inactive for 90 days",
  segmentId: segment._id,
  channel: "WhatsApp",
  message: "Hi {{name}}, we missed you. Enjoy 20% off your next order.",
  status: "DRAFT"
});

console.log("Seeded 1000 customers and 5000 orders.");
process.exit(0);
