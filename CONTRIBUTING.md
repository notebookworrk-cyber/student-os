# Contributing to Student OS

Thank you for considering contributing to Student OS!

## Code of Conduct

This project follows our [Code of Conduct](CODE_OF_CONDUCT.md).

## Development Setup

```bash
git clone https://github.com/notebookworrk-cyber/student-os.git
cd student-os
npm install
npm run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm test` | Run unit tests |
| `npm run test:coverage` | Run with coverage |
| `npm run e2e` | Run Playwright tests |
| `npm run lint` | Lint code |
| `npm run format` | Format code |

## Pull Request Process

1. Create a branch from `main`
2. Run `npm test` to verify tests pass
3. Run `npm run lint` to check code style
4. Update CHANGELOG.md with your changes
5. Submit a PR with a clear description

## Project Structure

```
src/
├── components/     # UI components
├── js/            # Core logic modules
├── styles/        # CSS files
└── app.js         # Entry point
tests/             # Unit tests
e2e/               # Playwright E2E tests
```
