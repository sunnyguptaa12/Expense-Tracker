import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Plus, Trash2, AlertTriangle, CheckCircle, FileText } from 'lucide-react';
import { format } from 'date-fns';
import styles from './Budget.module.css';

const CATEGORIES = ['Food','Transport','Shopping','Health','Entertainment','Education','Rent','Utilities','Other'];
const EMOJI = { Food:'🍽️', Transport:'🚗', Shopping:'🛍️', Health:'💊', Entertainment:'🎬', Education:'📚', Rent:'🏠', Utilities:'💡', Other:'📦' };

const DEMO_BUDGETS = [
  { _id:'1', category:'Food', limit:8000, spent:6400 },
  { _id:'2', category:'Transport', limit:3000, spent:2100 },
  { _id:'3', category:'Entertainment', limit:2000, spent:1849 },
  { _id:'4', category:'Rent', limit:10000, spent:8000 },
  { _id:'5', category:'Health', limit:2000, spent:1200 },
];

export default function Budget() {
  const [budgets, setBudgets] = useState(DEMO_BUDGETS);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: 'Food', limit: '' });
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    axios.get('/api/budgets').then(res => { if (res.data?.length) setBudgets(res.data); }).catch(() => {});
  }, []);

  const handleSave = async e => {
    e.preventDefault();
    if (!form.limit || Number(form.limit) <= 0) return toast.error('Please enter a valid budget limit');
    setLoading(true);
    try {
      const res = await axios.post('/api/budgets', { category: form.category, limit: Number(form.limit) });
      setBudgets(prev => {
        const exists = prev.find(b => b.category === form.category);
        if (exists) return prev.map(b => b.category === form.category ? { ...b, limit: Number(form.limit) } : b);
        return [...prev, res.data];
      });
      toast.success('Budget saved successfully!');
      setShowForm(false);
      setForm({ category: 'Food', limit: '' });
    } catch {
      const newBudget = { _id: Date.now().toString(), category: form.category, limit: Number(form.limit), spent: 0 };
      setBudgets(prev => {
        const exists = prev.find(b => b.category === form.category);
        if (exists) return prev.map(b => b.category === form.category ? { ...b, limit: Number(form.limit) } : b);
        return [...prev, newBudget];
      });
      toast.success('Budget saved!');
      setShowForm(false);
      setForm({ category: 'Food', limit: '' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = id => {
    setBudgets(prev => prev.filter(b => b._id !== id));
    axios.delete(`/api/budgets/${id}`).catch(() => {});
    toast.success('Budget removed');
  };

  const exportBudgetPDF = async () => {
    setExporting(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header
      doc.setFillColor(13, 13, 15);
      doc.rect(0, 0, pageWidth, 40, 'F');
      doc.setTextColor(200, 245, 90);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('SpendWise', 14, 18);
      doc.setTextColor(240, 237, 232);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('Budget Report', 14, 28);
      doc.setTextColor(154, 150, 144);
      doc.setFontSize(9);
      doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy')}`, pageWidth - 14, 22, { align: 'right' });

      // Overview
      const totalBudget = budgets.reduce((s, b) => s + b.limit, 0);
      const totalSpent = budgets.reduce((s, b) => s + (b.spent || 0), 0);
      const overCount = budgets.filter(b => (b.spent || 0) > b.limit).length;

      const boxes = [
        { label: 'Total Budget', value: `Rs. ${totalBudget.toLocaleString('en-IN')}`, color: [200, 245, 90] },
        { label: 'Total Spent', value: `Rs. ${totalSpent.toLocaleString('en-IN')}`, color: totalSpent > totalBudget ? [255, 92, 92] : [240, 237, 232] },
        { label: 'Remaining', value: `Rs. ${Math.max(0, totalBudget - totalSpent).toLocaleString('en-IN')}`, color: [74, 222, 128] },
        { label: 'Over Budget', value: `${overCount} categories`, color: overCount > 0 ? [255, 92, 92] : [74, 222, 128] },
      ];
      const boxW = (pageWidth - 28 - 12) / 4;
      boxes.forEach((b, i) => {
        const x = 14 + i * (boxW + 4);
        doc.setFillColor(28, 28, 32);
        doc.roundedRect(x, 46, boxW, 22, 2, 2, 'F');
        doc.setTextColor(...b.color);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(b.value, x + boxW / 2, 55, { align: 'center' });
        doc.setTextColor(154, 150, 144);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text(b.label, x + boxW / 2, 62, { align: 'center' });
      });

      // Budget table
      autoTable(doc, {
        startY: 76,
        head: [['Category', 'Budget Limit', 'Amount Spent', 'Remaining', 'Usage %', 'Status']],
        body: budgets.map(b => {
          const pct = Math.round(((b.spent || 0) / b.limit) * 100);
          const remaining = b.limit - (b.spent || 0);
          const status = pct >= 100 ? 'Over Budget' : pct >= 80 ? 'Near Limit' : 'On Track';
          return [
            b.category,
            `Rs. ${b.limit.toLocaleString('en-IN')}`,
            `Rs. ${(b.spent || 0).toLocaleString('en-IN')}`,
            `Rs. ${Math.max(0, remaining).toLocaleString('en-IN')}`,
            `${pct}%`,
            status
          ];
        }),
        styles: { fontSize: 9, textColor: [240, 237, 232], fillColor: [20, 20, 22], lineColor: [36, 36, 40], lineWidth: 0.3, cellPadding: 5 },
        headStyles: { fillColor: [36, 36, 40], textColor: [154, 150, 144], fontStyle: 'bold', fontSize: 8 },
        alternateRowStyles: { fillColor: [28, 28, 32] },
        columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'center', fontStyle: 'bold' }, 5: { halign: 'center', fontStyle: 'bold' } },
        didParseCell: data => {
          if (data.column.index === 5 && data.section === 'body') {
            const val = data.cell.raw;
            data.cell.styles.textColor = val === 'Over Budget' ? [255, 92, 92] : val === 'Near Limit' ? [251, 191, 36] : [74, 222, 128];
          }
        },
        margin: { left: 14, right: 14 },
      });

      // Footer
      doc.setFillColor(13, 13, 15);
      doc.rect(0, doc.internal.pageSize.getHeight() - 12, pageWidth, 12, 'F');
      doc.setTextColor(90, 87, 82);
      doc.setFontSize(8);
      doc.text('SpendWise — Expense Tracker', 14, doc.internal.pageSize.getHeight() - 4);
      doc.text('Page 1 of 1', pageWidth - 14, doc.internal.pageSize.getHeight() - 4, { align: 'right' });

      doc.save(`SpendWise_Budget_${format(new Date(), 'dd-MM-yyyy')}.pdf`);
      toast.success('Budget PDF exported!');
    } catch {
      toast.error('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const totalBudget = budgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent = budgets.reduce((s, b) => s + (b.spent || 0), 0);
  const overBudget = budgets.filter(b => (b.spent || 0) > b.limit).length;

  return (
    <div className={styles.page}>
      <div className={styles.topRow}>
        <div>
          <h1>Budget Manager</h1>
          <p className={styles.sub}>Set and track your monthly spending limits</p>
        </div>
        <div className={styles.actions}>
          <button className={styles.exportBtn} onClick={exportBudgetPDF} disabled={exporting || budgets.length === 0}>
            <FileText size={16} />
            {exporting ? 'Exporting...' : 'Export PDF'}
          </button>
          <button className={styles.addBtn} onClick={() => setShowForm(!showForm)}>
            <Plus size={18} /> Set Budget
          </button>
        </div>
      </div>

      <div className={styles.overview}>
        <div className={styles.ovCard}>
          <p className={styles.ovLabel}>Total Budget</p>
          <p className={styles.ovVal}>₹{totalBudget.toLocaleString('en-IN')}</p>
        </div>
        <div className={styles.ovCard}>
          <p className={styles.ovLabel}>Total Spent</p>
          <p className={styles.ovVal} style={{ color: totalSpent > totalBudget ? 'var(--red)' : 'var(--text)' }}>
            ₹{totalSpent.toLocaleString('en-IN')}
          </p>
        </div>
        <div className={styles.ovCard}>
          <p className={styles.ovLabel}>Remaining</p>
          <p className={styles.ovVal} style={{ color: 'var(--green)' }}>
            ₹{Math.max(0, totalBudget - totalSpent).toLocaleString('en-IN')}
          </p>
        </div>
        <div className={styles.ovCard}>
          <p className={styles.ovLabel}>Over Budget</p>
          <p className={styles.ovVal} style={{ color: overBudget > 0 ? 'var(--red)' : 'var(--green)' }}>
            {overBudget} {overBudget === 1 ? 'category' : 'categories'}
          </p>
        </div>
      </div>

      {showForm && (
        <div className={styles.formCard}>
          <h3>New Budget Limit</h3>
          <form onSubmit={handleSave} className={styles.formRow}>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <input type="number" placeholder="Monthly limit (₹)" value={form.limit} onChange={e => setForm({ ...form, limit: e.target.value })} min="1" required />
            <button type="submit" className={styles.saveBtn} disabled={loading}>{loading ? 'Saving...' : 'Save Budget'}</button>
            <button type="button" className={styles.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
          </form>
        </div>
      )}

      <div className={styles.budgetList}>
        {budgets.map(b => {
          const pct = Math.min(100, Math.round(((b.spent || 0) / b.limit) * 100));
          const over = (b.spent || 0) > b.limit;
          const warn = pct >= 80 && !over;
          return (
            <div key={b._id} className={`${styles.budgetCard} ${over ? styles.overCard : ''}`}>
              <div className={styles.cardTop}>
                <div className={styles.catInfo}>
                  <span className={styles.catEmoji}>{EMOJI[b.category] || '📦'}</span>
                  <div>
                    <p className={styles.catName}>{b.category}</p>
                    <p className={styles.catSub}>₹{(b.spent || 0).toLocaleString('en-IN')} spent of ₹{b.limit.toLocaleString('en-IN')} limit</p>
                  </div>
                </div>
                <div className={styles.cardRight}>
                  {over ? <AlertTriangle size={18} color="var(--red)" /> : warn ? <AlertTriangle size={18} color="var(--amber)" /> : <CheckCircle size={18} color="var(--green)" />}
                  <span className={styles.pctLabel} style={{ color: over ? 'var(--red)' : warn ? 'var(--amber)' : 'var(--green)' }}>{pct}%</span>
                  <button className={styles.delBtn} onClick={() => handleDelete(b._id)} title="Remove budget"><Trash2 size={15} /></button>
                </div>
              </div>
              <div className={styles.track}>
                <div className={styles.fill} style={{ width: `${pct}%`, background: over ? 'var(--red)' : warn ? 'var(--amber)' : 'var(--accent)' }} />
              </div>
              {over && <p className={styles.overMsg}>⚠️ Over budget by ₹{((b.spent||0) - b.limit).toLocaleString('en-IN')}!</p>}
              {warn && <p className={styles.warnMsg}>⚡ {100 - pct}% of budget remaining — almost at limit</p>}
            </div>
          );
        })}
        {budgets.length === 0 && <p className={styles.empty}>No budgets set yet. Click "Set Budget" to get started!</p>}
      </div>
    </div>
  );
}
