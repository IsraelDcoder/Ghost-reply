# Ghost Reply - AI Conversation Reply Generator

> Get 5 different reply personalities for any chat. Upload screenshots or paste conversations to get AI-powered suggestions.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- PostgreSQL database
- OpenRouter API key

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your values

# Run migrations
npm run db:push

# Start development server
npm run server:dev

# In another terminal, start mobile app
npm run expo:dev
```

## 📁 Project Structure

```
ghost-reply/
├── app/                      # React Native Expo app
│   ├── home.tsx             # Main screen with screenshot/paste input
│   ├── result.tsx           # Results with 5 personality replies
│   ├── paywall.tsx          # Subscription screen
│   └── onboarding.tsx       # First-time user flow
├── components/              # Reusable React components
├── lib/                     # Utilities
│   ├── ocr.ts              # Screenshot text extraction (ML Kit)
│   └── query-client.ts     # API client
├── server/                  # Express backend API
│   ├── index.ts            # Server entry point
│   ├── routes.ts           # API endpoints
│   └── middleware.ts       # Auth, rate limiting
├── shared/                  # Shared types and schemas
└── migrations/              # Database migrations
```

## 🔌 API Endpoints

### POST `/api/analyze`
Analyze conversation and generate 5 reply personalities.

**Request:**
```json
{
  "text": "Hey, how are you doing?"
}
```

**Response:**
```json
{
  "analysis": "Casual and friendly opener",
  "score": 75,
  "scoreLabel": "Strong Start",
  "replies": {
    "confident": "Doing great, excited to chat",
    "flirty": "Better now that you're here 😏",
    "funny": "Living the dream, one message at a time",
    "savage": "Could be better, but you're making it work",
    "smart": "Quite well, contemplating the nature of well-being"
  }
}
```

### POST `/api/regenerate`
Regenerate a specific personality reply.

**Request:**
```json
{
  "text": "Hey, how are you doing?",
  "personality": "flirty"
}
```

### GET `/api/conversations`
Get user's conversation history.

### GET `/api/health`
Health check endpoint.

## 🔐 Authentication

Uses device ID (X-Device-Id header) for basic identification. For production, implement proper authentication with Firebase Auth or similar.

## 🏗️ Deployment

### Backend Deployment

**Option 1: Render.com (Recommended)**
1. Push code to GitHub
2. Create new Web Service on Render
3. Set environment variables
4. Deploy

**Option 2: Railway.app**
1. Connect GitHub repo
2. Add environment variables
3. Auto-deploys on push

**Option 3: Other Providers**
- AWS Elastic Beanstalk
- Google Cloud Run
- Microsoft Azure App Service
- Heroku

### Mobile App Deployment

Update `.env` with your deployed backend URL:
```env
EXPO_PUBLIC_DOMAIN=api.ghostreply.com
```

Build and submit to Play Store:
```bash
eas build --platform android --wait
# Upload resulting .aab to Google Play Console
```

## 📚 Environment Variables

### Development (.env.local)
```env
EXPO_PUBLIC_DOMAIN=localhost:5000
NODE_ENV=development
DATABASE_URL=postgres://...
AI_INTEGRATIONS_OPENROUTER_API_KEY=sk-or-v1-...
```

### Production (.env.production.example)
See `.env.production.example` for template. Create `.env.production` before deploying.

## 🔑 Key Features

- **OCR Screenshot Upload** - Extract text from chat images using ML Kit
- **5 Personality Types** - Confident, Flirty, Funny, Savage, Smart
- **Real-time Analysis** - Get instant conversation scores and insights
- **Subscription Ready** - Free tier (2 replies/day) + Pro unlimited
- **Rate Limiting** - Protected endpoints with IP-based rate limits
- **Responsive UI** - Beautiful dark theme Expo app

## 🛠️ Development

### Scripts
```bash
npm run server:dev      # Start dev server
npm run expo:dev        # Start Expo dev server
npm run server:build    # Build for production
npm run db:push        # Push schema changes
npm run lint           # Run ESLint
npm run lint:fix       # Fix lint errors
```

### Testing

```bash
# Test API endpoint
curl -X POST http://localhost:5000/api/analyze \
  -H "Content-Type: application/json" \
  -H "X-Device-Id: test-device" \
  -d '{"text":"Hey, how are you?"}'
```

## 📦 Dependencies

### Core
- **Expo** - React Native framework
- **Expo Router** - File-based routing
- **React Native** - UI framework
- **Express** - Backend API
- **Drizzle ORM** - Database ORM
- **OpenRouter** - AI API provider

### ML & Media
- **@react-native-ml-kit/text-recognition** - OCR
- **expo-image-picker** - Photo library access
- **expo-file-system** - File system access
- **expo-sharing** - Share functionality

### State & Data
- **TanStack React Query** - Server state management
- **Zod** - Schema validation
- **PostgreSQL** - Database

## 🐛 Troubleshooting

### "EXPO_PUBLIC_DOMAIN is not set"
Set the environment variable:
```bash
export EXPO_PUBLIC_DOMAIN=localhost:5000
```

### API requests failing
1. Ensure backend is running: `npm run server:dev`
2. Check CORS settings in `server/index.ts`
3. Verify `EXPO_PUBLIC_DOMAIN` matches backend URL
4. Check firewall/network access

### OCR not working
- Ensure `expo-image-picker` permissions are granted
- Check that image file is readable
- Verify `@react-native-ml-kit/text-recognition` is properly linked

### Database connection errors
- Verify `DATABASE_URL` is correct
- Check PostgreSQL is running
- Run migrations: `npm run db:push`

## 📄 License

MIT

## 📞 Support

For issues and questions, check the README in each folder or contact support@ghostreply.app
