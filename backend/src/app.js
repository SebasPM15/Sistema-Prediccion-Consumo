// app.js
const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
const productRoutes = require('./routes/productRoutes');
const predictRoutes = require('./routes/predictRoutes');
const purchaseOrderRoutes = require('./routes/purchaseOrderRoutes');
const { defineAssociations } = require('./models');

const app = express();

// CORS
app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Inicialización asíncrona
(async () => {
    try {
        // Conexión DB
        await sequelize.authenticate();
        console.log('✅ PostgreSQL conectado');

        // Asociaciones
        defineAssociations();
        console.log('✅ Relaciones establecidas');

        // Sincronización
        await sequelize.sync({ alter: true }); // Ojo: solo para desarrollo
        console.log('✅ Tablas sincronizadas:', Object.keys(sequelize.models).join(', '));

        // Rutas
        app.use('/api/products', productRoutes);
        app.use('/api/predictions', predictRoutes);
        app.use('/api/products', purchaseOrderRoutes); 

        // 404
        app.use((req, res) => {
            res.status(404).json({ error: `Ruta no encontrada: ${req.originalUrl}` });
        });

        // Servidor
        const PORT = process.env.PORT || 3500;
        app.listen(PORT, () => {
            console.log(`✅ Servidor escuchando en puerto ${PORT}`);
        });

    } catch (error) {
        console.error('🚨 Error al iniciar:', error.message);
        process.exit(1);
    }
})();
