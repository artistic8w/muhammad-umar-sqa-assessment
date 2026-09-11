import { BookingPayload } from './api-client.js';
import { ContactFormPayload } from '../pages/ContactPage.js';
import { RoomDetails } from '../pages/AdminDashboardPage.js';

/** Valid booking payload used for happy-path booking creation tests. */
export const getValidBookingData = (): BookingPayload => ({
  firstname: 'Muhammad',
  lastname: 'Umar',
  totalprice: 250,
  depositpaid: true,
  bookingdates: {
    checkin: '2026-10-01',
    checkout: '2026-10-05',
  },
  additionalneeds: 'Late Check-in',
});

/** Payload used to verify PUT /booking correctly overwrites an existing booking. */
export const getUpdatedBookingData = (): BookingPayload => ({
  firstname: 'Muhammad',
  lastname: 'Umar Updated',
  totalprice: 350,
  depositpaid: false,
  bookingdates: {
    checkin: '2026-10-02',
    checkout: '2026-10-07',
  },
  additionalneeds: 'Airport Transfer',
});

// --- UI Test Data ---

/** Valid contact form payload used for the happy-path contact form test. */
export const getValidContactFormData = (): ContactFormPayload => ({
  name: 'Muhammad Umar',
  email: 'umar.qa@example.com',
  phone: '030012345678',
  subject: 'Booking Inquiry for October',
  message: 'Hello, I would like to inquire about room availability and pricing details.',
});

/**
 * Generates room data with a randomized room name/number on every call.
 * Randomization avoids "duplicate room number" collisions across repeated
 * test runs (see BUG-004), since the Admin Portal does not enforce uniqueness.
 */
export const getRandomRoomDetails = (): RoomDetails => ({
  roomName: `${Math.floor(100 + Math.random() * 900)}`,
  type: 'Single',
  accessible: true,
  price: '150',
  wifi: true,
  refreshments: true,
  tv: true,
  safe: true,
  radio: true,
  views: true,
});