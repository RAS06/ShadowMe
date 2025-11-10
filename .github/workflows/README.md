# GitHub Actions CI/CD Configuration

This directory contains GitHub Actions workflows for automated testing and continuous integration.

## Workflows

### 1. CI - Unit Tests (`ci.yml`)

**Triggers:**
- Pull requests to `main` or `develop` branches
- Direct pushes to `main` branch

**Jobs:**

#### Backend Tests
- Runs on: `ubuntu-latest`
- Node.js version: 18
- MongoDB service: 6.0
- Steps:
  1. Checkout code
  2. Setup Node.js with npm caching
  3. Install dependencies with `npm ci`
  4. Run tests with Jest
  5. Upload test coverage artifacts

**Environment Variables:**
- `MONGO_URI`: mongodb://localhost:27017/shadowme-test
- `JWT_SECRET`: test-jwt-secret-key-for-ci
- `NODE_ENV`: test

#### Frontend Tests
- Runs on: `ubuntu-latest`
- Node.js version: 18
- Steps:
  1. Checkout code
  2. Setup Node.js with npm caching
  3. Install dependencies with `npm ci`
  4. Run tests with Vitest
  5. Upload test coverage artifacts

#### Test Summary
- Aggregates results from both test jobs
- Creates GitHub Step Summary with test results
- Fails if any test job fails

### 2. Pull Request Checks (`pr-checks.yml`)

**Triggers:**
- Pull request opened, synchronized, or reopened

**Jobs:**

#### PR Validation
- Validates PR title format (semantic commit style)
- Checks for merge conflicts with main branch

#### Code Quality Checks
- Installs dependencies for both backend and frontend
- Prepares for future linting/formatting checks

#### Docker Build Test
- Uses Docker Buildx for efficient builds
- Tests building all three service images:
  - Backend (shadowme-backend)
  - Frontend (shadowme-frontend, development target)
  - Database (shadowme-database)
- Utilizes GitHub Actions cache for faster builds

#### Security Vulnerability Scan
- Runs `npm audit` on backend dependencies
- Runs `npm audit` on frontend dependencies
- Continues on error (warnings only)
- Audit level: moderate

#### Test Results Summary
- Runs after all checks complete
- Generates markdown summary table
- Shows status of all checks

## Test Results

### Current Test Coverage

**Backend:** 63/63 tests passing ✅
- JWT token validation (8 tests)
- Database operations (13 tests)
- Authentication API (5 tests)
- Admin API (15 tests)
- Appointments API (22 tests)

**Frontend:** 19/51 tests passing ⚠️
- Dashboard component (10/10 passing)
- NavBar component (7/7 passing)
- Geolocation mocking (4/8 passing)
- Login/Signup components (partial)

## Artifacts

Test coverage reports are uploaded as artifacts and retained for 7 days:
- `backend-test-results` - Backend coverage reports
- `frontend-test-results` - Frontend coverage reports

## Branch Protection

Recommended branch protection rules for `main`:

```yaml
Required status checks:
  - Backend Unit Tests
  - Frontend Unit Tests
  - Docker Build Test
  - Security Vulnerability Scan

Require branches to be up to date: true
Require pull request reviews: 1
Dismiss stale reviews: true
```

## Local Testing

Before pushing, run tests locally to catch issues early:

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# Docker build test
docker compose build

# Security audit
npm audit
```

## Continuous Integration Flow

```
┌─────────────────┐
│   Push to PR    │
└────────┬────────┘
         │
         ├─────────────────────────────────────┐
         │                                     │
         ▼                                     ▼
┌─────────────────┐                 ┌─────────────────┐
│   Unit Tests    │                 │   PR Checks     │
│                 │                 │                 │
│ • Backend (63)  │                 │ • Validation    │
│ • Frontend (51) │                 │ • Code Quality  │
│                 │                 │ • Docker Build  │
│ • MongoDB       │                 │ • Security Scan │
└────────┬────────┘                 └────────┬────────┘
         │                                     │
         └─────────────┬───────────────────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ Test Summary    │
              │                 │
              │ ✅ All Pass →   │
              │    Merge Ready  │
              │                 │
              │ ❌ Any Fail →   │
              │    Fix Required │
              └─────────────────┘
```

## Troubleshooting

### Tests Failing in CI but Passing Locally

1. **Check Node.js version**: CI uses Node 18, ensure local matches
2. **Environment variables**: CI uses test-specific values
3. **Database state**: CI uses fresh MongoDB instance
4. **Dependencies**: CI uses `npm ci` (clean install)

### Docker Build Failures

1. **Context issues**: Ensure Dockerfiles reference correct paths
2. **Multi-stage builds**: Verify target stages exist
3. **Build cache**: Clear cache if using outdated layers

### MongoDB Connection Issues

1. **Service health check**: MongoDB must pass health check
2. **Connection string**: Uses localhost:27017 in CI
3. **Database name**: Uses shadowme-test database

## Future Enhancements

- [ ] Add code coverage thresholds (80% minimum)
- [ ] Implement ESLint/Prettier checks
- [ ] Add end-to-end tests with Playwright
- [ ] Deploy preview environments for PRs
- [ ] Add performance benchmarking
- [ ] Integrate with SonarQube for code quality
- [ ] Add automatic dependency updates (Dependabot)
- [ ] Implement semantic versioning automation

## Monitoring

View CI/CD status:
- GitHub Actions tab: https://github.com/RAS06/ShadowMe/actions
- PR checks: Automatically displayed on each pull request
- Main branch status: Badge in main README (coming soon)

## Support

For CI/CD issues:
1. Check the Actions tab for detailed logs
2. Review this documentation
3. Contact the development team
4. Open an issue with the `ci/cd` label
