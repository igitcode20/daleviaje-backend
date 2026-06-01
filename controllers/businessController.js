const Business = require('../models/Business');

// Obtener todos los negocios
exports.getBusinesses = async (req, res) => {
  try {
    const businesses = await Business.find().sort('-rating');
    res.json(businesses);
  } catch (error) {
    res.status(500).json({ msg: 'Error obteniendo negocios' });
  }
};

// Obtener un negocio específico
exports.getBusinessById = async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);
    if (!business) {
      return res.status(404).json({ msg: 'Negocio no encontrado' });
    }
    res.json(business);
  } catch (error) {
    res.status(500).json({ msg: 'Error obteniendo negocio' });
  }
};

// Registrar un negocio
exports.registerBusiness = async (req, res) => {
  try {
    const { name, address, phone, location, socialLinks } = req.body;
    
    // Verificar límite de fotos (máximo 3 gratis)
    let photos = [];
    if (req.files && req.files.photos) {
      photos = req.files.photos.map(file => file.path);
      if (photos.length > 3) {
        return res.status(400).json({ msg: 'Solo puedes subir 3 fotos gratis. Para más, contacta al administrador' });
      }
    }
    
    // Verificar límite de redes sociales (1 gratis)
    let finalSocialLinks = socialLinks || [];
    if (finalSocialLinks.length > 1) {
      return res.status(400).json({ msg: 'Solo puedes agregar 1 red social gratis. Para más, contacta al administrador' });
    }
    
    const business = new Business({
      name,
      address,
      phone,
      location: JSON.parse(location),
      photos,
      socialLinks: finalSocialLinks
    });
    
    await business.save();
    
    res.status(201).json({
      success: true,
      business,
      message: 'Negocio registrado exitosamente'
    });
    
  } catch (error) {
    res.status(500).json({ msg: 'Error registrando negocio' });
  }
};

// Calificar negocio
exports.rateBusiness = async (req, res) => {
  try {
    const { id } = req.params;
    const { stars, comment } = req.body;
    const userId = req.user.id;
    
    const business = await Business.findById(id);
    if (!business) {
      return res.status(404).json({ msg: 'Negocio no encontrado' });
    }
    
    // Agregar reseña
    business.reviews.push({
      user: userId,
      stars,
      comment
    });
    
    // Calcular nuevo rating promedio
    const totalStars = business.reviews.reduce((sum, review) => sum + review.stars, 0);
    business.rating = totalStars / business.reviews.length;
    business.totalRatings = business.reviews.length;
    
    await business.save();
    
    res.json({ success: true, business });
    
  } catch (error) {
    res.status(500).json({ msg: 'Error calificando negocio' });
  }
};