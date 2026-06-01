const mongoose = require('mongoose');

const BusinessSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: String },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  
  // Fotos del negocio (máximo 3 gratis)
  photos: [{ type: String }],
  
  // Redes sociales
  socialLinks: [{ type: String }],
  
  // Catálogo de productos
  catalog: [{
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String },
    photo: { type: String },
    category: { type: String }
  }],
  
  // Calificaciones
  rating: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },
  reviews: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    comment: { type: String },
    stars: { type: Number, min: 1, max: 5 },
    date: { type: Date, default: Date.now }
  }],
  
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Business', BusinessSchema);