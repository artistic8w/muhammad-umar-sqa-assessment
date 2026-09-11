# Restful-Booker Platform — SQA Assessment

Automated test suite for the **Restful-Booker Platform**, covering both the REST API (`restful-booker.herokuapp.com`) and the Web UI (`automationintesting.online`). Built with [Playwright](https://playwright.dev) and TypeScript using the Page Object Model.

**Author:** Muhammad Umar

---

## Tech Stack

- [Playwright Test](https://playwright.dev) — test runner & browser automation
- TypeScript (ESM, `NodeNext` module resolution)
- Page Object Model for UI tests, dedicated API client for REST tests
- GitHub Actions for CI

---

## Project Structure

```
├── tests/
│   ├── api/                # REST API tests (auth, booking CRUD, bonus scenarios)
│   └── ui/                 # UI tests (login, contact form, room creation)
├── pages/                  # Page Object classes (BasePage, AdminLoginPage, AdminDashboardPage, ContactPage)
├── utils/                  # API client & test data generators
├── playwright.config.ts    # Playwright configuration
├── tsconfig.json           # TypeScript configuration (strict, NodeNext)
├── TEST-PLAN.md            # Test strategy, scope, risk-based coverage matrix
├── BUG-REPORT.md           # Documented defects found during testing
└── .github/workflows/      # CI pipeline (GitHub Actions)
```

---

## Getting Started

### Prerequisites
- Node.js (LTS recommended)
- npm

### Installation

```bash
git clone https://github.com/artistic8w/muhammad-umar-sqa-assessment.git
cd muhammad-umar-sqa-assessment
npm install
npx playwright install --with-deps
```

### Environment Setup

Copy the example env file and fill in the values:

```bash
cp .env.example .env
```

```env
# Web UI Configuration & Credentials
UI_BASE_URL=
UI_ADMIN_USERNAME=
UI_ADMIN_PASSWORD=

# REST API Configuration & Credentials
API_BASE_URL=
API_ADMIN_USERNAME=
API_ADMIN_PASSWORD=
```

> `.env` is git-ignored and never committed. Never commit real credentials.

---

## Running Tests

| Command | Description |
| :--- | :--- |
| `npm test` | Run the full suite (API + UI) |
| `npm run test:api` | Run API tests only |
| `npm run test:ui` | Run UI tests only |
| `npm run test:ui:headed` | Run UI tests in headed (visible browser) mode |
| `npm run test:ui:debug` | Open Playwright's interactive UI mode for debugging |
| `npm run test:smoke` | Run tests tagged `@smoke` |
| `npm run test:regression` | Run tests tagged `@regression` |
| `npm run report` | Open the last generated HTML report |

After a run, view the results with:
```bash
npx playwright show-report
```

---

## Test Coverage

- **API:** Authentication (`POST /auth`), full Booking CRUD lifecycle, payload/schema validation, and negative/error-handling scenarios.
- **UI:** Admin login, room creation workflow (including feature checkboxes and validation), and public contact form (happy path + validation errors).

Tests are tagged `@smoke` and `@regression` to support targeted execution in CI or locally. Full scope, risk analysis, and coverage rationale are documented in [`TEST-PLAN.md`](./TEST-PLAN.md).

---

## Continuous Integration

Every push and pull request to `main`/`master` triggers the [Playwright Tests workflow](./.github/workflows/playwright.yml), which installs dependencies, installs browsers, runs the full suite, and uploads the HTML report as a build artifact (retained for 30 days).

---

## Known Issues

Defects identified during exploratory and automated testing — including incorrect HTTP status codes on the API and missing validation on the Admin UI — are documented in [`BUG-REPORT.md`](./BUG-REPORT.md).
