module.exports = (req, res, next) => {
  try {
    // 1. Verificar que el middleware principal 'auth.js' haya inyectado al usuario
    if (!req.user) {
      console.error("🚨 [ADMIN ERROR]: No existe 'req.user' en la petición. Asegurate de poner 'auth' antes de 'adminAuth' en las rutas.");
      return res.status(401).json({ msg: 'No autorizado. Falta autenticación principal.' });
    }

    // 2. Extraer el rol y el nombre de forma segura
    const userRole = req.user.role;
    const userName = req.user.name || 'Usuario Admin';

    console.log(`🕵️ [BACKEND LOG]: Evaluando permisos para: ${userName} | Rol: '${userRole}'`);

    // 3. Validación estricta del rol según tu Schema ('admin')
    if (userRole !== 'admin') {
      console.warn(`⛔ [ACCESO DENEGADO]: El usuario ${userName} intentó entrar al panel de administración pero tiene rol: '${userRole}'`);
      return res.status(403).json({ msg: 'Acceso denegado. Se requieren permisos de administrador, mae.' });
    }

    // Si todo está bien y es admin de verdad, ¡dele viaje, loco!
    next();
  } catch (error) {
    console.error('🚨 Error crítico en adminAuth middleware:', error);
    res.status(500).json({ msg: 'Error de autorización interno en el servidor.' });
  }
};