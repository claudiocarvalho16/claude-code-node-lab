---
paths:
  - "src/**/*.controller.ts"
  - "src/**/dto/**/*.ts"
  - "src/**/*.service.ts"
---

# API boundary rules

- Do not treat TypeScript types or DTO declarations as runtime input validation.
- Data received from external boundaries must not be allowed to modify server-managed fields unintentionally.
- When runtime validation or filtering is not present, explicitly control which input fields are applied to domain state.
- Prefer fixing input-boundary concerns at the appropriate boundary instead of relying only on compile-time types.
