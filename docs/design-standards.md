# Design Standards

- Inline validation errors appear directly below the relevant field.
- Error messages use `role="alert"` so screen readers announce them.
- Buttons that trigger async actions must show a loading state and be `disabled` while in flight.
- Form fields use `id` + `htmlFor` pairing for accessible labels.
- No modal dialogs for errors — inline messages only.
