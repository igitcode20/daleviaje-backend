const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

// Conectar a MongoDB
connectDB();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');
const creditRoutes = require('./routes/creditRoutes');
const businessRoutes = require('./routes/businessRoutes');
const chatRoutes = require('./routes/chatRoutes');

// Usar rutas
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/credits', creditRoutes);
app.use('/api/businesses', businessRoutes);
app.use('/api/chat', chatRoutes);

// Hacer io accesible en los controladores
app.set('io', io);

// Servir archivos estáticos (para las fotos subidas)
app.use('/uploads', express.static('uploads'));

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ 
    message: '🚀 API de DaleViaje funcionando correctamente',
    version: '1.0.0',
    status: 'online'
  });
});

// Ruta 404 para endpoints no encontrados (CORREGIDO - sin '*')
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'Ruta no encontrada'
  });
});

// Middleware de manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error global:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor'
  });
});

// Puerto
const PORT = process.env.PORT || 5000;

// Iniciar servidor
server.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});

// Socket.io
require('./sockets/socketHandler')(io);