const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: {
    type: String,
    enum: ['Food','Transport','Shopping','Health','Entertainment','Education','Rent','Utilities','Salary','Business','Investment','Other'],
    required: true
  },
  limit: { type: Number, required: true, min: 1 },
  month: { type: String, default: () => new Date().toISOString().slice(0,7) },
}, { timestamps: true });

budgetSchema.index({ user: 1, category: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema);
