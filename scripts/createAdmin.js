const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Cargar .env desde la raíz
dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a MongoDB');
    
    const User = require('../models/User');
    
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('⚠️ Ya existe un administrador:', existingAdmin.phone);
      console.log('⚠️ Usuario:', existingAdmin.phone);
      process.exit();
    }
    
    const hashedPassword = await bcrypt.hash('Admin123', 10);
    
    const admin = new User({
      name: 'Administrador',
      lastName: 'DaleViaje',
      phone: '50500000000',
      password: hashedPassword,
      role: 'admin',
      termsAccepted: true,
      isActive: true
    });
    
    await admin.save();
    console.log('\n✅ Administrador creado exitosamente!');
    console.log('=====================================');
    console.log('📱 Teléfono: 50500000000');
    console.log('🔑 Contraseña: Admin123');
    console.log('=====================================\n');
    process.exit();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

createAdmin();