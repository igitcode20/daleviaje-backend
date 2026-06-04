const mongoose = require('mongoose');

const RechargeRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  packageId: { type: mongoose.Schema.Types.ObjectId, ref: 'CreditPackage' },
  amount: { type: Number, required: true },
  credits: { type: Number, required: true },
  voucherPhoto: { type: String },
  reference: { type: String },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('RechargeRequest', RechargeRequestSchema);