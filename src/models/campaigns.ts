// /models/Campaign.ts
import mongoose from 'mongoose';

const CampaignSchema = new mongoose.Schema({
  csvUrl: String,
  vapiCampaignId: String,
  createdAt: { type: Date, default: Date.now },
  description:String,
  name: String,
  status: String,
  total_contacts: Number,
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
});

export default mongoose.models.Campaign || mongoose.model('Campaign', CampaignSchema);
