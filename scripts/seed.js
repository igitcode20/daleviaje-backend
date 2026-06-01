const mongoose = require('mongoose');
const CreditPackage = require('../models/CreditPackage');
require('dotenv').config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Conectado a MongoDB');
    
    // Limpiar datos existentes
    await CreditPackage.deleteMany({});
    
    // Crear paquetes de créditos
    const packages = [
      {
        name: "Paquete Básico",
        priceCords: 30,
        credits: 30,
        givesVIP: false,
        vipDays: 0,
        isSpecial: false
      },
      {
        name: "Paquete Estándar",
        priceCords: 50,
        credits: 60,
        givesVIP: false,
        vipDays: 0,
        isSpecial: false
      },
      {
        name: "Paquete VIP",
        priceCords: 200,
        credits: 250,
        givesVIP: true,
        vipDays: 3,
        isSpecial: true
      }
    ];
    
    await CreditPackage.insertMany(packages);
    console.log('✅ Paquetes de créditos insertados');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

seedDatabase();