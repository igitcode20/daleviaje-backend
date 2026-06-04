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
      businessId,
      description,
      isPublic = false,
      mandaditoId
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
    const subtotal = items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
    const total = subtotal + deliveryPrice;
    
    // Crear orden
    const orderData = {
      client: clientId,
      items: items || [],
      subtotal,
      deliveryPrice,
      total,
      isUrgentVIP,
      pickupLocation,
      deliveryLocation,
      distanceMeters: distance,
      status: 'pendiente',
      isPublic: isPublic || false
    };
    
    if (businessId) orderData.business = businessId;
    if (description) orderData.description = description;
    
    const order = new Order(orderData);
    await order.save();
    
    // Si se asignó un mandadito específico
    if (mandaditoId) {
      const mandadito = await User.findById(mandaditoId);
      if (mandadito && mandadito.role === 'mandadito' && mandadito.status === 'disponible') {
        order.mandadito = mandaditoId;
        order.status = 'aceptado';
        await order.save();
        
        mandadito.credits -= 5;
        mandadito.status = 'ocupado';
        await mandadito.save();
      }
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

// Obtener pedidos disponibles para mandaditos (MANDADOS PÚBLICOS)
exports.getAvailableOrders = async (req, res) => {
  try {
    const orders = await Order.find({ 
      status: 'pendiente',
      mandadito: { $exists: false }
    })
    .populate('client', 'name phone')
    .populate('business', 'name address')
    .sort({ isUrgentVIP: -1, createdAt: -1 });
    
    console.log(`📦 ${orders.length} pedidos disponibles`);
    res.json(orders);
  } catch (error) {
    console.error('Error en getAvailableOrders:', error);
    res.status(500).json({ msg: 'Error al obtener pedidos disponibles' });
  }
};

// Aceptar un pedido (mandadito)
exports.acceptOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const mandaditoId = req.user.id;
    
    const mandadito = await User.findById(mandaditoId);
    if (mandadito.role !== 'mandadito') {
      return res.status(403).json({ msg: 'Solo los mandaditos pueden aceptar pedidos' });
    }
    
    if (mandadito.credits < 5) {
      return res.status(400).json({ msg: 'Créditos insuficientes' });
    }
    
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
    await mandadito.save();
    
    res.json({
      success: true,
      order,
      remainingCredits: mandadito.credits
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
    
    const isClient = order.client.toString() === req.user.id;
    const isMandadito = order.mandadito && order.mandadito.toString() === req.user.id;
    
    if (!isClient && !isMandadito) {
      return res.status(403).json({ msg: 'No autorizado' });
    }
    
    order.status = status;
    if (photos) {
      order.deliveryPhotos.push(...photos);
    }
    
    await order.save();
    
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
    
    if (order.client.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'No autorizado' });
    }
    
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

// Obtener un pedido por ID
exports.getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId)
      .populate('client', 'name phone')
      .populate('mandadito', 'name phone')
      .populate('business', 'name address');
    
    if (!order) {
      return res.status(404).json({ msg: 'Pedido no encontrado' });
    }
    
    res.json(order);
  } catch (error) {
    res.status(500).json({ msg: 'Error al obtener pedido' });
  }
};