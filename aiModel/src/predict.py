import json
import sys
import os
import joblib
import numpy as np
from datetime import datetime
from dateutil.relativedelta import relativedelta
import pandas as pd

# Mapeos para traducción de meses
SPANISH_TO_ENGLISH = {
    "ENE": "Jan", "FEB": "Feb", "MAR": "Mar", "ABR": "Apr",
    "MAY": "May", "JUN": "Jun", "JUL": "Jul", "AGO": "Aug",
    "SEP": "Sep", "OCT": "Oct", "NOV": "Nov", "DIC": "Dec"
}

SPANISH_MONTHS = {
    1: "ENE", 2: "FEB", 3: "MAR", 4: "ABR", 5: "MAY", 6: "JUN",
    7: "JUL", 8: "AGO", 9: "SEP", 10: "OCT", 11: "NOV", 12: "DIC"
}

def main():
    try:
        # 1. Leer datos de entrada
        input_data = json.load(sys.stdin) if not sys.stdin.isatty() else {}

        # 2. Extraer y validar parámetros
        codigo = input_data.get('CODIGO', 'DESCONOCIDO')
        stock_actual = float(input_data.get('STOCK_TOTAL', 0))
        unid_caja = float(input_data.get('UNID_CAJA', 1))
        consumos = input_data.get('consumos', {})
        po_dict = input_data.get('purchase_orders', {})

        if unid_caja <= 0:
            raise ValueError("UNID_CAJA debe ser mayor que 0")
        if stock_actual < 0:
            raise ValueError("STOCK_TOTAL no puede ser negativo")

        # 3. Cargar modelo Prophet
        model_path = os.path.join(os.path.dirname(__file__), '../models/prophet_model.pkl')
        model = joblib.load(model_path)

        # 4. Determinar última fecha de consumo
        fechas_usuario = []
        for mes_spanish in consumos.keys():
            try:
                mes_abr = mes_spanish[:3].strip().upper()
                año = mes_spanish[4:].strip()
                
                # Traducir mes y crear fecha
                fecha_str = f"{SPANISH_TO_ENGLISH[mes_abr]} {año}"
                fecha = datetime.strptime(fecha_str, "%b %Y")
                fechas_usuario.append(fecha)
            except (KeyError, ValueError):
                continue

        ultima_fecha = max(fechas_usuario) if fechas_usuario else datetime.today()

        # 5. Generar fechas futuras
        start_date = ultima_fecha + relativedelta(months=1)
        future_dates = [start_date + relativedelta(months=i) for i in range(6)]

        # 6. Obtener predicciones
        future = model.make_future_dataframe(periods=18, freq='MS')
        forecast = model.predict(future)
        forecast = forecast[forecast['ds'].isin(future_dates)].copy()

        # 7. Calcular proyecciones
        resultados = []
        stock_proyectado = stock_actual
        
        for _, row in forecast.iterrows():
            fecha = row['ds']
            consumo = max(row['yhat'], 0)
            
            # Convertir PO a unidades
            mes_po = f"{SPANISH_MONTHS[fecha.month]}-{fecha.year}"
            po_cajas = po_dict.get(mes_po, 0)
            po_unidades = po_cajas * unid_caja  # Conversión clave
            
            # Calcular métricas
            diario = consumo / 22
            ss = diario * 19
            stock_minimo = consumo + ss
            
            # Actualizar stock
            stock_proyectado = max(stock_proyectado - consumo + po_unidades, 0)
            necesita_pedir = max(stock_minimo - stock_proyectado, 0)
            
            resultados.append({
                "mes": f"{SPANISH_MONTHS[fecha.month]}-{fecha.year}",
                "stock_actual_proyectado": round(stock_proyectado, 2),
                "stock_seguridad": round(ss, 2),
                "consumo_previsto": round(consumo, 2),
                "po_recibido": po_cajas,  # Mostrar cajas
                "stock_minimo_requerido": round(stock_minimo, 2),
                "cajas_a_pedir": int(np.ceil(necesita_pedir / unid_caja)),
                "alerta_stock": stock_proyectado < stock_minimo
            })

        # 8. Generar salida
        print(json.dumps({
            "codigo": codigo,
            "parametros_base": {
                "modelo": "Prophet",
                "stock_inicial": stock_actual,
                "unidades_por_caja": unid_caja,
                "horizonte_prediccion": "6 meses",
                "ultima_fecha_usuario": ultima_fecha.strftime("%b-%Y").replace("Dec", "DIC")
            },
            "proyecciones": resultados
        }))

    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()