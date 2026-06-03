const User = require('../models/User');
const CreditPackage = require('../models/CreditPackage');

// Obtener paquetes de créditos disponibles
exports.getCreditPackages = async (req, res) => {
  try {
    const packages = await CreditPackage.find();
    res.json(packages);
  } catch (error) {
    res.status(500).json({ msg: 'Error obteniendo paquetes' });
  }
};

// Solicitar recarga de créditos (genera código de pago)
exports.requestCreditRecharge = async (req, res) => {
  try {
    const { packageId } = req.body;
    const userId = req.user.id;
    
    const creditPackage = await CreditPackage.findById(packageId);
    if (!creditPackage) {
      return res.status(404).json({ msg: 'Paquete no encontrado' });
    }
    
    // Generar código único para el pago
    const paymentCode = `DV-${Date.now()}-${userId.slice(-4)}`;
    
    // Información para el pago
    const paymentInfo = {
      bankAccount: "50585202908",
      accountType: "Billetera Móvil",
      amount: creditPackage.priceCords,
      concept: `Recarga de ${creditPackage.credits} créditos - ${paymentCode}`,
      code: paymentCode,
      package: creditPackage
    };
    
    res.json({
      success: true,
      paymentInfo,
      message: `Envía ${creditPackage.priceCords} córdobas al número ${paymentInfo.bankAccount} con el concepto: ${paymentInfo.concept}`
    });
    
  } catch (error) {
    res.status(500).json({ msg: 'Error solicitando recarga' });
  }
};

// Confirmar recarga (lo haría el admin)
exports.confirmRecharge = async (req, res) => {
  try {
    const { userId, creditsToAdd, givesVIP, vipDays } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'Usuario no encontrado' });
    }
    
    // Agregar créditos
    user.credits += creditsToAdd;
    
    // Si da VIP
    if (givesVIP && vipDays > 0) {
      user.isVIP = true;
      user.vipExpires = new Date();
      user.vipExpires.setDate(user.vipExpires.getDate() + vipDays);
    }
    
    await user.save();
    
    res.json({
      success: true,
      newCredits: user.credits,
      isVIP: user.isVIP,
      vipExpires: user.vipExpires
    });
    
  } catch (error) {
    res.status(500).json({ msg: 'Error confirmando recarga' });
  }
};

// Obtener créditos del usuario
exports.getUserCredits = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('credits isVIP vipExpires');
    res.json(user);
  } catch (error) {
    res.status(500).json({ msg: 'Error obteniendo créditos' });
  }
  // Agregar esta función para manejar comprobantes
exports.requestRechargeWithVoucher = async (req, res) => {
  try {
    const { packageId } = req.body;
    const voucherPhoto = req.file;
    const userId = req.user.id;
    
    const creditPackage = await CreditPackage.findById(packageId);
    if (!creditPackage) {
      return res.status(404).json({ msg: 'Paquete no encontrado' });
    }
    
    // Guardar solicitud de recarga con comprobante
    const rechargeRequest = {
      userId,
      packageId,
      amount: creditPackage.priceCords,
      credits: creditPackage.credits,
      voucherPhoto: voucherPhoto ? bufferToBase64(voucherPhoto.buffer, voucherPhoto.mimetype) : null,
      status: 'pending',
      createdAt: new Date()
    };
    
    await RechargeRequest.create(rechargeRequest);
    
    res.json({
      success: true,
      message: 'Comprobante enviado. En breve recibirás tus créditos.'
    });
  } catch (error) {
    res.status(500).json({ msg: 'Error procesando recarga' });
  }
};

// Admin: confirmar recarga
exports.confirmRecharge = async (req, res) => {
  try {
    const { requestId } = req.body;
    const request = await RechargeRequest.findById(requestId);
    
    if (!request || request.status !== 'pending') {
      return res.status(404).json({ msg: 'Solicitud no encontrada' });
    }
    
    const user = await User.findById(request.userId);
    user.credits += request.credits;
    
    if (request.credits >= 200) {
      user.isVIP = true;
      user.vipExpires = new Date();
      user.vipExpires.setDate(user.vipExpires.getDate() + 3);
    }
    
    await user.save();
    request.status = 'completed';
    await request.save();
    
    res.json({ success: true, message: 'Créditos agregados' });
  } catch (error) {
    res.status(500).json({ msg: 'Error confirmando recarga' });
  }
};
};