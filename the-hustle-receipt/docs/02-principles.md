# Payment Integration Principles: The Hustle Receipt 🛡️

This document maps our codebase to industry-standard payment integration principles to ensure security, data integrity, and a smooth user experience.

---

## 1. Trust Boundaries 🧱

**Principle:** Never trust the client (browser) with sensitive transaction logic or status updates.

*   **How we do it:** The client is responsible only for providing user intent (amount, email) and displaying the final status. The server handles all communication with Flutterwave and generates the unique transaction reference (`txRef`).
*   **Code Reference:** `src/app/api/tip/initiate/route.ts`
    ```typescript
    // Server generates the secret reference, NOT the client
    const txRef = `tip_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
    ```
*   **Impact:** A user cannot "tell" the server that they paid by sending a fake success status. The server only believes Flutterwave.

---

## 2. Server-Side Verification: The Only Source of Truth 🔍

**Principle:** Always verify the transaction status directly with the payment provider's API before updating the database.

*   **How we do it:** After the user is redirected back from Flutterwave, the Success Page triggers a server-side check. The server calls the Flutterwave verification endpoint using its secret key.
*   **Code Reference:** `src/app/api/tip/verify/route.ts`
    ```typescript
    // We call the Bank Boss (Flutterwave) directly to confirm
    const verification = await verifyFlutterwaveTransaction(txRef);
    if (verification.data.status === "successful") {
      // Only now do we update the database
    }
    ```
*   **Impact:** Prevents "Referer Spoofing" where a user manually navigates to the `/success` page without paying.

---

## 3. Idempotency 🔁

**Principle:** Ensure that performing the same operation multiple times has the same result as performing it once.

*   **How we do it:** In our verification route, we check if the transaction is already marked as `verified` in our database before doing anything else.
*   **Code Reference:** `src/app/api/tip/verify/route.ts`
    ```typescript
    if (tip.status === "verified") {
      return NextResponse.json({
        status: "success",
        message: "Payment already verified",
      });
    }
    ```
*   **Impact:** If a user refreshes the success page or if a webhook hits the server multiple times, we won't accidentally double-credit the creator or trigger duplicate logic.

---

## 4. Separation of Test and Production Keys 🔑

**Principle:** Use different credentials for development and production to prevent real money from being spent during testing.

*   **How we do it:** We use environment variables (`.env`) to store our Flutterwave keys. The code uses `process.env.FLW_SECRET_KEY`, allowing us to swap between `FLWSECK_TEST-xxx` and `FLWSECK-xxx` without changing a single line of code.
*   **Code Reference:** `src/lib/flutterwave.ts`
    ```typescript
    headers: {
      Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
    },
    ```
*   **Impact:** Complete isolation between the sandbox and live environments.

---

## 5. Never Logging or Exposing Secrets 🚫

**Principle:** Sensitive keys must never appear in client-side code, logs, or version control.

*   **How we do it:** 
    *   **No Client Exposure:** The secret key is used in `src/lib/flutterwave.ts`, which is only imported by server-side Route Handlers. It is **not** prefixed with `NEXT_PUBLIC_`.
    *   **Clean Logging:** Our `console.error` calls log the error object but avoid printing the raw environment variables.
*   **Code Reference:** `.gitignore` (prevents `.env` from being committed) and the absence of `NEXT_PUBLIC_FLW_SECRET_KEY`.
*   **Impact:** Even if someone inspects the website's source code in their browser, they will never see our secret keys.
