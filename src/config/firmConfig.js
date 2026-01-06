// Bu dosya build zamanında her büro için özelleştirilir
// Her büro sadece kendi konfigürasyonunu görür

export const FIRM_CONFIG = {
  // Bu değerler build script tarafından değiştirilir
  id: 'FIRM_ID_PLACEHOLDER',
  name: 'FIRM_NAME_PLACEHOLDER',
  shortName: 'FIRM_SHORT_NAME_PLACEHOLDER',
  description: 'FIRM_DESCRIPTION_PLACEHOLDER',
  
  // Görsel özellikler
  logo: 'FIRM_LOGO_PLACEHOLDER',
  primaryColor: 'FIRM_PRIMARY_COLOR_PLACEHOLDER',
  secondaryColor: 'FIRM_SECONDARY_COLOR_PLACEHOLDER',
  accentColor: 'FIRM_ACCENT_COLOR_PLACEHOLDER',
  
  // Özellikler
  features: ['calendar', 'cases', 'clients', 'chat', 'financial'],
  
  // Veritabanı
  database: 'firm.db',
  
  // Uygulama bilgileri
  appName: 'FIRM_APP_NAME_PLACEHOLDER',
  bundleId: 'FIRM_BUNDLE_ID_PLACEHOLDER',
  version: '1.0.0',
  
  // İletişim bilgileri
  contact: {
    email: 'FIRM_EMAIL_PLACEHOLDER',
    phone: 'FIRM_PHONE_PLACEHOLDER',
    address: 'FIRM_ADDRESS_PLACEHOLDER',
    website: 'FIRM_WEBSITE_PLACEHOLDER'
  }
};

// Varsayılan tema
export const getTheme = () => ({
  colors: {
    primary: FIRM_CONFIG.primaryColor,
    secondary: FIRM_CONFIG.secondaryColor,
    accent: FIRM_CONFIG.accentColor,
    background: '#f5f5f5',
    surface: '#ffffff',
    text: '#333333',
    textSecondary: '#666666',
    textLight: '#999999',
    border: '#e0e0e0',
    success: '#4caf50',
    warning: '#ff9800',
    error: '#f44336',
    info: '#2196f3',
  },
  gradients: {
    primary: [FIRM_CONFIG.primaryColor, FIRM_CONFIG.secondaryColor],
    accent: [FIRM_CONFIG.secondaryColor, FIRM_CONFIG.accentColor],
  },
  shadows: {
    small: {
      shadowColor: FIRM_CONFIG.primaryColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowColor: FIRM_CONFIG.primaryColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    large: {
      shadowColor: FIRM_CONFIG.primaryColor,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
  },
  typography: {
    h1: { fontSize: 32, fontWeight: 'bold', color: '#333333' },
    h2: { fontSize: 24, fontWeight: 'bold', color: '#333333' },
    h3: { fontSize: 20, fontWeight: 'bold', color: '#333333' },
    h4: { fontSize: 18, fontWeight: 'bold', color: '#333333' },
    body: { fontSize: 16, color: '#333333' },
    caption: { fontSize: 14, color: '#666666' },
    small: { fontSize: 12, color: '#999999' },
  },
  spacing: {
    xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
  },
  borderRadius: {
    small: 4, medium: 8, large: 12, xl: 16, round: 50,
  },
});
