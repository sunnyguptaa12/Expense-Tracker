const router = require('express').Router();
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');

// Get all transactions
router.get('/', auth, async (req, res) => {
  try {
    const { limit, type, category, month } = req.query;
    const query = { user: req.userId };
    if (type) query.type = type;
    if (category) query.category = category;
    if (month) {
      const start = new Date(month + '-01');
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
      query.date = { $gte: start, $lte: end };
    }
    const transactions = await Transaction.find(query)
      .sort({ date: -1, createdAt: -1 })
      .limit(limit ? parseInt(limit) : 100);
    res.json({ transactions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Summary
router.get('/summary', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const allTx = await Transaction.find({ user: userId });
    const totalIncome = allTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpense = allTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const balance = totalIncome - totalExpense;

    // Monthly data for chart (last 6 months)
    const monthlyMap = {};
    allTx.forEach(t => {
      const key = new Date(t.date).toLocaleString('default', { month: 'short' });
      if (!monthlyMap[key]) monthlyMap[key] = { month: key, income: 0, expense: 0 };
      monthlyMap[key][t.type] += t.amount;
    });

    res.json({ totalIncome, totalExpense, balance, monthlyData: Object.values(monthlyMap).slice(-6) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Analytics
router.get('/analytics', auth, async (req, res) => {
  try {
    const expenses = await Transaction.find({ user: req.userId, type: 'expense' });
    const income = await Transaction.find({ user: req.userId, type: 'income' });
    const catMap = {};
    expenses.forEach(t => { catMap[t.category] = (catMap[t.category] || 0) + t.amount; });
    const categoryData = Object.entries(catMap).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
    const totalIncome = income.reduce((s,t) => s + t.amount, 0);
    const totalExpense = expenses.reduce((s,t) => s + t.amount, 0);
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;
    res.json({ categoryData, savingsRate });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add transaction
router.post('/', auth, async (req, res) => {
  try {
    const { description, amount, type, category, date, note } = req.body;
    if (!description || !amount || !type) return res.status(400).json({ message: 'Required fields missing' });
    const tx = await Transaction.create({ user: req.userId, description, amount, type, category, date, note });
    res.status(201).json(tx);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete transaction
router.delete('/:id', auth, async (req, res) => {
  try {
    const tx = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!tx) return res.status(404).json({ message: 'Transaction nahi mili' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
