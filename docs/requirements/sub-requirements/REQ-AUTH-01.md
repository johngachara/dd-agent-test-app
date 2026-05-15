---
id: REQ-AUTH-01
title: Login form validation
epic: AUTH
milestone: M1
priority: high
status: in-progress
---

When a user submits the login form, both the email and password fields must be validated before the form is submitted.

Rules:
- If the email field is empty, display "Email is required" inline below the field. The form must not submit.
- If the email field contains a value that is not a valid email address (no @ symbol or no domain), display "Please enter a valid email address". The form must not submit.
- If the password field is empty, display "Password is required" inline below the field. The form must not submit.
- Both fields can have errors at the same time; both messages must be shown simultaneously.
- Errors must clear as soon as the user starts typing in the relevant field.
- The submit button must be disabled while a login request is in flight.
