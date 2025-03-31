"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ProductForm from './ProductForm';

interface Proyeccion {
    mes: string;
    stock_actual_proyectado: number;
    stock_seguridad: number;
    consumo_previsto: number;
    po_recibido: number;
    stock_minimo_requerido: number;
    cajas_a_pedir: number;
    alerta_stock: boolean;
    purchaseOrders?: any[];
}

interface Prediccion {
    codigo: string;
    parametros_base: {
        modelo: string;
        stock_inicial: number;
        unidades_por_caja: number;
        horizonte_prediccion: string;
    };
    proyecciones: Proyeccion[];
}

interface Producto {
    codigo: string;
    descripcion: string;
    unidCaja: number;
    stockTotal: number;
    consumos: { [key: string]: number };
    createdAt: string;
    updatedAt: string;
}

const Dashboard = () => {
    const [products, setProducts] = useState<Producto[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
    const [prediction, setPrediction] = useState<Prediccion | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPOForm, setShowPOForm] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState<string>('');
    const [poData, setPOData] = useState({
        cantidad: 0,
        fecha_entrega: ''
    });

    const fetchProducts = async () => {
        try {
            const response = await axios.get('http://localhost:3500/api/products');
            setProducts(response.data.data);
        } catch (error) {
            console.error('Error al obtener productos:', error);
            setError('Error al cargar los productos');
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleCreatePO = async () => {
        try {
            if (!selectedProduct) return;
            
            let [mes, año] = selectedMonth.split('-');
            mes = mes.toUpperCase().replace('DEC', 'DIC');
            
            const response = await axios.post(
                `http://localhost:3500/api/products/${selectedProduct}/pos`,
                {
                    mes,
                    año: parseInt(año),
                    cantidad: poData.cantidad,
                    fecha_entrega: poData.fecha_entrega
                }
            );

            if (prediction) {
                const updatedProyecciones = prediction.proyecciones.map(proyeccion => {
                    if (proyeccion.mes === selectedMonth) {
                        return {
                            ...proyeccion,
                            purchaseOrders: [...(proyeccion.purchaseOrders || []), response.data.data]
                        };
                    }
                    return proyeccion;
                });
                
                setPrediction({
                    ...prediction,
                    proyecciones: updatedProyecciones
                });
            }

            setShowPOForm(false);
            setPOData({ cantidad: 0, fecha_entrega: '' });
            alert('Orden de compra creada exitosamente');
        } catch (error) {
            console.error('Error al crear PO:', error);
            setError('Error al crear la orden de compra');
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const sortConsumptions = (consumos: { [key: string]: number }) => {
        const monthOrder = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN',
            'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

        return Object.entries(consumos)
            .sort(([a], [b]) => {
                const [monthA, yearA] = a.split(' ');
                const [monthB, yearB] = b.split(' ');
                return (
                    parseInt(yearA) - parseInt(yearB) ||
                    monthOrder.indexOf(monthA) - monthOrder.indexOf(monthB)
                );
            });
    };

    const handlePredict = async (productCode: string) => {
        setLoading(true);
        setError(null);
        try {
            // Obtener predicción
            const predictionResponse = await axios.get<{ data: { prediction: Prediccion } }>(
                `http://localhost:3500/api/predictions/${productCode}/predict`
            );
            
            // Obtener órdenes de compra existentes
            const poResponse = await axios.get(
                `http://localhost:3500/api/products/${productCode}/pos`
            );

            // Mapear POs a las proyecciones correspondientes
            const updatedProyecciones = predictionResponse.data.data.prediction.proyecciones.map(proyeccion => {
                const [mes, año] = proyeccion.mes.split('-');
                const pos = poResponse.data.filter((po: any) => 
                    po.mes.toUpperCase() === mes && po.año.toString() === año
                );
                
                return {
                    ...proyeccion,
                    purchaseOrders: pos
                };
            });

            setPrediction({
                ...predictionResponse.data.data.prediction,
                proyecciones: updatedProyecciones
            });
            setSelectedProduct(productCode);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Error al obtener la predicción');
            console.error('Prediction error:', err);
        } finally {
            setLoading(false);
        }
    };

    const calcularAlertas = (proyecciones: Proyeccion[]) => {
        return proyecciones.filter(p => p.alerta_stock).length;
    };

    const formatMes = (mes: string) => {
        return mes.replace('-', ' ').toUpperCase();
    };

    const renderPOForm = () => (
        <div className="fixed inset-0 bg-slate-500/30 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-slate-800">
                        Nueva Orden de Compra ({selectedMonth.replace('DEC', 'DIC')})
                    </h3>
                    <button
                        onClick={() => setShowPOForm(false)}
                        className="text-slate-500 hover:text-slate-700"
                    >
                        ✕
                    </button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-slate-700">
                            Cantidad de Cajas
                        </label>
                        <input
                            type="number"
                            value={poData.cantidad}
                            onChange={(e) => setPOData({...poData, cantidad: Number(e.target.value)})}
                            className="w-full px-4 py-2 rounded-lg border border-slate-200"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2 text-slate-700">
                            Fecha de Entrega
                        </label>
                        <input
                            type="date"
                            value={poData.fecha_entrega}
                            onChange={(e) => setPOData({...poData, fecha_entrega: e.target.value})}
                            className="w-full px-4 py-2 rounded-lg border border-slate-200"
                            min={new Date().toISOString().split('T')[0]}
                            required
                        />
                    </div>
                    <button
                        onClick={handleCreatePO}
                        className="w-full px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700"
                    >
                        Guardar Orden
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="container mx-auto p-6 max-w-7xl bg-slate-50 min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-slate-700">
                    📦 Panel de Control de Inventario
                </h1>
                <button
                    onClick={() => setShowForm(true)}
                    className="px-6 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors shadow-sm flex items-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Nuevo Producto
                </button>
            </div>

            {showForm && <ProductForm onClose={() => setShowForm(false)} onProductAdded={fetchProducts} />}
            {showPOForm && renderPOForm()}

            {error && (
                <div className="mb-4 p-4 bg-rose-100 text-rose-700 rounded-lg">
                    {error}
                </div>
            )}

            {prediction && (
                <div className="fixed inset-0 bg-slate-500/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-4xl shadow-xl border border-slate-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-slate-800">
                                Predicción para {prediction.codigo}
                            </h3>
                            <button
                                onClick={() => setPrediction(null)}
                                className="text-slate-500 hover:text-slate-700"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 rounded-lg">
                                    <h4 className="font-medium mb-2 text-lg text-slate-800">Parámetros Base</h4>
                                    <div className="space-y-2 text-sm text-slate-600">
                                        <p><span className="font-medium">Modelo:</span> {prediction.parametros_base.modelo}</p>
                                        <p><span className="font-medium">Stock Inicial:</span> {prediction.parametros_base.stock_inicial}</p>
                                        <p><span className="font-medium">Unidades por Caja:</span> {prediction.parametros_base.unidades_por_caja}</p>
                                        <p><span className="font-medium">Horizonte de Predicción:</span> {prediction.parametros_base.horizonte_prediccion}</p>
                                    </div>
                                </div>

                                <div className="p-4 bg-slate-50 rounded-lg">
                                    <h4 className="font-medium mb-2 text-lg text-slate-800">Resumen General</h4>
                                    <div className={`p-3 rounded-lg ${calcularAlertas(prediction.proyecciones) > 0
                                            ? 'bg-rose-100 text-rose-800'
                                            : 'bg-emerald-100 text-emerald-800'
                                        }`}>
                                        <p className="text-sm font-medium">
                                            {calcularAlertas(prediction.proyecciones) > 0
                                                ? `⚠️ Alertas de stock en ${calcularAlertas(prediction.proyecciones)} meses`
                                                : '✅ Stock suficiente proyectado'}
                                        </p>
                                        <p className="mt-2 text-sm">
                                            Cajas totales recomendadas: {
                                                prediction.proyecciones.reduce((sum, p) => sum + p.cajas_a_pedir, 0)
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-x-auto rounded-lg border border-slate-200">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-100">
                                        <tr>
                                            <th className="p-3 text-left text-slate-700">Mes</th>
                                            <th className="p-3 text-left text-slate-700">Consumo Previsto</th>
                                            <th className="p-3 text-left text-slate-700">Stock Proyectado</th>
                                            <th className="p-3 text-left text-slate-700">Stock Seguridad</th>
                                            <th className="p-3 text-left text-slate-700">PO Recibido</th>
                                            <th className="p-3 text-left text-slate-700">Cajas a Pedir</th>
                                            <th className="p-3 text-left text-slate-700">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {prediction.proyecciones.map((proyeccion, index) => (
                                            <tr
                                                key={index}
                                                className={`border-b border-slate-200 ${proyeccion.alerta_stock ? 'bg-rose-50' : ''}`}
                                            >
                                                <td className="p-3 text-slate-800">{formatMes(proyeccion.mes)}</td>
                                                <td className="p-3 text-slate-600">{proyeccion.consumo_previsto.toFixed(2)}</td>
                                                <td className="p-3 text-slate-600">{proyeccion.stock_actual_proyectado.toFixed(2)}</td>
                                                <td className="p-3 text-slate-600">{proyeccion.stock_seguridad.toFixed(2)}</td>
                                                <td className="p-3 text-slate-600">
                                                    <div className="flex flex-wrap gap-1">
                                                        {proyeccion.purchaseOrders?.map((po: any, idx: number) => (
                                                            <span key={idx} className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs">
                                                                {po.cantidad} cajas
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="p-3 text-center">
                                                    {proyeccion.cajas_a_pedir > 0 && (
                                                        <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
                                                            {proyeccion.cajas_a_pedir}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-3">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedMonth(proyeccion.mes);
                                                            setShowPOForm(true);
                                                        }}
                                                        className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs hover:bg-emerald-200"
                                                    >
                                                        + Orden
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <button
                                onClick={() => setPrediction(null)}
                                className="w-full mt-4 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200">
                <div className="p-6 border-b border-slate-200">
                    <h2 className="text-xl font-semibold text-slate-700">
                        Inventario Actual ({products.length} productos)
                    </h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-medium text-slate-600">Código</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-slate-600">Descripción</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-slate-600">Unidad/Caja</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-slate-600">Stock Total</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-slate-600">Consumos</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-slate-600">Creado</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-slate-600">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {products.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                                        <div className="flex flex-col items-center justify-center">
                                            <span className="text-4xl mb-4">📭</span>
                                            No se encontraron productos
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                products.map((product) => (
                                    <tr key={product.codigo} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-700">
                                            {product.codigo}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 max-w-xs">
                                            {product.descripcion}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 text-center">
                                            {product.unidCaja}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-1 rounded-full text-sm ${
                                                product.stockTotal > 50 
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-rose-100 text-rose-700'
                                            }`}>
                                                {product.stockTotal}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-2 max-w-xs">
                                                {sortConsumptions(product.consumos).map(([month, value]) => (
                                                    <div key={month} className="px-2 py-1 bg-sky-100 text-sky-700 rounded-full text-xs">
                                                        {month}: {value}
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 text-sm">
                                            {formatDate(product.createdAt)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handlePredict(product.codigo)}
                                                className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors text-sm flex items-center gap-2"
                                                disabled={loading}
                                            >
                                                {loading && selectedProduct === product.codigo ? (
                                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                                                    </svg>
                                                )}
                                                Predecir
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;