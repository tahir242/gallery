# 🤝 Contributing to Gallery

First off, **thank you** for taking the time to contribute! 🎉
Every contribution — bug fixes, features, documentation, or even typo corrections — is valued and appreciated.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [What Can I Contribute?](#what-can-i-contribute)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Commit Message Convention](#commit-message-convention)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)
- [Style Guidelines](#style-guidelines)
- [Need Help?](#need-help)

---

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before contributing.

---

## What Can I Contribute?

### 🟢 Great for beginners (`good first issue`)
Looking for your first contribution? Check out issues labeled [`good first issue`](../../labels/good%20first%20issue):
- Fixing typos or improving documentation
- Adding missing API documentation
- Improving error messages to be more descriptive
- Adding keyboard shortcuts
- Writing or improving tests

### 🟡 Intermediate (`help wanted`)
Issues labeled [`help wanted`](../../labels/help%20wanted) are a step up:
- Implementing roadmap features (see [ROADMAP.md](ROADMAP.md))
- Performance improvements
- Adding support for new file types
- Improving accessibility (a11y)

### 🔴 Advanced (reach out first)
For large architectural changes, please **open an issue for discussion** before writing code. This saves everyone time.

---

## Getting Started

### Prerequisites
- **Node.js** >= 22.5 (uses built-in SQLite support)
- **npm** >= 9
- **Git**

### 1. Fork & Clone

```bash
# Fork the repo on GitHub, then:
git clone https://github.com/YOUR-USERNAME/gallery.git
cd gallery
```

### 2. Install All Dependencies

```bash
npm run install:all
```
This installs dependencies for the root, `server/`, and `client/` in one command.

### 3. Set Up Environment (Optional)

```bash
# Copy the example env if needed
cp server/.env.example server/.env
```

Edit `server/.env` to configure your port or custom data directory.

### 4. Start Development Servers

```bash
npm run dev
```
- **Backend** runs at `http://localhost:5000`
- **Frontend** runs at `http://localhost:5173`

You should see the Gallery UI load in your browser. If you hit any issue, check the [Developer Guide](docs/DEVELOPMENT.md).

---

## Development Workflow

```
main (stable)
 └── community/your-feature-branch  ← you work here
```

1. **Always branch from `main`:**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** in small, focused commits.

3. **Test your changes** manually by running the app.

4. **Push and open a PR** against `main`.

---

## Commit Message Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <short description>

[optional body]
[optional footer]
```

| Type | When to use |
|------|------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no logic change |
| `refactor` | Code restructure, no feature/fix |
| `perf` | Performance improvement |
| `test` | Adding or fixing tests |
| `chore` | Build scripts, dependencies, config |

**Examples:**
```bash
feat: add collage maker for multiple photo selection
fix: resolve thumbnail not loading on network paths
docs: update API reference with new /favorites endpoint
chore: upgrade sharp to v0.33
```

---

## Pull Request Guidelines

1. **One PR = one logical change.** Avoid bundling unrelated changes.
2. **Reference the issue** your PR closes: `Closes #42`
3. **Fill in the PR template** completely — screenshots help a lot for UI changes.
4. **Keep PRs small** when possible. Large PRs take longer to review.
5. **Be responsive** to review feedback — address comments within a week.
6. **Don't force-push** after a review has started (add new commits instead).

PRs must pass the CI checks before they can be merged.

---

## Reporting Bugs

1. **Search existing issues** first — it may already be reported.
2. Use the [🐛 Bug Report](.github/ISSUE_TEMPLATE/bug_report.md) template.
3. Include your **OS, Node.js version, and Gallery version**.
4. Attach **screenshots or console logs** when possible.

---

## Suggesting Features

1. Check the [ROADMAP.md](ROADMAP.md) — it might already be planned.
2. Search [existing feature requests](../../issues?q=label%3Aenhancement).
3. Use the [✨ Feature Request](.github/ISSUE_TEMPLATE/feature_request.md) template.
4. Explain the **problem it solves**, not just the solution.

---

## Style Guidelines

### JavaScript / React
- Follow the existing patterns in the codebase
- Use **functional components** with React hooks
- Prefer **named exports** over default exports for components
- No `console.log` left in production code (use `console.error` for real errors only)

### CSS / Tailwind
- Use **Tailwind utility classes** — avoid writing custom CSS unless necessary
- Follow **mobile-first** responsive design (`sm:`, `md:`, `lg:`)

### File Naming
| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `MediaGrid.jsx` |
| Hooks | camelCase with `use` prefix | `useMediaQuery.js` |
| API routes | camelCase | `mediaRoutes.js` |
| Utilities | camelCase | `formatBytes.js` |

### Code Comments
- Comment **why**, not **what** (the code shows what)
- Use JSDoc for exported utility functions

---

## Need Help?

- 💬 **Questions?** Open a [Question issue](../../issues/new?template=question.md) or start a [Discussion](../../discussions)
- 📖 **Architecture?** Read the full [Developer Guide](docs/DEVELOPMENT.md)
- 🔐 **Security issue?** See [SECURITY.md](SECURITY.md) — please do **not** open a public issue

We look forward to your contribution! 🚀
