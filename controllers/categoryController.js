const Category = require('../models/Category');

// Get all categories
exports.getAll = (req, res) => {
  try {
    const categories = Category.getAll();

    res.json({
      success: true,
      data: categories,
      count: categories.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get category by ID
exports.getById = (req, res) => {
  try {
    const category = Category.getById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Create category
exports.create = (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }

    const category = Category.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update category
exports.update = (req, res) => {
  try {
    const existing = Category.getById(req.params.id);
    
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const category = Category.update(req.params.id, req.body);

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete category
exports.delete = (req, res) => {
  try {
    const existing = Category.getById(req.params.id);
    
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    Category.delete(req.params.id);

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
