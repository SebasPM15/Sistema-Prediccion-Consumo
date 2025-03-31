# Backend para Gestión de Productos y Predicciones de Stock

Este backend proporciona una API RESTful para gestionar productos, realizar predicciones de stock y gestionar órdenes de compra. Está construido usando **Node.js**, **Express**, **Sequelize** y **PostgreSQL**, y se integra con un modelo de inteligencia artificial en Python para predecir el stock de productos.

## Requisitos

- Node.js v14+ 
- PostgreSQL
- Python 3.x (para el modelo de predicción)
- Paquetes de Python necesarios (ver abajo)

## Instalación

### 1. Clonar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd <nombre_del_directorio>
```

### 2. Instalar las dependencias del backend

Ejecuta el siguiente comando para instalar todas las dependencias necesarias para el servidor:

```bash
npm install
```

### 3. Configuración de variables de entorno

Crea un archivo `.env` en la raíz del proyecto y agrega las siguientes variables de entorno:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=your_database_name
PORT=3500
```

### 4. Configuración del modelo de IA (Python)

1. Asegúrate de tener Python 3.x instalado.
2. Instala las dependencias de Python necesarias. Navega al directorio del modelo de IA (donde está el script `predict.py`) y ejecuta:

```bash
pip install -r requirements.txt
```

> Asegúrate de que `predict.py` esté correctamente configurado para interactuar con el backend.

### 5. Inicializar la base de datos

Si es la primera vez que ejecutas el backend, las tablas de la base de datos se crearán automáticamente al iniciar el servidor, gracias a Sequelize.

### 6. Ejecutar el servidor

Una vez que todo esté configurado, puedes iniciar el servidor usando:

```bash
npm run dev
```

Esto ejecutará el servidor con **nodemon**, por lo que cualquier cambio en el código reiniciará el servidor automáticamente.

### 7. Endpoint de predicción (Python)

El backend se conecta a un modelo de Python para realizar predicciones de stock. Asegúrate de que tu modelo de IA esté funcionando correctamente y que el archivo `predict.py` esté en la ruta correcta.

## Rutas de la API

### **Productos**
- `GET /api/products`: Obtener todos los productos.
- `POST /api/products`: Crear un nuevo producto.
- `GET /api/products/:productId`: Obtener un producto específico por código.
- `PUT /api/products/:productId`: Actualizar un producto específico por código.
- `DELETE /api/products/:productId`: Eliminar un producto específico por código.

### **Predicciones de Stock**
- `GET /api/predictions/:productId`: Obtener las predicciones de stock para un producto, calculadas utilizando el modelo de IA de Python.

### **Órdenes de Compra**
- `GET /api/purchase-orders`: Obtener todas las órdenes de compra.
- `POST /api/purchase-orders`: Crear una nueva orden de compra.

## Estructura del Proyecto

```plaintext
├── src/
│   ├── config/
│   │   └── database.js          # Configuración de la base de datos (Sequelize)
│   ├── controllers/
│   │   ├── productController.js # Controlador para productos
│   │   ├── predictController.js # Controlador para predicciones
│   │   └── purchaseOrderController.js # Controlador para órdenes de compra
│   ├── models/
│   │   ├── Product.js           # Modelo de productos
│   │   ├── PurchaseOrder.js     # Modelo de órdenes de compra
│   │   └── Alert.js             # Modelo de alertas (si se usa)
│   ├── routes/
│   │   ├── productRoutes.js     # Rutas para productos
│   │   ├── predictRoutes.js     # Rutas para predicciones
│   │   └── purchaseOrderRoutes.js # Rutas para órdenes de compra
│   ├── services/
│   │   ├── aiService.js         # Servicio para interactuar con el modelo de IA
│   │   └── alertService.js      # Servicio para manejar alertas
│   └── app.js                   # Archivo principal del servidor
├── .env                         # Variables de entorno
├── package.json                 # Dependencias del proyecto
├── requirements.txt             # Dependencias de Python para el modelo de IA
└── README.md                    # Documentación del proyecto
```

## Contribuciones

1. Forkea el repositorio.
2. Crea una nueva rama (`git checkout -b feature/nueva-funcionalidad`).
3. Realiza los cambios y haz commit (`git commit -m 'Añadir nueva funcionalidad'`).
4. Haz push a la rama (`git push origin feature/nueva-funcionalidad`).
5. Crea un pull request.

## Licencia

Este proyecto está bajo la licencia MIT.
