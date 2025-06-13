# Forge E2E Testing Guide

Complete guide for running, developing, and maintaining E2E tests for the Forge platform.

## Table of Contents

- [Overview](#overview)
- [Test Environment Setup](#test-environment-setup)
- [Running Tests](#running-tests)
- [Writing New Tests](#writing-new-tests)
- [Debugging Tests](#debugging-tests)
- [Best Practices](#best-practices)
- [CI/CD Integration](#cicd-integration)

## Overview

Forge E2E tests validate the complete application stack from API endpoints to frontend user interface. The test suite includes:

- **API Tests**: Server endpoint validation
- **Authentication Tests**: Login/logout flow testing
- **Integration Tests**: Frontend + backend integration
- **Security Tests**: Access control and validation
- **Browser Tests**: UI interaction testing (Puppeteer)

## Test Environment Setup

### Prerequisites

1. **Node.js** (v16 or higher)
2. **Forge Infrastructure** running locally
3. **Test Database** with seeded data

### Initial Setup

```bash
# 1. Navigate to e2e-tests directory
cd e2e-tests

# 2. Install dependencies
npm install

# 3. Verify Forge infrastructure is running
curl http://localhost:8888/health
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `FRONTEND_URL` | Frontend application URL | `http://localhost:8888` |
| `API_URL` | Backend API URL | `http://localhost:8888` |
| `NODE_ENV` | Environment mode | `test` |

### Test Data Requirements

The tests require a user account in the database:
- **Email**: `admin@forge.local`  
- **Password**: `admin123`

#### Creating Test User

```bash
# Option 1: Use seed command (if available)
cd ../server
DATABASE_URL="postgres://forge:forge@localhost:5432/forge?sslmode=disable" \
  ./bin/seed -email admin@forge.local -password admin123

# Option 2: Manual database insert
psql postgres://forge:forge@localhost:5432/forge -c \
  "INSERT INTO users (email, password_hash) VALUES ('admin@forge.local', '$2a$10$...');"
```

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run with verbose output
npm test -- --verbose

# Run specific test file
npm test -- --testPathPattern="api.test.js"

# Run tests in watch mode
npm run test:watch

# Run with debug output
npm run test:debug
```

### Environment-Specific Testing

```bash
# Development environment (default)
npm test

# Custom environment
FRONTEND_URL="http://localhost:3000" \
API_URL="http://localhost:8080" \
npm test

# Production environment
FRONTEND_URL="https://forge.yourdomain.com" \
API_URL="https://forge.yourdomain.com" \
npm test
```

### Test Filtering

```bash
# Run only API tests
npm test -- --testPathPattern="api"

# Run only full-flow tests  
npm test -- --testPathPattern="full-flow"

# Run specific test by name
npm test -- --testNamePattern="health endpoint"

# Skip browser tests
npm test -- --testPathIgnorePatterns="login.test.js"
```

## Writing New Tests

### Test File Structure

```javascript
const fetch = require('node-fetch');

describe('Feature Name Tests', () => {
  const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:8888';
  const API_URL = process.env.API_URL || 'http://localhost:8888';
  
  beforeAll(async () => {
    // Setup code
  });
  
  afterAll(async () => {
    // Cleanup code
  });
  
  test('should do something specific', async () => {
    // Test implementation
  });
});
```

### API Test Example

```javascript
test('should create and retrieve project', async () => {
  // 1. Login to get auth token
  const loginResponse = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@forge.local',
      password: 'admin123'
    })
  });
  
  const { token } = await loginResponse.json();
  
  // 2. Create project
  const createResponse = await fetch(`${API_URL}/api/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      name: 'Test Project',
      description: 'Test project description'
    })
  });
  
  expect(createResponse.status).toBe(201);
  
  const project = await createResponse.json();
  expect(project.name).toBe('Test Project');
  
  // 3. Retrieve project
  const getResponse = await fetch(`${API_URL}/api/projects/${project.id}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  expect(getResponse.status).toBe(200);
});
```

### Browser Test Example (Puppeteer)

```javascript
const puppeteer = require('puppeteer');

describe('UI Tests', () => {
  let browser, page;
  
  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  });
  
  beforeEach(async () => {
    page = await browser.newPage();
  });
  
  afterEach(async () => {
    await page.close();
  });
  
  afterAll(async () => {
    await browser.close();
  });
  
  test('should login and navigate to dashboard', async () => {
    await page.goto('http://localhost:8888');
    
    await page.waitForSelector('#email');
    await page.type('#email', 'admin@forge.local');
    await page.type('#password', 'admin123');
    
    await Promise.all([
      page.waitForNavigation(),
      page.click('#login-button')
    ]);
    
    await page.waitForSelector('h1');
    const heading = await page.$eval('h1', el => el.textContent);
    expect(heading).toBe('Dashboard');
  });
});
```

## Debugging Tests

### Verbose Output

```bash
# Enable Jest verbose mode
npm test -- --verbose

# Enable custom debug logging
NODE_ENV=debug npm test
```

### Browser Debugging

```javascript
// Run browser in non-headless mode
const browser = await puppeteer.launch({
  headless: false,  // Show browser window
  slowMo: 250      // Slow down actions
});

// Take screenshots on failure
await page.screenshot({ path: 'debug-screenshot.png' });

// Get page content for debugging
const content = await page.content();
console.log('Page HTML:', content);
```

### Network Debugging

```bash
# Check if services are accessible
curl -v http://localhost:8888/health
curl -v http://localhost:8888/

# Test API endpoints manually
curl -X POST http://localhost:8888/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@forge.local","password":"admin123"}' \
  -v
```

### Common Debug Steps

1. **Verify Infrastructure**:
   ```bash
   cd ../infrastructure && make status
   ```

2. **Check Test User**:
   ```bash
   curl -X POST http://localhost:8888/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@forge.local","password":"admin123"}'
   ```

3. **Inspect Test Output**:
   ```bash
   npm test -- --testNamePattern="failing test" --verbose
   ```

4. **Check Browser Console** (for Puppeteer tests):
   ```javascript
   page.on('console', msg => console.log('PAGE LOG:', msg.text()));
   page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
   ```

## Best Practices

### Test Organization

- **Group related tests** in describe blocks
- **Use descriptive test names** that explain what is being tested
- **Keep tests independent** - each test should be able to run in isolation
- **Clean up after tests** - remove created data, close connections

### API Testing

- **Test both success and failure cases**
- **Validate response status codes AND response data**
- **Test authentication and authorization**
- **Use proper HTTP methods and headers**

### Browser Testing

- **Wait for elements** before interacting with them
- **Use appropriate selectors** (prefer data-testid over CSS selectors)
- **Handle asynchronous operations** properly
- **Take screenshots on failures** for debugging

### Performance

- **Minimize test setup/teardown** time
- **Reuse browser instances** when possible
- **Use appropriate timeouts** for operations
- **Parallel test execution** where safe

### Error Handling

```javascript
test('should handle API errors gracefully', async () => {
  try {
    const response = await fetch(`${API_URL}/api/nonexistent`);
    expect(response.status).toBe(404);
  } catch (error) {
    console.error('Test failed with error:', error);
    throw error;
  }
});
```

## CI/CD Integration

### GitHub Actions

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: forge
          POSTGRES_DB: forge
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
          
      - name: Install dependencies
        run: |
          cd e2e-tests
          npm install
          
      - name: Start Forge infrastructure
        run: |
          cd infrastructure
          terraform init
          terraform apply -auto-approve
          
      - name: Create test user
        run: |
          cd server
          go build -o seed cmd/seed/main.go
          DATABASE_URL="postgres://forge:forge@localhost:5432/forge?sslmode=disable" \
            ./seed -email admin@forge.local -password admin123
            
      - name: Run E2E tests
        run: |
          cd e2e-tests
          FRONTEND_URL="http://localhost:8888" \
          API_URL="http://localhost:8888" \
          npm test
```

### Local CI Testing

```bash
# Simulate CI environment locally
docker run --rm -it \
  -v $(pwd):/workspace \
  -w /workspace \
  node:16 \
  bash -c "cd e2e-tests && npm install && npm test"
```

### Test Reporting

```javascript
// Add to package.json
{
  "scripts": {
    "test:ci": "jest --ci --coverage --testResultsProcessor=jest-junit"
  },
  "devDependencies": {
    "jest-junit": "^13.0.0"
  }
}
```

## Maintenance

### Regular Tasks

1. **Update dependencies**: `npm audit fix`
2. **Review test coverage**: Add tests for new features
3. **Clean up obsolete tests**: Remove tests for deprecated features
4. **Performance monitoring**: Track test execution time
5. **Documentation updates**: Keep guides current

### Monitoring Test Health

```bash
# Run tests with coverage
npm test -- --coverage

# Check for flaky tests
for i in {1..10}; do npm test; done

# Performance monitoring
time npm test
```

For troubleshooting specific issues, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md).