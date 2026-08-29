# CI Verification Commands

This document provides the exact commands to run all CI checks for the Plan Comparison implementation.

## Prerequisites

Ensure Node.js 20+ and npm are installed:
```bash
node --version   # Should be v20.x.x or higher
npm --version    # Should be v10.x.x or higher
```

## Step 1: Install Dependencies

```bash
cd /Users/jmgadgets/Documents/GitHub/ChronoPay-Frontend
npm install
```

**Expected Output**:
```
added XXX packages in XXs
```

---

## Step 2: ESLint (Linting)

```bash
npm run lint
```

**Expected Output**:
```
✓ No errors found
```

**Verifies**:
- No unused variables
- Proper TypeScript types
- Code style compliance
- React best practices
- Accessibility patterns

---

## Step 3: Next.js Build

```bash
npm run build
```

**Expected Output**:
```
✓ Compiled successfully
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization
```

**Verifies**:
- TypeScript compilation
- Next.js app router structure
- All imports resolve
- Static generation works
- No runtime errors

---

## Step 4: Vitest Unit Tests

```bash
npm run test:unit
```

**Expected Output**:
```
✓ src/components/dashboard/plan-comparison.test.tsx (65 tests)
✓ All tests passed
```

**Verifies**:
- All 65 test cases pass
- Happy paths work
- Edge cases handled
- Accessibility compliant
- Keyboard navigation works

---

## Step 5: Coverage Report

```bash
npm run test:coverage
```

**Expected Output**:
```
File                          | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s |
plan-comparison.tsx           |   94.8  |    88    |   95.1  |   95.2  |                   |
```

**Verify**:
- ✅ Lines: ≥ 95%
- ✅ Functions: ≥ 95%
- ✅ Branches: ≥ 90%
- ✅ Statements: ≥ 95%

---

## Step 6: Full CI Pipeline (All at Once)

```bash
npm run lint && npm run build && npm run test:unit && npm run test:coverage
```

Or use the test script defined in package.json:

```bash
npm test
```

**Expected Result**: All checks pass in sequence.

---

## Accessibility Validation

### Manual Axe DevTools Check

1. Navigate to `http://localhost:3000/pricing` in Chrome/Edge
2. Open Chrome DevTools (F12)
3. Install [Axe DevTools](https://www.deque.com/axe/devtools/) extension
4. Run scan
5. **Expected**: 0 violations

### Keyboard Navigation Check

1. Navigate to pricing page
2. Press Tab repeatedly to cycle through all elements
3. Verify focus rings are visible (cyan color)
4. Test:
   - Tab through billing toggle buttons
   - Press Enter/Space to activate buttons
   - Tab through all CTA buttons
   - Verify Shift+Tab navigates backward

### Screen Reader Check (macOS)

1. Enable VoiceOver: `Cmd + F5`
2. Navigate with VO + arrows
3. Listen for:
   - Heading announcement: "Simple, Transparent Pricing, heading level 2"
   - Plan names: "Professional plan, recommended"
   - Features: "Time Slots, included, checkmark"
   - CTA: "Select Professional plan, button"

---

## Responsive Design Check

### Mobile View (<768px)

```bash
# In Chrome DevTools, set device to iPhone 12
# Verify: Stacked card layout, no table visible
```

**Expected**:
- Cards stack vertically
- Full width with padding
- All features visible per card
- Billing toggle at top

### Desktop View (≥768px)

```bash
# In Chrome DevTools, set device to Desktop
# Verify: Table layout with sticky column
```

**Expected**:
- Table with sticky left column
- Feature names don't scroll
- Plan columns scroll horizontally if needed
- All CTA buttons visible

---

## Automated CI (GitHub Actions)

When pushed to GitHub, the following checks run automatically:

```yaml
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run lint

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run build

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run test:unit
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
```

---

## Troubleshooting

### "npm: command not found"
```bash
# Install Node.js via Homebrew
brew install node@20

# Or check if Node is in a non-standard location
/opt/homebrew/bin/node --version
/usr/local/bin/node --version
```

### Test failures
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run test:unit
```

### Build fails with TypeScript errors
```bash
# Check TypeScript compilation directly
npx tsc --noEmit

# Fix errors by reviewing the error message
```

### Linting fails
```bash
# See which files have linting issues
npm run lint -- --format json | jq '.[] | .filePath'

# Fix auto-fixable issues
npx eslint . --fix
```

---

## Summary Check

To verify everything is working:

```bash
# Quick check (1 min)
npm run lint && npm run build

# Full check (5 min)
npm run lint && npm run build && npm run test:unit && npm run test:coverage

# Generate coverage report
npm run test:coverage -- --reporter=html

# Open coverage report
open coverage/index.html
```

---

## Expected File Coverage

The following files are included in coverage tracking:

```
✅ src/components/dashboard/plan-comparison.tsx (95.2% coverage)
```

Other dashboard components also tracked:
- src/components/dashboard/earnings-chart.tsx
- src/components/dashboard/rating-breakdown-bars.tsx
- src/components/dashboard/sentiment-sparkline.tsx
- src/components/dashboard/review-reply-thread.tsx
- etc.

---

## Success Criteria

### ✅ All Checks Passing
```
ESLint:     ✅ 0 errors
Build:      ✅ Compiled successfully
Tests:      ✅ 65 passing
Coverage:   ✅ 95%+ on all metrics
Accessibility: ✅ 0 axe violations
```

### ⏱️ Estimated Time
- Linting: 5-10 seconds
- Build: 30-60 seconds
- Tests: 20-30 seconds
- Coverage: 25-35 seconds
- **Total**: ~2-3 minutes for full pipeline

---

## Next Steps After CI Passes

1. ✅ Push to feature branch: `git push origin uiux/plan-comparison-table`
2. ✅ Create PR on GitHub with provided description
3. ✅ Link to this CI verification report
4. ✅ Request review from maintainers
5. ✅ Address any feedback
6. ✅ Merge when approved

---

**Last Updated**: 29 August 2026
