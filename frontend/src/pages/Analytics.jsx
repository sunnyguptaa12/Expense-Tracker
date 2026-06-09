import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { FileText } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import styles from './Analytics.module.css';

const COLORS = ['#c8f55a','#4ade80','#60a5fa','#f472b6','#fb923c','#a78bfa','#34d399','#fbbf24','#f87171','#38bdf8'];

const DEMO_CAT = [
  { name: 'Food', value: 8400 },
  { name: 'Rent', value: 8000 },
  { name: 'Transport', value: 2100 },
  { name: 'Entertainment', value: 1849 },
  { name: 'Health', value: 1200 },
  { name: 'Education', value: 2999 },
];
const DEMO_MONTHLY = [
  { month: 'Jan', income: 45000, expense: 18000 },
  { month: 'Feb', income: 47000, expense: 21000 },
  { month: 'Mar', income: 45000, expense: 16000 },
  { month: 'Apr', income: 52000, expense: 19500 },
  { month: 'May', income: 48000, expense: 22000 },
  { month: 'Jun', income: 57000, expense: 18650 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px' }}>
        <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>{label}</p>
        {payload.map(p => <p key={p.name} style={{ fontSize: 13, color: p.fill || p.color, fontWeight: 500 }}>
          {p.name}: ₹{Number(p.value).toLocaleString('en-IN')}
        </p>)}
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  const [catData, setCatData] = useState(DEMO_CAT);
  const [monthlyData, setMonthlyData] = useState(DEMO_MONTHLY);
  const [savingsRate, setSavingsRate] = useState(67.3);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    axios.get('/api/transactions/analytics').then(res => {
      if (res.data.categoryData) setCatData(res.data.categoryData);
      if (res.data.monthlyData) setMonthlyData(res.data.monthlyData);
      if (res.data.savingsRate !== undefined) setSavingsRate(res.data.savingsRate);
    }).catch(() => {});
  }, []);

  const totalExp = catData.reduce((s, c) => s + c.value, 0);
  const totalInc = monthlyData.reduce((s, m) => s + m.income, 0);

  const exportAnalyticsPDF = async () => {
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
      doc.text('Analytics Report', 14, 28);
      doc.setTextColor(154, 150, 144);
      doc.setFontSize(9);
      doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy')}`, pageWidth - 14, 22, { align: 'right' });

      // Stats summary
      const stats = [
        { label: 'Savings Rate', value: `${savingsRate.toFixed(1)}%`, color: [200, 245, 90] },
        { label: 'Total Income', value: `Rs. ${totalInc.toLocaleString('en-IN')}`, color: [74, 222, 128] },
        { label: 'Total Expenses', value: `Rs. ${totalExp.toLocaleString('en-IN')}`, color: [255, 92, 92] },
      ];
      const boxW = (pageWidth - 28 - 16) / 3;
      stats.forEach((s, i) => {
        const x = 14 + i * (boxW + 8);
        doc.setFillColor(28, 28, 32);
        doc.roundedRect(x, 46, boxW, 22, 3, 3, 'F');
        doc.setTextColor(...s.color);
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text(s.value, x + boxW / 2, 56, { align: 'center' });
        doc.setTextColor(154, 150, 144);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(s.label, x + boxW / 2, 63, { align: 'center' });
      });

      // Category breakdown table
      doc.setTextColor(240, 237, 232);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Expense by Category', 14, 80);

      autoTable(doc, {
        startY: 85,
        head: [['Category', 'Amount (₹)', 'Share (%)']],
        body: [...catData].sort((a, b) => b.value - a.value).map((c, i) => [
          c.name,
          `Rs. ${c.value.toLocaleString('en-IN')}`,
          `${((c.value / totalExp) * 100).toFixed(1)}%`
        ]),
        styles: { fontSize: 9, textColor: [240, 237, 232], fillColor: [20, 20, 22], lineColor: [36, 36, 40], lineWidth: 0.3, cellPadding: 5 },
        headStyles: { fillColor: [36, 36, 40], textColor: [154, 150, 144], fontStyle: 'bold', fontSize: 8 },
        alternateRowStyles: { fillColor: [28, 28, 32] },
        columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right', fontStyle: 'bold' } },
        margin: { left: 14, right: 14 },
      });

      // Monthly comparison table
      const finalY = doc.lastAutoTable.finalY + 14;
      doc.setTextColor(240, 237, 232);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Monthly Summary', 14, finalY);

      autoTable(doc, {
        startY: finalY + 6,
        head: [['Month', 'Income (₹)', 'Expenses (₹)', 'Savings (₹)']],
        body: monthlyData.map(m => [
          m.month,
          `Rs. ${m.income.toLocaleString('en-IN')}`,
          `Rs. ${m.expense.toLocaleString('en-IN')}`,
          `Rs. ${(m.income - m.expense).toLocaleString('en-IN')}`
        ]),
        styles: { fontSize: 9, textColor: [240, 237, 232], fillColor: [20, 20, 22], lineColor: [36, 36, 40], lineWidth: 0.3, cellPadding: 5 },
        headStyles: { fillColor: [36, 36, 40], textColor: [154, 150, 144], fontStyle: 'bold', fontSize: 8 },
        alternateRowStyles: { fillColor: [28, 28, 32] },
        columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right', fontStyle: 'bold', textColor: [74, 222, 128] } },
        margin: { left: 14, right: 14 },
      });

      // Footer
      doc.setFillColor(13, 13, 15);
      doc.rect(0, doc.internal.pageSize.getHeight() - 12, pageWidth, 12, 'F');
      doc.setTextColor(90, 87, 82);
      doc.setFontSize(8);
      doc.text('SpendWise — Expense Tracker', 14, doc.internal.pageSize.getHeight() - 4);
      doc.text('Page 1 of 1', pageWidth - 14, doc.internal.pageSize.getHeight() - 4, { align: 'right' });

      doc.save(`SpendWise_Analytics_${format(new Date(), 'dd-MM-yyyy')}.pdf`);
      toast.success('Analytics PDF exported!');
    } catch (err) {
      toast.error('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.topRow}>
        <div>
          <h1 className={styles.title}>Analytics</h1>
          <p className={styles.sub}>A complete breakdown of your spending</p>
        </div>
        <button className={styles.exportBtn} onClick={exportAnalyticsPDF} disabled={exporting}>
          <FileText size={16} />
          {exporting ? 'Exporting...' : 'Export PDF'}
        </button>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Savings Rate</p>
          <p className={styles.statVal} style={{ color: 'var(--accent)' }}>{savingsRate.toFixed(1)}%</p>
          <p className={styles.statHint}>Of your total income saved</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Top Expense</p>
          <p className={styles.statVal} style={{ color: 'var(--red)' }}>{catData[0]?.name || '—'}</p>
          <p className={styles.statHint}>₹{(catData[0]?.value || 0).toLocaleString('en-IN')} this month</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Total Spent</p>
          <p className={styles.statVal} style={{ color: 'var(--amber)' }}>₹{totalExp.toLocaleString('en-IN')}</p>
          <p className={styles.statHint}>Across all categories</p>
        </div>
      </div>

      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <h3>Category Breakdown</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={catData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={3}>
                {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={v => `₹${Number(v).toLocaleString('en-IN')}`} contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className={styles.legend}>
            {catData.map((c, i) => (
              <div key={c.name} className={styles.legendItem}>
                <span className={styles.dot} style={{ background: COLORS[i % COLORS.length] }} />
                <span className={styles.legName}>{c.name}</span>
                <span className={styles.legPct}>{((c.value / totalExp) * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.chartCard}>
          <h3>Monthly Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barCategoryGap="30%">
              <XAxis dataKey="month" tick={{ fill: '#9a9690', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9a9690', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v/1000}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="income" name="Income" fill="#4ade80" radius={[4,4,0,0]} />
              <Bar dataKey="expense" name="Expenses" fill="#ff5c5c" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className={styles.legend} style={{ justifyContent: 'center' }}>
            <div className={styles.legendItem}><span className={styles.dot} style={{ background: '#4ade80' }} /><span className={styles.legName}>Income</span></div>
            <div className={styles.legendItem}><span className={styles.dot} style={{ background: '#ff5c5c' }} /><span className={styles.legName}>Expenses</span></div>
          </div>
        </div>
      </div>

      <div className={styles.catBars}>
        <h3>Expense by Category</h3>
        <div className={styles.barList}>
          {[...catData].sort((a,b)=>b.value-a.value).map((c, i) => (
            <div key={c.name} className={styles.barRow}>
              <span className={styles.barLabel}>{c.name}</span>
              <div className={styles.barTrack}>
                <div className={styles.barFill} style={{ width: `${(c.value/catData[0].value)*100}%`, background: COLORS[i % COLORS.length] }} />
              </div>
              <span className={styles.barVal}>₹{c.value.toLocaleString('en-IN')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
