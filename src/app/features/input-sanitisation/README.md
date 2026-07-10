# Input Sanitisation

## Requirement link
This folder supports the essential requirement: "The application must feature rules to prevent malicious code from being executed through XSS attacks or other methods."

## What has been started
- `InputSanitisationService` provides reusable rules for plain text, display names, game codes, and classic verse guesses.
- It strips obvious HTML/script patterns, removes control characters, trims whitespace, and enforces maximum lengths.
- Validation returns both a cleaned value and a list of errors, so pages can show useful feedback instead of failing silently.

## Stand-up talking points
- Identifying/planning: I looked at user-controlled inputs such as display names, game codes, lobby names, and verse guesses because those are common XSS and validation risk points.
- Producing/implementing: I made a reusable service so sanitisation can be applied consistently across forms.
- Security: The aim is defence in depth: Angular already escapes interpolation, but sanitising user input before storage reduces risk when data is later displayed elsewhere.
- Testing/evaluating: I would test strings like `<script>alert(1)</script>`, `javascript:alert(1)`, oversized display names, empty inputs, and malformed verse guesses.

## Next implementation steps
1. Use `validateVerseGuess()` inside `ClassicInputComponent`.
2. Use `validateGameCode()` before calling `ShareService`.
3. Use `validateDisplayName()` in login/profile/lobby display-name fields.
4. Add unit tests for malicious and valid examples.
