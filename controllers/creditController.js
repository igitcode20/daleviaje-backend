const User = require('../models/User');
const CreditPackage = require('../models/CreditPackage');
const RechargeRequest = require('../models/RechargeRequest');

// Función para convertir buffer a base64
const bufferToBase64 = (buffer, mimetype) => {
  return `data:${mimetype};base64,${buffer.toString('base64')}`;
};

// Obtener paquetes de créditos
exports.getCreditPackages = async (req, res) => {
  try {
    const packages = await CreditPackage.find();
    res.json(packages);
  } catch (error) {
    console.error('Error getCreditPackages:', error);
    res.status(500).json({ msg: 'Error obteniendo paquetes' });
  }
};

// Solicitar recarga de créditos (con comprobante)
exports.requestRecharge = async (req, res) => {
  try {
    const { packageId } = req.body;
    const userId = req.user.id;
    const voucherPhoto = req.file;
    
    const creditPackage = await CreditPackage.findById(packageId);
    if (!creditPackage) {
      return res.status(404).json({ msg: 'Paquete no encontrado' });
    }
    
    const rechargeRequest = new RechargeRequest({
      userId,
      packageId,
      amount: creditPackage.priceCords,
      credits: creditPackage.credits,
      voucherPhoto: voucherPhoto ? bufferToBase64(voucherPhoto.buffer, voucherPhoto.mimetype) : null,
      reference: `DV-${Date.now()}-${userId.slice(-4)}`,
      status: 'pending'
    });
    
    await rechargeRequest.save();
    
    res.json({
      success: true,
      message: 'Comprobante enviado. En breve recibirás tus créditos.',
      reference: rechargeRequest.reference
    });
  } catch (error) {
    console.error('Error requestRecharge:', error);
    res.status(500).json({ msg: 'Error procesando recarga' });
  }
};

// Obtener créditos del usuario
exports.getUserCredits = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('credits isVIP vipExpires');
    res.json(user);
  } catch (error) {
    console.error('Error getUserCredits:', error);
    res.status(500).json({ msg: 'Error obteniendo créditos' });
  }
};