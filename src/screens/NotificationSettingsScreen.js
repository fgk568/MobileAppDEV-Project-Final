import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import WebCompatibleIcon from '../components/WebCompatibleIcon';
import NotificationService from '../services/NotificationService';

const NotificationSettingsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const scheduledNotifications = await NotificationService.getScheduledNotifications();
      setNotifications(scheduledNotifications);
      setIsLoading(false);
    } catch (error) {
      console.error('Bildirim yükleme hatası:', error);
      setIsLoading(false);
    }
  };

  const handleClearAllNotifications = () => {
    Alert.alert(
      'Tüm Bildirimleri Temizle',
      'Tüm planlanmış bildirimleri silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Temizle',
          style: 'destructive',
          onPress: async () => {
            try {
              await NotificationService.cancelAllNotifications();
              await loadNotifications();
              Alert.alert('Başarılı', 'Tüm bildirimler temizlendi');
            } catch (error) {
              Alert.alert('Hata', 'Bildirimler temizlenirken bir hata oluştu');
            }
          },
        },
      ]
    );
  };

  const handleCancelNotification = async (notificationId) => {
    try {
      await NotificationService.cancelNotification(notificationId);
      await loadNotifications();
      Alert.alert('Başarılı', 'Bildirim iptal edildi');
    } catch (error) {
      Alert.alert('Hata', 'Bildirim iptal edilirken bir hata oluştu');
    }
  };

  const formatNotificationDate = (date) => {
    return new Date(date).toLocaleString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getNotificationTypeIcon = (type) => {
    const icons = {
      'hearing_reminder': '⚖️',
      'meeting_reminder': '🤝',
      'petition_reminder': '📝',
      'mediation_reminder': '📋',
    };
    return icons[type] || '📅';
  };

  const getNotificationTypeName = (type) => {
    const names = {
      'hearing_reminder': 'Duruşma Hatırlatması',
      'meeting_reminder': 'Toplantı Hatırlatması',
      'petition_reminder': 'Dilekçe Hatırlatması',
      'mediation_reminder': 'Arabuluculuk Hatırlatması',
    };
    return names[type] || 'Genel Hatırlatma';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <WebCompatibleIcon name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bildirim Ayarları</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollContainer}>
        <View style={styles.content}>
          {/* Bildirim İstatistikleri */}
          <View style={styles.statsContainer}>
            <Text style={styles.statsTitle}>Bildirim İstatistikleri</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{notifications.length}</Text>
                <Text style={styles.statLabel}>Planlanmış Bildirim</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {notifications.filter(n => n.content.data?.type === 'hearing_reminder').length}
                </Text>
                <Text style={styles.statLabel}>Duruşma</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {notifications.filter(n => n.content.data?.type === 'meeting_reminder').length}
                </Text>
                <Text style={styles.statLabel}>Toplantı</Text>
              </View>
            </View>
          </View>

          {/* Planlanmış Bildirimler */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Planlanmış Bildirimler</Text>
              {notifications.length > 0 && (
                <TouchableOpacity 
                  style={styles.clearButton}
                  onPress={handleClearAllNotifications}
                >
                  <Text style={styles.clearButtonText}>Tümünü Temizle</Text>
                </TouchableOpacity>
              )}
            </View>

            {isLoading ? (
              <Text style={styles.loadingText}>Yükleniyor...</Text>
            ) : notifications.length === 0 ? (
              <View style={styles.emptyContainer}>
                <WebCompatibleIcon name="notifications-none" size={48} color="#ccc" />
                <Text style={styles.emptyText}>Planlanmış bildirim bulunmuyor</Text>
                <Text style={styles.emptySubtext}>
                  Takvimde etkinlik eklediğinizde otomatik hatırlatmalar planlanır
                </Text>
              </View>
            ) : (
              <View style={styles.notificationsList}>
                {notifications.map((notification, index) => (
                  <View key={index} style={styles.notificationItem}>
                    <View style={styles.notificationHeader}>
                      <Text style={styles.notificationIcon}>
                        {getNotificationTypeIcon(notification.content.data?.type)}
                      </Text>
                      <View style={styles.notificationInfo}>
                        <Text style={styles.notificationTitle}>
                          {getNotificationTypeName(notification.content.data?.type)}
                        </Text>
                        <Text style={styles.notificationEvent}>
                          {notification.content.data?.eventTitle || 'Etkinlik'}
                        </Text>
                        <Text style={styles.notificationDate}>
                          {formatNotificationDate(notification.trigger.value)}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => handleCancelNotification(notification.identifier)}
                      >
                        <WebCompatibleIcon name="close" size={20} color="#f44336" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Bildirim Bilgileri */}
          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>Bildirim Hakkında</Text>
            <Text style={styles.infoText}>
              • Duruşma hatırlatmaları 1 gün önceden gönderilir
            </Text>
            <Text style={styles.infoText}>
              • Toplantı hatırlatmaları 30 dakika önceden gönderilir
            </Text>
            <Text style={styles.infoText}>
              • Dilekçe hatırlatmaları 1 hafta önceden gönderilir
            </Text>
            <Text style={styles.infoText}>
              • Arabuluculuk hatırlatmaları 2 gün önceden gönderilir
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 50,
    backgroundColor: '#1a1a2e',
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d3d',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  placeholder: {
    width: 40,
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  statsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4a9eff',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
    color: '#333',
  },
  clearButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  clearButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    padding: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
  },
  notificationsList: {
    gap: 10,
  },
  notificationItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#4a9eff',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  notificationEvent: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  notificationDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  cancelButton: {
    padding: 8,
  },
  infoContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
});

export default NotificationSettingsScreen;
