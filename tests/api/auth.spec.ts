import { test, expect } from '@playwright/test';
import { ApiClient } from '../../utils/api-client.js';

test.describe('Section 2.1 — Auth Token Scenarios', () => {
  let apiClient: ApiClient;

  test.beforeEach(async ({ request }) => {
    apiClient = new ApiClient(request);
  });

  test('POST /auth with valid credentials returns a token @smoke', async () => {
    const response = await apiClient.createToken('admin', 'password123');
    
    expect(response.status()).toBe(200);
    const body = await response.json();
    
    expect(body).toHaveProperty('token');
    expect(typeof body.token).toBe('string');
    expect(body.token.length).toBeGreaterThan(0);
  });

  test('POST /auth with invalid credentials returns HTTP 200 with error payload @regression', async () => {
    const response = await apiClient.createToken('invalidUser', 'wrongPassword');
    
    // NOTE & ASSERTION CHOICE: The Restful-Booker API design returns HTTP 200 OK 
    // on failed authentication, placing the error inside the JSON body.
    // We assert 200 status to match actual API behavior and check the failure reason.
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ reason: 'Bad credentials' });
  });
});