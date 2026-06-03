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
    
    if (!termsAccepted) {
      return res.status(400).json({ msg: 'Debes aceptar los términos y condiciones' });
    }
    
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ msg: 'Este número ya está registrado' });
    }
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
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
      currentLocation: { lat: 12.1063, lng: -85.3705 }
    };
    
    if (role === 'mandadito') {
      userData.credits = 15;
      userData.status = 'disponible';
      userData.isAvailable = true;
      
      if (workSchedule) {
        userData.workSchedule = typeof workSchedule === 'string' ? JSON.parse(workSchedule) : workSchedule;
      } else {
        userData.workSchedule = {
          days: [1, 2, 3, 4, 5, 6],
          startTime: "08:00",
          endTime: "17:00",
          lunchStart: "12:00",
          lunchEnd: "13:00"
        };
      }
      
      userData.documents = {};
      if (req.files) {
        if (req.files.cedula) {
          userData.documents.cedula = bufferToBase64(req.files.cedula[0].buffer, req.files.cedula[0].mimetype);
        }
        if (req.files.licencia) {
          userData.documents.licencia = bufferToBase64(req.files.licencia[0].buffer, req.files.licencia[0].mimetype);
        }
        if (req.files.motoPhoto) {
          userData.documents.motoPhoto = bufferToBase64(req.files.motoPhoto[0].buffer, req.files.motoPhoto[0].mimetype);
        }
        if (req.files.profilePhoto) {
          userData.documents.profilePhoto = bufferToBase64(req.files.profilePhoto[0].buffer, req.files.profilePhoto[0].mimetype);
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
    
    const userResponse = {
      id: user._id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      credits: user.credits || 0,
      isVIP: user.isVIP || false,
      status: user.status
    };
    
    res.status(201).json({ success: true, token, user: userResponse });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error en el servidor', error: error.message });
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
        credits: user.credits || 0,
        isVIP: user.isVIP || false,
        isAvailable: user.isAvailable,
        status: user.status
      }
    });
    
  } catch (error) {
    res.status(500).json({ msg: 'Error en el servidor', error: error.message });
  }
};

// Obtener perfil
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

// Actualizar ubicación
exports.updateLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    await User.findByIdAndUpdate(req.user.id, {
      currentLocation: { lat, lng },
      lastActive: new Date()
    });
    res.json({ success: true, msg: 'Ubicación actualizada' });
  } catch (error) {
    res.status(500).json({ msg: 'Error actualizando ubicación' });
  }
};

// Actualizar disponibilidad y estado
exports.updateAvailability = async (req, res) => {
  try {
    const { isAvailable, status } = req.body;
    const user = await User.findById(req.user.id);
    
    if (user.role !== 'mandadito') {
      return res.status(403).json({ msg: 'No autorizado' });
    }
    
    user.isAvailable = isAvailable !== undefined ? isAvailable : user.isAvailable;
    if (status) user.status = status;
    user.lastActive = new Date();
    await user.save();
    
    res.json({ success: true, isAvailable: user.isAvailable, status: user.status });
  } catch (error) {
    res.status(500).json({ msg: 'Error actualizando disponibilidad' });
  }
};

// Actualizar perfil
exports.updateProfile = async (req, res) => {
  try {
    const { name, lastName, bio, workSchedule } = req.body;
    const updates = { name, lastName, bio };
    
    if (workSchedule) {
      updates.workSchedule = typeof workSchedule === 'string' ? JSON.parse(workSchedule) : workSchedule;
    }
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true }
    ).select('-password');
    
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ msg: 'Error actualizando perfil' });
  }
};

// Cambiar contraseña
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Contraseña actual incorrecta' });
    }
    
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    
    res.json({ success: true, msg: 'Contraseña actualizada' });
  } catch (error) {
    res.status(500).json({ msg: 'Error cambiando contraseña' });
  }
};

// 👇 NUEVAS FUNCIONES PARA MANDADITOS

