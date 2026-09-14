# Exploratory Testing & Bug Report

| Document Metadata | Details |
| :--- | :--- |
| **Author** | Muhammad Umar (Senior SQA Engineer) |
| **Project** | Restful-Booker Platform SQA Assessment |
| **Environment** | REST API (`restful-booker.herokuapp.com`) & Web UI (`automationintesting.online`) |
| **Date** | September 10, 2026 |

---

## Executive Summary & Defect Matrix

During a 30-minute unscripted exploratory session across the Restful-Booker ecosystem, defects were identified across the authentication, booking CRUD API, and Admin Portal workflows.

| Bug ID | Title | Severity | Layer | Status |
| :--- | :--- | :--- | :--- | :--- |
| **BUG-001** | `POST /auth` Returns HTTP 200 OK on Invalid Credentials | Medium | API | Open |
| **BUG-002** | `POST /booking` Returns HTTP 500 Error on Missing Required Payload Fields | High | API | Open |
| **BUG-003** | Admin Portal Allows Creation of Duplicate Room Numbers | High | UI | Open |
| **BUG-004** | *Pending — to be added* | — | — | In progress |

> **Note:** An earlier candidate for BUG-003 (negative room price acceptance) was re-verified and did not reproduce — the Admin Portal correctly rejects negative prices with inline validation. It has been removed rather than left in the report, since an unconfirmed defect shouldn't be documented as a finding. A fourth defect is being sourced to replace it.

---

## Bug 1: `POST /auth` Returns HTTP 200 OK on Invalid Credentials Instead of HTTP 401

**Severity:** Medium
**Layer:** API
**Environment:** `https://restful-booker.herokuapp.com` (`POST /auth`)

**Steps to Reproduce:**
1. Send an HTTP `POST` request to `https://restful-booker.herokuapp.com/auth`.
2. Include the following JSON payload containing invalid credentials:
   ```json
   {
     "username": "invalidUser123",
     "password": "WrongPassword!"
   }
   ```
3. Inspect the HTTP response status code returned by the server.
4. Inspect the JSON response body returned alongside the status code.

**Expected Result:**
The API should return an `HTTP 401 Unauthorized` status code (or, at minimum, `HTTP 400 Bad Request`), signaling authentication failure at the protocol level so API consumers can rely on standard HTTP status-code handling rather than parsing the body.

**Actual Result:**
The API returns `HTTP 200 OK` with the response body:
```json
{
  "reason": "Bad credentials"
}
```
Success and failure are indistinguishable at the HTTP-status level; the caller must inspect the body to know the request failed.

**Why This Matters:**
Any client integration that checks only the HTTP status code — a common and reasonable pattern — will incorrectly treat a failed login as successful, potentially letting an unauthenticated flow proceed silently.

*(Evidence: Playwright request/response trace — `tests/api/auth.spec.ts`, "returns a token" test suite.)*

---

## Bug 2: `POST /booking` Returns HTTP 500 Internal Server Error on Missing Required Payload Fields

**Severity:** High
**Layer:** API
**Environment:** `https://restful-booker.herokuapp.com` (`POST /booking`)

**Steps to Reproduce:**
1. Send an HTTP `POST` request to `https://restful-booker.herokuapp.com/booking`.
2. Include a JSON payload with a required field omitted, for example:
   ```json
   {
     "lastname": "Umar",
     "totalprice": 250,
     "depositpaid": true,
     "bookingdates": {
       "checkin": "2026-10-01",
       "checkout": "2026-10-05"
     },
     "additionalneeds": "Late Check-in"
   }
   ```
   (`firstname` is intentionally omitted.)
3. Inspect the HTTP response status code.
4. Inspect the response body returned.

**Expected Result:**
The API should return `HTTP 400 Bad Request` with a structured error body naming the missing field(s), e.g. `{"errors": ["firstname is required"]}`.

**Actual Result:**
The API returns `HTTP 500 Internal Server Error` with no structured validation information — indicating the server attempts to process the payload without first validating it, and raises an unhandled exception internally rather than rejecting the request gracefully.

**Why This Matters:**
Malformed client input incorrectly surfaces as a server-health incident (5xx), polluting error-rate monitoring and alerting that's meant to catch genuine outages — and gives API consumers no actionable information to fix their request.

*(Evidence: Playwright request/response trace — `tests/api/booking-crud.spec.ts`, missing-field test.)*

---

## Bug 3: Admin Portal Allows Creation of Duplicate Room Numbers

**Severity:** High
**Layer:** UI
**Environment:** `https://automationintesting.online/#/admin` (Chrome, latest)

**Steps to Reproduce:**
1. Log in to the Admin Portal at `https://automationintesting.online/#/admin`.
2. Create a new room with a specific room name/number (e.g., `101`), filling all other fields with valid data.
3. Confirm the room appears in the dashboard grid.
4. Return to the room creation form.
5. Submit a second room using the same room name/number (`101`), with valid data in all other fields.
6. Observe the dashboard grid.

**Expected Result:**
The system should reject the second submission with a validation error indicating the room name/number is already in use.

**Actual Result:**
The system accepts the duplicate without warning, creating two distinct room entries sharing the same identifying number.

**Why This Matters:**
Two rooms sharing one identifier creates ambiguity that can cascade into double-booked rooms or guests being assigned to the wrong physical room — a direct data-integrity risk on a core business entity.

*(Evidence: two identical room-number rows visible simultaneously in the dashboard grid; this finding directly informed `getRandomRoomDetails()` in `utils/test-data.ts`, which generates a random room name per run specifically to avoid colliding with this defect in automated tests.)*

---

## Bug 4: *[Pending]*

**Severity:** TBD
**Layer:** TBD
**Environment:** TBD

**Steps to Reproduce:**
*(To be completed.)*

**Expected Result:**
*(To be completed.)*

**Actual Result:**
*(To be completed.)*

**Why This Matters:**
*(To be completed.)*
