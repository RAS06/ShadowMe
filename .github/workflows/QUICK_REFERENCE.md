# 🚀 CI/CD Quick Reference

## What Runs Automatically

Every time you **create or update a pull request**, the following checks run automatically:

### ✅ Backend Unit Tests
- **What:** 63 Jest tests
- **Database:** MongoDB 6.0
- **Time:** ~45 seconds
- **Coverage:** Uploaded as artifact

### ✅ Frontend Unit Tests
- **What:** 51 Vitest tests
- **Environment:** jsdom
- **Time:** ~23 seconds
- **Coverage:** Uploaded as artifact

### ✅ Docker Build Test
- **What:** Builds all 3 services
- **Services:** backend, frontend, database
- **Time:** ~2-3 minutes
- **Cache:** Enabled for speed

### ✅ Security Scan
- **What:** npm audit on dependencies
- **Level:** Moderate severity
- **Time:** ~18 seconds

### ✅ PR Validation
- **What:** Title format, merge conflicts
- **Time:** ~5 seconds

## How to View Results

1. **In Your PR:** Scroll to bottom → See check status
2. **Details:** Click "Details" next to any check
3. **Logs:** View full logs in Actions tab
4. **Coverage:** Download from Artifacts section

## Common Status Messages

| Icon | Status | Meaning |
|------|--------|---------|
| 🟡 | Pending | Tests are running |
| ✅ | Success | All tests passed |
| ❌ | Failed | Some tests failed |
| ⚠️ | Warning | Non-blocking issue |

## What to Do When Tests Fail

### Backend Tests Failed
```bash
cd backend
npm test
# Fix the failing test
git add .
git commit -m "fix: resolve test failure"
git push
```

### Frontend Tests Failed
```bash
cd frontend
npm test
# Fix the failing test
git add .
git commit -m "fix: resolve test failure"
git push
```

### Docker Build Failed
```bash
docker compose build
# Fix Dockerfile or dependencies
git add .
git commit -m "fix: resolve build issue"
git push
```

### Security Issues Found
```bash
npm audit fix
# Review and commit changes
git add package*.json
git commit -m "fix: update vulnerable dependencies"
git push
```

## Running Tests Locally (Before Pushing)

```bash
# Quick check (recommended before every push)
cd backend && npm test && cd ../frontend && npm test

# Full check (recommended before creating PR)
cd backend && npm test
cd ../frontend && npm test
docker compose build
npm audit
```

## PR Workflow

```
1. Create branch → git checkout -b feature/my-feature
2. Make changes → git add . && git commit -m "feat: add feature"
3. Push → git push origin feature/my-feature
4. Create PR → CI runs automatically ⚡
5. Wait for checks → All must pass ✅
6. Request review → Reviewer approves
7. Merge → Done! 🎉
```

## Helpful Commands

```bash
# View CI logs locally
docker compose logs backend
docker compose logs frontend

# Run specific test file
cd backend && npm test -- auth.test.js
cd frontend && npm test -- Login.test.jsx

# Watch mode for development
cd backend && npm test -- --watch
cd frontend && npm test

# Check test coverage
cd backend && npm test -- --coverage
cd frontend && npm run test:coverage
```

## Tips for Faster CI

✅ **DO:**
- Run tests locally before pushing
- Keep commits small and focused
- Fix CI failures immediately
- Use descriptive commit messages

❌ **DON'T:**
- Push without testing locally
- Ignore CI failures
- Force push without checking CI
- Merge with failing tests

## Emergency: Skip CI (USE SPARINGLY)

If you absolutely must merge without CI:
1. Get admin approval
2. Use `[skip ci]` in commit message
3. Fix issues in follow-up PR immediately

**Note:** Branch protection may prevent this!

## Support

- **CI Logs:** GitHub Actions tab
- **Documentation:** `.github/workflows/README.md`
- **Issues:** Open issue with `ci/cd` label
- **Questions:** Ask in team chat

## Badges

Add to your PR description to show status:
```markdown
[![CI](https://github.com/RAS06/ShadowMe/actions/workflows/ci.yml/badge.svg?branch=your-branch)](https://github.com/RAS06/ShadowMe/actions/workflows/ci.yml)
```

---

**Remember:** CI is here to help you catch issues early! 🛡️
