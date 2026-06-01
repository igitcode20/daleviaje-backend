// models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  lastName: { type: String },
  phone: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['cliente', 'mandadito'], required: true },
  
  currentLocation: {
    lat: { type: Number, default: 12.1063 },
    lng: { type: Number, default: -85.3705 }
  },
  
  notificationsEnabled: { type: Boolean, default: false },
  locationEnabled: { type: Boolean, default: false },
  backgroundEnabled: { type: Boolean, default: false },
  termsAccepted: { type: Boolean, required: true },
  
  // Solo para mandaditos
  credits: { type: Number, default: 0 },
  isVIP: { type: Boolean, default: false },
  vipExpires: { type: Date },
  isAvailable: { type: Boolean, default: true },
  
  // 📸 DOCUMENTOS GUARDADOS COMO BASE64 EN LA BD
  documents: {
    cedula: { type: String },      // Base64
    licencia: { type: String },    // Base64
    motoPhoto: { type: String },   // Base64
    profilePhoto: { type: String } // Base64
  },
  
  workSchedule: {
    days: [{ type: Number }],
    startTime: { type: String },
    endTime: { type: String },
    lunchStart: { type: String },
    lunchEnd: { type: String }
  },
  
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);