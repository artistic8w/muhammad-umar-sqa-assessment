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

export class ApiClient {
  private baseUrl: string;

  constructor(private request: APIRequestContext) {
    this.baseUrl = process.env.API_BASE_URL || 'https://restful-booker.herokuapp.com';
  }

  /**
   * Reads admin credentials from environment variables by default (no hardcoded
   * fallback) — mirrors the fail-fast pattern used by AdminLoginPage.login() so
   * both layers behave consistently rather than one silently defaulting.
   */
  async createToken(username = process.env.API_ADMIN_USERNAME, password = process.env.API_ADMIN_PASSWORD) {
    if (!username || !password) {
      throw new Error('API_ADMIN_USERNAME or API_ADMIN_PASSWORD is not defined in .env');
    }
    return await this.request.post(`${this.baseUrl}/auth`, {
      data: { username, password },
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async createBooking(payload: BookingPayload) {
    return await this.request.post(`${this.baseUrl}/booking`, {
      data: payload,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
  }

  async getBooking(bookingId: number) {
    return await this.request.get(`${this.baseUrl}/booking/${bookingId}`, {
      headers: { 'Accept': 'application/json' },
    });
  }

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

  async deleteBooking(bookingId: number, token?: string) {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Cookie'] = `token=${token}`;
    }

    return await this.request.delete(`${this.baseUrl}/booking/${bookingId}`, { headers });
  }
}