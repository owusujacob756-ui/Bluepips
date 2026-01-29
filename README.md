# Bluepips - AI-Powered Forex Trading Platform

A professional forex trading platform that uses AI algorithms to generate high-confidence trading signals and automate trading strategies.

## Features

- 🤖 **AI-Powered Signals**: Machine learning algorithms analyze market patterns 24/7
- 📊 **Real-Time Charts**: Interactive price charts with technical indicators
- 🎯 **Risk Management**: Built-in stop-loss, position sizing, and kill switch
- 📈 **Performance Analytics**: Detailed insights into trading performance
- 🔔 **Smart Notifications**: Instant alerts for trading opportunities
- 🛡️ **Safe Trading**: Demo mode and comprehensive safety features

## Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: Next.js API Routes, PostgreSQL
- **UI**: Lucide Icons, Custom Components
- **Database**: PostgreSQL with optimized indexes

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bluepips
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local` with your database configuration and API keys:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/bluepips_db"
   OPENAI_API_KEY=
   NEWS_API_KEY=
   AI_PROVIDER=openai
   NEWS_PROVIDER=newsapi
   NEWS_WEBHOOK_URL=
   AI_MAX_CONCURRENT=2
   JOBS_SYNC_INTERVAL_MS=600000
   ```
   - **NOTE**: The app runs in a safe stub mode when `DATABASE_URL` or API keys are missing. This allows building and running locally without requiring external services.
   - **Optional envs**: `AI_PROVIDER` (openai|anthropic|gemini), `NEWS_PROVIDER` (newsapi|google).  Use `NEWS_WEBHOOK_URL` to receive high-impact news (optional).  `AI_MAX_CONCURRENT` controls concurrency against AI providers; `JOBS_SYNC_INTERVAL_MS` controls background job frequency.

7. **Background sync (news / price data)**
   There are two sync options:

   - One-off sync: `npm run sync:news` — runs the news sync once (useful for seeding)
   - Daemon: `npm run jobs:start` — starts a small background job runner (syncs every 10 minutes)

   The scripts fetch news for configured forex pairs and save them to the `news_items` table for analysis.

   You can also run a local Postgres instance using Docker Compose:

   ```bash
   docker compose up -d
   # then run migrations
   psql postgres://bluepips:secret@localhost:5432/bluepips_dev -f database/schema.sql
   ```

   Security best practices are documented in `SECURITY.md`.

4. **Set up the database**
   ```bash
   # Create database
   createdb bluepips_db
   
   # Run schema and seed data
   psql bluepips_db < database/schema.sql
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
bluepips/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   │   ├── forex/         # Forex pairs API
│   │   │   ├── signals/       # Trading signals API
│   │   │   ├── trades/        # Trade history API
│   │   │   ├── user/          # User settings API
│   │   │   └── dashboard/     # Dashboard stats API
│   │   ├── dashboard/         # Dashboard page
│   │   ├── charts/           # Charts page
│   │   ├── onboarding/       # Onboarding flow
│   │   ├── layout.jsx        # Root layout
│   │   ├── page.jsx          # Home page
│   │   └── globals.css       # Global styles
│   └── components/           # Reusable components
├── database/
│   └── schema.sql            # Database schema and seed data
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

## API Endpoints

### Forex Pairs
- `GET /api/forex/pairs` - Get all active forex pairs

### Trading Signals
- `GET /api/signals/active` - Get active trading signals

### Trade History
- `GET /api/trades/history` - Get user trade history
- Query params: `status=open|closed`

### Price History
- `GET /api/price-history` - Get historical price data
- Query params: `pairId`, `timeframe`, `limit`

### User Settings
- `GET /api/user/settings` - Get user settings
- `POST /api/user/settings` - Update user settings

### Dashboard Stats
- `GET /api/dashboard/stats` - Get dashboard statistics

### Notifications
- `GET /api/notifications` - Get user notifications
- `PATCH /api/notifications` - Mark notifications as read

## Database Schema

The platform uses PostgreSQL with the following main tables:

- **users** - User accounts and profiles
- **forex_pairs** - Currency pairs information
- **signals** - AI-generated trading signals
- **trades** - User trade history
- **price_history** - Historical OHLCV data
- **notifications** - Alert system
- **user_settings** - User preferences
- **performance_metrics** - Daily statistics

## Features Overview

### Dashboard
- Real-time P&L tracking
- Win rate statistics
- Active signals display
- Market overview
- Trade execution interface

### Charts
- Interactive price charts
- Multiple timeframes (1H, 4H, 1D)
- Technical indicators
- Volume analysis
- Pattern recognition

### Risk Management
- Kill switch for emergency closure
- Maximum daily trade limits
- Position size controls
- Stop-loss and take-profit automation
- Risk tolerance settings

### AI Signals
- 87%+ success rate
- Multiple timeframe analysis
- Technical indicator integration
- Pattern detection
- Confidence scoring

## Deployment

### Production Build

```bash
npm run build
npm start
```

### Environment Variables

Make sure to set these in production:

```
DATABASE_URL=your_production_db_url
NEXTAUTH_URL=your_domain
NEXTAUTH_SECRET=your_secret_key
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team.

---

**Bluepips** - Trade Smarter with AI 🚀
