# Comprehensive Exploratory Testing & Bug Report

| Document Metadata | Details |
| :--- | :--- |
| **Author** | Muhammad Umar (Senior SQA Engineer) |
| **Project** | Restful-Booker Platform SQA Assessment |
| **Environment** | REST API (`restful-booker.herokuapp.com`) & Web UI (`automationintesting.online`) |
| **Date** | September 10, 2026 |

---

## 1. Executive Summary & Defect Matrix

During automated and manual exploratory test cycles executed across the Restful-Booker ecosystem, four critical defects were identified across the core authentication, booking CRUD API, and Admin Portal workflows.

| Bug ID | Title | Severity | Priority | Component | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **BUG-001** | `POST /auth` Returns HTTP 200 OK on Invalid Credentials | Medium | High | API (`/auth`) | Open |
| **BUG-002** | `POST /booking` Returns HTTP 500 Error on Missing Required Payload Fields | High | High | API (`/booking`) | Open |
| **BUG-003** | Admin Dashboard Accepts Negative Room Price Values (`-100`) | High | Medium | UI (`/#/admin`) | Open |
| **BUG-004** | Admin Dashboard Allows Creation of Duplicate Room Numbers | High | High | UI (`/#/admin`) | Open |

---

## 2. Detailed Bug Reports

### BUG-001: `POST /auth` Returns HTTP 200 OK on Invalid Credentials Instead of HTTP 401
* **Bug ID:** BUG-001
* **Severity:** Medium
* **Priority:** High
* **Component:** REST API (`POST /auth`)
* **Environment:** Staging / Production (`https://restful-booker.herokuapp.com`)

**Description:**
When submitting invalid administrative credentials to the authentication endpoint (`POST /auth`), the API responds with an `HTTP 200 OK` status code instead of the standard `HTTP 401 Unauthorized` or `HTTP 400 Bad Request`. The authentication failure is communicated solely via a JSON body property (`{"reason": "Bad credentials"}`).

**Pre-conditions:**
* API client (Postman, Playwright APIRequestContext, or cURL) is configured to target `https://restful-booker.herokuapp.com`.

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
The API should return an `HTTP 401 Unauthorized` status code (or, at minimum, `HTTP 400 Bad Request`), signaling authentication failure at the protocol level so that API consumers and automated clients can rely on standard HTTP status-code handling.

**Actual Result:**
The API returns `HTTP 200 OK` with the response body:
```json
{
  "reason": "Bad credentials"
}
```
This forces every consumer of the endpoint to parse the response body to determine success/failure, rather than relying on the HTTP status code — a violation of standard REST API design conventions.

**Impact:**
Clients that check only the HTTP status code (a common integration pattern) will incorrectly treat failed authentication attempts as successful, potentially allowing unauthenticated flows to proceed silently.

**Evidence:**
*(Attach Postman/Playwright request-response screenshot or trace file here.)*

---

### BUG-002: `POST /booking` Returns HTTP 500 Internal Server Error on Missing Required Payload Fields
* **Bug ID:** BUG-002
* **Severity:** High
* **Priority:** High
* **Component:** REST API (`POST /booking`)
* **Environment:** Staging / Production (`https://restful-booker.herokuapp.com`)

**Description:**
When submitting a booking creation request with one or more required fields omitted from the payload (e.g., `firstname`), the API responds with an `HTTP 500 Internal Server Error` instead of a structured `HTTP 400 Bad Request`. This indicates the server is failing due to an unhandled exception during payload validation/processing, rather than gracefully rejecting malformed input.

**Pre-conditions:**
* API client is configured to target `https://restful-booker.herokuapp.com`.
* No authentication token is required for this endpoint (public booking creation).

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
   (Note: `firstname` is intentionally omitted.)
3. Inspect the HTTP response status code.
4. Inspect the response body/content returned.

**Expected Result:**
The API should return an `HTTP 400 Bad Request` with a structured, descriptive error body indicating which required field(s) are missing or invalid (e.g., `{"errors": ["firstname is required"]}`).

**Actual Result:**
The API returns `HTTP 500 Internal Server Error`, with no structured validation error information, indicating the server is not validating input before attempting to process it — an unhandled exception is raised internally instead.

