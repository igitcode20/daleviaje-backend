const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Función para convertir buffer a base64
const bufferToBase64 = (buffer, mimetype) => {
  const base64 = buffer.toString('base64');
  return `data:${mimetype};base64,${base64}`;
};

// Registrar usuario (cliente o mandadito)
exports.register = async (req, res) => {
  try {
    const { 
      role, name, lastName, phone, password, termsAccepted,
      notificationsEnabled, locationEnabled, backgroundEnabled,
      workSchedule 
    } = req.body;
    
    // Verificar términos
    if (!termsAccepted) {
      return res.status(400).json({ msg: 'Debes aceptar los términos y condiciones' });
    }
    
    // Verificar si ya existe
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ msg: 'Este número ya está registrado' });
    }
    
    // Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Crear usuario base
    const userData = {
      name,
      lastName,
      phone,
      password: hashedPassword,
      role,
      termsAccepted,
      notificationsEnabled: notificationsEnabled || false,
      locationEnabled: locationEnabled || false,
      backgroundEnabled: backgroundEnabled || false,
      currentLocation: {
        lat: 12.1063,
        lng: -85.3705
      }
    };
    
    // Si es mandadito, agregar créditos, horario y DOCUMENTOS EN BASE64
    if (role === 'mandadito') {
      userData.credits = 15;
      userData.workSchedule = workSchedule || {
        days: [1, 2, 3, 4, 5, 6],
        startTime: "08:00",
        endTime: "17:00",
        lunchStart: "12:00",
        lunchEnd: "13:00"
      };
      
      // 📸 CONVERTIR LAS FOTOS A BASE64 Y GUARDAR EN BD
      userData.documents = {};
      
      if (req.files) {
        if (req.files.cedula) {
          userData.documents.cedula = bufferToBase64(
            req.files.cedula[0].buffer, 
            req.files.cedula[0].mimetype
          );
        }
        if (req.files.licencia) {
          userData.documents.licencia = bufferToBase64(
            req.files.licencia[0].buffer, 
            req.files.licencia[0].mimetype
          );
        }
        if (req.files.motoPhoto) {
          userData.documents.motoPhoto = bufferToBase64(
            req.files.motoPhoto[0].buffer, 
            req.files.motoPhoto[0].mimetype
          );
        }
        if (req.files.profilePhoto) {
          userData.documents.profilePhoto = bufferToBase64(
            req.files.profilePhoto[0].buffer, 
            req.files.profilePhoto[0].mimetype
          );
        }
      }
    }
    
    const user = new User(userData);
    await user.save();
    
    const token = jwt.sign(
      { id: user._id, role: user.role, phone: user.phone },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    // No enviar las fotos completas en la respuesta (son muy grandes)
    const userResponse = {
      id: user._id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      credits: user.credits,
      isVIP: user.isVIP,
      hasDocuments: {
        cedula: !!user.documents?.cedula,
        licencia: !!user.documents?.licencia,
        motoPhoto: !!user.documents?.motoPhoto,
        profilePhoto: !!user.documents?.profilePhoto
      }
    };
    
    res.status(201).json({
      success: true,
      token,
      user: userResponse
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error en el servidor', error: error.message });
  }
};

// Obtener perfil (incluye las fotos en Base64)
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'Usuario no encontrado' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { phone, password } = req.body;
    
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(400).json({ msg: 'Credenciales inválidas' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Credenciales inválidas' });
    }
    
    const token = jwt.sign(
      { id: user._id, role: user.role, phone: user.phone },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        credits: user.credits,
        isVIP: user.isVIP,
        isAvailable: user.isAvailable
      }
    });
    
  } catch (error) {
    res.status(500).json({ msg: 'Error en el servidor', error: error.message });
  }
};

// Actualizar ubicación
exports.updateLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    await User.findByIdAndUpdate(req.user.id, {
      currentLocation: { lat, lng }
    });
    res.json({ success: true, msg: 'Ubicación actualizada' });
  } catch (error) {
    res.status(500).json({ msg: 'Error actualizando ubicación' });
  }
};

// Actualizar disponibilidad
exports.updateAvailability = async (req, res) => {
  try {
    const { isAvailable } = req.body;
    const user = await User.findById(req.user.id);
    
    if (user.role !== 'mandadito') {
      return res.status(403).json({ msg: 'No autorizado' });
    }
    
    user.isAvailable = isAvailable;
    await user.save();
    
    res.json({ success: true, isAvailable: user.isAvailable });
  } catch (error) {
    res.status(500).json({ msg: 'Error actualizando disponibilidad' });
  }
};