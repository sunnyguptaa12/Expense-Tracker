import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';
import styles from './AddTransactionModal.module.css';

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Health', 'Entertainment', 'Education', 'Rent', 'Utilities', 'Salary', 'Business', 'Investment', 'Other'];

export default function AddTransactionModal({ onClose, onAdd }) {
  const [type, setType] = useState('expense');
  const [form, setForm] = useState({ description: '', amount: '', category: 'Food', date: new Date().toISOString().split('T')[0], note: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) return toast.error('Please enter a valid amount');
    setLoading(true);
    try {
      await axios.post('/api/transactions', { ...form, type, amount: Number(form.amount) });
      toast.success('Transaction added successfully!');
      onAdd();
      onClose();
    } catch {
      toast.error('Could not save transaction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3>New Transaction</h3>
          <button className={styles.closeBtn} onClick={onClose}><X size={20} /></button>
        </div>

        <div className={styles.typeTabs}>
          <button className={`${styles.typeBtn} ${type === 'expense' ? styles.expActive : ''}`} onClick={() => setType('expense')}>Expense</button>
          <button className={`${styles.typeBtn} ${type === 'income' ? styles.incActive : ''}`} onClick={() => setType('income')}>Income</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label>Description</label>
            <input name="description" placeholder="e.g. Grocery, Monthly Salary..." value={form.description} onChange={handleChange} required />
          </div>
          <div className={styles.row}>
            <div className={styles.field}>
              <label>Amount (₹)</label>
              <input name="amount" type="number" placeholder="0" min="1" value={form.amount} onChange={handleChange} required />
            </div>
            <div className={styles.field}>
              <label>Date</label>
              <input name="date" type="date" value={form.date} onChange={handleChange} required />
            </div>
          </div>
          <div className={styles.field}>
            <label>Category</label>
            <select name="category" value={form.category} onChange={handleChange}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className={styles.field}>
            <label>Note <span style={{ color: 'var(--text3)', fontWeight: 400 }}>(optional)</span></label>
            <input name="note" placeholder="Add a note..." value={form.note} onChange={handleChange} />
          </div>
          <button type="submit" className={`${styles.saveBtn} ${type === 'income' ? styles.incSave : ''}`} disabled={loading}>
            {loading ? 'Saving...' : `Add ${type === 'income' ? 'Income' : 'Expense'}`}
          </button>
        </form>
      </div>
    </div>
  );
}
