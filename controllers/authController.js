const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ✅ OBTENER TODOS LOS MANDADITOS
exports.getAllMandaditos = async (req, res) => {
  try {
    const mandaditos = await User.find({ role: 'mandadito' })
      .select('-password')
      .sort({ credits: -1 }); // Los que tienen más créditos primero
    
    console.log(`📦 [BACKEND]: Enviando ${mandaditos.length} mandaditos con éxito.`);
    res.json(mandaditos);
  } catch (error) {
    console.error('🚨 Error getAllMandaditos:', error);
    res.status(500).json({ msg: 'Error al obtener mandaditos' });
  }
};

// ✅ OBTENER UN MANDADITO POR ID
exports.getMandaditoById = async (req, res) => {
  try {
    const mandadito = await User.findById(req.params.id).select('-password');
    if (!mandadito || mandadito.role !== 'mandadito') {
      return res.status(404).json({ msg: 'Mandadito no encontrado, mae.' });
    }
    res.json(mandadito);
  } catch (error) {
    console.error('🚨 Error getMandaditoById:', error);
    res.status(500).json({ msg: 'Error al obtener mandadito' });
  }
};

// ✅ REGISTRO
exports.register = async (req, res) => {
  try {
    const { role, name, lastName, phone, password, termsAccepted, workSchedule } = req.body;
    
    if (!termsAccepted) return res.status(400).json({ msg: 'Debés aceptar los términos y condiciones.' });
    
    const existe = await User.findOne({ phone });
    if (existe) return res.status(400).json({ msg: 'Este número de teléfono ya está registrado, loco.' });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const userData = {
      name, 
      lastName, 
      phone, 
      password: hashedPassword, 
      role,
      termsAccepted, 
      currentLocation: { lat: 12.1063, lng: -85.3705 }
    };
    
    if (role === 'mandadito') {
      userData.credits = 15;
      userData.status = 'disponible';
      
      // Controlar el parseo del horario de forma segura por si viene como String o como Objeto
      if (workSchedule) {
        try {
          userData.workSchedule = typeof workSchedule === 'string' ? JSON.parse(workSchedule) : workSchedule;
        } catch (e) {
          console.error("Error parseando workSchedule, usando el default");
        }
      }
      
      if (!userData.workSchedule) {
        userData.workSchedule = {
          days: [1, 2, 3, 4, 5, 6],
          startTime: "08:00", 
          endTime: "17:00",
          lunchStart: "12:00", 
          lunchEnd: "13:00"
        };
      }
      
      // Guardar fotos en base64 de forma segura
      userData.documents = {};
      if (req.files) {
        const toBase64 = (file) => `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
        if (req.files.cedula) userData.documents.cedula = toBase64(req.files.cedula[0]);
        if (req.files.licencia) userData.documents.licencia = toBase64(req.files.licencia[0]);
        if (req.files.motoPhoto) userData.documents.motoPhoto = toBase64(req.files.motoPhoto[0]);
        if (req.files.profilePhoto) userData.documents.profilePhoto = toBase64(req.files.profilePhoto[0]);
      }
    }
    
    const user = new User(userData);
    await user.save();
    
    // 💥 Firmamos usando user._id explícito
    const token = jwt.sign(
      { id: user._id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '30d' }
    );
    
    console.log(`✨ [BACKEND]: Nuevo usuario creado: ${name} con Rol: [${role}]`);

    res.status(201).json({ 
      success: true, 
      token, 
      user: { id: user._id, name, phone, role, credits: user.credits || 0 } 
    });
  } catch (error) {
    console.error('🚨 Error en registro:', error);
    res.status(500).json({ msg: 'Error en registro', error: error.message });
  }
};

// ✅ LOGIN
exports.login = async (req, res) => {
  try {
    const { phone, password } = req.body;
    const user = await User.findOne({ phone });
    if (!user) return res.status(400).json({ msg: 'Credenciales inválidas, mae.' });
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Credenciales inválidas, mae.' });
    
    if (!user.isActive) {
      return res.status(403).json({ msg: 'Tu cuenta está desactivada. Contactá al soporte de DaleViaje.' });
    }

    // 💥 Mantenemos 'id' apuntando a user._id
    const token = jwt.sign(
      { id: user._id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '30d' }
    );
    
    console.log(`🔓 [BACKEND]: Login exitoso para el usuario: ${user.name} (${user.role})`);

    res.json({ 
      success: true, 
      token, 
      user: { id: user._id, name: user.name, phone, role: user.role, credits: user.credits || 0 } 
    });
  } catch (error) {
    console.error('🚨 Error en login:', error);
    res.status(500).json({ msg: 'Error en login' });
  }
};

// ✅ PERFIL
exports.getProfile = async (req, res) => {
  try {
    // 💥 Corregido: Buscamos usando el ID inyectado por el middleware de forma flexible
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ msg: 'Usuario no encontrado en la base de datos.' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('🚨 Error al obtener perfil:', error);
    res.status(500).json({ msg: 'Error al obtener perfil' });
  }
};

// ✅ ACTUALIZAR UBICACIÓN
exports.updateLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const userId = req.user._id || req.user.id;

    await User.findByIdAndUpdate(userId, { currentLocation: { lat, lng } });
    res.json({ success: true });
  } catch (error) {
    console.error('🚨 Error en updateLocation:', error);
    res.status(500).json({ msg: 'Error al actualizar ubicación' });
  }
};

// ✅ ACTUALIZAR DISPONIBILIDAD
exports.updateAvailability = async (req, res) => {
  try {
    const { isAvailable, status } = req.body;
    const userId = req.user._id || req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'Usuario no encontrado.' });
    }

    if (user.role !== 'mandadito') {
      return res.status(403).json({ msg: 'No autorizado. Acción exclusiva para mandaditos.' });
    }
    
    user.isAvailable = isAvailable !== undefined ? isAvailable : user.isAvailable;
    if (status) user.status = status;
    user.lastActive = Date.now();
    
    await user.save();
    
    res.json({ success: true, isAvailable: user.isAvailable, status: user.status });
  } catch (error) {
    console.error('🚨 Error en updateAvailability:', error);
    res.status(500).json({ msg: 'Error al cambiar disponibilidad' });
  }
};