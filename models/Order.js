const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mandadito: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business' },
  
  items: [{
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    photo: { type: String }
  }],
  
  description: { type: String },
  
  subtotal: { type: Number, required: true },
  deliveryPrice: { type: Number, required: true },
  total: { type: Number, required: true },
  
  isUrgentVIP: { type: Boolean, default: false },
  isPublic: { type: Boolean, default: false },
  
  pickupLocation: {
    address: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  
  deliveryLocation: {
    address: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  
  // Ubicación en tiempo real del mandadito
  mandaditoLocation: {
    lat: { type: Number },
    lng: { type: Number },
    updatedAt: { type: Date }
  },
  
  distanceMeters: { type: Number },
  
  status: { 
    type: String, 
    enum: ['pendiente', 'aceptado', 'recogido', 'enCamino', 'entregado', 'cancelado'],
    default: 'pendiente'
  },
  
  // Para cancelaciones
  cancelReason: { type: String },
  cancelledBy: { type: String },
  deliveredAt: { type: Date },
  
  clientRating: { type: Number, min: 1, max: 5 },
  clientReview: { type: String },
  deliveryPhotos: [{ type: String }],
  
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);