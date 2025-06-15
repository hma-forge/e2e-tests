# Forge E2E Tests

Comprehensive end-to-end tests for the complete Forge platform. These tests validate the entire application stack including API endpoints, authentication flow, frontend deployment, and system integration.

## Quick start

```bash
# Install dependencies
npm install

# Run all working tests (recommended)
npm test

# Run with debug output
npm run test:debug
```

## Project structure

```
e2e-tests/
├── tests/
│   ├── api.test.js        # ✅ API endpoint tests
│   ├── full-flow.test.js  # ✅ Complete application flow
│   └── login.test.js      # ❌ Browser tests (Puppeteer issues)
├── package.json           # Dependencies and scripts
├── README.md             # This file
├── TESTING_GUIDE.md      # Detailed testing guide
└── TROUBLESHOOTING.md    # Common issues and solutions
```

## Test Categories

### 🚀 API Tests (`api.test.js`) - **WORKING**
Tests core API functionality without browser dependencies:
- Health endpoint validation
- User authentication (login/logout)
- JWT token creation and validation  
- Protected endpoint access control
- Error handling for invalid credentials

### 🔄 Full Flow Tests (`full-flow.test.js`) - **WORKING**
Tests complete application workflow:
- End-to-end authentication flow
- Frontend asset serving
- API integration
- CORS and security headers
- System health monitoring

### 🌐 Browser Tests (`login.test.js`) - **ISSUES**
Puppeteer-based UI tests (currently failing due to browser compatibility):
- Login form interaction
- Navigation testing
- UI element validation
- User experience flows

## Running Tests

### Basic Usage
```bash
# All tests
npm test

# Specific test files
npm test -- --testPathPattern="api.test.js"
npm test -- --testPathPattern="full-flow.test.js"

# Watch mode for development
npm run test:watch
```

### Environment Configuration
```bash
# Default (development environment)
npm test

# Custom URLs
FRONTEND_URL="http://localhost:3000" API_URL="http://localhost:8080" npm test

# Production testing
FRONTEND_URL="https://forge.example.com" API_URL="https://api.forge.example.com" npm test
```

### Debug Mode
```bash
# Detailed output
npm run test:debug

# Single test with debug
npm run test:debug -- --testNamePattern="health endpoint"
```

## Test Environment Setup

### Prerequisites
1. **Forge Infrastructure Running**: Development environment must be deployed
2. **Test User Created**: Database must contain test user `admin@forge.local`
3. **Services Accessible**: API and frontend must be reachable

### Quick Health Check
```bash
# Verify services are running
curl http://localhost:8888/health
curl http://localhost:8888/

# Test authentication
curl -X POST http://localhost:8888/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@forge.local","password":"admin123"}'
```

## Test Results Interpretation

### ✅ Success Output
```
PASS tests/api.test.js
  API Tests
    ✓ health endpoint should return ok
    ✓ login should return JWT token
    ✓ protected endpoint should work with valid token
    ✓ protected endpoint should reject without token
    ✓ protected endpoint should reject with invalid token  
    ✓ login should reject invalid credentials

PASS tests/full-flow.test.js
  Full Application Flow E2E Tests
    ✓ complete user authentication flow
    ✓ frontend serves all required assets
    ✓ CORS and headers are configured correctly

Test Suites: 2 passed
Tests: 9 passed
```

### ❌ Common Failures
- **"Connection refused"**: Infrastructure not running
- **"401 Unauthorized"**: Test user not created or wrong credentials
- **"404 Not Found"**: API endpoints not properly configured
- **"socket hang up"**: Puppeteer browser issues

## Technology Stack

- **Jest** - Test framework and runner
- **node-fetch** - HTTP client for API testing  
- **Puppeteer** - Browser automation (for UI tests)
- **Node.js** - Runtime environment

## Integration with CI/CD

### GitHub Actions Example
```yaml
- name: Run E2E Tests
  run: |
    cd e2e-tests
    npm install
    FRONTEND_URL=${{ env.FRONTEND_URL }} API_URL=${{ env.API_URL }} npm test
```

### Local Development Workflow
```bash
# 1. Start infrastructure
cd ../infrastructure && make status

# 2. Run tests in watch mode
cd ../e2e-tests && npm run test:watch

# 3. Make changes to server/frontend
# 4. Tests auto-run and validate changes
```

## Test Coverage

| Component        | Coverage   | Status           |
|------------------|------------|------------------|
| Health Endpoints | ✅ Complete | Working          |
| Authentication   | ✅ Complete | Working          |
| API Security     | ✅ Complete | Working          |
| Frontend Serving | ✅ Complete | Working          |
| Error Handling   | ✅ Complete | Working          |
| UI Interactions  | ⚠️ Partial | Puppeteer Issues |

## Next Steps

1. **Fix Puppeteer Issues**: Resolve browser compatibility for UI tests
2. **Add Project Tests**: E2E tests for project management features  
3. **Performance Tests**: Load testing and response time validation
4. **Security Tests**: Comprehensive security validation
5. **Mobile Tests**: Mobile browser compatibility testing

For detailed testing procedures, see [TESTING_GUIDE.md](TESTING_GUIDE.md).
For troubleshooting, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md).