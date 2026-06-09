# 💰 SpendWise — Full Stack Expense Tracker

> A production-ready expense tracking application built with React.js, Node.js, Express, and MongoDB.

![SpendWise Dashboard](https://via.placeholder.com/900x500/0d0d0f/c8f55a?text=SpendWise+Dashboard)

## 🚀 Features

- **JWT Authentication** — Secure login/register with bcrypt password hashing
- **Transaction Management** — Add, filter, delete income & expense transactions
- **Budget Tracking** — Set monthly category-wise budgets with visual progress bars
- **Analytics Dashboard** — Pie charts, bar graphs, savings rate, category breakdowns
- **Responsive Design** — Works on mobile, tablet, and desktop
- **Role-based Data** — Every user sees only their own data (user isolation)

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js 18, React Router v6, Recharts |
| Styling | CSS Modules, Google Fonts (Syne + DM Sans) |
| Backend | Node.js, Express.js |
| Database | MongoDB with Mongoose ODM |
| Auth | JWT (JSON Web Tokens) + bcryptjs |
| HTTP Client | Axios |
| Notifications | React Hot Toast |
| Icons | Lucide React |

## 📁 Project Structure

```
expense-tracker/
├── frontend/                  # React Application
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx         # Sidebar + navigation
│   │   │   ├── Layout.module.css
│   │   │   ├── AddTransactionModal.jsx
│   │   │   └── AddTransactionModal.module.css
│   │   ├── context/
│   │   │   └── AuthContext.jsx    # Global auth state
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx      # Summary + charts + recent txns
│   │   │   ├── Transactions.jsx   # Full transaction list + filters
│   │   │   ├── Analytics.jsx      # Pie chart + bar chart + category bars
│   │   │   ├── Budget.jsx         # Budget management
│   │   │   └── *.module.css
│   │   ├── App.jsx
│   │   └── index.js
│   └── package.json
│
└── backend/                   # Node.js + Express API
    ├── middleware/
    │   └── auth.js            # JWT verification middleware
    ├── models/
    │   ├── User.js            # User schema + password hashing
    │   ├── Transaction.js     # Transaction schema
    │   └── Budget.js          # Budget schema
    ├── routes/
    │   ├── auth.js            # /api/auth/login, /register
    │   ├── transactions.js    # CRUD + summary + analytics
    │   └── budgets.js         # CRUD for budget limits
    ├── server.js
    ├── .env.example
    └── package.json
```

## ⚙️ Setup & Installation

### Prerequisites
- Node.js v18+
- MongoDB (local or MongoDB Atlas)

### 1. Clone the repo
```bash
git clone https://github.com/yourusername/spendwise.git
cd spendwise
```

### 2. Backend Setup
```bash
cd backend
npm install

# Create .env file
cp .env.example .env
# Edit .env and add your MongoDB URI and JWT secret

npm run dev   # Starts on http://localhost:5000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm start     # Starts on http://localhost:3000
```

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login & get JWT token |

### Transactions (Protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transactions` | Get all transactions (with filters) |
| GET | `/api/transactions/summary` | Income/expense summary + chart data |
| GET | `/api/transactions/analytics` | Category breakdown + savings rate |
| POST | `/api/transactions` | Add new transaction |
| DELETE | `/api/transactions/:id` | Delete transaction |

### Budgets (Protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/budgets` | Get budgets with spent amounts |
| POST | `/api/budgets` | Create/update budget limit |
| DELETE | `/api/budgets/:id` | Remove budget |

## 📸 Screenshots

- **Dashboard** — Income/expense summary cards, area chart, recent transactions
- **Transactions** — Full list with search, type filter, category filter
- **Analytics** — Donut chart, monthly comparison bar chart, category progress bars
- **Budget** — Budget limits with progress bars, over-budget alerts

## 💡 What I Learned

- JWT-based stateless authentication with protected routes
- MongoDB aggregation for financial summaries
- React Context API for global state management
- React Router v6 nested routing with layout components
- CSS Modules for component-scoped styling
- Recharts for data visualization

## 🔮 Future Enhancements

- [ ] Email notifications for budget alerts (Nodemailer)
- [ ] Export transactions to CSV/PDF
- [ ] Recurring transaction support
- [ ] Multiple currency support
- [ ] Dark/Light theme toggle

## 📄 License

MIT License — free to use for portfolio and learning purposes.

---
Developed by Sunny Kumar as a full-stack development learning project.
