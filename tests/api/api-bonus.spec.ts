import { test, expect } from '@playwright/test';
import { ApiClient } from '../../utils/api-client.js';
import { getValidBookingData } from '../../utils/test-data.js';

test.describe('Section 2.6 — Custom API Edge Case Tests', () => {
  let apiClient: ApiClient;
  const baseUrl = process.env.API_BASE_URL || 'https://restful-booker.herokuapp.com';

  test.beforeEach(async ({ request }) => {
    apiClient = new ApiClient(request);
  });

  /**
   * REASONING FOR BONUS TEST 1:
   * Query Parameter Filtering Validation.
   * Tests whether GET /booking accurately filters records when queried by 
   * specific criteria (firstname & lastname), ensuring search capability works.
   */
  test('2.6.1 BONUS: GET /booking with query parameter filters @regression', async ({ request }) => {
    const tempRes = await apiClient.createBooking(getValidBookingData());
    const { bookingid, booking } = await tempRes.json();

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
   */
  test('2.6.2 BONUS: POST /booking/:id path returns expected client error @regression', async ({ request }) => {
    const response = await request.post(`${baseUrl}/booking/1`, {
      data: getValidBookingData(),
    });

    expect([404, 405]).toContain(response.status());
  });
});