const express = require('express');
const router = express.Router();

// Controllers
const productController = require('../controllers/productController');
const categoryController = require('../controllers/categoryController');
const supplierController = require('../controllers/supplierController');
const transactionController = require('../controllers/transactionController');
const authController = require('../controllers/authController');
const returnController = require('../controllers/Returncontroller');

// Middleware
const { auth, optionalAuth, requireRole } = require('../middleware/auth');

// =============================================
// AUTH ROUTES
// =============================================
router.post('/auth/login', authController.login);
router.post('/auth/register', authController.register);
router.get('/auth/me', auth, authController.me);
router.put('/auth/profile', auth, authController.updateProfile);
router.put('/auth/password', auth, authController.changePassword);

// =============================================
// PRODUCT ROUTES (Require Authentication)
// =============================================
router.get('/products', auth, productController.getAll);
router.get('/products/stats', auth, productController.getStats);
router.get('/products/low-stock', auth, productController.getLowStock);
router.get('/products/out-of-stock', auth, productController.getOutOfStock);
router.get('/products/barcode/:barcode', auth, productController.getByBarcode);
router.get('/products/:id', auth, productController.getById);
router.post('/products', auth, productController.create);
router.put('/products/:id', auth, productController.update);
router.delete('/products/:id', auth, productController.delete);
router.post('/products/:id/stock', auth, productController.updateStock);

// =============================================
// CATEGORY ROUTES (Require Authentication)
// =============================================
router.get('/categories', auth, categoryController.getAll);
router.get('/categories/:id', auth, categoryController.getById);
router.post('/categories', auth, categoryController.create);
router.put('/categories/:id', auth, categoryController.update);
router.delete('/categories/:id', auth, categoryController.delete);

// =============================================
// SUPPLIER ROUTES (Require Authentication)
// =============================================
router.get('/suppliers', auth, supplierController.getAll);
router.get('/suppliers/:id', auth, supplierController.getById);
router.post('/suppliers', auth, supplierController.create);
router.put('/suppliers/:id', auth, supplierController.update);
router.delete('/suppliers/:id', auth, supplierController.delete);

// =============================================
// TRANSACTION ROUTES (Require Authentication)
// =============================================
router.get('/transactions', auth, transactionController.getAll);
router.get('/transactions/recent', auth, transactionController.getRecent);
router.get('/transactions/summary', auth, transactionController.getSummary);
router.get('/transactions/date-range', auth, transactionController.getByDateRange);
router.get('/transactions/product/:productId', auth, transactionController.getByProduct);
router.get('/transactions/:id', auth, transactionController.getById);

// =============================================
// RETURN ROUTES (Require Authentication)
// =============================================
router.get('/returns', auth, returnController.getAll);
router.get('/returns/recent', auth, returnController.getRecent);
router.get('/returns/stats', auth, returnController.getStats);
router.get('/returns/product/:productId', auth, returnController.getByProduct);
router.get('/returns/:id', auth, returnController.getById);
router.post('/returns', auth, returnController.create);
router.put('/returns/:id', auth, returnController.update);
router.post('/returns/:id/process', auth, returnController.process);
router.delete('/returns/:id', auth, returnController.delete);

// =============================================
// HEALTH CHECK
// =============================================
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;