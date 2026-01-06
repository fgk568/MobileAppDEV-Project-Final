import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

class EDevletService {
  constructor() {
    this.baseURL = 'https://api.edevlet.gov.tr'; // E-Devlet API base URL
    this.apiKey = null;
    this.token = null;
  }

  // E-Devlet API anahtarı ayarla
  async setApiKey(apiKey) {
    this.apiKey = apiKey;
    await AsyncStorage.setItem('edevlet_api_key', apiKey);
  }

  // E-Devlet token'ı ayarla
  async setToken(token) {
    this.token = token;
    await AsyncStorage.setItem('edevlet_token', token);
  }

  // Kayıtlı API anahtarını yükle
  async loadStoredCredentials() {
    try {
      this.apiKey = await AsyncStorage.getItem('edevlet_api_key');
      this.token = await AsyncStorage.getItem('edevlet_token');
    } catch (error) {
      console.error('Error loading stored credentials:', error);
    }
  }

  // E-Devlet'e giriş yap
  async login(tcKimlikNo, password) {
    try {
      const response = await axios.post(`${this.baseURL}/auth/login`, {
        tcKimlikNo,
        password,
        applicationId: 'SY_HUKUK_APP'
      });

      if (response.data.success) {
        await this.setToken(response.data.token);
        return { success: true, token: response.data.token };
      } else {
        return { success: false, error: response.data.message };
      }
    } catch (error) {
      console.error('E-Devlet login error:', error);
      return { success: false, error: 'E-Devlet bağlantısı kurulamadı' };
    }
  }

  // Dava dosyalarını çek
  async getCaseFiles() {
    try {
      if (!this.token) {
        throw new Error('E-Devlet token bulunamadı. Lütfen giriş yapın.');
      }

      const response = await axios.get(`${this.baseURL}/cases`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        cases: response.data.cases || []
      };
    } catch (error) {
      console.error('Error fetching case files:', error);
      return {
        success: false,
        error: 'Dava dosyaları çekilemedi'
      };
    }
  }

  // Belirli bir dava dosyasının detaylarını çek
  async getCaseDetails(caseNumber) {
    try {
      if (!this.token) {
        throw new Error('E-Devlet token bulunamadı. Lütfen giriş yapın.');
      }

      const response = await axios.get(`${this.baseURL}/cases/${caseNumber}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        case: response.data.case
      };
    } catch (error) {
      console.error('Error fetching case details:', error);
      return {
        success: false,
        error: 'Dava detayları çekilemedi'
      };
    }
  }

  // Dava duruşmalarını çek
  async getCaseHearings(caseNumber) {
    try {
      if (!this.token) {
        throw new Error('E-Devlet token bulunamadı. Lütfen giriş yapın.');
      }

      const response = await axios.get(`${this.baseURL}/cases/${caseNumber}/hearings`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        hearings: response.data.hearings || []
      };
    } catch (error) {
      console.error('Error fetching case hearings:', error);
      return {
        success: false,
        error: 'Duruşma bilgileri çekilemedi'
      };
    }
  }

  // Dava belgelerini çek
  async getCaseDocuments(caseNumber) {
    try {
      if (!this.token) {
        throw new Error('E-Devlet token bulunamadı. Lütfen giriş yapın.');
      }

      const response = await axios.get(`${this.baseURL}/cases/${caseNumber}/documents`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        documents: response.data.documents || []
      };
    } catch (error) {
      console.error('Error fetching case documents:', error);
      return {
        success: false,
        error: 'Dava belgeleri çekilemedi'
      };
    }
  }

  // Dava kararlarını çek
  async getCaseDecisions(caseNumber) {
    try {
      if (!this.token) {
        throw new Error('E-Devlet token bulunamadı. Lütfen giriş yapın.');
      }

      const response = await axios.get(`${this.baseURL}/cases/${caseNumber}/decisions`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        decisions: response.data.decisions || []
      };
    } catch (error) {
      console.error('Error fetching case decisions:', error);
      return {
        success: false,
        error: 'Dava kararları çekilemedi'
      };
    }
  }

  // E-Devlet'ten çıkış yap
  async logout() {
    try {
      if (this.token) {
        await axios.post(`${this.baseURL}/auth/logout`, {}, {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
          }
        });
      }
      
      await AsyncStorage.removeItem('edevlet_token');
      await AsyncStorage.removeItem('edevlet_api_key');
      this.token = null;
      this.apiKey = null;
      
      return { success: true };
    } catch (error) {
      console.error('E-Devlet logout error:', error);
      return { success: false, error: 'Çıkış yapılamadı' };
    }
  }

  // Bağlantı durumunu kontrol et
  async checkConnection() {
    try {
      const response = await axios.get(`${this.baseURL}/health`, {
        timeout: 5000
      });
      return { success: true, status: response.data.status };
    } catch (error) {
      return { success: false, error: 'E-Devlet bağlantısı kurulamadı' };
    }
  }
}

export default new EDevletService();
