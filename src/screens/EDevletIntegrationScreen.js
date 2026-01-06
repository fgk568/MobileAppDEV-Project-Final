import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import WebCompatibleIcon from '../components/WebCompatibleIcon';
import EDevletService from '../services/EDevletService';
import { useDatabase } from '../context/FirebaseDatabaseContext';

const EDevletIntegrationScreen = ({ navigation }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [tcKimlikNo, setTcKimlikNo] = useState('');
  const [password, setPassword] = useState('');
  const [importedCases, setImportedCases] = useState([]);
  const [selectedCases, setSelectedCases] = useState([]);
  const { db, isReady } = useDatabase();

  useEffect(() => {
    checkConnection();
    loadStoredCredentials();
  }, []);

  const checkConnection = async () => {
    setIsLoading(true);
    const result = await EDevletService.checkConnection();
    setIsConnected(result.success);
    setIsLoading(false);
  };

  const loadStoredCredentials = async () => {
    await EDevletService.loadStoredCredentials();
  };

  const handleLogin = async () => {
    if (!tcKimlikNo || !password) {
      Alert.alert('Hata', 'Lütfen TC Kimlik No ve şifrenizi girin.');
      return;
    }

    setIsLoading(true);
    const result = await EDevletService.login(tcKimlikNo, password);
    
    if (result.success) {
      setIsConnected(true);
      setShowLoginModal(false);
      Alert.alert('Başarılı', 'E-Devlet bağlantısı kuruldu.');
      await loadCaseFiles();
    } else {
      Alert.alert('Hata', result.error || 'Giriş yapılamadı.');
    }
    setIsLoading(false);
  };

  const loadCaseFiles = async () => {
    setIsLoading(true);
    const result = await EDevletService.getCaseFiles();
    
    if (result.success) {
      setImportedCases(result.cases);
    } else {
      Alert.alert('Hata', result.error || 'Dava dosyaları yüklenemedi.');
    }
    setIsLoading(false);
  };

  const toggleCaseSelection = (caseId) => {
    setSelectedCases(prev => 
      prev.includes(caseId) 
        ? prev.filter(id => id !== caseId)
        : [...prev, caseId]
    );
  };

  const importSelectedCases = async () => {
    if (selectedCases.length === 0) {
      Alert.alert('Uyarı', 'Lütfen en az bir dava dosyası seçin.');
      return;
    }

    setIsLoading(true);
    let successCount = 0;
    let errorCount = 0;

    for (const caseId of selectedCases) {
      try {
        const caseData = importedCases.find(c => c.id === caseId);
        if (caseData) {
          // Dava dosyasını veritabanına ekle
          await db.runAsync(`
            INSERT INTO cases (
              lawyer_id, case_number, title, client_name, status,
              total_fee, paid_fee, remaining_fee, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            1, // Varsayılan avukat ID
            caseData.caseNumber,
            caseData.title,
            caseData.clientName,
            caseData.status || 'Açık',
            caseData.totalFee || 0,
            caseData.paidFee || 0,
            (caseData.totalFee || 0) - (caseData.paidFee || 0),
            new Date().toISOString(),
            new Date().toISOString()
          ]);

          // Duruşmaları takvime ekle
          const hearingsResult = await EDevletService.getCaseHearings(caseData.caseNumber);
          if (hearingsResult.success) {
            for (const hearing of hearingsResult.hearings) {
              await db.runAsync(`
                INSERT INTO calendar_events (
                  lawyer_id, title, description, date, time,
                  event_type, location, client_name, case_number,
                  is_reminder, status, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `, [
                1,
                `Duruşma - ${caseData.title}`,
                hearing.description,
                hearing.date,
                hearing.time,
                'Duruşma',
                hearing.location,
                caseData.clientName,
                caseData.caseNumber,
                1,
                'Planlandı',
                new Date().toISOString(),
                new Date().toISOString()
              ]);
            }
          }

          successCount++;
        }
      } catch (error) {
        console.error('Error importing case:', error);
        errorCount++;
      }
    }

    setIsLoading(false);
    Alert.alert(
      'İçe Aktarma Tamamlandı',
      `${successCount} dava dosyası başarıyla içe aktarıldı. ${errorCount} hata oluştu.`
    );
    
    setSelectedCases([]);
    setImportedCases([]);
  };

  const handleLogout = async () => {
    const result = await EDevletService.logout();
    if (result.success) {
      setIsConnected(false);
      setImportedCases([]);
      setSelectedCases([]);
      Alert.alert('Başarılı', 'E-Devlet bağlantısı kesildi.');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Açık': return '#4caf50';
      case 'Devam Ediyor': return '#ff9800';
      case 'Kapalı': return '#f44336';
      default: return '#666';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>🏛️ E-Devlet Entegrasyonu</Text>
          <Text style={styles.subtitle}>Dava dosyalarını otomatik çekin</Text>
        </View>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <WebCompatibleIcon name="arrow-back" size={24} color="#4a9eff" />
        </TouchableOpacity>
      </View>

      {/* Bağlantı Durumu */}
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <WebCompatibleIcon 
            name={isConnected ? "check-circle" : "error"} 
            size={24} 
            color={isConnected ? "#4caf50" : "#f44336"} 
          />
          <Text style={styles.statusText}>
            {isConnected ? 'E-Devlet Bağlı' : 'E-Devlet Bağlantısı Yok'}
          </Text>
        </View>
        
        {!isConnected && (
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => setShowLoginModal(true)}
          >
            <WebCompatibleIcon name="login" size={20} color="white" />
            <Text style={styles.loginButtonText}>E-Devlet'e Giriş Yap</Text>
          </TouchableOpacity>
        )}

        {isConnected && (
          <View style={styles.connectedActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={loadCaseFiles}
              disabled={isLoading}
            >
              <WebCompatibleIcon name="refresh" size={20} color="#4a9eff" />
              <Text style={styles.actionButtonText}>Dava Dosyalarını Yükle</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.logoutButton]}
              onPress={handleLogout}
            >
              <WebCompatibleIcon name="logout" size={20} color="#f44336" />
              <Text style={[styles.actionButtonText, styles.logoutText]}>Çıkış Yap</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Yüklenen Dava Dosyaları */}
      {importedCases.length > 0 && (
        <View style={styles.casesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📁 Yüklenen Dava Dosyaları</Text>
            <TouchableOpacity 
              style={styles.importButton}
              onPress={importSelectedCases}
              disabled={selectedCases.length === 0 || isLoading}
            >
              <WebCompatibleIcon name="download" size={20} color="white" />
              <Text style={styles.importButtonText}>
                Seçilenleri İçe Aktar ({selectedCases.length})
              </Text>
            </TouchableOpacity>
          </View>

          {importedCases.map((caseItem) => (
            <TouchableOpacity
              key={caseItem.id}
              style={[
                styles.caseCard,
                selectedCases.includes(caseItem.id) && styles.selectedCaseCard
              ]}
              onPress={() => toggleCaseSelection(caseItem.id)}
            >
              <View style={styles.caseHeader}>
                <View style={styles.caseInfo}>
                  <Text style={styles.caseTitle}>{caseItem.title}</Text>
                  <Text style={styles.caseNumber}>Dava No: {caseItem.caseNumber}</Text>
                  <Text style={styles.clientName}>Müvekkil: {caseItem.clientName}</Text>
                </View>
                <View style={styles.caseActions}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(caseItem.status) }]}>
                    <Text style={styles.statusText}>{caseItem.status}</Text>
                  </View>
                  {selectedCases.includes(caseItem.id) && (
                    <WebCompatibleIcon name="check-circle" size={24} color="#4caf50" />
                  )}
                </View>
              </View>
              
              <View style={styles.caseDetails}>
                <Text style={styles.caseDetail}>
                  📅 Açılış Tarihi: {formatDate(caseItem.openingDate)}
                </Text>
                <Text style={styles.caseDetail}>
                  💰 Toplam Ücret: ₺{caseItem.totalFee || 0}
                </Text>
                <Text style={styles.caseDetail}>
                  🏛️ Mahkeme: {caseItem.court}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Giriş Modal */}
      <Modal
        visible={showLoginModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLoginModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>E-Devlet Girişi</Text>
              <TouchableOpacity onPress={() => setShowLoginModal(false)}>
                <WebCompatibleIcon name="close" size={24} color="#4a9eff" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>TC Kimlik No</Text>
              <TextInput
                style={styles.input}
                placeholder="TC Kimlik No girin"
                value={tcKimlikNo}
                onChangeText={setTcKimlikNo}
                keyboardType="numeric"
                maxLength={11}
              />

              <Text style={styles.inputLabel}>E-Devlet Şifresi</Text>
              <TextInput
                style={styles.input}
                placeholder="E-Devlet şifrenizi girin"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              <TouchableOpacity 
                style={styles.submitButton}
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <WebCompatibleIcon name="login" size={20} color="white" />
                    <Text style={styles.submitButtonText}>Giriş Yap</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4a9eff" />
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    backgroundColor: '#1a1a2e',
    padding: 20,
    paddingTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d3d',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#b8c5d1',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(74, 158, 255, 0.1)',
  },
  statusCard: {
    backgroundColor: '#1e1e2e',
    margin: 15,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2d2d3d',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  statusText: {
    fontSize: 16,
    color: '#ffffff',
    marginLeft: 10,
    fontWeight: '500',
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4a9eff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  connectedActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 158, 255, 0.1)',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4a9eff',
  },
  actionButtonText: {
    color: '#4a9eff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 5,
  },
  logoutButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderColor: '#f44336',
  },
  logoutText: {
    color: '#f44336',
  },
  casesSection: {
    margin: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4caf50',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  importButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  caseCard: {
    backgroundColor: '#1e1e2e',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2d2d3d',
  },
  selectedCaseCard: {
    borderColor: '#4a9eff',
    backgroundColor: 'rgba(74, 158, 255, 0.1)',
  },
  caseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  caseInfo: {
    flex: 1,
    marginRight: 10,
  },
  caseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  caseNumber: {
    fontSize: 14,
    color: '#b8c5d1',
    marginBottom: 3,
  },
  clientName: {
    fontSize: 14,
    color: '#b8c5d1',
  },
  caseActions: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 5,
  },
  caseDetails: {
    borderTopWidth: 1,
    borderTopColor: '#2d2d3d',
    paddingTop: 10,
  },
  caseDetail: {
    fontSize: 13,
    color: '#b8c5d1',
    marginBottom: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  modalBody: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    backgroundColor: '#2d2d3d',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#4a9eff',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4a9eff',
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 10,
  },
});

export default EDevletIntegrationScreen;




