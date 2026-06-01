const ChatMessage = require('../models/ChatMessage');
const Order = require('../models/Order');

// Enviar mensaje en un pedido
exports.sendMessage = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { message, photos } = req.body;
    const fromUserId = req.user.id;
    
    // Verificar que el usuario está en el pedido
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ msg: 'Pedido no encontrado' });
    }
    
    const isClient = order.client.toString() === fromUserId;
    const isMandadito = order.mandadito && order.mandadito.toString() === fromUserId;
    
    if (!isClient && !isMandadito) {
      return res.status(403).json({ msg: 'No autorizado' });
    }
    
    const toUserId = isClient ? order.mandadito : order.client;
    
    // Limitar fotos a 2
    const finalPhotos = photos ? photos.slice(0, 2) : [];
    
    const chatMessage = new ChatMessage({
      order: orderId,
      from: fromUserId,
      to: toUserId,
      message,
      photos: finalPhotos
    });
    
    await chatMessage.save();
    
    // Notificar con Socket.io
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${toUserId}`).emit('new_message', {
        orderId,
        message: chatMessage
      });
    }
    
    res.status(201).json({ success: true, message: chatMessage });
    
  } catch (error) {
    res.status(500).json({ msg: 'Error enviando mensaje' });
  }
};

// Obtener mensajes de un pedido
exports.getMessages = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;
    
    // Verificar acceso
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ msg: 'Pedido no encontrado' });
    }
    
    const isClient = order.client.toString() === userId;
    const isMandadito = order.mandadito && order.mandadito.toString() === userId;
    
    if (!isClient && !isMandadito) {
      return res.status(403).json({ msg: 'No autorizado' });
    }
    
    const messages = await ChatMessage.find({ order: orderId })
      .populate('from', 'name role')
      .populate('to', 'name role')
      .sort('createdAt');
    
    res.json(messages);
    
  } catch (error) {
    res.status(500).json({ msg: 'Error obteniendo mensajes' });
  }
};