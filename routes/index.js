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
// PRODUCT ROUTES
// =============================================
router.get('/products', optionalAuth, productController.getAll);
router.get('/products/stats', optionalAuth, productController.getStats);
router.get('/products/low-stock', optionalAuth, productController.getLowStock);
router.get('/products/out-of-stock', optionalAuth, productController.getOutOfStock);
router.get('/products/barcode/:barcode', optionalAuth, productController.getByBarcode);
router.get('/products/:id', optionalAuth, productController.getById);
router.post('/products', optionalAuth, productController.create);
router.put('/products/:id', optionalAuth, productController.update);
router.delete('/products/:id', optionalAuth, productController.delete);
router.post('/products/:id/stock', optionalAuth, productController.updateStock);

// =============================================
// CATEGORY ROUTES
// =============================================
router.get('/categories', optionalAuth, categoryController.getAll);
router.get('/categories/:id', optionalAuth, categoryController.getById);
router.post('/categories', optionalAuth, categoryController.create);
router.put('/categories/:id', optionalAuth, categoryController.update);
router.delete('/categories/:id', optionalAuth, categoryController.delete);

// =============================================
// SUPPLIER ROUTES
// =============================================
router.get('/suppliers', optionalAuth, supplierController.getAll);
router.get('/suppliers/:id', optionalAuth, supplierController.getById);
router.post('/suppliers', optionalAuth, supplierController.create);
router.put('/suppliers/:id', optionalAuth, supplierController.update);
router.delete('/suppliers/:id', optionalAuth, supplierController.delete);

// =============================================
// TRANSACTION ROUTES
// =============================================
router.get('/transactions', optionalAuth, transactionController.getAll);
router.get('/transactions/recent', optionalAuth, transactionController.getRecent);
router.get('/transactions/summary', optionalAuth, transactionController.getSummary);
router.get('/transactions/date-range', optionalAuth, transactionController.getByDateRange);
router.get('/transactions/product/:productId', optionalAuth, transactionController.getByProduct);
router.get('/transactions/:id', optionalAuth, transactionController.getById);

// =============================================
// RETURN ROUTES
// =============================================
router.get('/returns', optionalAuth, returnController.getAll);
router.get('/returns/recent', optionalAuth, returnController.getRecent);
router.get('/returns/stats', optionalAuth, returnController.getStats);
router.get('/returns/product/:productId', optionalAuth, returnController.getByProduct);
router.get('/returns/:id', optionalAuth, returnController.getById);
router.post('/returns', optionalAuth, returnController.create);
router.put('/returns/:id', optionalAuth, returnController.update);
router.post('/returns/:id/process', optionalAuth, returnController.process);
router.delete('/returns/:id', optionalAuth, returnController.delete);

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