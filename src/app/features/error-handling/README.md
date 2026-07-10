# Error Handling

## Requirement link
This folder supports the essential requirement: "The application must feature rule sets that dictate how the application responds to different errors."

## What has been started
- `ErrorHandlingService` creates a central place to report, store, clear, and display application errors.
- Errors are classified by severity: `info`, `warning`, `error`, and `critical`.
- The service keeps user-friendly messages separate from technical messages, which is important for security because raw stack traces should not be shown to normal users.
- The service is registered as Angular's global `ErrorHandler` in `AppModule`.

## Stand-up talking points
- Identifying/planning: I identified error handling as a high-priority requirement because unexpected failures in authentication, lobbies, sharing codes, or database reads should not expose private details or leave users stuck.
- Producing/implementing: I started a central service so future components do not each invent their own inconsistent error messages.
- Security: The service logs technical details for developers while returning safer user messages, reducing information leakage.
- Testing/evaluating: Test cases should include invalid game codes, failed Firebase reads, failed purchases, offline access, and unexpected null data.

## Next implementation steps
1. Add a small shared error banner component that subscribes to `errors$`.
2. Replace direct `alert()` and `console.error()` calls in feature components with `reportError()`.
3. Add tests for safe user messages and retained technical messages.
4. Add Firebase-specific error message mapping for authentication and database failures.
