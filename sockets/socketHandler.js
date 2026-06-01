const User = require('../models/User');
const Order = require('../models/Order');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('🔌 Nuevo cliente conectado:', socket.id);
    
    // Unir usuario a su sala personal
    socket.on('register_user', (userId) => {
      socket.join(`user_${userId}`);
      console.log(`Usuario ${userId} unido a su sala`);
    });
    
    // Actualizar ubicación en tiempo real
    socket.on('update_location', async (data) => {
      const { userId, lat, lng } = data;
      
      // Actualizar en BD
      await User.findByIdAndUpdate(userId, {
        currentLocation: { lat, lng }
      });
      
      // Emitir ubicación a los clientes que siguen a este mandadito
      const activeOrders = await Order.find({
        mandadito: userId,
        status: { $in: ['aceptado', 'recogido', 'enCamino'] }
      });
      
      activeOrders.forEach(order => {
        socket.to(`user_${order.client}`).emit('mandadito_location', {
          orderId: order._id,
          location: { lat, lng }
        });
      });
    });
    
    // Cliente siguiendo a su mandadito
    socket.on('track_mandadito', (orderId) => {
      socket.join(`track_${orderId}`);
    });
    
    // Enviar notificación de nuevo pedido
    socket.on('notify_new_order', async (data) => {
      const { orderId, mandaditoId } = data;
      socket.to(`user_${mandaditoId}`).emit('new_order_notification', { orderId });
    });
    
    // Desconexión
    socket.on('disconnect', () => {
      console.log('🔌 Cliente desconectado:', socket.id);
    });
  });
};