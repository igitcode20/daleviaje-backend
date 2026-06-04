const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ msg: 'Acceso denegado. Se requieren permisos de administrador.' });
    }
    next();
  } catch (error) {
    console.error('Error en adminAuth:', error);
    res.status(500).json({ msg: 'Error de autorización' });
  }
};