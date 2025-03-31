import pandas as pd
import numpy as np
from prophet import Prophet
from prophet.diagnostics import cross_validation, performance_metrics
import joblib
import os
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def train_model():
    try:
        # 1. Carga de datos
        file_path = os.path.join(os.path.dirname(__file__), '../data/consumo.csv')
        
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Archivo de datos no encontrado: {file_path}")
        
        df = pd.read_csv(file_path)
        logger.info(f"✅ Datos cargados correctamente. Registros: {len(df)}")

        # 2. Preprocesamiento y validación
        required_columns = {'Fecha', 'Consumo'}
        if not required_columns.issubset(df.columns):
            missing = required_columns - set(df.columns)
            raise ValueError(f"Columnas faltantes: {missing}")

        df = df.rename(columns={"Fecha": "ds", "Consumo": "y"})
        df['ds'] = pd.to_datetime(df['ds'], errors='coerce')
        
        if df['ds'].isnull().any():
            raise ValueError("Formato de fecha inválido en algunos registros")

        # 3. Configuración del modelo
        model = Prophet(
            yearly_seasonality=True,
            weekly_seasonality=False,
            daily_seasonality=False,
            seasonality_mode='multiplicative',
            changepoint_prior_scale=0.1  # Aumentamos sensibilidad
        )
        
        # 4. Entrenamiento
        model.fit(df)
        logger.info("✅ Modelo entrenado exitosamente")

        # 5. Guardado del modelo
        model_path = os.path.join(os.path.dirname(__file__), '../models/prophet_model.pkl')
        joblib.dump(model, model_path)
        logger.info(f"💾 Modelo guardado en: {model_path}")

        # 6. Predicción de muestra (12 meses desde Febrero 2025)
        future = model.make_future_dataframe(periods=12, freq='MS')
        future = future[future['ds'] >= pd.to_datetime('2025-02-01')]  # Solo desde Feb 2025
        forecast = model.predict(future)

        # 7. Guardar gráfico
        fig = model.plot(forecast)
        plot_path = os.path.join(os.path.dirname(__file__), '../data/forecast_plot.png')
        fig.savefig(plot_path)
        logger.info(f"📊 Gráfico guardado en: {plot_path}")

        logger.info("🚀 Entrenamiento y predicción completados")

        return {
            "status": "success",
            "model_path": model_path,
            "plot_path": plot_path,
            "forecast": forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].to_dict(orient='records')
        }

    except Exception as e:
        logger.error(f"❌ Error en el entrenamiento: {str(e)}")
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    train_model()
