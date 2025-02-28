# CDP Support Agent

An intelligent support agent for Customer Data Platforms (CDPs) powered by LLM technology.

## Overview

The CDP Support Agent is a sophisticated support system designed to assist users with CDP-related queries. It leverages large language models (LLMs) and integrates with various CDPs to provide accurate, context-aware responses.

Current System Configuration:
- **UTC Time Format**: YYYY-MM-DD HH:MM:SS
- **Current System Time**: 2025-02-28 19:45:13
- **System User**: drhousevicodine

## Features

- Real-time chat interface with CDP-specific context
- Intelligent document search and retrieval
- Conversation history management
- Rate limiting for API stability
- Performance monitoring and logging
- Support for multiple CDPs:
  - Segment
  - Zeotap
  - Other CDPs (expandable)

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/cdp-support-agent.git

# Navigate to project directory
cd cdp-support-agent1

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
```

## Environment Variables

Create a `.env` file with the following configuration:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/cdp_support"

# Ollama
OLLAMA_URL="http://localhost:11434"

# System
NODE_ENV="development"
```

## Usage

### Development

```bash
# Start the development server
npm run dev

# Run tests
npm test

# Lint code
npm run lint
```

### Production

```bash
# Build the application
npm run build

# Start the production server
npm start
```

## Architecture

### Core Components

1. **Chat Service**
   - Handles user queries
   - Manages conversation context
   - Integrates with LLM

2. **Document Management**
   - Stores CDP documentation
   - Provides relevant search
   - Maintains version control

3. **Performance Monitoring**
   - Tracks response times
   - Monitors system health
   - Logs activities

### Database Schema

```sql
-- Key tables structure
CREATE TABLE conversations (
  id SERIAL PRIMARY KEY,
  query TEXT NOT NULL,
  response TEXT NOT NULL,
  cdp TEXT,
  sessionId TEXT NOT NULL,
  userId TEXT NOT NULL,
  timestamp TIMESTAMP NOT NULL
);

CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  url TEXT,
  cdp TEXT,
  updatedAt TIMESTAMP NOT NULL
);
```

## API Reference

### Chat Endpoints

```typescript
POST /api/chat
{
  query: string;
  cdp?: CDP;
  sessionId?: string;
}

GET /api/chat/history
{
  sessionId: string;
  limit?: number;
}
```

### Document Endpoints

```typescript
GET /api/documents
{
  query?: string;
  cdp?: CDP;
}

POST /api/documents
{
  title: string;
  content: string;
  cdp?: CDP;
  url?: string;
}
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Testing

```bash
# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run all tests with coverage
npm run test:coverage
```

## Logging

Logs are stored in the following format:
```javascript
{
  timestamp: "YYYY-MM-DD HH:MM:SS",
  user: "username",
  activity: "ACTIVITY_TYPE",
  details: {
    // activity-specific information
  }
}
```

## Performance Monitoring

The system tracks:
- Response times
- Query performance
- LLM generation time
- Document retrieval speed
- Error rates

## Error Handling

The system implements comprehensive error handling:
- API errors
- LLM failures
- Database issues
- Rate limiting
- Invalid inputs

## Security

- Input sanitization
- Rate limiting
- User authentication
- Error logging
- Secure API endpoints

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Ollama for LLM support
- Next.js for the frontend framework
- Prisma for database management
- TypeScript for type safety
- Various CDP providers for their documentation

## Support

For support, please create an issue in the repository or contact the development team.
