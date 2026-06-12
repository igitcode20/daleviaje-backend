const Order = require('../models/Order');
const User = require('../models/User');
const { getPriceByDistance, calculateDistance } = require('../services/distancePrice');

// 🚀 CREAR UN PEDIDO (PÚBLICO O DIRECTO)
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
      driverId // <-- El frontend envía 'driverId' si es un Mandado Directo
    } = req.body;
    
    const clientId = req.user.id;
    
    const distance = await calculateDistance(pickupLocation, deliveryLocation);
    let deliveryPrice = getPriceByDistance(distance);
    
    if (isUrgentVIP) {
      deliveryPrice = 150;
    }
    
    const subtotal = items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
    const total = subtotal + deliveryPrice;
    
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
      // Si el cliente seleccionó a un chofer directo, el estado nace como 'aceptado', si no, queda 'pendiente'
      status: driverId ? 'aceptado' : 'pendiente', 
      isPublic: isPublic || false
    };
    
    if (businessId) orderData.business = businessId;
    if (description) orderData.description = description;
    
    // Si viene asignado a un repartidor directo, lo vinculamos de una vez
    if (driverId) {
      orderData.mandadito = driverId;
      
      // Opcional: Cambiamos el estado del repartidor a ocupado inmediatamente
      await User.findByIdAndUpdate(driverId, { status: 'ocupado' });
    }
    
    const order = new Order(orderData);
    await order.save();
    
    res.status(201).json({ success: true, order });
    
  } catch (error) {
    console.error('Error creando pedido:', error);
    res.status(500).json({ msg: 'Error creando pedido', error: error.message });
  }
};

// 🚀 OBTENER LISTA DE REPARTIDORES (El endpoint que te daba Error 500)
exports.getAvailableDrivers = async (req, res) => {
  try {
    // Buscamos usuarios cuyo rol sea estrictamente 'mandadito' (según tu UserSchema) y que estén activos
    const drivers = await User.find({ 
      role: 'mandadito',
      isActive: true 
    }).select('-password -__v'); // Protegemos la contraseña del chofer

    res.status(200).json(drivers);
  } catch (error) {
    console.error('Error en getAvailableDrivers:', error);
    res.status(500).json({ 
      msg: 'Error interno en el servidor al obtener mandaditos', 
      error: error.message 
    });
  }
};

// Obtener pedidos disponibles generales (Mandados Públicos)
exports.getAvailableOrders = async (req, res) => {
  try {
    const orders = await Order.find({ 
      status: 'pendiente',
      mandadito: { $exists: false }
    })
    .populate('client', 'name phone')
    .populate('business', 'name address')
    .sort({ isUrgentVIP: -1, createdAt: -1 });
    
    res.json(orders);
  } catch (error) {
    res.status(500).json({ msg: 'Error al obtener pedidos disponibles' });
  }
};

// Aceptar un pedido público (mandadito) - CON VALIDACIÓN DE CRÉDITOS
exports.acceptOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const mandaditoId = req.user.id;
    
    const mandadito = await User.findById(mandaditoId);
    if (mandadito.role !== 'mandadito') {
      return res.status(403).json({ msg: 'No autorizado' });
    }
    
    // VALIDACIÓN DE CRÉDITOS
    if (mandadito.credits < 5) {
      return res.status(400).json({ 
        msg: 'No tienes suficientes créditos. Recarga para seguir aceptando mandados.',
        credits: mandadito.credits,
        needed: 5
      });
    }
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ msg: 'Pedido no encontrado' });
    }
    
    if (order.status !== 'pendiente') {
      return res.status(400).json({ msg: 'Este pedido ya no está disponible' });
    }
    
    // ASIGNAR Y DESCONTAR CRÉDITOS
    order.mandadito = mandaditoId;
    order.status = 'aceptado';
    await order.save();
    
    mandadito.credits -= 5;
    mandadito.status = 'ocupado';
    await mandadito.save();
    
    res.json({
      success: true,
      order,
      remainingCredits: mandadito.credits,
      message: 'Pedido aceptado. Se te han descontado 5 créditos.'
    });
    
  } catch (error) {
    res.status(500).json({ msg: 'Error aceptando pedido', error: error.message });
  }
};

// Actualizar estado del pedido
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    
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
    await order.save();
    
    res.json({ success: true, order });
    
  } catch (error) {
    res.status(500).json({ msg: 'Error actualizando estado' });
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

// Calificar pedido
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