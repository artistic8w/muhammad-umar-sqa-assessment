import { test, expect } from '@playwright/test';
import { ApiClient } from '../../utils/api-client.js';
import { getValidBookingData } from '../../utils/test-data.js';

test.describe('Section 2.6 — Custom API Edge Case Tests', () => {
  let apiClient: ApiClient;
  let authToken: string;
  const baseUrl = process.env.API_BASE_URL || 'https://restful-booker.herokuapp.com';
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

  test.afterEach(async () => {
    for (const id of createdBookingIds) {
      await apiClient.deleteBooking(id, authToken).catch(() => {});
    }
  });

  /**
   * REASONING FOR BONUS TEST 1:
   * Query Parameter Filtering Validation.
   * Tests whether GET /booking accurately filters records when queried by
   * specific criteria (firstname & lastname), ensuring search capability works.
   * Not directly tied to a top-5 risk in TEST-PLAN.md — included as baseline
   * coverage of a REST semantic (query filtering) not otherwise exercised
   * by the required CRUD scenarios.
   */
  test('2.6.1 BONUS: GET /booking with query parameter filters', { tag: '@regression' }, async ({ request }) => {
    const tempRes = await apiClient.createBooking(getValidBookingData());
    const { bookingid, booking } = await tempRes.json();
    createdBookingIds.push(bookingid);

    const response = await request.get(`${baseUrl}/booking`, {
      params: {
        firstname: booking.firstname,
        lastname: booking.lastname,
      },
    });

    expect(response.status()).toBe(200);
    const results = await response.json();

    expect(Array.isArray(results)).toBeTruthy();
    const match = results.find((item: { bookingid: number }) => item.bookingid === bookingid);
    expect(match).toBeDefined();
  });

  /**
   * REASONING FOR BONUS TEST 2:
   * HTTP Verb & Resource Path Validation.
   * Restful-Booker returns HTTP 404 or 405 when attempting to POST directly to an explicit resource ID.
   * Not directly tied to a top-5 risk — included as baseline REST semantics coverage.
   */
  test('2.6.2 BONUS: POST /booking/:id path returns expected client error', { tag: '@regression' }, async ({ request }) => {
    const response = await request.post(`${baseUrl}/booking/1`, {
      data: getValidBookingData(),
    });

    expect([404, 405]).toContain(response.status());

    // Body assertion: confirm no booking-shaped payload leaked through on
    // this rejected request.
    const text = await response.text();
    expect(text).not.toContain('bookingid');
  });

  /**
   * REASONING FOR BONUS TEST 3:
   * Directly extends Risk 4 ("Schema Mutation & Missing Mandatory Fields")
   * from TEST-PLAN.md Section 1.2, and generalizes the BUG-002 finding
   * (missing 'firstname' → HTTP 500) to a second required field
   * ('bookingdates') to confirm the same unhandled-exception pattern isn't
   * limited to a single field.
   */
  test('2.6.3 BONUS: POST /booking with missing bookingdates returns consistent error behavior', { tag: '@regression' }, async () => {
    const invalidPayload = getValidBookingData();
    delete invalidPayload.bookingdates;

    const response = await apiClient.createBooking(invalidPayload);

    // Documents whether the missing-mandatory-field defect (BUG-002)
    // generalizes across fields, or is specific to 'firstname'.
    expect(response.status()).toBe(500);

    const text = await response.text();
    expect(text).not.toContain('bookingid');
  });
});
