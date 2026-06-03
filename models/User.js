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
  
  // Estado del mandadito
  status: {
    type: String,
    enum: ['disponible', 'ocupado', 'almorzando', 'descanso'],
    default: 'descanso'
  },
  lastActive: { type: Date, default: Date.now },
  
  // Estadísticas
  totalOrders: { type: Number, default: 0 },
  completionRate: { type: Number, default: 98 },
  totalRatings: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  bio: { type: String, maxLength: 200 },
  
  // Documentos
  documents: {
    cedula: { type: String },
    licencia: { type: String },
    motoPhoto: { type: String },
    profilePhoto: { type: String }
  },
  
  workSchedule: {
    days: [{ type: Number }],
    startTime: { type: String },
    endTime: { type: String },
    lunchStart: { type: String },
    lunchEnd: { type: String },
    breaks: [{ type: Object }]
  },
  
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);