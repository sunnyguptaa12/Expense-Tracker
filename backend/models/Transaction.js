const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 0 },
  type: { type: String, enum: ['income', 'expense'], required: true },
  category: {
    type: String,
    enum: ['Food','Transport','Shopping','Health','Entertainment','Education','Rent','Utilities','Salary','Business','Investment','Other'],
    default: 'Other'
  },
  date: { type: Date, default: Date.now },
  note: { type: String, trim: true },
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
