import { test, expect } from '@playwright/test';
import { ApiClient } from '../../utils/api-client.js';
import { getValidBookingData, getUpdatedBookingData } from '../../utils/test-data.js';

test.describe('Sections 2.2–2.5 — Booking CRUD Operations', () => {
  let apiClient: ApiClient;
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    const client = new ApiClient(request);
    const res = await client.createToken('admin', 'password123');
    const body = await res.json();
    authToken = body.token;
  });

  test.beforeEach(async ({ request }) => {
    apiClient = new ApiClient(request);
  });

  test('2.2.1 POST /booking creates booking and returns expected schema @smoke', async () => {
    const payload = getValidBookingData();
    const response = await apiClient.createBooking(payload);

    expect(response.status()).toBe(200);
    const body = await response.json();

    expect(body).toHaveProperty('bookingid');
    const booking = body.booking;
    expect(booking.firstname).toBe(payload.firstname);
    expect(booking.lastname).toBe(payload.lastname);
    expect(typeof booking.totalprice).toBe('number');
    expect(typeof booking.depositpaid).toBe('boolean');
    expect(booking.bookingdates.checkin).toBe(payload.bookingdates?.checkin);
  });

  test('2.2.2 POST /booking with missing required field (firstname) @regression', async () => {
    const invalidPayload = getValidBookingData();
    delete invalidPayload.firstname;

    const response = await apiClient.createBooking(invalidPayload);

    // BEHAVIOR DOCUMENTATION: API returns HTTP 500 when 'firstname' is missing 
    // due to an unhandled backend null constraint error.
    expect(response.status()).toBe(500);
  });

  test('2.3.1 GET /booking/:id returns correct data for existing booking @smoke', async () => {
    const createRes = await apiClient.createBooking(getValidBookingData());
    const { bookingid } = await createRes.json();

    const response = await apiClient.getBooking(bookingid);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.firstname).toBe('Muhammad');
  });

  test('2.3.2 GET /booking/:id for non-existent ID returns 404 @regression', async () => {
    const response = await apiClient.getBooking(99999999);
    expect(response.status()).toBe(404);
  });

  test('2.4.1 PUT /booking/:id with valid token updates record @smoke', async () => {
    const createRes = await apiClient.createBooking(getValidBookingData());
    const { bookingid } = await createRes.json();

    const updatedPayload = getUpdatedBookingData();
    const response = await apiClient.updateBooking(bookingid, updatedPayload, authToken);

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.lastname).toBe(updatedPayload.lastname);
  });
  
  // Contrast case: unlike the documented 500-error bug above, this IS the
  // API's correct, expected behavior — missing auth correctly returns 403.
  test('2.4.2 PUT /booking/:id without auth token returns 403 Forbidden @regression', async () => {
    const createRes = await apiClient.createBooking(getValidBookingData());
    const { bookingid } = await createRes.json();

    const response = await apiClient.updateBooking(bookingid, getUpdatedBookingData());
    expect(response.status()).toBe(403);
  });

  test('2.5.1 DELETE /booking/:id with valid token returns 201 Created @smoke', async () => {
    const createRes = await apiClient.createBooking(getValidBookingData());
    const { bookingid } = await createRes.json();

    const response = await apiClient.deleteBooking(bookingid, authToken);
    expect(response.status()).toBe(201);
  });

  test('2.5.2 GET /booking/:id after deletion confirms record is gone @smoke', async () => {
    const createRes = await apiClient.createBooking(getValidBookingData());
    const { bookingid } = await createRes.json();

    await apiClient.deleteBooking(bookingid, authToken);

    const response = await apiClient.getBooking(bookingid);
    expect(response.status()).toBe(404);
  });
});