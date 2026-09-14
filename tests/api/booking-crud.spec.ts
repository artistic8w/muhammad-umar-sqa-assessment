import { test, expect } from '@playwright/test';
import { ApiClient } from '../../utils/api-client.js';
import { getValidBookingData, getUpdatedBookingData } from '../../utils/test-data.js';

test.describe('Sections 2.2–2.5 — Booking CRUD Operations', () => {
  let apiClient: ApiClient;
  let authToken: string;
  // Tracks every booking created during a test so afterEach can clean it up,
  // regardless of whether the test's own assertions pass or fail.
  let createdBookingIds: number[] = [];

  test.beforeAll(async ({ request }) => {
    const client = new ApiClient(request);
    const res = await client.createToken();
    const body = await res.json();
    authToken = body.token;
  });

  test.beforeEach(async ({ request }) => {
    apiClient = new ApiClient(request);
    createdBookingIds = [];
  });

  // Deletes every booking created during the test that just ran. Wrapped in
  // .catch() per-id since some tests (2.5.1/2.5.2) already delete their own
  // booking — a redundant delete attempt on an already-gone ID is expected
  // and harmless here, not a real failure.
  test.afterEach(async () => {
    for (const id of createdBookingIds) {
      await apiClient.deleteBooking(id, authToken).catch(() => {});
    }
  });

  test('2.2.1 POST /booking creates booking and returns expected schema', { tag: '@smoke' }, async () => {
    const payload = getValidBookingData();
    const response = await apiClient.createBooking(payload);

    expect(response.status()).toBe(200);
    const body = await response.json();

    expect(body).toHaveProperty('bookingid');
    createdBookingIds.push(body.bookingid);

    const booking = body.booking;
    expect(booking.firstname).toBe(payload.firstname);
    expect(booking.lastname).toBe(payload.lastname);
    expect(typeof booking.totalprice).toBe('number');
    expect(typeof booking.depositpaid).toBe('boolean');
    expect(booking.bookingdates.checkin).toBe(payload.bookingdates?.checkin);
  });

  test('2.2.2 POST /booking with missing required field (firstname)', { tag: '@regression' }, async () => {
    const invalidPayload = getValidBookingData();
    delete invalidPayload.firstname;

    const response = await apiClient.createBooking(invalidPayload);

    // BEHAVIOR DOCUMENTATION: API returns HTTP 500 when 'firstname' is missing
    // due to an unhandled backend null constraint error (see BUG-002).
    expect(response.status()).toBe(500);

    // Body assertion: confirm the failure response never accidentally contains
    // a valid booking payload (i.e. the server didn't silently create a
    // malformed booking despite the 500). Kept as a .text() read rather than
    // .json() since a 500 error page is not guaranteed to be valid JSON.
    const text = await response.text();
    expect(text).not.toContain('bookingid');
    // No booking is created here, so nothing to push to createdBookingIds.
  });

  test('2.3.1 GET /booking/:id returns correct data for existing booking', { tag: '@smoke' }, async () => {
    const createRes = await apiClient.createBooking(getValidBookingData());
    const { bookingid } = await createRes.json();
    createdBookingIds.push(bookingid);

    const response = await apiClient.getBooking(bookingid);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.firstname).toBe('Muhammad');
  });

  test('2.3.2 GET /booking/:id for non-existent ID returns 404', { tag: '@regression' }, async () => {
    const response = await apiClient.getBooking(99999999);
    expect(response.status()).toBe(404);

    // Body assertion: confirm a body is actually returned for the 404 case
    // (Restful-Booker does not return an empty body here) rather than only
    // trusting the status code.
    const text = await response.text();
    expect(text.length).toBeGreaterThan(0);
  });

  test('2.4.1 PUT /booking/:id with valid token updates record', { tag: '@smoke' }, async () => {
    const createRes = await apiClient.createBooking(getValidBookingData());
    const { bookingid } = await createRes.json();
    createdBookingIds.push(bookingid);

    const updatedPayload = getUpdatedBookingData();
    const response = await apiClient.updateBooking(bookingid, updatedPayload, authToken);

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.lastname).toBe(updatedPayload.lastname);
    expect(body.totalprice).toBe(updatedPayload.totalprice);
    expect(body.depositpaid).toBe(updatedPayload.depositpaid);
  });

  // Contrast case: unlike the documented 500-error bug above, this IS the
  // API's correct, expected behavior — missing auth correctly returns 403.
  test('2.4.2 PUT /booking/:id without auth token returns 403 Forbidden', { tag: '@regression' }, async () => {
    const createRes = await apiClient.createBooking(getValidBookingData());
    const { bookingid } = await createRes.json();
    createdBookingIds.push(bookingid);

    const response = await apiClient.updateBooking(bookingid, getUpdatedBookingData());
    expect(response.status()).toBe(403);

    // Body assertion: confirm the unauthorized attempt did NOT apply the
    // update — the booking's data should remain the original, not the
    // rejected update payload.
    const verifyRes = await apiClient.getBooking(bookingid);
    const verifyBody = await verifyRes.json();
    expect(verifyBody.lastname).not.toBe(getUpdatedBookingData().lastname);
  });

  test('2.5.1 DELETE /booking/:id with valid token returns 201 Created', { tag: '@smoke' }, async () => {
    const createRes = await apiClient.createBooking(getValidBookingData());
    const { bookingid } = await createRes.json();
    createdBookingIds.push(bookingid);

    const response = await apiClient.deleteBooking(bookingid, authToken);
    expect(response.status()).toBe(201);

    // Body assertion: Restful-Booker's DELETE endpoint returns the literal
    // text "Created" in its response body alongside the 201 status.
    const text = await response.text();
    expect(text).toContain('Created');
  });

  test('2.5.2 GET /booking/:id after deletion confirms record is gone', { tag: '@smoke' }, async () => {
    const createRes = await apiClient.createBooking(getValidBookingData());
    const { bookingid } = await createRes.json();
    createdBookingIds.push(bookingid);

    await apiClient.deleteBooking(bookingid, authToken);

    const response = await apiClient.getBooking(bookingid);
    expect(response.status()).toBe(404);
  });
});
