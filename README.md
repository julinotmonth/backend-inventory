# Inventory API - Node.js + Express + SQLite

REST API untuk aplikasi Inventory Management dengan SQLite database.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd inventory_api
npm install
```

### 2. Setup Environment
```bash
# Copy environment file
cp .env.example .env

# Edit .env sesuai kebutuhan (opsional)
```

### 3. Run Server
```bash
# Development mode (dengan auto-reload)
npm run dev

# Production mode
npm start
```

Server akan berjalan di `http://localhost:3000`

## 📁 Project Structure

```
inventory_api/
├── config/
│   └── database.js      # SQLite database connection
├── controllers/
│   ├── authController.js
│   ├── categoryController.js
│   ├── productController.js
│   ├── supplierController.js
│   └── transactionController.js
├── database/
│   ├── init.js          # Database initialization script
│   └── inventory.db     # SQLite database file (auto-generated)
├── middleware/
│   └── auth.js          # JWT authentication middleware
├── models/
│   ├── Category.js
│   ├── Product.js
│   ├── Supplier.js
│   ├── Transaction.js
│   └── User.js
├── routes/
│   └── index.js         # API routes
├── .env.example
├── package.json
├── README.md
└── server.js            # Entry point
```

## 🔐 Default Credentials

```
Email: admin@inventory.com
Password: admin123
```

## 📚 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | Login user |
| POST | `/api/v1/auth/register` | Register new user |
| GET | `/api/v1/auth/me` | Get current user |
| PUT | `/api/v1/auth/profile` | Update profile |
| PUT | `/api/v1/auth/password` | Change password |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/products` | Get all products |
| GET | `/api/v1/products/:id` | Get product by ID |
| POST | `/api/v1/products` | Create product |
| PUT | `/api/v1/products/:id` | Update product |
| DELETE | `/api/v1/products/:id` | Delete product |
| POST | `/api/v1/products/:id/stock` | Update stock |
| GET | `/api/v1/products/stats` | Get inventory stats |
| GET | `/api/v1/products/low-stock` | Get low stock products |
| GET | `/api/v1/products/out-of-stock` | Get out of stock products |
| GET | `/api/v1/products/barcode/:barcode` | Find by barcode |

### Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/categories` | Get all categories |
| GET | `/api/v1/categories/:id` | Get category by ID |
| POST | `/api/v1/categories` | Create category |
| PUT | `/api/v1/categories/:id` | Update category |
| DELETE | `/api/v1/categories/:id` | Delete category |

### Suppliers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/suppliers` | Get all suppliers |
| GET | `/api/v1/suppliers/:id` | Get supplier by ID |
| POST | `/api/v1/suppliers` | Create supplier |
| PUT | `/api/v1/suppliers/:id` | Update supplier |
| DELETE | `/api/v1/suppliers/:id` | Delete supplier |

### Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/transactions` | Get all transactions |
| GET | `/api/v1/transactions/:id` | Get transaction by ID |
| GET | `/api/v1/transactions/recent` | Get recent transactions |
| GET | `/api/v1/transactions/product/:productId` | Get by product |
| GET | `/api/v1/transactions/date-range` | Get by date range |
| GET | `/api/v1/transactions/summary` | Get summary |

### Health Check
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/health` | Check API status |

## 📝 Request Examples

### Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@inventory.com", "password": "admin123"}'
```

### Get Products
```bash
curl http://localhost:3000/api/v1/products
```

### Create Product
```bash
curl -X POST http://localhost:3000/api/v1/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "iPhone 15",
    "sku": "IP15-001",
    "category_id": "cat_1",
    "price": 15000000,
    "quantity": 50,
    "min_stock": 10,
    "unit": "unit"
  }'
```

### Update Stock
```bash
curl -X POST http://localhost:3000/api/v1/products/prod_1/stock \
  -H "Content-Type: application/json" \
  -d '{
    "quantity_change": 10,
    "type": "stock_in",
    "notes": "Restocking from supplier"
  }'
```

### Stock Out
```bash
curl -X POST http://localhost:3000/api/v1/products/prod_1/stock \
  -H "Content-Type: application/json" \
  -d '{
    "quantity_change": -5,
    "type": "stock_out",
    "notes": "Sold to customer"
  }'
```

## 🔧 Configuration

### Environment Variables (.env)
```env
PORT=3000
NODE_ENV=development
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=7d
CORS_ORIGIN=*
```

## 🔗 Flutter Integration

Update URL di Flutter app (`lib/services/api_service.dart`):

```dart
ApiService.init(
  baseUrl: 'http://localhost:3000/api/v1',  // atau IP komputer Anda
);
```

Untuk testing di device/emulator Android:
```dart
// Gunakan IP komputer Anda, bukan localhost
ApiService.init(
  baseUrl: 'http://192.168.1.xxx:3000/api/v1',
);
```

## 📦 Dependencies

- **express** - Web framework
- **better-sqlite3** - SQLite database
- **cors** - Cross-origin resource sharing
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication
- **uuid** - Generate unique IDs
- **dotenv** - Environment variables
- **multer** - File upload (optional)

## 📄 License

MIT License
