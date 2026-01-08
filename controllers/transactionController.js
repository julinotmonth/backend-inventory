const Transaction = require('../models/Transaction');

// Get all transactions
exports.getAll = (req, res) => {
  try {
    const { product_id, type, limit, offset } = req.query;
    const transactions = Transaction.getAll({
      product_id,
      type,
      limit: parseInt(limit) || 100,
      offset: parseInt(offset) || 0
    });

    res.json({
      success: true,
      data: transactions,
      count: transactions.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get transaction by ID
exports.getById = (req, res) => {
  try {
    const transaction = Transaction.getById(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get transactions by product
exports.getByProduct = (req, res) => {
  try {
    const { limit } = req.query;
    const transactions = Transaction.getByProduct(req.params.productId, {
      limit: parseInt(limit) || 50
    });

    res.json({
      success: true,
      data: transactions,
      count: transactions.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get recent transactions
exports.getRecent = (req, res) => {
  try {
    const { limit } = req.query;
    const transactions = Transaction.getRecent(parseInt(limit) || 10);

    res.json({
      success: true,
      data: transactions,
      count: transactions.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get transactions by date range
exports.getByDateRange = (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'start_date and end_date are required'
      });
    }

    const transactions = Transaction.getByDateRange(start_date, end_date);

    res.json({
      success: true,
      data: transactions,
      count: transactions.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get transaction summary
exports.getSummary = (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'start_date and end_date are required'
      });
    }

    const summary = Transaction.getSummaryByType(start_date, end_date);

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};