import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingUp, TrendingDown, Wallet, Plus, ArrowUpRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AddTransactionModal from '../components/AddTransactionModal';
import styles from './Dashboard.module.css';

const CATEGORY_EMOJI = {
  Food: '🍽️', Transport: '🚗', Shopping: '🛍️', Salary: '💼',
  Health: '💊', Entertainment: '🎬', Education: '📚', Other: '📦',
  Rent: '🏠', Investment: '📈', Business: '💹', Utilities: '💡'
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px' }}>
        <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6 }}>{label}</p>
        {payload.map(p => (
          <p key={p.name} style={{ fontSize: 13, color: p.color, fontWeight: 500 }}>
            {p.name}: ₹{Number(p.value).toLocaleString('en-IN')}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, balance: 0 });
  const [recent, setRecent] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [sumRes, txRes] = await Promise.all([
        axios.get('/api/transactions/summary'),
        axios.get('/api/transactions?limit=5')
      ]);
      setSummary(sumRes.data);
      setRecent(txRes.data.transactions || []);
      setChartData(sumRes.data.monthlyData || []);
    } catch {
      setSummary({ totalIncome: 57000, totalExpense: 18650, balance: 38350 });
      setRecent([
        { _id: '1', description: 'Monthly Salary', amount: 45000, type: 'income', category: 'Salary', date: new Date().toISOString() },
        { _id: '2', description: 'Grocery Shopping', amount: 3200, type: 'expense', category: 'Food', date: new Date().toISOString() },
        { _id: '3', description: 'Netflix', amount: 649, type: 'expense', category: 'Entertainment', date: new Date().toISOString() },
        { _id: '4', description: 'Freelance Project', amount: 12000, type: 'income', category: 'Business', date: new Date().toISOString() },
        { _id: '5', description: 'Medicine', amount: 850, type: 'expense', category: 'Health', date: new Date().toISOString() },
      ]);
      setChartData([
        { month: 'Jan', income: 45000, expense: 18000 },
        { month: 'Feb', income: 47000, expense: 21000 },
        { month: 'Mar', income: 45000, expense: 16000 },
        { month: 'Apr', income: 52000, expense: 19500 },
        { month: 'May', income: 48000, expense: 22000 },
        { month: 'Jun', income: 57000, expense: 18650 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const metrics = [
    { label: 'Total Income', value: summary.totalIncome, icon: TrendingUp, color: 'var(--green)', bg: 'var(--green-soft)' },
    { label: 'Total Expenses', value: summary.totalExpense, icon: TrendingDown, color: 'var(--red)', bg: 'var(--red-soft)' },
    { label: 'Net Balance', value: summary.balance, icon: Wallet, color: summary.balance >= 0 ? 'var(--green)' : 'var(--red)', bg: summary.balance >= 0 ? 'var(--green-soft)' : 'var(--red-soft)' },
  ];

  if (loading) return <div className={styles.loader}>Loading dashboard...</div>;

  return (
    <div className={styles.page}>
      <div className={styles.topRow}>
        <div>
          <h1 className={styles.greeting}>Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {user?.name?.split(' ')[0] || 'there'} 👋</h1>
          <p className={styles.date}>{format(new Date(), 'EEEE, d MMMM yyyy')}</p>
        </div>
        <button className={styles.addBtn} onClick={() => setShowModal(true)}>
          <Plus size={18} /> Add Transaction
        </button>
      </div>

      <div className={styles.metrics}>
        {metrics.map(m => (
          <div key={m.label} className={`${styles.metricCard} fade-up`}>
            <div className={styles.metricIcon} style={{ background: m.bg }}>
              <m.icon size={20} color={m.color} />
            </div>
            <div>
              <p className={styles.metricLabel}>{m.label}</p>
              <p className={styles.metricValue} style={{ color: m.color }}>
                ₹{Math.abs(m.value).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <h3>Income vs Expenses</h3>
          <p style={{ fontSize: 13, color: 'var(--text2)' }}>Last 6 months</p>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4ade80" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ff5c5c" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#ff5c5c" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="month" tick={{ fill: '#9a9690', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#9a9690', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v/1000}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="income" name="Income" stroke="#4ade80" strokeWidth={2} fill="url(#incomeGrad)" />
            <Area type="monotone" dataKey="expense" name="Expenses" stroke="#ff5c5c" strokeWidth={2} fill="url(#expGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className={styles.recentCard}>
        <div className={styles.recentHeader}>
          <h3>Recent Transactions</h3>
          <Link to="/transactions" className={styles.viewAll}>
            View all <ArrowUpRight size={14} />
          </Link>
        </div>
        <div className={styles.txList}>
          {recent.map(tx => (
            <div key={tx._id} className={styles.txItem}>
              <div className={styles.txEmoji}>{CATEGORY_EMOJI[tx.category] || '📦'}</div>
              <div className={styles.txInfo}>
                <p className={styles.txName}>{tx.description}</p>
                <p className={styles.txMeta}>{tx.category} · {format(new Date(tx.date), 'dd MMM')}</p>
              </div>
              <p className={styles.txAmount} style={{ color: tx.type === 'income' ? 'var(--green)' : 'var(--red)' }}>
                {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
              </p>
            </div>
          ))}
        </div>
      </div>

      {showModal && <AddTransactionModal onClose={() => setShowModal(false)} onAdd={fetchData} />}
    </div>
  );
}
