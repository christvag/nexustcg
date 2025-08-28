# TCG Grading Service

A modern e-commerce website for trading card game grading services built with Next.js, TypeScript, and Tailwind CSS.

## Features

- 🎴 Professional card grading service for Pokemon, Yu-Gi-Oh!, MTG, and more
- 🌓 Dark/Light mode support with smooth transitions
- 🎮 Gaming-themed UI with gradient styles and animations
- 💳 Stripe payment integration
- 📱 Fully responsive design
- ⚡ Fast performance with Next.js 14

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd gradingsiteproject
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Update the `.env.local` file with your Stripe API keys and other configuration.

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
gradingsiteproject/
├── app/                    # Next.js app directory
│   ├── packages/          # Package selection flow
│   │   ├── card-selection/
│   │   ├── checkout/
│   │   ├── payment/
│   │   └── confirmation/
│   ├── report/            # Grading reports
│   ├── about/             # About page
│   └── page.tsx           # Homepage
├── components/            # Reusable components
│   ├── layout/           # Header, Footer
│   └── ui/               # UI components
├── lib/                   # Utilities and types
└── public/               # Static assets
```

## Available Packages

1. **Authentication** - $10/card - Card authentication only
2. **Bulk Grading** - $12/card - Minimum 50 cards, 5-6 days processing
3. **Standard** - $15/card - Unlimited cards, 5-6 days processing
4. **Express** - $20/card - Priority 2-3 days processing

## Technologies Used

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animations
- **Stripe** - Payment processing
- **next-themes** - Theme management

## Deployment

This application is ready to be deployed on Vercel:

```bash
npm run build
```

## License

MIT