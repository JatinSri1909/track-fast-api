# TrackFast - Expense Tracker Backend

RESTful API server for the TrackFast expense tracking application with secure authentication and comprehensive expense management.

## Features

- 🔐 JWT-based authentication with refresh tokens
- 📝 Complete CRUD operations for expenses
- 📊 Advanced expense analytics and insights
- 🔍 Powerful filtering and search
- 📄 Pagination support
- 🛡️ Input validation
- 📝 Detailed logging
- 📚 API documentation

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **ODM**: Mongoose
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Zod
- **Logging**: Winston
- **Types**: TypeScript

## Getting Started

1. **Prerequisites**
   - Node.js 18+
   - MongoDB 4.4+
   - npm or yarn

2. **Installation**
   ```bash
   # Clone the repository
   git clone <repository-url>
   cd server

   # Install dependencies
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Copy example env file
   cp .env.example .env

   # Configure environment variables
   MONGODB_URI=mongodb://localhost:27017/expense-tracker
   JWT_SECRET=your_jwt_secret
   REFRESH_TOKEN_SECRET=your_refresh_token_secret
   CLIENT_URL=http://localhost:3000
   ```

4. **Start Server**
   ```bash
   # Development
   npm run dev

   # Production
   npm run build
   npm start
   ```

## API Documentation

### Authentication Endpoints

- **POST** `/api/auth/register`
  - Register new user
  - Body: `{ firstName, lastName, email, password }`

- **POST** `/api/auth/login`
  - Login user
  - Body: `{ email, password }`

- **POST** `/api/auth/refresh-token`
  - Refresh access token using refresh token

- **POST** `/api/auth/logout`
  - Logout user and invalidate tokens

### Expense Endpoints

- **GET** `/api/expenses`
  - Get expenses with filtering & pagination
  - Query params: `page`, `limit`, `category`, `startDate`, `endDate`, `search`

- **POST** `/api/expenses`
  - Create new expense
  - Body: `{ amount, category, date, description? }`

- **PATCH** `/api/expenses/:id`
  - Update expense
  - Body: `{ amount?, category?, date?, description? }`

- **DELETE** `/api/expenses/:id`
  - Delete expense

- **GET** `/api/expenses/insights`
  - Get spending insights and analytics

## JWT Implementation

The application uses a two-token authentication system:

1. **Access Token**
   - Short-lived (15 minutes)
   - Stored in HTTP-only cookie
   - Used for API authentication

2. **Refresh Token**
   - Long-lived (7 days)
   - Stored in database
   - Used to issue new access tokens

## Database Schema

### User Schema
```typescript
{
  firstName: string
  lastName: string
  email: string
  password: string // hashed with bcrypt
  refreshToken?: string
  createdAt: Date
  updatedAt: Date
}
```

### Expense Schema
```typescript
{
  amount: number
  category: string
  date: Date
  description?: string
  user: ObjectId // reference to User
  createdAt: Date
  updatedAt: Date
}
```

## Error Handling

The API uses standardized error responses:

```typescript
{
  message: string      // Human-readable error message
  code?: string       // Error code for client handling
  details?: {         // Validation errors
    field?: string
    message?: string
  }[]
}
```

Common error codes:
- `UNAUTHORIZED` - Invalid or expired token
- `VALIDATION_ERROR` - Invalid input data
- `NOT_FOUND` - Resource not found
- `DUPLICATE_EMAIL` - Email already registered

## Security Features

1. **Password Security**
   - Passwords hashed using bcrypt
   - Minimum password requirements enforced
   - Rate limiting on auth endpoints

2. **JWT Security**
   - HTTP-only cookies
   - Secure flag in production
   - CSRF protection
   - Token refresh mechanism

3. **API Security**
   - Input validation using Zod
   - Request rate limiting
   - CORS configuration
   - Helmet middleware for HTTP headers

## Available Scripts

```bash
# Development
npm run dev         # Start development server with hot reload

# Production
npm run build      # Build TypeScript to JavaScript
npm start         # Start production server

# Utility
npm run lint      # Run ESLint
npm run format    # Run Prettier
```

## Logging

Winston logger configuration:
- Error logs: `logs/error-%DATE%.log`
- Combined logs: `logs/combined-%DATE%.log`
- Console output in development
- Log rotation enabled

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details