**Impact:**
* Exposes the API to potential unhandled-exception based vulnerabilities and stability issues.
* Provides no actionable error information to API consumers, making client-side error handling and debugging significantly harder.
* HTTP 5xx responses are typically monitored/alerted on as server-health incidents; malformed client input incorrectly triggering 5xx responses pollutes error monitoring and incident response pipelines.

**Evidence:**
*(Attach Postman/Playwright request-response screenshot or trace file here.)*

---

### BUG-003: Admin Dashboard Accepts Negative Room Price Values
* **Bug ID:** BUG-003
* **Severity:** High
* **Priority:** Medium
* **Component:** Web UI — Admin Dashboard (`/#/admin`, Room Creation Form)
* **Environment:** Production (`https://automationintesting.online/#/admin`)

**Description:**
The room creation form in the Admin Dashboard does not perform validation on the "Price" input field. Submitting a negative value (e.g., `-100`) is accepted without any client-side or server-side validation error, resulting in a room being created with an invalid price state that is then rendered in the dashboard grid.

**Pre-conditions:**
* Tester is authenticated as an admin user in the Admin Portal.
* Tester has navigated to the Room Creation form on the Admin Dashboard.

**Steps to Reproduce:**
1. Log in to the Admin Portal at `https://automationintesting.online/#/admin`.
2. Navigate to the room creation form.
3. Fill in all required fields with valid data (Room Name, Type, Accessible), and enter `-100` in the Price field.
4. Click the "Create" button to submit the form.
5. Observe the dashboard grid where the newly created room entry is rendered.

**Expected Result:**
The form should reject the negative price value, either via inline client-side validation (preventing submission) or a server-side validation error, with a clear message such as "Price must be a positive number." The room should not be created.

**Actual Result:**
The form accepts `-100` as a valid price, submits successfully, and the room is created and rendered in the dashboard grid displaying the negative price value, resulting in an invalid business state.

**Impact:**
* Allows creation of rooms with nonsensical pricing data that could propagate to booking calculations, invoices, or public-facing room listings.
* Indicates a broader lack of server-side input validation, which may also affect other numeric fields.

**Evidence:**
*(Attach screenshot of the room creation form submission and the resulting dashboard grid entry showing the negative price.)*

---

### BUG-004: Admin Portal Allows Creation of Duplicate Room Numbers
* **Bug ID:** BUG-004
* **Severity:** High
* **Priority:** High
* **Component:** Web UI — Admin Dashboard (`/#/admin`, Room Creation Form)
* **Environment:** Production (`https://automationintesting.online/#/admin`)

**Description:**
The Admin Portal's room creation workflow does not enforce uniqueness on the room name/number field. Submitting the room creation form with a room name that already exists in the system succeeds without any warning or validation error, resulting in duplicate room entries in the dashboard grid.

**Pre-conditions:**
* Tester is authenticated as an admin user in the Admin Portal.
* At least one room already exists in the system with a known room name/number.

**Steps to Reproduce:**
1. Log in to the Admin Portal at `https://automationintesting.online/#/admin`.
2. Create a new room with a specific room name/number (e.g., `101`), filling all other fields with valid data.
3. Confirm the room appears in the dashboard grid.
4. Navigate back to the room creation form.
5. Submit a second room creation request using the same room name/number (`101`), with valid data in all other fields.
6. Observe the dashboard grid for the resulting entries.

**Expected Result:**
The system should reject the second submission with a validation error indicating the room name/number is already in use, preventing duplicate room entries from being created.

**Actual Result:**
The system accepts the duplicate room name/number without any warning, creating a second, distinct room entry with the same identifying name/number as an existing room, resulting in two ambiguous entries in the dashboard grid.

**Impact:**
* Creates ambiguity in room identification, which can cascade into incorrect bookings, conflicting reservations, or misassigned guests referencing the same room number.
* Undermines data integrity of the room inventory, a core business entity for the platform.

**Evidence:**
*(Attach screenshot of both duplicate room entries visible simultaneously in the dashboard grid.)*

---


