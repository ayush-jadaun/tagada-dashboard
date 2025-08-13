// /models/Company.ts
import mongoose from 'mongoose';

const CompanySchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: String,
  createdAt: { type: Date, default: Date.now },
  campaigns: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' }],
  paymentLink:String
});

export default mongoose.models.Company || mongoose.model('Company', CompanySchema);
