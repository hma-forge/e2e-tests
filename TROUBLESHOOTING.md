# E2E Testing Troubleshooting Guide

Common issues and solutions when running Forge E2E tests.

## Quick Diagnosis

### 🩺 Health Check Commands

```bash
# 1. Check infrastructure status
cd ../infrastructure && ./scripts/status.sh dev

# 2. Test API connectivity
curl http://localhost:8888/health

# 3. Test authentication
curl -X POST http://localhost:8888/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@forge.local","password":"admin123"}'

# 4. Verify frontend
curl http://localhost:8888/ | head -5
```

## Common Issues

### ❌ "Connection refused" / "ECONNREFUSED"

**Symptoms:**
```
Error: connect ECONNREFUSED 127.0.0.1:8888
```

**Causes & Solutions:**

1. **Infrastructure not running**
   ```bash
   cd ../infrastructure
   terraform -chdir=terraform/environments/dev apply
   ```

2. **Wrong port configuration**
   ```bash
   # Check what's running on port 8888
   lsof -i :8888
   
   # Use correct port
   FRONTEND_URL="http://localhost:3000" npm test
   ```

3. **Services not started**
   ```bash
   # Check container status
   docker ps | grep forge
   
   # Restart if needed
   cd ../infrastructure && make destroy-dev && make deploy-dev
   ```

### ❌ "401 Unauthorized" / Login Failures

**Symptoms:**
```
Expected: 200
Received: 401
```

**Causes & Solutions:**

1. **Test user doesn't exist**
   ```bash
   # Create test user
   cd ../server
   GOOS=linux GOARCH=amd64 go build -o bin/seed-linux cmd/seed/main.go
   
   # Copy to dev environment and run
   cd ../infrastructure
   scp -i ./terraform/environments/dev/ssh/id_rsa -P 2222 \
     ../server/bin/seed-linux ubuntu@localhost:/opt/forge/seed
   
   ssh -i ./terraform/environments/dev/ssh/id_rsa -p 2222 ubuntu@localhost \
     "cd /opt/forge && DATABASE_URL='postgres://forge:forge@localhost:5432/forge?sslmode=disable' ./seed -email admin@forge.local -password admin123"
   ```

2. **Wrong credentials**
   ```bash
   # Test with curl
   curl -v -X POST http://localhost:8888/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@forge.local","password":"admin123"}'
   ```

3. **Database connection issues**
   ```bash
   # Check database
   ssh -i ./terraform/environments/dev/ssh/id_rsa -p 2222 ubuntu@localhost \
     "psql postgres://forge:forge@localhost:5432/forge -c 'SELECT email FROM users;'"
   ```

### ❌ "404 Not Found" / API Endpoints

**Symptoms:**
```
Expected: 200
Received: 404
```

**Causes & Solutions:**

1. **nginx configuration issues**
   ```bash
   # Check nginx config
   ssh -i ./terraform/environments/dev/ssh/id_rsa -p 2222 ubuntu@localhost \
     "cat /etc/nginx/sites-available/forge"
   
   # Reload nginx
   ssh -i ./terraform/environments/dev/ssh/id_rsa -p 2222 ubuntu@localhost \
     "sudo nginx -t && sudo service nginx reload"
   ```

2. **Go server not running**
   ```bash
   # Check Go server process
   ssh -i ./terraform/environments/dev/ssh/id_rsa -p 2222 ubuntu@localhost \
     "ps aux | grep forge-server"
   
   # Restart if needed
   ssh -i ./terraform/environments/dev/ssh/id_rsa -p 2222 ubuntu@localhost \
     "cd /opt/forge && nohup ./forge-server > server.log 2>&1 &"
   ```

3. **Wrong API endpoints**
   ```bash
   # Test specific endpoints
   curl http://localhost:8888/health      # Should return JSON
   curl http://localhost:8888/api/user    # Should return 401
   curl -X POST http://localhost:8888/login  # Should accept POST
   ```

### ❌ "socket hang up" / Puppeteer Issues

**Symptoms:**
```
Error: socket hang up
```

**Causes & Solutions:**

1. **Chrome/Chromium not available**
   ```bash
   # Install Chrome dependencies (macOS)
   brew install chromium
   
   # Or install with bundled Chrome
   npm install puppeteer --ignore-scripts=false
   ```

2. **Headless browser issues**
   ```javascript
   // In test file, try non-headless mode
   const browser = await puppeteer.launch({
     headless: false,  // Show browser window
     args: [
       '--no-sandbox',
       '--disable-setuid-sandbox',
       '--disable-dev-shm-usage'
     ]
   });
   ```

3. **Network timeouts**
   ```javascript
   // Increase timeouts
   await page.goto(BASE_URL, { 
     waitUntil: 'networkidle0',
     timeout: 30000 
   });
   ```

4. **Skip Puppeteer tests for now**
   ```bash
   # Run only working tests
   npm test -- --testPathIgnorePatterns="login.test.js"
   ```

### ❌ "Invalid JSON response" / HTML Instead of JSON

**Symptoms:**
```
FetchError: invalid json response body reason: Unexpected token '<'
```

**Causes & Solutions:**

1. **nginx serving HTML instead of proxying**
   ```bash
   # Check if endpoint returns HTML
   curl -i http://localhost:8888/health
   
   # Should return JSON, not HTML
   ```

2. **Missing nginx location blocks**
   ```bash
   # Check nginx config has proxy rules for API endpoints
   ssh -i ./terraform/environments/dev/ssh/id_rsa -p 2222 ubuntu@localhost \
     "grep -A 5 'location /health' /etc/nginx/sites-available/forge"
   ```

