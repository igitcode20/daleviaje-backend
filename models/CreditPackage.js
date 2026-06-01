const mongoose = require('mongoose');

const CreditPackageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  priceCords: { type: Number, required: true }, // Precio en córdobas
  credits: { type: Number, required: true },
  givesVIP: { type: Boolean, default: false },
  vipDays: { type: Number, default: 0 },
  isSpecial: { type: Boolean, default: false }
});

module.exports = mongoose.model('CreditPackage', CreditPackageSchema);