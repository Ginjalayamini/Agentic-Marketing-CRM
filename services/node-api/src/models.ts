import mongoose, { Schema } from "mongoose";

const customerSchema = new Schema(
  {
    name: String,
    email: { type: String, index: true },
    phone: String,
    city: { type: String, index: true },
    gender: String,
    age: Number,
    totalSpend: Number,
    orderCount: Number,
    lastPurchaseDate: Date,
    recencyScore: Number,
    frequencyScore: Number,
    monetaryScore: Number,
    healthScore: Number,
    churnScore: Number,
    churnRisk: String,
    lifecycleSegment: String
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const orderSchema = new Schema({
  customerId: { type: Schema.Types.ObjectId, ref: "Customer", index: true },
  amount: Number,
  product: String,
  category: String,
  date: { type: Date, index: true }
});

const segmentSchema = new Schema(
  {
    name: String,
    rules: Schema.Types.Mixed,
    audienceSize: Number
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const campaignSchema = new Schema(
  {
    name: String,
    objective: String,
    segmentId: { type: Schema.Types.ObjectId, ref: "Segment" },
    channel: String,
    message: String,
    status: { type: String, default: "DRAFT" }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const communicationSchema = new Schema({
  campaignId: { type: Schema.Types.ObjectId, ref: "Campaign", index: true },
  customerId: { type: Schema.Types.ObjectId, ref: "Customer", index: true },
  channel: String,
  status: { type: String, default: "SENT", index: true },
  timestamp: { type: Date, default: Date.now }
});

const eventSchema = new Schema({
  communicationId: { type: Schema.Types.ObjectId, ref: "Communication", index: true },
  campaignId: { type: Schema.Types.ObjectId, ref: "Campaign", index: true },
  eventType: { type: String, index: true },
  timestamp: { type: Date, default: Date.now }
});

export const Customer = mongoose.model("Customer", customerSchema);
export const Order = mongoose.model("Order", orderSchema);
export const Segment = mongoose.model("Segment", segmentSchema);
export const Campaign = mongoose.model("Campaign", campaignSchema);
export const Communication = mongoose.model("Communication", communicationSchema);
export const CommunicationEvent = mongoose.model("CommunicationEvent", eventSchema);