// Obtener todos los mandaditos con su estado
exports.getAllMandaditos = async (req, res) => {
  try {
    const mandaditos = await User.find({ role: 'mandadito' })
      .select('-password -documents')
      .sort('-createdAt');
    
    const mandaditosConEstado = mandaditos.map(m => {
      const now = new Date();
      const currentHour = now.getHours().toString().padStart(2, '0');
      const currentMinute = now.getMinutes().toString().padStart(2, '0');
      const currentTime = `${currentHour}:${currentMinute}`;
      const currentDay = now.getDay() || 7;
      
      let autoStatus = m.status || 'descanso';
      
      if (m.workSchedule) {
        const schedule = m.workSchedule;
        if (!schedule.days || !schedule.days.includes(currentDay)) {
          autoStatus = 'descanso';
        } else if (currentTime >= schedule.lunchStart && currentTime <= schedule.lunchEnd) {
          autoStatus = 'almorzando';
        } else if (currentTime < schedule.startTime || currentTime > schedule.endTime) {
          autoStatus = 'descanso';
        } else if (!m.isAvailable) {
          autoStatus = 'ocupado';
        } else {
          autoStatus = 'disponible';
        }
      }
      
      return { 
        ...m.toObject(), 
        currentStatus: autoStatus,
        totalOrders: m.totalOrders || 0,
        completionRate: m.completionRate || 98,
        totalRatings: m.totalRatings || 0
      };
    });
    
    res.json(mandaditosConEstado);
  } catch (error) {
    console.error('Error getting mandaditos:', error);
    res.status(500).json({ msg: 'Error obteniendo mandaditos' });
  }
};

// Obtener un mandadito específico
exports.getMandaditoById = async (req, res) => {
  try {
    const mandadito = await User.findById(req.params.id)
      .select('-password -documents');
    
    if (!mandadito || mandadito.role !== 'mandadito') {
      return res.status(404).json({ msg: 'Mandadito no encontrado' });
    }
    
    const now = new Date();
    const currentHour = now.getHours().toString().padStart(2, '0');
    const currentMinute = now.getMinutes().toString().padStart(2, '0');
    const currentTime = `${currentHour}:${currentMinute}`;
    const currentDay = now.getDay() || 7;
    
    let currentStatus = mandadito.status || 'descanso';
    if (mandadito.workSchedule) {
      const schedule = mandadito.workSchedule;
      if (!schedule.days || !schedule.days.includes(currentDay)) {
        currentStatus = 'descanso';
      } else if (currentTime >= schedule.lunchStart && currentTime <= schedule.lunchEnd) {
        currentStatus = 'almorzando';
      } else if (currentTime < schedule.startTime || currentTime > schedule.endTime) {
        currentStatus = 'descanso';
      } else if (!mandadito.isAvailable) {
        currentStatus = 'ocupado';
      } else {
        currentStatus = 'disponible';
      }
    }
    
    res.json({ 
      ...mandadito.toObject(), 
      currentStatus,
      totalOrders: mandadito.totalOrders || 0,
      completionRate: mandadito.completionRate || 98,
      totalRatings: mandadito.totalRatings || 0
    });
  } catch (error) {
    console.error('Error getting mandadito:', error);
    res.status(500).json({ msg: 'Error obteniendo mandadito' });
  }
};

// Asignar mandado directamente a un mandadito
exports.assignOrderToMandadito = async (req, res) => {
  try {
    const { orderId, mandaditoId } = req.body;
    
    const mandadito = await User.findById(mandaditoId);
    if (!mandadito || mandadito.role !== 'mandadito') {
      return res.status(404).json({ msg: 'Mandadito no encontrado' });
    }
    
    if (mandadito.status !== 'disponible' || !mandadito.isAvailable) {
      return res.status(400).json({ msg: 'El mandadito no está disponible' });
    }
    
    if (mandadito.credits < 5) {
      return res.status(400).json({ msg: 'El mandadito no tiene créditos suficientes' });
    }
    
    const Order = require('../models/Order');
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ msg: 'Pedido no encontrado' });
    }
    
    if (order.status !== 'pendiente') {
      return res.status(400).json({ msg: 'Este pedido ya no está disponible' });
    }
    
    order.mandadito = mandaditoId;
    order.status = 'aceptado';
    await order.save();
    
    mandadito.credits -= 5;
    mandadito.status = 'ocupado';
    mandadito.totalOrders = (mandadito.totalOrders || 0) + 1;
    await mandadito.save();
    
    res.json({ success: true, order });
  } catch (error) {
    console.error('Error assigning order:', error);
    res.status(500).json({ msg: 'Error asignando mandado' });
  }
};