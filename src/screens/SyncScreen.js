import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useDatabase } from '../context/FirebaseDatabaseContext';
import WebCompatibleIcon from '../components/WebCompatibleIcon';
import { format } from 'date-fns';

const SyncScreen = ({ navigation }) => {
  const { db, isReady } = useDatabase();
  const [syncSettings, setSyncSettings] = useState({
    autoSync: true,
    wifiOnly: true,
    cloudBackup: false,
    notifications: true,
  });
  const [lastSync, setLastSync] = useState(null);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, success, error
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncStats, setSyncStats] = useState({
    totalCases: 0,
    totalClients: 0,
    totalEvents: 0,
    totalDocuments: 0,
  });

  useEffect(() => {
    if (isReady) {
      loadSyncData();
    }
  }, [isReady]);

  const loadSyncData = async () => {
    try {
      // Son senkronizasyon tarihini yükle (bu örnekte localStorage'dan)
      const lastSyncDate = new Date(); // Gerçek uygulamada AsyncStorage'dan gelecek
      setLastSync(lastSyncDate);

      // İstatistikleri yükle
      const [cases, clients, events, documents] = await Promise.all([
        db.getAllAsync('cases'),
        db.getAllAsync('clients'),
        db.getAllAsync('calendar_events'),
        db.getAllAsync('documents')
      ]);
      
      const casesCount = { count: cases.length };
      const clientsCount = { count: clients.length };
      const eventsCount = { count: events.length };
      const documentsCount = { count: documents.length };

      setSyncStats({
        totalCases: casesCount?.count || 0,
        totalClients: clientsCount?.count || 0,
        totalEvents: eventsCount?.count || 0,
        totalDocuments: documentsCount?.count || 0,
      });
    } catch (error) {
      console.error('Error loading sync data:', error);
    }
  };

  const handleSync = async () => {
    setSyncStatus('syncing');
    setSyncProgress(0);

    try {
      // Simüle edilmiş senkronizasyon süreci
      const steps = [
        { name: 'Veriler hazırlanıyor...', progress: 20 },
        { name: 'Cloud\'a yükleniyor...', progress: 50 },
        { name: 'Dosyalar senkronize ediliyor...', progress: 80 },
        { name: 'Tamamlanıyor...', progress: 100 },
      ];

      for (const step of steps) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setSyncProgress(step.progress);
      }

      setSyncStatus('success');
      setLastSync(new Date());
      Alert.alert('Başarılı', 'Senkronizasyon tamamlandı.');
      
      // 3 saniye sonra durumu sıfırla
      setTimeout(() => {
        setSyncStatus('idle');
        setSyncProgress(0);
      }, 3000);
    } catch (error) {
      console.error('Error during sync:', error);
      setSyncStatus('error');
      Alert.alert('Hata', 'Senkronizasyon sırasında bir hata oluştu.');
      
      setTimeout(() => {
        setSyncStatus('idle');
        setSyncProgress(0);
      }, 3000);
    }
  };

  const handleSettingsChange = (setting, value) => {
    setSyncSettings(prev => ({
      ...prev,
      [setting]: value,
    }));
    Alert.alert('Başarılı', 'Senkronizasyon ayarları güncellendi.');
  };

  const handleExportData = async () => {
    Alert.alert(
      'Veri Dışa Aktar',
      'Tüm verilerinizi dışa aktarmak istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Dışa Aktar',
          onPress: async () => {
            try {
              // Bu örnekte basit bir alert gösteriyoruz
              // Gerçek uygulamada veriler JSON olarak dışa aktarılır
              Alert.alert('Başarılı', 'Veriler başarıyla dışa aktarıldı.');
            } catch (error) {
              console.error('Error exporting data:', error);
              Alert.alert('Hata', 'Veri dışa aktarılırken bir hata oluştu.');
            }
          },
        },
      ]
    );
  };

  const handleImportData = async () => {
    Alert.alert(
      'Veri İçe Aktar',
      'Dışa aktarılan verileri içe aktarmak istediğinizden emin misiniz? Mevcut veriler üzerine yazılacaktır.',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'İçe Aktar',
          onPress: async () => {
            try {
              // Bu örnekte basit bir alert gösteriyoruz
              // Gerçek uygulamada JSON dosyası okunur ve veritabanına aktarılır
              Alert.alert('Başarılı', 'Veriler başarıyla içe aktarıldı.');
              loadSyncData(); // İstatistikleri yenile
            } catch (error) {
              console.error('Error importing data:', error);
              Alert.alert('Hata', 'Veri içe aktarılırken bir hata oluştu.');
            }
          },
        },
      ]
    );
  };

  const getSyncStatusColor = () => {
    switch (syncStatus) {
      case 'syncing': return '#ff9800';
      case 'success': return '#4caf50';
      case 'error': return '#f44336';
      default: return '#666';
    }
  };

  const getSyncStatusText = () => {
    switch (syncStatus) {
      case 'syncing': return 'Senkronize ediliyor...';
      case 'success': return 'Senkronizasyon tamamlandı';
      case 'error': return 'Senkronizasyon hatası';
      default: return 'Son senkronizasyon';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔄 Senkronizasyon</Text>
        <Text style={styles.subtitle}>Veri yedekleme ve senkronizasyon</Text>
      </View>

      {/* Senkronizasyon Durumu */}
      <View style={styles.statusSection}>
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <WebCompatibleIcon name="cloud-sync" size={24} color={getSyncStatusColor()} />
            <Text style={styles.statusTitle}>{getSyncStatusText()}</Text>
          </View>
          
          {lastSync && (
            <Text style={styles.lastSyncText}>
              {format(lastSync, 'dd/MM/yyyy HH:mm')}
            </Text>
          )}

          {syncStatus === 'syncing' && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${syncProgress}%` }]} />
              </View>
              <Text style={styles.progressText}>{syncProgress}%</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.syncButton, syncStatus === 'syncing' && styles.syncButtonDisabled]}
            onPress={handleSync}
            disabled={syncStatus === 'syncing'}
          >
            {syncStatus === 'syncing' ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <WebCompatibleIcon name="sync" size={20} color="white" />
            )}
            <Text style={styles.syncButtonText}>
              {syncStatus === 'syncing' ? 'Senkronize Ediliyor...' : 'Senkronize Et'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Veri İstatistikleri */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>📊 Veri İstatistikleri</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{syncStats.totalCases}</Text>
            <Text style={styles.statLabel}>Dava Dosyası</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{syncStats.totalClients}</Text>
            <Text style={styles.statLabel}>Müvekkil</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{syncStats.totalEvents}</Text>
            <Text style={styles.statLabel}>Etkinlik</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{syncStats.totalDocuments}</Text>
            <Text style={styles.statLabel}>Doküman</Text>
          </View>
        </View>
      </View>

      {/* Senkronizasyon Ayarları */}
      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>⚙️ Senkronizasyon Ayarları</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <WebCompatibleIcon name="sync" size={24} color="#1976d2" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Otomatik Senkronizasyon</Text>
              <Text style={styles.settingDescription}>Uygulama açıldığında otomatik senkronize et</Text>
            </View>
          </View>
          <Switch
            value={syncSettings.autoSync}
            onValueChange={(value) => handleSettingsChange('autoSync', value)}
            trackColor={{ false: '#767577', true: '#1976d2' }}
            thumbColor={syncSettings.autoSync ? '#fff' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <WebCompatibleIcon name="wifi" size={24} color="#4caf50" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Sadece WiFi</Text>
              <Text style={styles.settingDescription}>Sadece WiFi bağlantısında senkronize et</Text>
            </View>
          </View>
          <Switch
            value={syncSettings.wifiOnly}
            onValueChange={(value) => handleSettingsChange('wifiOnly', value)}
            trackColor={{ false: '#767577', true: '#1976d2' }}
            thumbColor={syncSettings.wifiOnly ? '#fff' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <WebCompatibleIcon name="cloud-upload" size={24} color="#ff9800" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Cloud Yedekleme</Text>
              <Text style={styles.settingDescription}>Verileri cloud'da yedekle</Text>
            </View>
          </View>
          <Switch
            value={syncSettings.cloudBackup}
            onValueChange={(value) => handleSettingsChange('cloudBackup', value)}
            trackColor={{ false: '#767577', true: '#1976d2' }}
            thumbColor={syncSettings.cloudBackup ? '#fff' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <WebCompatibleIcon name="notifications" size={24} color="#9c27b0" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Bildirimler</Text>
              <Text style={styles.settingDescription}>Senkronizasyon bildirimleri gönder</Text>
            </View>
          </View>
          <Switch
            value={syncSettings.notifications}
            onValueChange={(value) => handleSettingsChange('notifications', value)}
            trackColor={{ false: '#767577', true: '#1976d2' }}
            thumbColor={syncSettings.notifications ? '#fff' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Veri Yönetimi */}
      <View style={styles.dataSection}>
        <Text style={styles.sectionTitle}>💾 Veri Yönetimi</Text>
        
        <TouchableOpacity style={styles.dataButton} onPress={handleExportData}>
          <WebCompatibleIcon name="file-download" size={24} color="#4caf50" />
          <View style={styles.dataButtonContent}>
            <Text style={styles.dataButtonTitle}>Veri Dışa Aktar</Text>
            <Text style={styles.dataButtonDescription}>Tüm verilerinizi JSON formatında dışa aktarın</Text>
          </View>
          <WebCompatibleIcon name="chevron-right" size={24} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.dataButton} onPress={handleImportData}>
          <WebCompatibleIcon name="file-upload" size={24} color="#2196f3" />
          <View style={styles.dataButtonContent}>
            <Text style={styles.dataButtonTitle}>Veri İçe Aktar</Text>
            <Text style={styles.dataButtonDescription}>Dışa aktarılan verileri içe aktarın</Text>
          </View>
          <WebCompatibleIcon name="chevron-right" size={24} color="#ccc" />
        </TouchableOpacity>
      </View>

      {/* Güvenlik Bilgisi */}
      <View style={styles.securitySection}>
        <View style={styles.securityCard}>
          <WebCompatibleIcon name="security" size={24} color="#4caf50" />
          <View style={styles.securityContent}>
            <Text style={styles.securityTitle}>Güvenli Veri Yönetimi</Text>
            <Text style={styles.securityDescription}>
              Tüm verileriniz şifrelenmiş olarak saklanır ve sadece sizin erişiminiz vardır. 
              Senkronizasyon işlemleri güvenli bağlantılar üzerinden gerçekleştirilir.
            </Text>
          </View>
        </View>
      </View>
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
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d3d',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#b8c5d1',
  },
  statusSection: {
    padding: 15,
  },
  statusCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  lastSyncText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  progressContainer: {
    marginBottom: 15,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1976d2',
    borderRadius: 4,
  },
  progressText: {
    textAlign: 'center',
    marginTop: 5,
    fontSize: 14,
    color: '#666',
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1976d2',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  syncButtonDisabled: {
    backgroundColor: '#ccc',
  },
  syncButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  statsSection: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  settingsSection: {
    backgroundColor: 'white',
    margin: 15,
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 15,
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
  },
  dataSection: {
    padding: 15,
  },
  dataButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dataButtonContent: {
    flex: 1,
    marginLeft: 15,
  },
  dataButtonTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  dataButtonDescription: {
    fontSize: 14,
    color: '#666',
  },
  securitySection: {
    padding: 15,
  },
  securityCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  securityContent: {
    flex: 1,
    marginLeft: 15,
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  securityDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default SyncScreen;
