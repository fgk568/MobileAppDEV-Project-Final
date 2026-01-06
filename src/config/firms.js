// Hukuk büroları konfigürasyonu
export const FIRM_CONFIGS = {
  'firm1': {
    id: 'firm1',
    name: 'Avukatlık Bürosu A',
    shortName: 'Büro A',
    logo: require('../../assets/logos/firm1.png'),
    primaryColor: '#1a1a2e',
    secondaryColor: '#4a9eff',
    accentColor: '#ff6b6b',
    features: ['calendar', 'cases', 'clients', 'chat', 'financial'],
    database: 'firm1.db',
    description: 'Profesyonel hukuk hizmetleri'
  },
  'firm2': {
    id: 'firm2',
    name: 'Hukuk Bürosu B',
    shortName: 'Büro B',
    logo: require('../../assets/logos/firm2.png'),
    primaryColor: '#2d5016',
    secondaryColor: '#4caf50',
    accentColor: '#ff9800',
    features: ['calendar', 'cases', 'clients'],
    database: 'firm2.db',
    description: 'Uzman hukuk danışmanlığı'
  },
  'firm3': {
    id: 'firm3',
    name: 'Hukuk Bürosu C',
    shortName: 'Büro C',
    logo: require('../../assets/logos/firm3.png'),
    primaryColor: '#8e24aa',
    secondaryColor: '#e91e63',
    accentColor: '#00bcd4',
    features: ['calendar', 'cases', 'clients', 'chat'],
    database: 'firm3.db',
    description: 'Modern hukuk çözümleri'
  }
};

// Varsayılan büro
export const DEFAULT_FIRM = 'firm1';

// Tüm büro listesi
export const getAllFirms = () => Object.values(FIRM_CONFIGS);

// Büro ID'sine göre konfigürasyon getir
export const getFirmConfig = (firmId) => FIRM_CONFIGS[firmId] || FIRM_CONFIGS[DEFAULT_FIRM];
