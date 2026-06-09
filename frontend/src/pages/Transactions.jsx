import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { Plus, Search, Trash2, Download, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import AddTransactionModal from '../components/AddTransactionModal';
import styles from './Transactions.module.css';

const CATEGORY_EMOJI = { Food:'🍽️', Transport:'🚗', Shopping:'🛍️', Salary:'💼', Health:'💊', Entertainment:'🎬', Education:'📚', Other:'📦', Rent:'🏠', Investment:'📈', Business:'💹', Utilities:'💡' };
const DEMO_DATA = [
  { _id:'1', description:'Monthly Salary', amount:45000, type:'income', category:'Salary', date:new Date().toISOString(), note:'' },
  { _id:'2', description:'Grocery Shopping', amount:3200, type:'expense', category:'Food', date:new Date().toISOString(), note:'Big Bazaar' },
  { _id:'3', description:'Netflix Subscription', amount:649, type:'expense', category:'Entertainment', date:new Date().toISOString(), note:'' },
  { _id:'4', description:'Freelance Project', amount:12000, type:'income', category:'Business', date:new Date().toISOString(), note:'Website work' },
  { _id:'5', description:'Auto Rickshaw', amount:320, type:'expense', category:'Transport', date:new Date().toISOString(), note:'' },
  { _id:'6', description:'Medicine', amount:850, type:'expense', category:'Health', date:new Date().toISOString(), note:'' },
  { _id:'7', description:'Monthly Rent', amount:8000, type:'expense', category:'Rent', date:new Date().toISOString(), note:'Monthly rent' },
  { _id:'8', description:'Online Course', amount:2999, type:'expense', category:'Education', date:new Date().toISOString(), note:'React course' },
];

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCat, setFilterCat] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const fetchTransactions = async () => {
    try {
      const res = await axios.get('/api/transactions');
      setTransactions(res.data.transactions || []);
    } catch {
      setTransactions(DEMO_DATA);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTransactions(); }, []);

  const handleDelete = async id => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    try {
      await axios.delete(`/api/transactions/${id}`);
    } catch {}
    setTransactions(prev => prev.filter(t => t._id !== id));
    toast.success('Transaction deleted successfully');
  };

  const exportPDF = async () => {
    setExporting(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header background
      doc.setFillColor(13, 13, 15);
      doc.rect(0, 0, pageWidth, 40, 'F');

      // Title
      doc.setTextColor(200, 245, 90);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('SpendWise', 14, 18);

      doc.setTextColor(240, 237, 232);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('Transaction Report', 14, 28);

      // Report info
      doc.setTextColor(154, 150, 144);
      doc.setFontSize(9);
      doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy, hh:mm a')}`, pageWidth - 14, 18, { align: 'right' });
      doc.text(`Total Records: ${filtered.length}`, pageWidth - 14, 26, { align: 'right' });

      // Summary boxes
      const totalInc = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const totalExp = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const balance = totalInc - totalExp;

      const boxes = [
        { label: 'Total Income', value: `Rs. ${totalInc.toLocaleString('en-IN')}`, color: [74, 222, 128] },
        { label: 'Total Expenses', value: `Rs. ${totalExp.toLocaleString('en-IN')}`, color: [255, 92, 92] },
        { label: 'Net Balance', value: `Rs. ${Math.abs(balance).toLocaleString('en-IN')}`, color: balance >= 0 ? [74, 222, 128] : [255, 92, 92] },
      ];

      const boxW = (pageWidth - 28 - 16) / 3;
      boxes.forEach((b, i) => {
        const x = 14 + i * (boxW + 8);
        doc.setFillColor(28, 28, 32);
        doc.roundedRect(x, 46, boxW, 22, 3, 3, 'F');
        doc.setTextColor(...b.color);
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text(b.value, x + boxW / 2, 56, { align: 'center' });
        doc.setTextColor(154, 150, 144);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(b.label, x + boxW / 2, 63, { align: 'center' });
      });

      // Table
      autoTable(doc, {
        startY: 76,
        head: [['#', 'Description', 'Category', 'Type', 'Date', 'Amount']],
        body: filtered.map((tx, i) => [
          i + 1,
          tx.description,
          tx.category,
          tx.type.charAt(0).toUpperCase() + tx.type.slice(1),
          format(new Date(tx.date), 'dd MMM yyyy'),
          `${tx.type === 'income' ? '+' : '-'} Rs. ${tx.amount.toLocaleString('en-IN')}`
        ]),
        styles: {
          font: 'helvetica',
          fontSize: 9,
          cellPadding: 5,
          textColor: [240, 237, 232],
          fillColor: [20, 20, 22],
          lineColor: [36, 36, 40],
          lineWidth: 0.3,
        },
        headStyles: {
          fillColor: [36, 36, 40],
          textColor: [154, 150, 144],
          fontStyle: 'bold',
          fontSize: 8,
        },
        alternateRowStyles: { fillColor: [28, 28, 32] },
        columnStyles: {
          0: { cellWidth: 10 },
          3: {
            fontStyle: 'bold',
          },
          5: {
            fontStyle: 'bold',
            halign: 'right',
          }
        },
        didParseCell: (data) => {
          if (data.column.index === 5 && data.section === 'body') {
            const isIncome = data.row.raw[3] === 'Income';
            data.cell.styles.textColor = isIncome ? [74, 222, 128] : [255, 92, 92];
          }
        },
        margin: { left: 14, right: 14 },
      });

      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFillColor(13, 13, 15);
        doc.rect(0, doc.internal.pageSize.getHeight() - 12, pageWidth, 12, 'F');
        doc.setTextColor(90, 87, 82);
        doc.setFontSize(8);
        doc.text(`SpendWise — Expense Tracker`, 14, doc.internal.pageSize.getHeight() - 4);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, doc.internal.pageSize.getHeight() - 4, { align: 'right' });
      }

      doc.save(`SpendWise_Transactions_${format(new Date(), 'dd-MM-yyyy')}.pdf`);
      toast.success('PDF exported successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to export PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const cats = ['all', ...new Set(transactions.map(t => t.category))];
  const filtered = transactions.filter(t => {
    if (filterType !== 'all' && t.type !== filterType) return false;
    if (filterCat !== 'all' && t.category !== filterCat) return false;
    if (search && !t.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className={styles.page}>
      <div className={styles.topRow}>
        <div>
          <h1>Transactions</h1>
          <p className={styles.sub}>Manage and track all your transactions</p>
        </div>
        <div className={styles.actions}>
          <button className={styles.exportBtn} onClick={exportPDF} disabled={exporting || filtered.length === 0}>
            <FileText size={16} />
            {exporting ? 'Exporting...' : 'Export PDF'}
          </button>
          <button className={styles.addBtn} onClick={() => setShowModal(true)}>
            <Plus size={18} /> Add
          </button>
        </div>
      </div>

      <div className={styles.filters}>
        <div className={styles.searchWrap}>
          <Search size={16} className={styles.searchIcon} />
          <input placeholder="Search transactions..." value={search} onChange={e => setSearch(e.target.value)} className={styles.searchInput} />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className={styles.select}>
          <option value="all">All Types</option>
          <option value="income">Income Only</option>
          <option value="expense">Expenses Only</option>
        </select>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className={styles.select}>
          {cats.map(c => <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>)}
        </select>
      </div>

      <div className={styles.summary}>
        <span className={styles.count}>{filtered.length} transaction{filtered.length !== 1 ? 's' : ''}</span>
        <span className={styles.totals}>
          <span style={{ color: 'var(--green)' }}>+₹{filtered.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0).toLocaleString('en-IN')}</span>
          {' · '}
          <span style={{ color: 'var(--red)' }}>-₹{filtered.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0).toLocaleString('en-IN')}</span>
        </span>
      </div>

      <div className={styles.list}>
        {loading ? <p style={{ color: 'var(--text2)', padding: 20 }}>Loading transactions...</p> : filtered.length === 0 ? (
          <div className={styles.empty}>
            <p>No transactions found</p>
            <p style={{ fontSize: 13, marginTop: 8 }}>Try adding a transaction or adjusting your filters</p>
          </div>
        ) : filtered.map((tx, i) => (
          <div key={tx._id} className={styles.txRow} style={{ animationDelay: `${i * 30}ms` }}>
            <div className={styles.emoji}>{CATEGORY_EMOJI[tx.category] || '📦'}</div>
            <div className={styles.info}>
              <p className={styles.desc}>{tx.description}</p>
              <p className={styles.meta}>
                <span className={`${styles.badge} ${tx.type === 'income' ? styles.incBadge : styles.expBadge}`}>{tx.category}</span>
                <span>·</span>
                <span>{format(new Date(tx.date), 'dd MMM yyyy')}</span>
                {tx.note && <><span>·</span><span className={styles.note}>{tx.note}</span></>}
              </p>
            </div>
            <p className={styles.amount} style={{ color: tx.type === 'income' ? 'var(--green)' : 'var(--red)' }}>
              {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
            </p>
            <button className={styles.delBtn} onClick={() => handleDelete(tx._id)} title="Delete transaction">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {showModal && <AddTransactionModal onClose={() => setShowModal(false)} onAdd={fetchTransactions} />}
    </div>
  );
}
