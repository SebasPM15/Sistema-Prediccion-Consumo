// test.js (archivo temporal)
const { predictStock } = require('./services/aiService');

// Ejecutar prueba
predictStock('PROD-001')
    .then(result => console.log('Resultado:', result))
    .catch(err => console.error('Error:', err.message));