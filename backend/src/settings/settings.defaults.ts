/**
 * Shipped defaults for every settings section on the admin Settings screen.
 * A section is only persisted once an admin saves it; until then these apply.
 * Keys mirror `frontend/lib/admin/settings.ts`.
 */
export const DEFAULT_SETTINGS = {
  storeInformation: {
    storeName: 'CENTO Servizi',
    supportEmail: 'support@cento.local',
    phone: '',
    currency: 'EUR (€)',
    timeZone: '(UTC+01:00) Rome, Berlin, Paris',
    language: 'English',
  },

  customerAccounts: {
    registration: true,
    emailVerification: true,
    guestCheckout: true,
    socialLogin: false,
    profileEditing: true,
    accountDeletion: false,
    passwordStrength: 'Medium',
    sessionTimeout: '1 hour',
  },

  orders: {
    autoConfirm: false,
    allowCancellation: true,
    orderTracking: true,
    invoiceGeneration: true,
    defaultOrderStatus: 'Pending',
    cancellationWindow: '24 hours',
    returnPeriod: '30 days',
  },

  shipping: {
    methods: [
      { id: 'standard', name: 'Standard Shipping', price: 4.99, enabled: true },
      { id: 'express', name: 'Express Shipping', price: 9.99, enabled: true },
      { id: 'next-day', name: 'Next-Day Delivery', price: 14.99, enabled: false },
      { id: 'pickup', name: 'Local Pickup', price: 0, enabled: true },
    ],
    regions: ['Europe'],
    freeShippingThreshold: 0,
  },

  payments: {
    cod: true,
    card: true,
    bankTransfer: false,
    wallet: true,
    gateway: true,
  },

  tax: {
    pricesIncludeTax: true,
    regionalRates: [
      { region: 'European Union (VAT)', rate: '20%' },
      { region: 'United Kingdom (VAT)', rate: '20%' },
      { region: 'United States (Sales Tax)', rate: 'Varies by state' },
    ],
  },

  discountsPromotions: {
    coupons: true,
    automaticDiscounts: false,
    referralProgram: false,
    loyaltyRewards: false,
    firstOrderDiscount: true,
    couponExpiration: '30 days',
  },

  inventory: {
    backorders: false,
    autoInventoryUpdates: true,
    outOfStockVisibility: 'Show as “Out of Stock”',
    stockReservation: '30 minutes',
    lowStockThreshold: 20,
  },

  notifications: {
    customer: {
      orderConfirmation: true,
      shippingUpdates: true,
      deliveryConfirmation: true,
      promotionalEmails: false,
      smsNotifications: false,
      newsletter: true,
    },
    admin: {
      newOrderAlerts: true,
      lowInventoryAlerts: true,
      customerRegistrationAlerts: false,
      paymentFailureAlerts: true,
    },
  },

  security: {
    sessionManagement: true,
    securityAlerts: true,
    loginAttempts: '5 attempts',
    passwordExpiry: 'Never',
    twoFactorRequired: false,
  },

  seoWebsite: {
    metaTitle: 'CENTO Servizi',
    metaDescription: '',
    sitemapEnabled: true,
  },

  email: {
    provider: 'SMTP',
    fromName: 'CENTO Admin',
    // The actual credentials live in environment variables, never in the DB.
    configuredViaEnv: true,
  },

  appearance: {
    theme: 'system',
    primaryColor: '#0A2540',
    secondaryColor: '#F4F3EF',
  },

  legal: {
    documents: [
      { id: 'privacy', name: 'Privacy Policy', content: '' },
      { id: 'terms', name: 'Terms & Conditions', content: '' },
      { id: 'returns', name: 'Return Policy', content: '' },
      { id: 'shipping-policy', name: 'Shipping Policy', content: '' },
      { id: 'cookies', name: 'Cookie Policy', content: '' },
    ],
  },

  backup: {
    frequency: 'Daily',
    lastBackup: null,
    version: 'v2.4.1',
  },
} as const;

export type SettingKey = keyof typeof DEFAULT_SETTINGS;

export const SETTING_KEYS = Object.keys(DEFAULT_SETTINGS) as SettingKey[];
