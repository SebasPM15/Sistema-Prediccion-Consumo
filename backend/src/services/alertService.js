const nodemailer = require('nodemailer');
const Alert = require('../models/Alert');

const { EMAIL_USER, EMAIL_PASS, APP_URL } = process.env;

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    pool: true,
    auth: { user: EMAIL_USER, pass: EMAIL_PASS }
});

const sendStockAlerts = async (product, prediction) => {
    try {
        const alertMessages = [];

        prediction.proyecciones.forEach(proyeccion => {
            if (proyeccion.alerta_stock) {
                alertMessages.push(`
                    <div style="padding: 10px; border-left: 5px solid #dc3545; background: #f8d7da; margin-bottom: 10px;">
                        <strong>📅 ${proyeccion.mes}</strong><br>
                        📦 Stock proyectado: <strong>${proyeccion.stock_actual_proyectado} unidades</strong><br>
                        ⚠️ Mínimo requerido: <strong>${proyeccion.stock_minimo_requerido} unidades</strong><br>
                        🛒 Acción necesaria: Pedir <strong>${proyeccion.cajas_a_pedir} cajas</strong> (${proyeccion.cajas_a_pedir * product.unidCaja} unidades)
                    </div>
                `);
            }
        });

        if (alertMessages.length > 0) {
            await Alert.create({
                product_id: product.codigo,
                message: alertMessages.join('\n'),
                severity: 'high'
            });

            const emailBody = buildEmailBody(product, alertMessages);
            await sendEmailNotification(emailBody);
        }
    } catch (error) {
        console.error('❌ Error en alertas:', error);
        throw new Error('Error procesando alertas');
    }
};

const buildEmailBody = (product, messages) => ({
    from: `Sistema de Inventarios <${EMAIL_USER}>`,
    to: 'mateo.pilco.dev@gmail.com',
    subject: `🚨 Stock crítico: ${product.codigo} - ${product.descripcion}`,
    html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #f8f9fa; border-radius: 10px;">
            <h2 style="color: #dc3545;">🚨 Alerta de Stock Crítico</h2>
            <h3>${product.descripcion} <small>(${product.codigo})</small></h3>
            <div style="background: #ffeeba; padding: 15px; border-radius: 5px;">
                <p>📦 Stock actual: <strong>${product.stockTotal} unidades</strong></p>
                <p>🔗 <a href="${APP_URL}/products/${product.codigo}" style="color: #007bff; text-decoration: none;">Revisar en sistema</a></p>
            </div>
            <h4 style="margin-top: 20px;">📅 Meses afectados:</h4>
            ${messages.join('')}
        </div>
    `
});

const sendEmailNotification = async (emailBody) => {
    try {
        await transporter.sendMail(emailBody);
        console.log('✅ Email de alerta enviado correctamente');
    } catch (error) {
        console.error('❌ Error enviando email:', error);
    }
};

module.exports = { sendStockAlerts };
