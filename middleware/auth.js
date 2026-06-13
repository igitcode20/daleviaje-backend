const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    // 1. Obtener el token del header Authorization
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      return res.status(401).json({ msg: 'No hay token, autorización denegada.' });
    }

    // 2. Limpiar el prefijo Bearer
    const token = authHeader.replace('Bearer ', '').trim();
    if (!token || token === 'undefined' || token === 'null') {
      return res.status(401).json({ msg: 'Token inválido o mal estructurado.' });
    }

    // 3. Verificar el token usando la firma secreta
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 4. Buscar el usuario en la BD usando el ID que guardamos en el token (decoded.id)
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ msg: 'El usuario ya no existe en el sistema.' });
    }

    // 5. Si el usuario está baneado o inactivo, bloquear de viaje
    if (!user.isActive) {
      return res.status(403).json({ msg: 'Esta cuenta se encuentra desactivada, mae.' });
    }

    // Inyectamos el usuario completo en la petición para los siguientes middlewares
    req.user = user;
    next();
  } catch (error) {
    console.error('🚨 Error en auth middleware:', error.message);
    res.status(401).json({ msg: 'Token no válido o expirado.' });
  }
};