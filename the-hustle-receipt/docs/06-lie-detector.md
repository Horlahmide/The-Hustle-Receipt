# Payment Flow: Lie Detector

This document serves as a knowledge check on the payment flow implementation in **The Hustle Receipt**.

## The Statements

1.  **Atomic Status Transitions:** To prevent race conditions (like a webhook and a redirect hitting at the same time), the system uses an atomic database update that only transitions a tip to `VERIFIED` if its current status is still `PENDING`.
2.  **Currency Enforcement:** The verification logic is strictly locked to NGN (Nigerian Naira); if the payment gateway returns a successful response but the currency is anything other than "NGN", the system will automatically mark the tip as `FAILED`.
3.  **Kobo-Based Storage:** The project stores the tip amount in the database as an `Int` (representing the value in cents/kobo) and performs a mathematical cross-check during verification to ensure the amount paid matches the amount expected.
4.  **Client-Side Reference Generation:** The transaction reference (`txRef`) is generated on the client-side (browser) using `crypto.randomUUID()` to ensure uniqueness before it is sent to the initiation API.
5.  **Administrative Cleanup:** The codebase includes a dedicated admin route and library function that can be used to transition any `PENDING` tips older than 24 hours to a `FAILED` status.

---

## The Answer

**Statement 4 is the LIE.**

### Technical Explanation
The transaction reference (`txRef`) is **not** generated on the client-side. It is generated **server-side** within the `POST` handler of the initiation API to ensure security and maintain a single source of truth.

**File:** `src/app/api/tip/initiate/route.ts`
```typescript
// Generating the reference on the server
const txRef = `tip_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
```

Generating it on the server prevents a malicious user from providing their own reference or attempting to "guess" or "reuse" an old one before the initiation is even recorded in the database.
