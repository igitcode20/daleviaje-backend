const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mandadito: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business' },
  
  // Productos del pedido
  items: [{
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    photo: { type: String }
  }],
  
  // Totales
  subtotal: { type: Number, required: true },
  deliveryPrice: { type: Number, required: true },
  total: { type: Number, required: true },
  
  // Tipo de mandado
  isUrgentVIP: { type: Boolean, default: false },
  
  // Ubicaciones
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
  
  distanceMeters: { type: Number },
  
  // Estado del pedido
  status: { 
    type: String, 
    enum: ['pendiente', 'aceptado', 'recogido', 'enCamino', 'entregado', 'cancelado'],
    default: 'pendiente'
  },
  
  // Calificación
  clientRating: { type: Number, min: 1, max: 5 },
  clientReview: { type: String },
  
  // Fotos del mandado
  deliveryPhotos: [{ type: String }],
  
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);