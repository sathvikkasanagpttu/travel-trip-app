import dotenv from 'dotenv'
dotenv.config()

export const config = {
  port: parseInt(process.env.PORT || '5001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || 'travel-trip-jwt-access-super-secret-key-2026-safe-random-phrase',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'travel-trip-jwt-refresh-super-secret-key-2026-safe-random-phrase',
  jwtAccessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
  jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  cookieDomain: process.env.COOKIE_DOMAIN || undefined,
  cookieSecure: process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production',
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  mailFrom: process.env.MAIL_FROM || 'no-reply@traveltrip.com',
  nominatimUserAgent: process.env.NOMINATIM_USER_AGENT || 'TravelTripApp/1.0 (contact@traveltrip.com)',
  quoteRatePerKm: parseFloat(process.env.QUOTE_RATE_PER_KM || '5'),
  quoteNightRate: parseFloat(process.env.QUOTE_NIGHT_RATE || '1000'),
  quoteAssistanceSurcharge: parseFloat(process.env.QUOTE_ASSISTANCE_SURCHARGE || '500'),
  autoConfirmSeconds: parseInt(process.env.AUTO_CONFIRM_SECONDS || '0', 10),
}
