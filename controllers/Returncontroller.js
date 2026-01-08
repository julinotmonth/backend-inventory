const Return = require('../models/Return');

// Get all returns
exports.getAll = (req, res) => {
  try {
    const { type, status, product_id, limit, offset } = req.query;
    const returns = Return.getAll({
      type,
      status,
      product_id,
      limit: parseInt(limit) || 100,
      offset: parseInt(offset) || 0
    });

    res.json({
      success: true,
      data: returns,
      count: returns.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get return by ID
exports.getById = (req, res) => {
  try {
    const returnData = Return.getById(req.params.id);
    
    if (!returnData) {
      return res.status(404).json({
        success: false,
        message: 'Return not found'
      });
    }

    res.json({
      success: true,
      data: returnData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Create return
exports.create = (req, res) => {
  try {
    const {
      product_id,
      type,
      quantity,
      reason,
      customer_name,
      customer_contact,
      supplier_id,
      original_transaction_id,
      refund_amount,
      notes
    } = req.body;

    if (!product_id) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Valid quantity is required'
      });
    }

    if (!type || !['return_in', 'return_out'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type must be return_in (from customer) or return_out (to supplier)'
      });
    }

    const returnData = Return.create({
      product_id,
      type,
      quantity,
      reason,
      customer_name,
      customer_contact,
      supplier_id,
      original_transaction_id,
      refund_amount,
      notes,
      processed_by: req.user?.id
    });

    res.status(201).json({
      success: true,
      message: 'Return created successfully',
      data: returnData
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Update return
exports.update = (req, res) => {
  try {
    const existingReturn = Return.getById(req.params.id);
    
    if (!existingReturn) {
      return res.status(404).json({
        success: false,
        message: 'Return not found'
      });
    }

    if (existingReturn.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update completed return'
      });
    }

    const returnData = Return.update(req.params.id, req.body);

    res.json({
      success: true,
      message: 'Return updated successfully',
      data: returnData
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Process return (approve/reject)
exports.process = (req, res) => {
  try {
    const { status, notes } = req.body;

    if (!status || !['approved', 'rejected', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be approved, rejected, or completed'
      });
    }

    // Get existing return to check current status
    const existingReturn = Return.getById(req.params.id);
    if (!existingReturn) {
      return res.status(404).json({
        success: false,
        message: 'Return not found'
      });
    }

    // Get processed_by, default to null if not available
    const processedBy = req.user?.id || null;

    // If trying to complete, must be approved first (or auto-approve)
    if (status === 'completed' && existingReturn.status === 'pending') {
      // Auto-approve first then complete
      Return.process(req.params.id, {
        status: 'approved',
        processed_by: processedBy,
        notes: 'Auto-approved'
      });
    }

    const returnData = Return.process(req.params.id, {
      status,
      processed_by: processedBy,
      notes: notes || null
    });

    res.json({
      success: true,
      message: `Return ${status} successfully`,
      data: returnData
    });
  } catch (error) {
    console.error('Process return error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete return
exports.delete = (req, res) => {
  try {
    Return.delete(req.params.id);

    res.json({
      success: true,
      message: 'Return deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get returns by product
exports.getByProduct = (req, res) => {
  try {
    const { limit } = req.query;
    const returns = Return.getByProduct(req.params.productId, {
      limit: parseInt(limit) || 50
    });

    res.json({
      success: true,
      data: returns,
      count: returns.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get recent returns
exports.getRecent = (req, res) => {
  try {
    const { limit } = req.query;
    const returns = Return.getRecent(parseInt(limit) || 10);

    res.json({
      success: true,
      data: returns,
      count: returns.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get return statistics
exports.getStats = (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const stats = Return.getStats(start_date, end_date);

    // Calculate summary
    const summary = {
      total_returns: 0,
      total_return_in: 0,
      total_return_out: 0,
      pending_count: 0,
      approved_count: 0,
      completed_count: 0,
      rejected_count: 0,
      total_refund_amount: 0
    };

    stats.forEach(stat => {
      summary.total_returns += stat.count;
      if (stat.type === 'return_in') {
        summary.total_return_in += stat.count;
      } else {
        summary.total_return_out += stat.count;
      }
      
      if (stat.status === 'pending') summary.pending_count += stat.count;
      if (stat.status === 'approved') summary.approved_count += stat.count;
      if (stat.status === 'completed') summary.completed_count += stat.count;
      if (stat.status === 'rejected') summary.rejected_count += stat.count;
      
      summary.total_refund_amount += stat.total_refund || 0;
    });

    res.json({
      success: true,
      data: {
        details: stats,
        summary
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};