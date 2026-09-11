import { APIRequestContext } from '@playwright/test';

export interface BookingDates {
  checkin: string;
  checkout: string;
}

export interface BookingPayload {
  firstname?: string;
  lastname?: string;
  totalprice?: number;
  depositpaid?: boolean;
  bookingdates?: BookingDates;
  additionalneeds?: string;
}

/**
 * Thin wrapper around the Restful-Booker REST API, built directly on
 * Playwright's APIRequestContext (no external HTTP client) so that request
 * tracing, retries, and fixtures stay consistent with the rest of the suite.
 */
export class ApiClient {
  private baseUrl: string;

  constructor(private request: APIRequestContext) {
    this.baseUrl = process.env.API_BASE_URL || 'https://restful-booker.herokuapp.com';
  }

    /**
   * Authenticates against POST /auth and returns the raw response.
   * Defaults fall back to the public sandbox's documented admin credentials
   * when env vars are not supplied, so smoke tests can run without a .env file.
   */
  async createToken(username = process.env.API_ADMIN_USERNAME || 'admin', password = process.env.API_ADMIN_PASSWORD || 'password123') {
    return await this.request.post(`${this.baseUrl}/auth`, {
      data: { username, password },
      headers: { 'Content-Type': 'application/json' },
    });
  }

    /**
   * Creates a new booking via POST /booking. No auth required — booking
   * creation is a public endpoint in this API.
   */
  async createBooking(payload: BookingPayload) {
    return await this.request.post(`${this.baseUrl}/booking`, {
      data: payload,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
  }

    /**
   * Fetches a single booking by ID via GET /booking/:id. No auth required.
   */
  async getBooking(bookingId: number) {
    return await this.request.get(`${this.baseUrl}/booking/${bookingId}`, {
      headers: { 'Accept': 'application/json' },
    });
  }

    /**
   * Fully replaces a booking via PUT /booking/:id.
   * Restful-Booker authenticates write operations via a session cookie
   * (`token=<value>`) rather than an Authorization/Bearer header — the token
   * is the one returned by createToken(). Omitting it intentionally tests
   * the 403 Forbidden path.
   */
  async updateBooking(bookingId: number, payload: BookingPayload, token?: string) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (token) {
      headers['Cookie'] = `token=${token}`;
    }

    return await this.request.put(`${this.baseUrl}/booking/${bookingId}`, {
      data: payload,
      headers,
    });
  }

    /**
   * Deletes a booking via DELETE /booking/:id. Same cookie-based auth as
   * updateBooking(); omitting the token intentionally tests the 403 path.
   */
  async deleteBooking(bookingId: number, token?: string) {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Cookie'] = `token=${token}`;
    }

    return await this.request.delete(`${this.baseUrl}/booking/${bookingId}`, { headers });
  }
}
