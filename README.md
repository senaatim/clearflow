# ClearFlow - AI-Powered Investment Intelligence Platform
Doc
A modern, secure web-based investment and portfolio intelligence platform built for Jbryanson Globals Limited.

![ClearFlow Dashboard](https://img.shields.io/badge/ClearFlow-Investment%20Intelligence-00ffaa)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6)
![Python](https://img.shields.io/badge/Python-3.11+-3776AB)

## Features

### Portfolio Overview Dashboard
- Total portfolio value with real-time updates
- Performance charts and trend analysis
- Risk indicators and market summaries
- Asset allocation visualization

### AI Investment Recommendations
- Personalized suggestions based on user goals and risk profile
- Diversified strategies for Nigerian and global markets
- Simple explanations for non-technical users
- Confidence scoring for each recommendation

### Predictive Market Analytics
- Market trend predictions
- Volatility alerts
- Scenario simulations (best-case, worst-case, expected)
- Sector performance analysis

### Risk Management Tools
- Personalized risk scoring (0-10 scale)
- Portfolio stress testing
- Volatility monitoring
- Correlation analysis
- High-risk exposure alerts

### Tax Optimization Dashboard
- Estimated capital gains and dividend taxes
- Tax-loss harvesting opportunities
- Tax-efficient investment insights
- Year-end tax summary

### Reports & Insights
- AI-generated investment reports
- Downloadable PDF/CSV summaries
- Benchmark performance comparison
- Historical analysis

### Robo-Advisor Automation
- Automated portfolio allocation logic
- Periodic rebalancing recommendations
- Contribution scheduling
- Custom rule builder

## Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Recharts** - Data visualization
- **Zustand** - State management
- **TanStack Query** - Server state management
- **React Hook Form + Zod** - Form handling

### Backend
- **FastAPI** - High-performance Python API
- **SQLAlchemy** - Async ORM
- **Pydantic** - Data validation
- **JWT** - Authentication
- **SQLite** - Database (upgradeable to PostgreSQL)

### AI/ML Layer
- Rule-based recommendation engine
- Risk scoring algorithms
- Tax optimization calculator
- Market prediction (mock/simulated)

## Project Structure

```
clearflow/
├── frontend/                 # Next.js Application
│   ├── src/
│   │   ├── app/             # Next.js App Router pages
│   │   │   ├── (auth)/      # Authentication pages
│   │   │   └── (dashboard)/ # Dashboard pages
│   │   ├── components/      # React components
│   │   ├── hooks/           # Custom hooks
│   │   ├── lib/             # Utilities
│   │   ├── stores/          # Zustand stores
│   │   └── types/           # TypeScript types
│   └── package.json
│
├── backend/                  # FastAPI Application
│   ├── app/
│   │   ├── api/v1/          # API endpoints
│   │   ├── models/          # SQLAlchemy models
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── services/        # Business logic
│   │   └── ml/              # AI/ML algorithms
│   └── requirements.txt
│
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- npm or yarn

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`
- API Documentation: `http://localhost:8000/docs`
- Alternative docs: `http://localhost:8000/redoc`

### Environment Variables

Create a `.env` file in the backend directory:

```env
SECRET_KEY=your-super-secret-key-change-in-production
DATABASE_URL=sqlite+aiosqlite:///./clearflow.db
DEBUG=true
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | User login |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| GET | `/api/v1/auth/me` | Get current user |

### Portfolios
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/portfolios` | List portfolios |
| POST | `/api/v1/portfolios` | Create portfolio |
| GET | `/api/v1/portfolios/:id` | Get portfolio details |
| GET | `/api/v1/portfolios/:id/allocation` | Get allocation |
| GET | `/api/v1/portfolios/:id/performance` | Get performance data |

### AI Features
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/recommendations` | List recommendations |
| POST | `/api/v1/recommendations/generate` | Generate new recommendations |
| GET | `/api/v1/risk/score` | Get risk score |
| POST | `/api/v1/risk/stress-test` | Run stress test |
| GET | `/api/v1/tax/summary` | Get tax summary |
| GET | `/api/v1/tax/harvesting` | Get harvesting opportunities |

## Design System

The platform uses a modern dark theme with the following color palette:

```css
--bg-primary: #0a0e14
--bg-secondary: #141922
--bg-tertiary: #1a2030
--accent-primary: #00ffaa
--accent-secondary: #00d4ff
--accent-danger: #ff4466
--text-primary: #e8edf4
--text-secondary: #8b94a8
--success: #00ff88
--warning: #ffbb00
```

Fonts:
- **Instrument Sans** - UI typography
- **JetBrains Mono** - Data and code

## Security

- JWT-based authentication
- Password hashing with bcrypt
- CORS protection
- Input validation with Pydantic/Zod
- SQL injection protection via SQLAlchemy ORM

## Future Enhancements

- [ ] Real ML models for predictions
- [ ] Real-time market data integration
- [ ] Payment gateway integration
- [ ] Brokerage API connections
- [ ] Mobile app (React Native)
- [ ] Push notifications
- [ ] KYC/Compliance features
- [ ] Multi-currency support

## License

Proprietary - Jbryanson Globals Limited

## Support

For support, contact the development team at Jbryanson Globals Limited.

---

Built with care by the ClearFlow team for Jbryanson Globals Limited.
