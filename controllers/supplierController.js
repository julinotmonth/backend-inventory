const Supplier = require('../models/Supplier');

// Get all suppliers
exports.getAll = (req, res) => {
  try {
    const suppliers = Supplier.getAll();

    res.json({
      success: true,
      data: suppliers,
      count: suppliers.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get supplier by ID
exports.getById = (req, res) => {
  try {
    const supplier = Supplier.getById(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    res.json({
      success: true,
      data: supplier
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Create supplier
exports.create = (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Supplier name is required'
      });
    }

    const supplier = Supplier.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Supplier created successfully',
      data: supplier
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update supplier
exports.update = (req, res) => {
  try {
    const existing = Supplier.getById(req.params.id);
    
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    const supplier = Supplier.update(req.params.id, req.body);

    res.json({
      success: true,
      message: 'Supplier updated successfully',
      data: supplier
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete supplier
exports.delete = (req, res) => {
  try {
    const existing = Supplier.getById(req.params.id);
    
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    Supplier.delete(req.params.id);

    res.json({
      success: true,
      message: 'Supplier deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
