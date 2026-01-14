const Product = require('../models/Product');

// Get all products
exports.getAll = (req, res) => {
  try {
    const { search, category_id, limit, offset } = req.query;
    const user_id = req.user?.id; // Get user_id from authenticated user
    
    const products = Product.getAll({
      search,
      category_id,
      user_id, // Filter by user
      limit: parseInt(limit) || 100,
      offset: parseInt(offset) || 0
    });

    res.json({
      success: true,
      data: products,
      count: products.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get product by ID
exports.getById = (req, res) => {
  try {
    const product = Product.getById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Create product
exports.create = (req, res) => {
  try {
    // Add user_id from authenticated user
    const productData = {
      ...req.body,
      user_id: req.user?.id || null
    };
    
    const product = Product.create(productData);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update product
exports.update = (req, res) => {
  try {
    const existing = Product.getById(req.params.id);
    
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const product = Product.update(req.params.id, req.body);

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete product
exports.delete = (req, res) => {
  try {
    const existing = Product.getById(req.params.id);
    
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    Product.delete(req.params.id);

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update stock
exports.updateStock = (req, res) => {
  try {
    const { id } = req.params;
    const { quantity_change, type, reference_no, notes, unit_price } = req.body;

    if (!quantity_change || !type) {
      return res.status(400).json({
        success: false,
        message: 'quantity_change and type are required'
      });
    }

    const validTypes = ['stock_in', 'stock_out', 'adjustment', 'transfer', 'sale', 'purchase', 'return'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transaction type'
      });
    }

    const result = Product.updateStock(id, parseInt(quantity_change), type, {
      reference_no,
      notes,
      unit_price: parseFloat(unit_price) || null,
      user_id: req.user?.id || null
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Stock updated successfully',
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get low stock products
exports.getLowStock = (req, res) => {
  try {
    const user_id = req.user?.id;
    const products = Product.getLowStock(user_id);

    res.json({
      success: true,
      data: products,
      count: products.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get out of stock products
exports.getOutOfStock = (req, res) => {
  try {
    const user_id = req.user?.id;
    const products = Product.getOutOfStock(user_id);

    res.json({
      success: true,
      data: products,
      count: products.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get inventory statistics
exports.getStats = (req, res) => {
  try {
    const user_id = req.user?.id;
    const stats = Product.getStats(user_id);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Search product by barcode
exports.getByBarcode = (req, res) => {
  try {
    const product = Product.getByBarcode(req.params.barcode);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};