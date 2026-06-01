const Order = require('../models/Order');
const User = require('../models/User');
const { getPriceByDistance, calculateDistance } = require('../services/distancePrice');
const NotificationService = require('../services/notificationService');

// Crear un pedido
exports.createOrder = async (req, res) => {
  try {
    const {
      items,
      pickupLocation,
      deliveryLocation,
      isUrgentVIP = false,
      businessId
    } = req.body;
    
    const clientId = req.user.id;
    
    // Calcular distancia
    const distance = await calculateDistance(pickupLocation, deliveryLocation);
    let deliveryPrice = getPriceByDistance(distance);
    
    // Si es urgente VIP, precio fijo de 150
    if (isUrgentVIP) {
      deliveryPrice = 150;
    }
    
    // Calcular subtotal
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal + deliveryPrice;
    
    // Crear orden
    const order = new Order({
      client: clientId,
      business: businessId,
      items,
      subtotal,
      deliveryPrice,
      total,
      isUrgentVIP,
      pickupLocation,
      deliveryLocation,
      distanceMeters: distance,
      status: 'pendiente'
    });
    
    await order.save();
    
    // Buscar mandaditos disponibles y notificarles
    const availableMandaditos = await User.find({
      role: 'mandadito',
      isAvailable: true,
      credits: { $gte: 5 } // Deben tener al menos 5 créditos
    });
    
    // Notificar a los mandaditos (Socket.io se implementará después)
    const io = req.app.get('io');
    if (io) {
      availableMandaditos.forEach(mandadito => {
        io.to(`user_${mandadito._id}`).emit('new_order', {
          orderId: order._id,
          pickupLocation,
          deliveryLocation,
          total: order.total,
          isUrgentVIP
        });
      });
    }
    
    res.status(201).json({
      success: true,
      order,
      message: 'Pedido creado exitosamente'
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error creando pedido', error: error.message });
  }
};

// Aceptar un pedido (mandadito)
exports.acceptOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const mandaditoId = req.user.id;
    
    // Verificar que el usuario es mandadito
    const mandadito = await User.findById(mandaditoId);
    if (mandadito.role !== 'mandadito') {
      return res.status(403).json({ msg: 'Solo los mandaditos pueden aceptar pedidos' });
    }
    
    // Verificar créditos
    if (mandadito.credits < 5) {
      return res.status(400).json({ msg: 'Créditos insuficientes. Recarga para aceptar mandados' });
    }
    
    // Buscar orden
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ msg: 'Pedido no encontrado' });
    }
    
    if (order.status !== 'pendiente') {
      return res.status(400).json({ msg: 'Este pedido ya no está disponible' });
    }
    
    // Asignar mandadito y descontar créditos
    order.mandadito = mandaditoId;
    order.status = 'aceptado';
    await order.save();
    
    // Descontar 5 créditos
    mandadito.credits -= 5;
    await mandadito.save();
    
    // Notificar al cliente
    const client = await User.findById(order.client);
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${order.client}`).emit('order_accepted', {
        orderId: order._id,
        mandadito: {
          id: mandadito._id,
          name: mandadito.name,
          phone: mandadito.phone
        }
      });
    }
    
    res.json({
      success: true,
      order,
      remainingCredits: mandadito.credits,
      message: 'Pedido aceptado exitosamente'
    });
    
  } catch (error) {
    res.status(500).json({ msg: 'Error aceptando pedido', error: error.message });
  }
};

// Actualizar estado del pedido
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, photos } = req.body;
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ msg: 'Pedido no encontrado' });
    }
    
    // Verificar permisos (cliente o mandadito asignado)
    const isClient = order.client.toString() === req.user.id;
    const isMandadito = order.mandadito && order.mandadito.toString() === req.user.id;
    
    if (!isClient && !isMandadito) {
      return res.status(403).json({ msg: 'No autorizado' });
    }
    
    // Actualizar estado
    order.status = status;
    if (photos) {
      order.deliveryPhotos.push(...photos);
    }
    
    await order.save();
    
    // Notificar cambios
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${order.client}`).emit('order_status_changed', {
        orderId: order._id,
        status: order.status
      });
      if (order.mandadito) {
        io.to(`user_${order.mandadito}`).emit('order_status_changed', {
          orderId: order._id,
          status: order.status
        });
      }
    }
    
    res.json({ success: true, order });
    
  } catch (error) {
    res.status(500).json({ msg: 'Error actualizando estado' });
  }
};

// Calificar pedido (cliente)
exports.rateOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { rating, review } = req.body;
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ msg: 'Pedido no encontrado' });
    }
    
    // Verificar que es el cliente
    if (order.client.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'No autorizado' });
    }
    
    // Verificar que el pedido está entregado
    if (order.status !== 'entregado') {
      return res.status(400).json({ msg: 'Solo puedes calificar pedidos entregados' });
    }
    
    order.clientRating = rating;
    order.clientReview = review;
    await order.save();
    
    res.json({ success: true, order });
    
  } catch (error) {
    res.status(500).json({ msg: 'Error calificando pedido' });
  }
};

// Obtener pedidos de un usuario
exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    let orders;
    if (user.role === 'cliente') {
      orders = await Order.find({ client: userId })
        .populate('mandadito', 'name phone')
        .populate('business', 'name')
        .sort('-createdAt');
    } else {
      orders = await Order.find({ mandadito: userId })
        .populate('client', 'name phone')
        .populate('business', 'name')
        .sort('-createdAt');
    }
    
    res.json(orders);
    
  } catch (error) {
    res.status(500).json({ msg: 'Error obteniendo pedidos' });
  }
};