import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDatabase } from '../context/FirebaseDatabaseContext';
import { logLogout } from '../utils/logUtils';
import WebCompatibleIcon from '../components/WebCompatibleIcon';

const ProfileScreen = ({ navigation }) => {
  const [lawyers, setLawyers] = useState([]);
  const [stats, setStats] = useState({
    totalCases: 0,
    openCases: 0,
    closedCases: 0,
    totalEvents: 0
  });
  const { db, isReady } = useDatabase();

  useEffect(() => {
    if (isReady) {
      loadLawyers();
      loadStats();
    }
  }, [isReady]);

  const loadLawyers = async () => {
    try {
      const result = await db.getAllAsync('SELECT * FROM lawyers ORDER BY name');
      setLawyers(result);
    } catch (error) {
      console.error('Error loading lawyers:', error);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Çıkış Yap',
      'Çıkış yapmak istediğinizden emin misiniz?',
      [
        {
          text: 'İptal',
          style: 'cancel',
        },
        {
          text: 'Çıkış Yap',
          style: 'destructive',
          onPress: async () => {
            try {
              // Kullanıcı bilgilerini al
              const userEmail = await AsyncStorage.getItem('userEmail');
              const user = await db.get('lawyers', userEmail);
              
              // Log kaydı
              if (user) {
                await logLogout(db, userEmail, {
                  name: user.name,
                  email: user.email
                });
              }
              
              // AsyncStorage'dan kullanıcı bilgilerini temizle
              await AsyncStorage.removeItem('userToken');
              await AsyncStorage.removeItem('userEmail');
              
              // Login ekranına yönlendir
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Hata', 'Çıkış yapılırken bir hata oluştu');
            }
          },
        },
      ]
    );
  };

  const loadStats = async () => {
    try {
      // Toplam dava sayısı
      const totalCasesResult = await db.getFirstAsync('SELECT COUNT(*) as count FROM cases');
      
      // Açık davalar
      const openCasesResult = await db.getFirstAsync('SELECT COUNT(*) as count FROM cases WHERE status = "Açık"');
      
      // Kapalı davalar
      const closedCasesResult = await db.getFirstAsync('SELECT COUNT(*) as count FROM cases WHERE status = "Kapalı"');
      
      // Toplam etkinlik sayısı
      const totalEventsResult = await db.getFirstAsync('SELECT COUNT(*) as count FROM calendar_events');

      setStats({
        totalCases: totalCasesResult?.count || 0,
        openCases: openCasesResult?.count || 0,
        closedCases: closedCasesResult?.count || 0,
        totalEvents: totalEventsResult?.count || 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };


  const StatCard = ({ title, value, color }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Floating Logout Button */}
      <TouchableOpacity 
        style={styles.floatingLogoutButton}
        onPress={handleLogout}
      >
        <WebCompatibleIcon name="logout" size={20} color="#f44336" />
      </TouchableOpacity>

      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>İstatistikler</Text>
        <View style={styles.statsGrid}>
          <StatCard title="Toplam Dava" value={stats.totalCases} color="#1976d2" />
          <StatCard title="Açık Dava" value={stats.openCases} color="#4CAF50" />
          <StatCard title="Kapalı Dava" value={stats.closedCases} color="#F44336" />
          <StatCard title="Toplam Etkinlik" value={stats.totalEvents} color="#FF9800" />
        </View>
      </View>

      <View style={styles.lawyersContainer}>
        <Text style={styles.sectionTitle}>Kayıtlı Avukatlar</Text>
        {lawyers.map((lawyer) => (
          <View key={lawyer.id} style={styles.lawyerCard}>
            <View style={styles.lawyerInfo}>
              <View style={[styles.lawyerColor, { backgroundColor: lawyer.color }]} />
              <View style={styles.lawyerDetails}>
                <Text style={styles.lawyerName}>{lawyer.name}</Text>
                <Text style={styles.lawyerEmail}>{lawyer.email}</Text>
                <Text style={styles.lawyerDate}>
                  Kayıt: {new Date(lawyer.created_at).toLocaleDateString('tr-TR')}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.appInfo}>
        <Text style={styles.appTitle}>SY HUKUK</Text>
        <Text style={styles.appVersion}>Versiyon 1.0.0</Text>
        <Text style={styles.appDescription}>
          Avukatların dava dosyalarını takip etmeleri ve takvim yönetimi yapmaları için geliştirilmiş profesyonel uygulama.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  floatingLogoutButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1000,
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f44336',
    shadowColor: '#f44336',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1a1a2e',
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d3d',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  logoutButton: {
    backgroundColor: '#d32f2f',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    width: '48%',
    marginBottom: 10,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  lawyersContainer: {
    padding: 20,
  },
  lawyerCard: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lawyerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lawyerColor: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 15,
  },
  lawyerDetails: {
    flex: 1,
  },
  lawyerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  lawyerEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  lawyerDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  appInfo: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  appTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976d2',
    textAlign: 'center',
    marginBottom: 5,
  },
  appVersion: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  appDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ProfileScreen;
