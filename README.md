# Akoma Bet - Automated Soccer Betting Platform

An intelligent, automated soccer betting platform that removes emotional decision-making from sports betting through AI-driven match selection and comprehensive risk management.

## 🎯 Project Overview

Akoma Bet enables soccer fans to automate their betting strategy with "set it and forget it" functionality. The platform integrates with msport.com to execute bets automatically based on AI predictions while maintaining strict risk controls and user security.

### Key Features

- **Automated Betting**: Set schedules and let AI handle match selection and bet placement
- **Risk Management**: Built-in loss limits, spending caps, and emergency controls
- **Security First**: AES-256 encrypted credential storage with comprehensive audit trails
- **Real-time Monitoring**: Live updates, activity feeds, and performance analytics
- **Smart Selection**: AI-driven match analysis for optimal betting opportunities

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account (for authentication and data storage)

### Installation

```bash
# Clone the repository
git clone https://github.com/troasfl/akoma-bet.git
cd akoma-bet

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development server
npm run dev
```

### Environment Setup

Create a `.env` file with the following variables:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🏗️ Tech Stack

- **Frontend**: React 18, TypeScript, Chakra UI
- **State Management**: Zustand
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **Form Handling**: React Hook Form
- **Testing**: Jest, React Testing Library
- **Build Tool**: Vite
- **Automation**: Playwright (for msport.com integration)

## 📁 Project Structure

```
src/
├── components/
│   └── auth/              # Authentication components
├── stores/                # Zustand state management
├── types/                 # TypeScript type definitions
├── utils/                 # Utility functions and Supabase client
└── __tests__/            # Test files

docs/
├── prd.md                # Product Requirements Document
├── architecture/         # Architecture documentation
└── stories/              # User stories and specifications

supabase/
├── migrations/           # Database migrations
└── config/              # Supabase configuration
```

## 🛠️ Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode

## 🔐 Security Features

- **Credential Encryption**: User betting credentials encrypted with AES-256
- **Authentication**: Secure email/password authentication with Supabase
- **Risk Controls**: Automated loss limits and spending caps
- **Audit Trails**: Comprehensive logging of all betting activities
- **Emergency Controls**: Instant stop functionality for all automation

## 📊 Core Functionality

### Epic 1: Foundation & User Management
- ✅ User registration and authentication
- ✅ Secure credential storage for msport.com accounts
- ✅ Basic dashboard with account status

### Epic 2: Betting Automation Core
- 🔄 Playwright-based msport.com integration
- 🔄 Automated match discovery and selection
- 🔄 Intelligent bet placement system

### Epic 3: Schedule Management & Risk Controls
- 📋 Betting schedule configuration
- 📋 Comprehensive risk management controls
- 📋 AI-driven match selection algorithm

### Epic 4: Reporting & Performance Tracking
- 📋 Real-time activity monitoring
- 📋 Profit/loss reporting and analytics
- 📋 Security and audit features

**Legend**: ✅ Complete | 🔄 In Progress | 📋 Planned

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is private and proprietary. All rights reserved.

## 🔗 Links

### Live Deployment
- **Live Application**: https://admirable-croissant-724913.netlify.app
- **Netlify Admin**: https://app.netlify.com/projects/admirable-croissant-724913

### Documentation
- [Product Requirements Document](docs/prd.md)
- [Architecture Documentation](docs/architecture/)
- [User Stories](docs/stories/)

## ⚠️ Disclaimer

This software is for educational and automation purposes only. Users are responsible for compliance with local gambling laws and regulations. Automated betting carries financial risk - never bet more than you can afford to lose.