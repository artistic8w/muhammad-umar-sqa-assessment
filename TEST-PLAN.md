# Test Plan & Strategy: Restful-Booker Platform

| Document Metadata | Details |
| :--- | :--- |
| **Author** | Muhammad Umar (Senior SQA Engineer) |
| **Project** | Restful-Booker Technical Assessment |
| **Version** | 1.0.0 |
| **Date** | September 10, 2026 |
| **Status** | Approved / Ready for Review |

## 1. Document Overview & Objective
This document outlines the end-to-end testing strategy for the **Restful-Booker** platform (comprising the Web UI at `automationintesting.online` and the REST API at `restful-booker.herokuapp.com`). The primary objective is to ensure system reliability, data integrity across UI/API layers, robust error handling, and high-quality user experience across core booking workflows.

---

## 1.1 Scope & Objectives

### In-Scope
* **API Testing Layer (`https://restful-booker.herokuapp.com`)**:
  * Authentication workflows (`POST /auth`).
  * Full CRUD lifecycle for Bookings (`POST`, `GET`, `PUT`, `PATCH`, `DELETE` `/booking`).
  * Payload schema validation, data type integrity, and mandatory field assertions.
  * Status code correctness and error payload handling.
* **Web UI Layer (`https://automationintesting.online`)**:
  * Public Customer Portal: Contact form submission, validation messaging, and booking UI.
  * Admin Portal (`/#/admin`): Authentication, session control, and room/booking management.
* **Cross-Layer Validation**: Ensuring business logic consistency between API endpoints and UI state.

### Out-of-Scope
* Performance, load, and stress testing under high throughput (due to public sandbox rate limits).
* Third-party payment gateway processing or financial transaction fulfillment.
* Accessibility compliance (WCAG 2.1) audit (deferred to post-release milestone).
* Infrastructure, security penetration, or vulnerability testing.

---

## 1.2 Risk-Based Test Coverage

| Risk Area | Description & Business Impact | Probability / Impact | Testing & Mitigation Approach |
| :--- | :--- | :--- | :--- |
| **1. Auth Token Expiry & Unauthorized Access** | Expired or invalid tokens allowed to execute `PUT`/`DELETE` requests, leading to unauthorized data modification or data loss. | **High / Critical** | Automated API negative testing with missing, malformed, and expired tokens. Verify explicit HTTP 403 Forbidden responses. |
| **2. Concurrent Updates & Race Conditions** | Simultaneous edits or deletes on the same `bookingid` causing state desynchronization or dirty reads. | **Medium / High** | Execute concurrent automated API requests (`PUT` vs `DELETE`) against a single booking ID and assert atomic response behavior. |
| **3. Date Range Boundary & Validation Logic** | Invalid booking dates (e.g., checkout date prior to checkin date, past dates) accepted by backend. | **High / High** | Boundary Value Analysis (BVA) & Equivalence Partitioning (EP) on `bookingdates`. Validate boundary dates via API payloads and UI forms. |
| **4. Schema Mutation & Missing Mandatory Fields** | Payload missing required fields (e.g., `firstname`) causing unhandled server exceptions (HTTP 500) or corrupt DB entries. | **Medium / High** | Negative schema validation tests stripping individual mandatory fields. Assert graceful degradation (HTTP 400 or documented behavior). |
| **5. Cross-Layer Data Desynchronization** | Bookings created or modified via API not reflecting accurately in the Admin UI dashboard. | **Medium / Medium** | End-to-End (E2E) integration tests: Create/Update via API, then verify DOM state rendered in Admin UI. |

---

## 1.3 Test Coverage Matrix

Legend: **S** = Smoke Test (`@smoke`) | **R** = Regression Test (`@regression`) | **N** = Negative / Edge Case (`@negative`)

| Operation / Feature | Layer | Smoke | Regression | Negative | Test Description |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Authentication** | API | **X** | **X** | **X** | Validate token generation with valid creds (`admin`/`password123`) and verify error payload on bad creds. |
| **Create Booking** | API | **X** | **X** | **X** | Validate `200 OK` with full schema response; test missing mandatory fields (`firstname`). |
| **Get Booking** | API | **X** | **X** | **X** | Fetch existing booking by ID; assert HTTP 404 on non-existent ID lookup. |
| **Update Booking** | API | **X** | **X** | **X** | Full update (`PUT`) with valid token; verify HTTP 403 when token is omitted or invalid. |
| **Partial Update** | API | -- | **X** | **X** | Patch partial fields (`PATCH`) with valid token; verify header authorization. |
| **Delete Booking** | API | **X** | **X** | **X** | Delete record (`DELETE`) with token; verify HTTP 201 and confirm record deletion via subsequent `GET`. |
| **Contact Form** | UI | **X** | **X** | **X** | Happy path submission (`@smoke`); validation errors on empty/malformed inputs (`@regression`). |
| **Admin Login** | UI | **X** | **X** | **X** | Admin login with valid credentials (`admin`/`password`); invalid login error validation. |
| **Room Creation** | UI | -- | **X** | **X** | Admin dashboard room creation E2E workflow; verify room appears in public grid. |

---

## 1.4 Execution Strategy & CI/CD Integration
* **Smoke Suite (`@smoke`)**: Runs on every Pull Request (PR) and push to `main`. Execution target < 2 minutes.
* **Regression Suite (`@regression`)**: Runs automatically on nightly CI pipelines via GitHub Actions.
* **Environment Configuration**: Managed via `.env` file for local development and GitHub Encrypted Secrets for CI execution.
