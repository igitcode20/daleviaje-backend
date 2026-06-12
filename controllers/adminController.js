const User = require('../models/User');
const Order = require('../models/Order');
const Business = require('../models/Business');
const CreditPackage = require('../models/CreditPackage');

// ========== USUARIOS ==========
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.json(users);
  } catch (error) {
    console.error('Error getUsers:', error);
    res.status(500).json({ msg: 'Error al obtener usuarios' });
  }
};

exports.updateUserCredits = async (req, res) => {
  try {
    const { userId } = req.params;
    const { credits } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'Usuario no encontrado' });
    }
    
    user.credits = credits;
    await user.save();
    
    res.json({ success: true, credits: user.credits });
  } catch (error) {
    console.error('Error updateUserCredits:', error);
    res.status(500).json({ msg: 'Error al actualizar créditos' });
  }
};

exports.toggleUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'Usuario no encontrado' });
    }
    
    user.isActive = isActive;
    await user.save();
    
    res.json({ success: true, isActive: user.isActive });
  } catch (error) {
    console.error('Error toggleUserStatus:', error);
    res.status(500).json({ msg: 'Error al cambiar estado' });
  }
};

// 🎯 FUNCIÓN AGREGADA: Borrado definitivo de Clientes o Mandaditos
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByIdAndDelete(userId);
    
    if (!user) {
      return res.status(404).json({ msg: 'Usuario no encontrado' });
    }
    
    res.json({ success: true, message: 'Usuario eliminado del sistema' });
  } catch (error) {
    console.error('Error deleteUser:', error);
    res.status(500).json({ msg: 'Error al eliminar usuario' });
  }
};

// ========== PEDIDOS ==========
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('client', 'name phone')
      .populate('mandadito', 'name phone')
      .populate('business', 'name')
      .sort({ createdAt: -1 });
    
    res.json(orders);
  } catch (error) {
    console.error('Error getOrders:', error);
    res.status(500).json({ msg: 'Error al obtener pedidos' });
  }
};

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
    console.error('Error getOrderById:', error);
    res.status(500).json({ msg: 'Error al obtener pedido' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ msg: 'Pedido no encontrado' });
    }
    
    order.status = status;
    await order.save();
    
    res.json({ success: true, order });
  } catch (error) {
    console.error('Error updateOrderStatus:', error);
    res.status(500).json({ msg: 'Error al actualizar pedido' });
  }
};

// ========== NEGOCIOS ==========
exports.getBusinesses = async (req, res) => {
  try {
    const businesses = await Business.find({}).sort({ createdAt: -1 });
    res.json(businesses);
  } catch (error) {
    console.error('Error getBusinesses:', error);
    res.status(500).json({ msg: 'Error al obtener negocios' });
  }
};

exports.createBusiness = async (req, res) => {
  try {
    const { name, address, phone, location, catalog } = req.body;
    
    const business = new Business({
      name,
      address,
      phone,
      location: location || { lat: 12.1063, lng: -85.3705 },
      catalog: catalog || []
    });
    
    await business.save();
    res.status(201).json({ success: true, business });
  } catch (error) {
    console.error('Error createBusiness:', error);
    res.status(500).json({ msg: 'Error al crear negocio' });
  }
};

exports.updateBusiness = async (req, res) => {
  try {
    const { businessId } = req.params;
    const updates = req.body;
    
    const business = await Business.findByIdAndUpdate(businessId, updates, { new: true });
    if (!business) {
      return res.status(404).json({ msg: 'Negocio no encontrado' });
    }
    
    res.json({ success: true, business });
  } catch (error) {
    console.error('Error updateBusiness:', error);
    res.status(500).json({ msg: 'Error al actualizar negocio' });
  }
};

exports.deleteBusiness = async (req, res) => {
  try {
    const { businessId } = req.params;
    const business = await Business.findByIdAndDelete(businessId);
    if (!business) {
      return res.status(404).json({ msg: 'Negocio no encontrado' });
    }
    
    res.json({ success: true, message: 'Negocio eliminado' });
  } catch (error) {
    console.error('Error deleteBusiness:', error);
    res.status(500).json({ msg: 'Error al eliminar negocio' });
  }
};

// ========== RECARGAS ==========
exports.getRecharges = async (req, res) => {
  try {
    const RechargeRequest = require('../models/RechargeRequest');
    const recharges = await RechargeRequest.find({})
      .populate('userId', 'name lastName phone')
      .sort({ createdAt: -1 });
    
    res.json(recharges);
  } catch (error) {
    console.error('Error getRecharges:', error);
    res.json([]);
  }
};

exports.approveRecharge = async (req, res) => {
  try {
    const { rechargeId } = req.params;
    const { credits } = req.body;
    
    const RechargeRequest = require('../models/RechargeRequest');
    const recharge = await RechargeRequest.findById(rechargeId);
    
    if (!recharge) {
      return res.status(404).json({ msg: 'Solicitud no encontrada' });
    }
    
    const user = await User.findById(recharge.userId);
    user.credits += credits;
    await user.save();
    
    recharge.status = 'approved';
    await recharge.save();
    
    res.json({ success: true, message: 'Recarga aprobada' });
  } catch (error) {
    console.error('Error approveRecharge:', error);
    res.status(500).json({ msg: 'Error al aprobar recarga' });
  }
};

exports.rejectRecharge = async (req, res) => {
  try {
    const { rechargeId } = req.params;
    
    const RechargeRequest = require('../models/RechargeRequest');
    const recharge = await RechargeRequest.findById(rechargeId);
    
    if (!recharge) {
      return res.status(404).json({ msg: 'Solicitud no encontrada' });
    }
    
    recharge.status = 'rejected';
    await recharge.save();
    
    res.json({ success: true, message: 'Recarga rechazada' });
  } catch (error) {
    console.error('Error rejectRecharge:', error);
    res.status(500).json({ msg: 'Error al rechazar recarga' });
  }
};

// ========== ESTADÍSTICAS ==========
exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalMandaditos = await User.countDocuments({ role: 'mandadito' });
    const totalClientes = await User.countDocuments({ role: 'cliente' });
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'pendiente' });
    const completedOrders = await Order.countDocuments({ status: 'entregado' });
    const totalBusinesses = await Business.countDocuments();
    
    const recentOrders = await Order.find({})
      .populate('client', 'name')
      .sort({ createdAt: -1 })
      .limit(10);
    
    res.json({
      stats: {
        totalUsers,
        totalMandaditos,
        totalClientes,
        totalOrders,
        pendingOrders,
        completedOrders,
        totalBusinesses
      },
      recentOrders
    });
  } catch (error) {
    console.error('Error getDashboardStats:', error);
    res.status(500).json({ msg: 'Error al obtener estadísticas' });
  }
};