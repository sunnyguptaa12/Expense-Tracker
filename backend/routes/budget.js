const express = require('express');
const router = express.Router();
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/auth');

router.use(protect);

// @route  GET /api/budget
// @desc   Get budget for a specific month/year
router.get('/', async (req, res) => {
  try {
    const { month, year } = req.query;
    const m = parseInt(month) || new Date().getMonth() + 1;
    const y = parseInt(year) || new Date().getFullYear();

    let budget = await Budget.findOne({ user: req.user._id, month: m, year: y });

    // Get actual spending for that month
    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0, 23, 59, 59);

    const spending = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          type: 'expense',
          date: { $gte: startDate, $lte: endDate },
        },
      },
      { $group: { _id: '$category', spent: { $sum: '$amount' } } },
    ]);

    const spentByCategory = {};
    spending.forEach(({ _id, spent }) => (spentByCategory[_id] = spent));

    res.json({
      success: true,
      budget: budget || { totalBudget: 0, categoryBudgets: [] },
      spentByCategory,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route  POST/PUT /api/budget
// @desc   Set or update budget for a month
router.post('/', async (req, res) => {
  try {
    const { month, year, totalBudget, categoryBudgets } = req.body;
    const m = parseInt(month) || new Date().getMonth() + 1;
    const y = parseInt(year) || new Date().getFullYear();

    const budget = await Budget.findOneAndUpdate(
      { user: req.user._id, month: m, year: y },
      { totalBudget, categoryBudgets },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, budget });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;
