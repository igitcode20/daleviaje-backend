module.exports = (req, res, next) => {
  try {
    // 1. Validar que el middleware previo 'auth.js' haya hecho su trabajo
    if (!req.user) {
      console.error("🚨 [ADMIN ERROR]: No se encontró 'req.user'. El orden en la ruta está al revés.");
      return res.status(401).json({ msg: 'No autorizado. Falta autenticación principal.' });
    }

    console.log(`🕵️ [BACKEND LOG]: Evaluando permisos para: ${req.user.name} | Rol actual: '${req.user.role}'`);

    // 2. Validar estrictamente si es administrador
    if (req.user.role !== 'admin') {
      console.warn(`⛔ [ACCESO DENEGADO]: ${req.user.name} intentó entrar a rutas admin con rol: '${req.user.role}'`);
      return res.status(403).json({ msg: 'Acceso denegado. Se requieren permisos de administrador.' });
    }

    // Si es admin real, ¡dale viaje loco!
    next();
  } catch (error) {
    console.error('🚨 Error crítico en adminAuth middleware:', error);
    res.status(500).json({ msg: 'Error interno de autorización.' });
  }
};