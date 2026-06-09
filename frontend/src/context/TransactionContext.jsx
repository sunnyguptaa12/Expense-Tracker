import { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const TransactionContext = createContext();

export const TransactionProvider = ({ children }) => {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [budget, setBudget] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });

  const fetchTransactions = useCallback(async (filters = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams(filters).toString();
      const { data } = await axios.get(`/api/transactions?${params}`);
      setTransactions(data.transactions);
      setPagination(data.pagination);
    } catch (err) {
      toast.error('Transactions load nahi ho paaye');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSummary = useCallback(async (month, year) => {
    try {
      const { data } = await axios.get(`/api/transactions/summary?month=${month}&year=${year}`);
      setSummary(data.summary);
    } catch (err) {
      console.error('Summary error:', err);
    }
  }, []);

  const addTransaction = async (txData) => {
    const { data } = await axios.post('/api/transactions', txData);
    setTransactions((prev) => [data.transaction, ...prev]);
    toast.success('Transaction add ho gayi! ✅');
    return data.transaction;
  };

  const deleteTransaction = async (id) => {
    await axios.delete(`/api/transactions/${id}`);
    setTransactions((prev) => prev.filter((t) => t._id !== id));
    toast.success('Transaction delete ho gayi');
  };

  const updateTransaction = async (id, txData) => {
    const { data } = await axios.put(`/api/transactions/${id}`, txData);
    setTransactions((prev) => prev.map((t) => (t._id === id ? data.transaction : t)));
    toast.success('Transaction update ho gayi!');
    return data.transaction;
  };

  const fetchBudget = useCallback(async (month, year) => {
    try {
      const { data } = await axios.get(`/api/budget?month=${month}&year=${year}`);
      setBudget(data);
    } catch (err) {
      console.error('Budget error:', err);
    }
  }, []);

  const saveBudget = async (budgetData) => {
    const { data } = await axios.post('/api/budget', budgetData);
    setBudget((prev) => ({ ...prev, budget: data.budget }));
    toast.success('Budget save ho gaya! 💰');
  };

  return (
    <TransactionContext.Provider value={{
      transactions, summary, budget, loading, pagination,
      fetchTransactions, fetchSummary, addTransaction,
      deleteTransaction, updateTransaction, fetchBudget, saveBudget,
    }}>
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransactions = () => useContext(TransactionContext);
