// /models/campaigns.js (or .ts)
import mongoose from "mongoose";

const campaignSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    csvUrl: {
      type: String,
      required: true,
    },
    company_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    vapiCampaignId: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: [
        "created",
        "running",
        "paused",
        "ended",
        "failed",
        "scheduled",
      ],
      default: "created",
    },
    total_contacts: {
      type: Number,
      required: true,
    },
    // CSV parsing statistics
    csv_stats: {
      totalRows: Number,
      validContacts: Number,
      errors: [String],
      summary: {
        totalAmount: Number,
        averageAmount: Number,
        minAmount: Number,
        maxAmount: Number,
      },
    },
    // Campaign execution stats (can be updated via webhooks)
    execution_stats: {
      totalCalls: { type: Number, default: 0 },
      completedCalls: { type: Number, default: 0 },
      failedCalls: { type: Number, default: 0 },
      answeredCalls: { type: Number, default: 0 },
      voicemailCalls: { type: Number, default: 0 },
      totalDuration: { type: Number, default: 0 }, // in seconds
      averageDuration: { type: Number, default: 0 },
    },
    scheduleAt: {
      type: Date,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Add indexes
campaignSchema.index({ company_id: 1 });
campaignSchema.index({ vapiCampaignId: 1 });
campaignSchema.index({ status: 1 });
campaignSchema.index({ createdAt: -1 });

const Campaign =
  mongoose.models.Campaign || mongoose.model("Campaign", campaignSchema);

export default Campaign;
