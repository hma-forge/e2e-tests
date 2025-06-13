# Forge E2E Tests Directory Structure

## 📁 Directory Organization

```
tests/
├── backend/           # 🔧 Pure backend API tests
├── integration/       # 🔄 Full system integration tests  
├── ui/               # 🎭 UI component & interaction tests
└── flows/            # 🚀 Complete end-to-end user flows
```

## 🔧 Backend Tests (`tests/backend/`)

**Purpose**: Test backend APIs independently without browser
**Framework**: Jest + node-fetch
**Speed**: ~0.5s per suite

```
backend/
├── health.test.js      # System health & infrastructure
└── auth-api.test.js    # Authentication API endpoints
```

**Run Commands**:
```bash
npm run test:backend        # All backend tests
npm run test:health         # Health checks only
npm run test:auth          # Auth API only
```

## 🔄 Integration Tests (`tests/integration/`)

**Purpose**: Test complete system integration (backend + frontend together)
**Framework**: Jest + node-fetch
**Speed**: ~1s per suite

```
integration/
└── integration.test.js  # End-to-end API + frontend integration
```

**Run Commands**:
```bash
npm run test:integration   # Full system integration
```

## 🎭 UI Tests (`tests/ui/`)

**Purpose**: Test individual UI components and navigation
**Framework**: Jest + Puppeteer
**Speed**: ~2-3s per suite

```
ui/
├── ui-components.test.js   # Login forms, buttons, elements
└── routing.test.js         # Navigation, 404s, redirects
```

**Run Commands**:
```bash
npm run test:ui            # All UI tests
npm run test:ui:components # Component tests only
npm run test:ui:routing    # Routing tests only
npm run test:ui:visual     # With browser window visible
```

## 🚀 Flow Tests (`tests/flows/`)

**Purpose**: Test complete user journeys from start to finish
**Framework**: Jest + Puppeteer  
**Speed**: ~5-10s per suite

```
flows/
└── user-flows.test.js     # Login → Dashboard → Logout flows
```

**Run Commands**:
```bash
npm run test:flows         # All user flows
npm run test:flows:visual  # With browser window visible
```

## 🎯 Common Usage Patterns

### Quick Development Workflow
```bash
# Fast feedback during development
npm run test:quick         # Health + Integration (~1s)

# UI debugging
npm run test:ui:visual     # See UI tests with browser window

# E2E debugging  
npm run test:flows:visual  # See user flows with browser window
```

### Component-Specific Testing
```bash
# When working on login form
npm run test:ui:components

# When working on navigation
npm run test:ui:routing

# When working on complete flows
npm run test:flows
```

### Problem Diagnosis
```bash
# Backend broken?
npm run test:backend

# Frontend broken?
npm run test:ui

# Integration issues?
npm run test:integration

# User flow problems?
npm run test:flows
```

### Visual Debugging
```bash
# See exactly what's happening
npm run test:ui:visual
npm run test:flows:visual
npm run test:browser:visual  # All browser tests with window
```

### Complete Testing
```bash
npm run test:all           # Everything (backend + integration + browser)
npm run test:browser       # All browser tests (ui + flows)
npm run test:ci            # CI/CD pipeline tests
```

## 🚀 Future Expansion

As Forge grows, add new test files following this pattern:

```
backend/
├── projects-api.test.js    # Project management APIs
├── websocket-api.test.js   # Real-time communication APIs
└── deployment-api.test.js  # Infrastructure APIs

ui/
├── projects-ui.test.js     # Project management UI
├── settings-ui.test.js     # Settings & configuration UI
└── dashboard-ui.test.js    # Dashboard components

flows/
├── project-flows.test.js   # Project creation & management flows
├── deployment-flows.test.js # Infrastructure deployment flows
└── collaboration-flows.test.js # Multi-user workflows

integration/
├── github-integration.test.js  # GitHub API integration
├── claude-integration.test.js  # Claude CLI integration  
└── monitoring-integration.test.js # Monitoring & logging
```

## 💡 Best Practices

1. **Single Responsibility**: Each test file tests one specific area
2. **Clear Naming**: File names clearly indicate what they test
3. **Visual Debugging**: Use `:visual` scripts when developing
4. **Fast Feedback**: Run specific test categories during development
5. **Comprehensive Coverage**: Use `test:all` before committing

## 🛠️ Development Tips

- **Start with UI tests** when building new components
- **Use visual mode** when tests fail to see what's happening
- **Run backend tests first** when diagnosing system issues
- **Use integration tests** to verify complete system functionality
- **Add flow tests** for critical user journeys

This structure scales perfectly as Forge grows! 🚀