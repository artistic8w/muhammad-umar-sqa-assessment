import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

/** Shape of a room creation payload; feature flags are optional so tests can create minimal rooms. */
export interface RoomDetails {
  roomName: string;
  type: 'Single' | 'Double' | 'Twin' | 'Family' | 'Suite';
  accessible: boolean;
  price: string;
  wifi?: boolean;
  refreshments?: boolean;
  tv?: boolean;
  safe?: boolean;
  radio?: boolean;
  views?: boolean;
}

export class AdminDashboardPage extends BasePage {
  readonly roomNameInput: Locator;
  readonly typeSelect: Locator;
  readonly accessibleSelect: Locator;
  readonly priceInput: Locator;
  readonly wifiCheckbox: Locator;
  readonly refreshmentsCheckbox: Locator;
  readonly tvCheckbox: Locator;
  readonly safeCheckbox: Locator;
  readonly radioCheckbox: Locator;
  readonly viewsCheckbox: Locator;
  readonly createRoomButton: Locator;

  constructor(page: Page) {
    super(page);
    this.roomNameInput = page.getByTestId('roomName');
    this.typeSelect = page.locator('#type');
    this.accessibleSelect = page.locator('#accessible');
    this.priceInput = page.locator('#roomPrice');
    this.wifiCheckbox = page.locator('#wifiCheckbox');
    this.refreshmentsCheckbox = page.locator('#refreshCheckbox');
    this.tvCheckbox = page.locator('#tvCheckbox');
    this.safeCheckbox = page.locator('#safeCheckbox');
    this.radioCheckbox = page.locator('#radioCheckbox');
    this.viewsCheckbox = page.locator('#viewsCheckbox');
    this.createRoomButton = page.locator('#createRoom');
  }

  /**
   * Fills and submits the room creation form, checking all specified feature checkboxes.
   */
  async createRoom(details: RoomDetails) {
    await this.roomNameInput.fill(details.roomName);
    await this.typeSelect.selectOption(details.type);
    await this.accessibleSelect.selectOption(details.accessible ? 'true' : 'false');
    await this.priceInput.fill(details.price);

    // Check all feature checkboxes if enabled in room details
    if (details.wifi) await this.wifiCheckbox.check();
    if (details.refreshments) await this.refreshmentsCheckbox.check();
    if (details.tv) await this.tvCheckbox.check();
    if (details.safe) await this.safeCheckbox.check();
    if (details.radio) await this.radioCheckbox.check();
    if (details.views) await this.viewsCheckbox.check();

    await this.createRoomButton.click();
  }

  /** Locates the newly created room's row in the dashboard grid by its exact room name/number. */
  getRoomLocator(roomName: string): Locator {
    return this.page.getByText(roomName, { exact: true });
  }
}