3. **Redeploy nginx configuration**
   ```bash
   cd ../infrastructure
   ansible-playbook -i ansible/inventories/dev/hosts.yml \
     ansible/playbooks/deploy.yml --limit dev-forge-vps \
     --start-at-task "Configure nginx for Forge application"
   ```

### ❌ Test Timeouts

**Symptoms:**
```
Timeout - Async callback was not invoked within the 5000ms timeout
```

**Solutions:**

1. **Increase Jest timeout**
   ```javascript
   // In test file
   jest.setTimeout(30000);  // 30 seconds
   
   // Or per test
   test('slow test', async () => {
     // test code
   }, 30000);
   ```

2. **Increase individual timeouts**
   ```javascript
   // Puppeteer
   await page.waitForSelector('#element', { timeout: 10000 });
   
   // Fetch
   const response = await fetch(url, { timeout: 10000 });
   ```

### ❌ Database Connection Issues

**Symptoms:**
```
Error: connection to server failed
```

**Solutions:**

1. **Check PostgreSQL is running**
   ```bash
   ssh -i ./terraform/environments/dev/ssh/id_rsa -p 2222 ubuntu@localhost \
     "service postgresql status"
   ```

2. **Check database exists**
   ```bash
   ssh -i ./terraform/environments/dev/ssh/id_rsa -p 2222 ubuntu@localhost \
     "psql postgres://forge:forge@localhost:5432/forge -c '\l'"
   ```

3. **Run migrations**
   ```bash
   ssh -i ./terraform/environments/dev/ssh/id_rsa -p 2222 ubuntu@localhost \
     "cd /opt/forge && DATABASE_URL='postgres://forge:forge@localhost:5432/forge?sslmode=disable' ./seed -email admin@forge.local -password admin123"
   ```

## Environment-Specific Issues

### Development Environment

1. **Port conflicts**
   ```bash
   # Check what's using port 8888
   lsof -i :8888
   
   # Kill conflicting process
   kill -9 <PID>
   ```

2. **File permissions**
   ```bash
   # Fix SSH key permissions
   chmod 600 ./terraform/environments/dev/ssh/id_rsa
   ```

### Production Environment

1. **SSL/TLS issues**
   ```bash
   # Test HTTPS endpoints
   curl -k https://your-domain.com/health
   
   # Check certificate
   openssl s_client -connect your-domain.com:443
   ```

2. **Firewall blocking**
   ```bash
   # Check if ports are open
   telnet your-domain.com 80
   telnet your-domain.com 443
   ```

## Debug Tools & Techniques

### Enable Debug Logging

```bash
# Jest verbose output
npm test -- --verbose

# Node.js debug
DEBUG=* npm test

# Custom debug environment
NODE_ENV=debug npm test
```

### Network Debugging

```bash
# Trace network requests
curl -v http://localhost:8888/health

# Check headers
curl -I http://localhost:8888/

# Test with different methods
curl -X GET http://localhost:8888/health
curl -X POST http://localhost:8888/login
```

### Browser Debugging (Puppeteer)

```javascript
// Enable console logging
page.on('console', msg => console.log('PAGE LOG:', msg.text()));
page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

// Take screenshot on error
try {
  await page.click('#button');
} catch (error) {
  await page.screenshot({ path: 'error-screenshot.png' });
  throw error;
}

// Get page content
const content = await page.content();
console.log('Page HTML:', content);
```

### Database Debugging

```bash
# Connect to database
ssh -i ./terraform/environments/dev/ssh/id_rsa -p 2222 ubuntu@localhost \
  "psql postgres://forge:forge@localhost:5432/forge"

# Check user table
# In psql:
\d users
SELECT * FROM users;
```

## Recovery Procedures

### Complete Reset

```bash
# 1. Destroy infrastructure
cd ../infrastructure
terraform -chdir=terraform/environments/dev destroy -auto-approve

# 2. Rebuild everything
terraform -chdir=terraform/environments/dev apply -auto-approve

# 3. Redeploy applications
ansible-playbook -i ansible/inventories/dev/hosts.yml ansible/playbooks/deploy.yml

# 4. Create test user
# ... (see above)

# 5. Run tests
cd ../e2e-tests && npm test
```

### Partial Reset

```bash
# Reset just the application (keep infrastructure)
cd ../infrastructure
ansible-playbook -i ansible/inventories/dev/hosts.yml \
  ansible/playbooks/deploy.yml --limit dev-forge-vps
```

## Getting Help

### Log Files

```bash
# Infrastructure logs
cd ../infrastructure && ./scripts/status.sh dev

# Application logs
ssh -i ./terraform/environments/dev/ssh/id_rsa -p 2222 ubuntu@localhost \
  "tail -f /opt/forge/server.log"

# nginx logs
ssh -i ./terraform/environments/dev/ssh/id_rsa -p 2222 ubuntu@localhost \
  "tail -f /var/log/nginx/error.log"
```

### System Information

```bash
# Container info
docker ps -a
docker logs <container-id>

# System resources
ssh -i ./terraform/environments/dev/ssh/id_rsa -p 2222 ubuntu@localhost \
  "top -bn1 | head -20"
```

### Test Information

```bash
# Jest configuration
cat package.json | grep -A 10 '"jest"'

# Node.js version
node --version

# NPM packages
npm list
```

Still having issues? Check the main [README.md](README.md) or [TESTING_GUIDE.md](TESTING_GUIDE.md) for more information.