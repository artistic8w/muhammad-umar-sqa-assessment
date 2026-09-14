# Test Plan & Strategy: Restful-Booker Platform

| Document Metadata | Details |
| :--- | :--- |
| **Author** | Muhammad Umar (Senior SQA Engineer) |
| **Project** | Restful-Booker Technical Assessment |
| **Version** | 1.1.0 |
| **Date** | September 10, 2026 |

## Document Overview & Objective
This document outlines the testing strategy for the **Booking CRUD feature** of the Restful-Booker platform (comprising the Web UI at `automationintesting.online` and the REST API at `restful-booker.herokuapp.com`). The objective is to ensure data integrity across the full booking lifecycle, correct handling of authentication and authorization, and robust error handling for both valid and invalid input.

---

## 1.1 Scope & Objectives

### What is being tested and why
* **API layer (`https://restful-booker.herokuapp.com`)**: Authentication (`POST /auth`) and the full Booking CRUD lifecycle (`POST`, `GET`, `PUT`, `DELETE /booking`) — this is the system of record for booking data, so correctness here directly determines data integrity everywhere downstream.
* **Web UI layer (`https://automationintesting.online`)**: The public contact form and the Admin Portal's login and room-management flows — these are the primary user-facing surfaces that depend on the API behaving correctly underneath them.
* **Cross-layer consistency**: Confirming that state changes made via one layer (e.g. a room created in the Admin UI) are correctly reflected in the other.

### What is explicitly out of scope
* Performance, load, and stress testing (the public sandbox is shared infrastructure with rate limits — load testing it would affect other users/candidates).
* Third-party payment processing (not implemented in this sandbox).
* Accessibility (WCAG) audit.
* Infrastructure or penetration testing.
* Concurrent-write race conditions on a single `bookingid` (identified as a real risk in 1.2 below, but deliberately deferred — see the note under Risk 2).

---

## 1.2 Risk-Based Test Coverage

| Risk Area | Description & Business Impact | Probability / Impact | Testing Approach |
| :--- | :--- | :--- | :--- |
| **1. Auth Token Expiry & Unauthorized Access** | Missing or invalid tokens allowed to execute `PUT`/`DELETE` requests, leading to unauthorized data modification. | High / Critical | Negative API tests with missing/invalid tokens; assert explicit `403 Forbidden` responses. |
| **2. Concurrent Updates & Race Conditions** | Simultaneous `PUT`/`DELETE` on the same `bookingid` causing state desynchronization or a "successful" response for an operation that didn't actually apply cleanly. | Medium / High | Would require firing near-simultaneous requests against a single booking ID and asserting a consistent final state. **Deliberately deferred for this assessment** — flagged here as a known, named gap rather than silently omitted, since it requires more time than the scope allows to test reliably without flaking. |
| **3. Date Range Boundary & Validation Logic** | Invalid dates (checkout before checkin, past dates) accepted by the backend. | High / High | Boundary Value Analysis on `bookingdates`, both via API payloads and equivalent UI form input. |
| **4. Schema Mutation & Missing Mandatory Fields** | Payload missing required fields (e.g. `firstname`) causing unhandled exceptions (`HTTP 500`) rather than a clean rejection. | Medium / High | Negative schema tests stripping individual mandatory fields; assert the API's actual documented behavior (see BUG-002). |
| **5. Cross-Layer Data Desynchronization** | Bookings/rooms created or modified via one layer not reflecting accurately in the other. | Medium / Medium | Create/modify via API, then verify the resulting state renders correctly in the UI, and vice versa. |

---

## 1.3 Test Coverage Matrix

Tags actually used in the automated suite: `@smoke` (must-pass, every build) and `@regression` (full suite). There is no separate `@negative` tag — negative-path coverage is tracked in the matrix below but implemented as regular `@smoke`/`@regression` tests, since a negative-path assertion is still a normal test, just one exercising invalid input.

| Operation | Layer | Smoke | Regression | Negative | Test Description |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Authentication** | API | ✓ | ✓ | ✓ | Token generation with valid creds; error payload verified on invalid creds (see BUG-001). |
| **Create Booking** | API | ✓ | ✓ | ✓ | `201`-equivalent creation with full schema response; missing mandatory field behavior documented (see BUG-002). |
| **Get Booking** | API | ✓ | ✓ | ✓ | Fetch by ID for an existing booking; `404` on a non-existent ID. |
| **Update Booking** | API | ✓ | ✓ | ✓ | Full update (`PUT`) with valid token; `403` when token is omitted. |
| **Delete Booking** | API | ✓ | ✓ | – | Delete with valid token returns `201`; subsequent `GET` confirms removal. Not marked Negative — no invalid-token delete case implemented in this pass. |
| **Contact Form** | UI | ✓ | ✓ | ✓ | Happy-path submission (`@smoke`); blank-field validation errors (`@regression`). |
| **Admin Login** | UI | ✓ | – | – | Valid-credential login only; invalid-login UI case not automated in this pass (tracked as a gap, not silently dropped). |
| **Room Creation** | UI | – | ✓ | – | Not smoke-tested — room creation is a lower-frequency admin action, not a must-pass-every-build path; covered in regression instead. |

---

## 1.4 Exit Criteria

The Booking CRUD feature is considered ready to ship when:

* **100% of `@smoke`-tagged tests pass** on the target environment — no exceptions, since these represent the minimum must-work paths (auth, create, read, update, delete).
* **`@regression` pass rate is 100%, or every failure is triaged and explicitly waived** with a documented reason (e.g. a known, already-filed defect with an accepted workaround) — regression failures are not silently ignored, but a pre-existing, tracked defect does not have to block a release if a workaround is agreed.
* **No open defect of Severity: Critical or High remains unresolved** in `BUG-REPORT.md`. BUG-002 (`HTTP 500` on missing required fields) is High severity and currently open — under this criterion, it would block release until fixed or explicitly accepted as a documented, time-boxed risk by the product owner.
* **No new booking-data leakage** is introduced by the test suite itself into the shared environment (i.e. the test suite's own cleanup routines run successfully) — a suite that pollutes its own target environment cannot be trusted to give clean signal on subsequent runs.
* **CI pipeline runs the smoke suite successfully end-to-end** (correct environment variables/secrets configured, no missing-config failures) — a pipeline that cannot execute is not a met exit criterion, regardless of local pass rates.

---

## 1.5 Execution Strategy & CI/CD Integration
* **Smoke Suite (`@smoke`)**: Runs on every Pull Request and push to `main`. Target execution time under 2 minutes.
* **Regression Suite (`@regression`)**: Runs on nightly CI pipelines via GitHub Actions.
* **Environment Configuration**: Managed via `.env` for local development and GitHub Encrypted Secrets for CI execution.
