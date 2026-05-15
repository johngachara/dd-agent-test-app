# Coding Standards

- TypeScript strict mode; no `any` except at genuine boundaries.
- Functions return plain objects or throw — no sentinel `null` returns.
- Validation functions return an errors object (empty = valid); they never throw.
- React components use function components and hooks only.
- `async/await` throughout; no `.then()` chains.
- No global state management library — props and localStorage only.
