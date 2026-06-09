const router = require('express').Router();
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');

// Get budgets with spent amount
router.get('/', auth, async (req, res) => {
  try {
    const month = new Date().toISOString().slice(0,7);
    const budgets = await Budget.find({ user: req.userId, month });
    const start = new Date(month + '-01');
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    const expenses = await Transaction.find({ user: req.userId, type: 'expense', date: { $gte: start, $lte: end } });

    const result = budgets.map(b => {
      const spent = expenses.filter(e => e.category === b.category).reduce((s, e) => s + e.amount, 0);
      return { ...b.toObject(), spent };
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Set/update budget
router.post('/', auth, async (req, res) => {
  try {
    const { category, limit } = req.body;
    const month = new Date().toISOString().slice(0,7);
    const budget = await Budget.findOneAndUpdate(
      { user: req.userId, category, month },
      { limit },
      { upsert: true, new: true }
    );
    res.status(201).json(budget);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete budget
router.delete('/:id', auth, async (req, res) => {
  try {
    await Budget.findOneAndDelete({ _id: req.params.id, user: req.userId });
    res.json({ message: 'Budget remove ho gaya' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
