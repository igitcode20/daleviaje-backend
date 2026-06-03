const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ✅ OBTENER TODOS LOS MANDADITOS (corregido)
exports.getAllMandaditos = async (req, res) => {
  try {
    const mandaditos = await User.find({ role: 'mandadito' })
      .select('-password')
      .sort({ credits: -1 }); // Los que tienen más créditos primero
    
    console.log(`📦 Enviando ${mandaditos.length} mandaditos`);
    res.json(mandaditos);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ msg: 'Error al obtener mandaditos' });
  }
};

// ✅ OBTENER UN MANDADITO POR ID
exports.getMandaditoById = async (req, res) => {
  try {
    const mandadito = await User.findById(req.params.id).select('-password');
    if (!mandadito || mandadito.role !== 'mandadito') {
      return res.status(404).json({ msg: 'Mandadito no encontrado' });
    }
    res.json(mandadito);
  } catch (error) {
    res.status(500).json({ msg: 'Error al obtener mandadito' });
  }
};

// ✅ REGISTRO
exports.register = async (req, res) => {
  try {
    const { role, name, lastName, phone, password, termsAccepted, workSchedule } = req.body;
    
    if (!termsAccepted) return res.status(400).json({ msg: 'Acepta términos' });
    
    const existe = await User.findOne({ phone });
    if (existe) return res.status(400).json({ msg: 'Número ya registrado' });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const userData = {
      name, lastName, phone, password: hashedPassword, role,
      termsAccepted, currentLocation: { lat: 12.1063, lng: -85.3705 }
    };
    
    if (role === 'mandadito') {
      userData.credits = 15;
      userData.status = 'disponible';
      userData.workSchedule = workSchedule ? JSON.parse(workSchedule) : {
        days: [1,2,3,4,5,6],
        startTime: "08:00", endTime: "17:00",
        lunchStart: "12:00", lunchEnd: "13:00"
      };
      
      // Guardar fotos en base64
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
    
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '30d' });
    
    res.status(201).json({ success: true, token, user: { id: user._id, name, phone, role, credits: user.credits || 0 } });
  } catch (error) {
    res.status(500).json({ msg: 'Error en registro', error: error.message });
  }
};

// ✅ LOGIN
exports.login = async (req, res) => {
  try {
    const { phone, password } = req.body;
    const user = await User.findOne({ phone });
    if (!user) return res.status(400).json({ msg: 'Credenciales inválidas' });
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Credenciales inválidas' });
    
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '30d' });
    
    res.json({ success: true, token, user: { id: user._id, name: user.name, phone, role: user.role, credits: user.credits || 0 } });
  } catch (error) {
    res.status(500).json({ msg: 'Error en login' });
  }
};

// ✅ PERFIL
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ msg: 'Error al obtener perfil' });
  }
};

// ✅ ACTUALIZAR UBICACIÓN
exports.updateLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    await User.findByIdAndUpdate(req.user.id, { currentLocation: { lat, lng } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ msg: 'Error' });
  }
};

// ✅ ACTUALIZAR DISPONIBILIDAD
exports.updateAvailability = async (req, res) => {
  try {
    const { isAvailable, status } = req.body;
    const user = await User.findById(req.user.id);
    if (user.role !== 'mandadito') return res.status(403).json({ msg: 'No autorizado' });
    
    user.isAvailable = isAvailable !== undefined ? isAvailable : user.isAvailable;
    if (status) user.status = status;
    await user.save();
    
    res.json({ success: true, isAvailable: user.isAvailable, status: user.status });
  } catch (error) {
    res.status(500).json({ msg: 'Error' });
  }
};