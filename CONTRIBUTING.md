# Contributing to Sentinel Desktop

Thank you for your interest in contributing to Sentinel Desktop.

---

## 1. Development Principles

- **Code Quality**: Strict TypeScript mode is enabled. No `any` types; use explicit interfaces and types.
- **Package Modularity**: Never bypass package boundaries. Renderer code must never import from `@sentinel/native-bridge` or `packages/system-adapter/src/windows`.
- **Testing**: Every feature, parser, and adapter should have corresponding unit tests using Vitest.

---

## 2. Pull Request Guidelines

1. Fork the repository and create your branch from `main`.
2. Ensure dependencies are installed via `pnpm install`.
3. Check that your code compiles:
   ```bash
   pnpm typecheck
   pnpm test
   pnpm lint
   ```
4. Write descriptive commit messages following the Conventional Commits specification (`feat:`, `fix:`, `docs:`, `perf:`, `refactor:`, `test:`).
5. Open a Pull Request referencing any related issues.
