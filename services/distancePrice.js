const fetch = require('node-fetch');

// Calcular precio según distancia (en metros)
const getPriceByDistance = (distanceMeters) => {
  if (distanceMeters <= 1000) return 40;      // 0-1 km
  if (distanceMeters <= 2000) return 50;      // 1-2 km
  if (distanceMeters <= 3000) return 60;      // 2-3 km
  if (distanceMeters <= 4000) return 70;      // 3-4 km
  if (distanceMeters <= 5000) return 80;      // 4-5 km
  return 80; // Más de 5 km
};

// Calcular distancia usando Google Maps
const calculateDistance = async (origin, destination) => {
  try {
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin.lat},${origin.lng}&destinations=${destination.lat},${destination.lng}&key=${process.env.GOOGLE_MAPS_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.rows[0] && data.rows[0].elements[0]) {
      return data.rows[0].elements[0].distance.value; // metros
    }
    return 1000; // Valor por defecto 1km
  } catch (error) {
    console.error('Error calculando distancia:', error);
    return 1000;
  }
};

module.exports = { getPriceByDistance, calculateDistance };