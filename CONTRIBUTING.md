# Contributing to RollCall

Thank you for your interest in contributing to RollCall! This document outlines the process for contributing to this project.

## 🎯 Ways to Contribute

- **Bug Reports** — Found an issue? Let us know!
- **Feature Requests** — Have an idea? We'd love to hear it.
- **Code Contributions** — Fix bugs, add features, improve performance.
- **Documentation** — Improve README, add code comments, write guides.
- **Translations** — Help improve Amharic translations or add new languages.
- **Testing** — Write unit tests, test on different devices/browsers.

## 🚀 Getting Started

1. **Fork** the repository
2. **Clone** your fork locally
   ```bash
   git clone https://github.com/YOUR-USERNAME/student-attendance-app.git
   cd student-attendance-app
   ```
3. **Install dependencies**
   ```bash
   npm install
   ```
4. **Create a branch** for your change
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```
5. **Make your changes** — Follow the code style and conventions
6. **Test your changes**
   ```bash
   npm run dev    # Test locally
   npm test       # Run unit tests
   npm run lint   # Type-check
   ```
7. **Commit** with clear messages
   ```bash
   git commit -m "feat: add weekly attendance trend chart"
   # or
   git commit -m "fix: resolve offline sync issue on iOS Safari"
   ```
8. **Push** to your fork
   ```bash
   git push origin feature/your-feature-name
   ```
9. **Open a Pull Request** against the `main` branch

## 📝 Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

| Type | Description |
|------|-------------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation changes |
| `style:` | Formatting, missing semicolons, etc. |
| `refactor:` | Code restructuring without behavior change |
| `test:` | Adding or updating tests |
| `chore:` | Maintenance tasks, dependency updates |
| `perf:` | Performance improvements |

Examples:
```
feat: add termly report export to PDF
fix: correct Ethiopian date conversion for leap years
docs: update README with mobile build instructions
refactor: extract attendance calculation hooks
```

## 🎨 Code Style Guidelines

- **TypeScript** — Strict mode enabled; avoid `any`
- **React** — Functional components with hooks; prefer composition
- **Tailwind CSS** — Utility-first; avoid custom CSS when possible
- **File Naming** — PascalCase for components (`StudentCard.tsx`), camelCase for utilities (`timeUtils.ts`)
- **Imports** — Group: React, third-party, internal (`@/utils/...`), relative (`./Component`)
- **Comments** — JSDoc for exported functions; inline for complex logic

## 🧪 Testing

- Write tests for new utilities in `src/utils/**/*.test.ts`
- Run `npm test` before submitting
- Aim for meaningful coverage of business logic (attendance calculations, date conversions, export formatting)

## 🌐 Translation Guidelines

- Amharic translations live in `src/i18n/translations.ts`
- Keep keys consistent between `en` and `am` objects
- Use formal/respectful Amharic suitable for educational contexts
- Test RTL layout after translation changes

## 📱 Mobile Considerations

- Test on Android Chrome and iOS Safari
- Verify safe-area insets (notch, Dynamic Island)
- Check PWA install flow on both platforms
- Ensure touch targets meet 44×44pt minimum

## 🔍 Pull Request Checklist

Before submitting, ensure:

- [ ] Code passes `npm run lint` (TypeScript strict check)
- [ ] All tests pass (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] Changes are tested manually in browser
- [ ] Mobile layout verified (responsive dev tools)
- [ ] No console errors or warnings
- [ ] Commit messages follow convention
- [ ] PR description explains *what* and *why*

## 💬 Questions?

Open a [Discussion](https://github.com/your-username/student-attendance-app/discussions) or [Issue](https://github.com/your-username/student-attendance-app/issues) — we're happy to help!

---

**Thank you for contributing to RollCall!** 🎓