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

const NotificationsScreen = ({ navigation }) => {
  const { db, isReady } = useDatabase();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    courtReminders: true,
    paymentReminders: true,
    caseDeadlines: true,
    generalNotifications: true,
  });

  useEffect(() => {
    if (isReady) {
      loadNotifications();
    }
  }, [isReady]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      // Firebase'den verileri yükle
      const [events, cases, lawyers] = await Promise.all([
        db.getAllAsync('calendar_events'),
        db.getAllAsync('cases'),
        db.getAllAsync('lawyers')
      ]);

      // Lawyer bilgilerini map'e çevir
      const lawyerMap = {};
      lawyers.forEach(lawyer => {
        lawyerMap[lawyer.id] = lawyer;
      });

      const today = new Date().toISOString().split('T')[0];
      const oneWeekFromNow = new Date();
      oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
      const oneWeekFromNowStr = oneWeekFromNow.toISOString().split('T')[0];

      // Yaklaşan duruşmalar
      const upcomingEvents = events
        .filter(event => 
          event.event_type === 'Duruşma' && 
          event.date >= today && 
          event.date <= oneWeekFromNowStr
        )
        .map(event => ({
          ...event,
          lawyer_name: lawyerMap[event.lawyer_id]?.name || 'Bilinmeyen Avukat',
          lawyer_color: lawyerMap[event.lawyer_id]?.color || '#000000',
          type: 'court_reminder',
          notification_type: 'Duruşma Hatırlatması',
          priority: 'high',
          icon: 'gavel',
          color: '#f44336'
        }));

      // Ödeme hatırlatmaları
      const paymentReminders = cases
        .filter(c => c.remaining_fee > 0 && c.status !== 'Kapalı')
        .map(c => ({
          ...c,
          lawyer_name: lawyerMap[c.lawyer_id]?.name || 'Bilinmeyen Avukat',
          lawyer_color: lawyerMap[c.lawyer_id]?.color || '#000000',
          type: 'payment_reminder',
          notification_type: 'Ödeme Hatırlatması',
          priority: 'medium',
          icon: 'payment',
          color: '#ff9800'
        }));

      // Dava süreç hatırlatmaları (30 gün önce oluşturulanlar)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

      const caseDeadlines = cases
        .filter(c => c.status === 'Açık' && c.created_at <= thirtyDaysAgoStr)
        .map(c => ({
          ...c,
          lawyer_name: lawyerMap[c.lawyer_id]?.name || 'Bilinmeyen Avukat',
          lawyer_color: lawyerMap[c.lawyer_id]?.color || '#000000',
          type: 'case_deadline',
          notification_type: 'Dava Süreç Hatırlatması',
          priority: 'low',
          icon: 'schedule',
          color: '#2196f3'
        }));

      // Tüm bildirimleri birleştir
      const allNotifications = [
        ...upcomingEvents.map(event => ({
          ...event,
          priority: 'high',
          icon: 'gavel',
          color: '#f44336',
        })),
        ...paymentReminders.map(caseItem => ({
          ...caseItem,
          priority: 'medium',
          icon: 'payment',
          color: '#ff9800',
        })),
        ...caseDeadlines.map(caseItem => ({
          ...caseItem,
          priority: 'low',
          icon: 'schedule',
          color: '#2196f3',
        })),
      ];

      setNotifications(allNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
      Alert.alert('Hata', 'Bildirimler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationPress = (notification) => {
    if (notification.type === 'court_reminder') {
      navigation.navigate('Calendar');
    } else if (notification.type === 'payment_reminder' || notification.type === 'case_deadline') {
      navigation.navigate('Cases');
    }
  };

  const handleMarkAsRead = (notificationId) => {
    // Bu örnekte basit bir state güncellemesi yapıyoruz
    // Gerçek uygulamada veritabanında okundu olarak işaretlenir
    setNotifications(prev => 
      prev.filter(notif => notif.id !== notificationId)
    );
  };

  const handleSettingsChange = (setting, value) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value,
    }));
    Alert.alert('Başarılı', 'Bildirim ayarları güncellendi.');
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#f44336';
      case 'medium': return '#ff9800';
      case 'low': return '#2196f3';
      default: return '#666';
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 'high': return 'Yüksek';
      case 'medium': return 'Orta';
      case 'low': return 'Düşük';
      default: return 'Bilinmiyor';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976d2" />
        <Text style={styles.loadingText}>Bildirimler yükleniyor...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔔 Bildirimler</Text>
        <Text style={styles.subtitle}>Hatırlatmalar ve Uyarılar</Text>
      </View>

      {/* Bildirim Ayarları */}
      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>⚙️ Bildirim Ayarları</Text>
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <WebCompatibleIcon name="gavel" size={24} color="#f44336" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Duruşma Hatırlatmaları</Text>
              <Text style={styles.settingDescription}>Yaklaşan duruşmalar için bildirim</Text>
            </View>
          </View>
          <Switch
            value={settings.courtReminders}
            onValueChange={(value) => handleSettingsChange('courtReminders', value)}
            trackColor={{ false: '#767577', true: '#1976d2' }}
            thumbColor={settings.courtReminders ? '#fff' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <WebCompatibleIcon name="payment" size={24} color="#ff9800" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Ödeme Hatırlatmaları</Text>
              <Text style={styles.settingDescription}>Bekleyen ödemeler için bildirim</Text>
            </View>
          </View>
          <Switch
            value={settings.paymentReminders}
            onValueChange={(value) => handleSettingsChange('paymentReminders', value)}
            trackColor={{ false: '#767577', true: '#1976d2' }}
            thumbColor={settings.paymentReminders ? '#fff' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <WebCompatibleIcon name="schedule" size={24} color="#2196f3" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Dava Süreç Hatırlatmaları</Text>
              <Text style={styles.settingDescription}>Uzun süreli davalar için bildirim</Text>
            </View>
          </View>
          <Switch
            value={settings.caseDeadlines}
            onValueChange={(value) => handleSettingsChange('caseDeadlines', value)}
            trackColor={{ false: '#767577', true: '#1976d2' }}
            thumbColor={settings.caseDeadlines ? '#fff' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <WebCompatibleIcon name="notifications" size={24} color="#4caf50" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Genel Bildirimler</Text>
              <Text style={styles.settingDescription}>Diğer sistem bildirimleri</Text>
            </View>
          </View>
          <Switch
            value={settings.generalNotifications}
            onValueChange={(value) => handleSettingsChange('generalNotifications', value)}
            trackColor={{ false: '#767577', true: '#1976d2' }}
            thumbColor={settings.generalNotifications ? '#fff' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Aktif Bildirimler */}
      <View style={styles.notificationsSection}>
        <Text style={styles.sectionTitle}>📋 Aktif Bildirimler ({notifications.length})</Text>
        
        {notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <WebCompatibleIcon name="notifications-off" size={48} color="#ccc" />
            <Text style={styles.emptyText}>Henüz bildirim bulunmamaktadır.</Text>
            <Text style={styles.emptySubtext}>Yeni duruşmalar, ödemeler ve dava süreçleri eklendiğinde burada görünecek.</Text>
          </View>
        ) : (
          notifications.map((notification, index) => (
            <TouchableOpacity
              key={`${notification.type}-${notification.id}-${index}`}
              style={styles.notificationCard}
              onPress={() => handleNotificationPress(notification)}
            >
              <View style={styles.notificationHeader}>
                <View style={styles.notificationIcon}>
                  <WebCompatibleIcon name={notification.icon} size={24} color={notification.color} />
                </View>
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationType}>{notification.notification_type}</Text>
                  <Text style={styles.notificationTitle}>{notification.title}</Text>
                  {notification.client_name && (
                    <Text style={styles.notificationClient}>Müvekkil: {notification.client_name}</Text>
                  )}
                </View>
                <View style={styles.notificationActions}>
                  <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(notification.priority) }]}>
                    <Text style={styles.priorityText}>{getPriorityText(notification.priority)}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleMarkAsRead(notification.id)}
                    style={styles.markAsReadButton}
                  >
                    <WebCompatibleIcon name="check" size={20} color="#4caf50" />
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.notificationDetails}>
                {notification.date && (
                  <Text style={styles.notificationDate}>
                    📅 {format(new Date(notification.date), 'dd/MM/yyyy')} {notification.time}
                  </Text>
                )}
                {notification.remaining_fee && (
                  <Text style={styles.notificationAmount}>
                    💰 Kalan: {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(notification.remaining_fee)}
                  </Text>
                )}
                {notification.case_number && (
                  <Text style={styles.notificationCase}>
                    📁 Dava No: {notification.case_number}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#b8c5d1',
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
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
  notificationsSection: {
    padding: 15,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 15,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  notificationCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  notificationContent: {
    flex: 1,
  },
  notificationType: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  notificationClient: {
    fontSize: 14,
    color: '#666',
  },
  notificationActions: {
    alignItems: 'flex-end',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 5,
  },
  priorityText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  markAsReadButton: {
    padding: 5,
  },
  notificationDetails: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  notificationDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  notificationAmount: {
    fontSize: 14,
    color: '#f44336',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  notificationCase: {
    fontSize: 14,
    color: '#666',
  },
});

export default NotificationsScreen;
