import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useDatabase } from '../context/FirebaseDatabaseContext';

const EventDetailScreen = ({ navigation, route }) => {
  const { event } = route.params;
  const [eventData, setEventData] = useState(event);
  const [lawyer, setLawyer] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const { db, isReady } = useDatabase();

  useEffect(() => {
    if (isReady) {
      loadEventData();
    }
  }, [isReady]);

  const loadEventData = async () => {
    try {
      // Avukat bilgilerini yükle
      const lawyerData = await db.getFirstAsync(
        'SELECT * FROM lawyers WHERE id = ?',
        [event.lawyer_id]
      );
      setLawyer(lawyerData);
    } catch (error) {
      console.error('Error loading event data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEventData();
    setRefreshing(false);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'Belirtilmemiş';
    return timeString;
  };

  const getEventTypeInfo = (eventType) => {
    const types = [
      { id: 'Duruşma', name: 'Duruşma', color: '#f44336', icon: '⚖️' },
      { id: 'Toplantı', name: 'Toplantı', color: '#2196f3', icon: '🤝' },
      { id: 'Randevu', name: 'Müvekkil Randevusu', color: '#4caf50', icon: '👥' },
      { id: 'Genel', name: 'Genel', color: '#ff9800', icon: '📅' },
      { id: 'Önemli', name: 'Önemli', color: '#9c27b0', icon: '⭐' },
    ];
    return types.find(type => type.id === eventType) || types[3];
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Planlandı': return '#2196f3';
      case 'Tamamlandı': return '#4caf50';
      case 'İptal': return '#f44336';
      case 'Ertelendi': return '#ff9800';
      default: return '#666';
    }
  };

  const handleEdit = () => {
    navigation.navigate('AddEvent', { event: eventData, isEdit: true });
  };

  const handleDelete = () => {
    Alert.alert(
      'Etkinliği Sil',
      'Bu etkinliği silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await db.runAsync('DELETE FROM calendar_events WHERE id = ?', [eventData.id]);
              Alert.alert('Başarılı', 'Etkinlik silindi');
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting event:', error);
              Alert.alert('Hata', 'Etkinlik silinirken bir hata oluştu');
            }
          },
        },
      ]
    );
  };

  const eventTypeInfo = getEventTypeInfo(eventData.event_type);

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <View style={styles.eventTypeContainer}>
          <Text style={styles.eventIcon}>{eventTypeInfo.icon}</Text>
          <Text style={styles.eventType}>{eventTypeInfo.name}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(eventData.status) }]}>
          <Text style={styles.statusText}>{eventData.status}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{eventData.title}</Text>
        
        {eventData.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📝 Açıklama</Text>
            <Text style={styles.description}>{eventData.description}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Tarih ve Saat</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tarih:</Text>
            <Text style={styles.infoValue}>{formatDate(eventData.date)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Saat:</Text>
            <Text style={styles.infoValue}>{formatTime(eventData.time)}</Text>
          </View>
        </View>

        {eventData.location && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📍 Konum</Text>
            <Text style={styles.location}>{eventData.location}</Text>
          </View>
        )}

        {eventData.client_name && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👤 Müvekkil Bilgileri</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Müvekkil:</Text>
              <Text style={styles.infoValue}>{eventData.client_name}</Text>
            </View>
            {eventData.case_number && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Dosya No:</Text>
                <Text style={styles.infoValue}>{eventData.case_number}</Text>
              </View>
            )}
          </View>
        )}

        {eventData.is_reminder && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔔 Hatırlatıcı</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Hatırlatma Zamanı:</Text>
              <Text style={styles.infoValue}>{eventData.reminder_time || 'Belirtilmemiş'}</Text>
            </View>
          </View>
        )}

        {lawyer && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👨‍💼 Sorumlu Avukat</Text>
            <View style={styles.lawyerInfo}>
              <View style={[styles.lawyerColor, { backgroundColor: lawyer.color }]} />
              <Text style={styles.lawyerName}>{lawyer.name}</Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Etkinlik Detayları</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Oluşturulma:</Text>
            <Text style={styles.infoValue}>
              {new Date(eventData.created_at).toLocaleDateString('tr-TR')}
            </Text>
          </View>
          {eventData.updated_at !== eventData.created_at && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Son Güncelleme:</Text>
              <Text style={styles.infoValue}>
                {new Date(eventData.updated_at).toLocaleDateString('tr-TR')}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
          <Text style={styles.editButtonText}>Düzenle</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Sil</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1976d2',
    paddingTop: 40,
  },
  eventTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  eventType: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  section: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    flex: 2,
    textAlign: 'right',
  },
  location: {
    fontSize: 16,
    color: '#333',
  },
  lawyerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lawyerColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 10,
  },
  lawyerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  editButton: {
    flex: 1,
    backgroundColor: '#1976d2',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 10,
  },
  editButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#d32f2f',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EventDetailScreen;
