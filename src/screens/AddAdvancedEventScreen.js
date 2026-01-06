import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useDatabase } from '../context/FirebaseDatabaseContext';
import { logEventCreate, logEventUpdate, logEventDelete } from '../utils/logUtils';
import NotificationService from '../services/NotificationService';

const EVENT_TYPES = [
  { id: 'Duruşma', name: 'Duruşma', color: '#f44336', icon: '⚖️' },
  { id: 'Toplantı', name: 'Toplantı', color: '#2196f3', icon: '🤝' },
  { id: 'Randevu', name: 'Müvekkil Randevusu', color: '#4caf50', icon: '👥' },
  { id: 'Dilekçe', name: 'Dilekçe', color: '#795548', icon: '📝' },
  { id: 'Arabulucuk', name: 'Arabulucuk', color: '#607d8b', icon: '📋' },
  { id: 'Genel', name: 'Genel', color: '#ff9800', icon: '📅' },
  { id: 'Önemli', name: 'Önemli', color: '#9c27b0', icon: '⭐' },
];

const AddAdvancedEventScreen = ({ navigation, route }) => {
  const { event: existingEvent, isEdit, selectedDate } = route.params || {};
  const [title, setTitle] = useState(existingEvent?.title || '');
  const [description, setDescription] = useState(existingEvent?.description || '');
  const [date, setDate] = useState(existingEvent?.date || selectedDate || new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(existingEvent?.time || '');
  const [eventType, setEventType] = useState(existingEvent?.event_type || 'Genel');
  const [location, setLocation] = useState(existingEvent?.location || '');
  const [clientName, setClientName] = useState(existingEvent?.client_name || '');
  const [caseNumber, setCaseNumber] = useState(existingEvent?.case_number || '');
  const [isReminder, setIsReminder] = useState(existingEvent?.is_reminder || false);
  const [reminderTime, setReminderTime] = useState(existingEvent?.reminder_time || '');
  const [status, setStatus] = useState(existingEvent?.status || 'Planlandı');
  const [selectedLawyerId, setSelectedLawyerId] = useState(existingEvent?.lawyer_id || null);
  const [lawyers, setLawyers] = useState([]);
  const { db, isReady } = useDatabase();

  const statusOptions = ['Planlandı', 'Tamamlandı', 'İptal', 'Ertelendi'];

  useEffect(() => {
    if (isReady) {
      loadLawyers();
    }
  }, [isReady]);

  const loadLawyers = async () => {
    try {
      const lawyersData = await db.getAllAsync('lawyers');
      setLawyers(lawyersData);
      if (lawyersData.length > 0 && !selectedLawyerId) {
        setSelectedLawyerId(lawyersData[0].id);
      }
    } catch (error) {
      console.error('Error loading lawyers:', error);
    }
  };

  const handleSave = async () => {
    // Form validasyonu
    if (!title.trim()) {
      Alert.alert('Hata', 'Lütfen etkinlik başlığını girin');
      return;
    }

    if (!selectedLawyerId) {
      Alert.alert('Hata', 'Lütfen bir avukat seçin');
      return;
    }

    if (!date.trim()) {
      Alert.alert('Hata', 'Lütfen tarih girin');
      return;
    }

    // Tarih formatı kontrolü
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      Alert.alert('Hata', 'Tarih formatı YYYY-MM-DD olmalıdır');
      return;
    }

    // Geçmiş tarih kontrolü
    const eventDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (eventDate < today) {
      Alert.alert('Uyarı', 'Geçmiş tarihli etkinlik ekliyorsunuz');
    }

    try {
      // Kullanıcı bilgilerini al
      const currentLawyer = lawyers.find(l => l.id === selectedLawyerId);
      const lawyerName = currentLawyer?.name || 'Bilinmeyen Kullanıcı';

      const eventData = {
        title,
        description,
        date,
        time,
        event_type: eventType,
        location,
        client_name: clientName,
        case_number: caseNumber,
        is_reminder: isReminder,
        reminder_time: reminderTime,
        status,
        lawyer_id: selectedLawyerId,
        updated_at: new Date().toISOString()
      };

      if (isEdit) {
        // Güncelleme
        await db.set('calendar_events', existingEvent.id, eventData);
        
        // Log kaydı
        await logEventUpdate(db, selectedLawyerId, {
          id: existingEvent.id,
          title,
          date,
          time,
          lawyer_name: lawyerName
        });
        
        Alert.alert('Başarılı', 'Etkinlik güncellendi');
      } else {
        // Yeni etkinlik
        const result = await db.push('calendar_events', eventData);
        
        // Log kaydı
        await logEventCreate(db, selectedLawyerId, {
          id: result.key,
          title,
          date,
          time,
          lawyer_name: lawyerName
        });
        
        // Bildirim planla
        const notificationEventData = {
          id: result.key,
          title: title,
          date: date,
          time: time,
          event_type: eventType,
          description: description,
          location: location
        };
        
        try {
          await NotificationService.scheduleEventReminder(notificationEventData);
          console.log('Bildirim planlandı');
        } catch (notificationError) {
          console.error('Bildirim hatası:', notificationError);
        }
        
        Alert.alert('Başarılı', 'Etkinlik eklendi ve hatırlatma planlandı');
      }
      
      // Takvime geri dön ve otomatik güncelleme için parametre gönder
      navigation.navigate('CalendarMain', { refresh: true });
    } catch (error) {
      console.error('Error saving event:', error);
      Alert.alert('Hata', 'Etkinlik kaydedilirken bir hata oluştu');
    }
  };

  const handleDelete = () => {
    if (!isEdit) return;
    
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
              // Kullanıcı bilgilerini al
              const currentLawyer = lawyers.find(l => l.id === selectedLawyerId);
              const lawyerName = currentLawyer?.name || 'Bilinmeyen Kullanıcı';
              
              // Log kaydı
              await logEventDelete(db, selectedLawyerId, {
                id: existingEvent.id,
                title: existingEvent.title,
                date: existingEvent.date,
                lawyer_name: lawyerName
              });
              
              await db.remove(`calendar_events/${existingEvent.id}`);
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

  const getEventTypeInfo = (typeId) => {
    return EVENT_TYPES.find(type => type.id === typeId) || EVENT_TYPES[3];
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>📅 Etkinlik Bilgileri</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Etkinlik Başlığı *"
            value={title}
            onChangeText={setTitle}
          />
          
          <TextInput
            style={[styles.input, styles.descriptionInput]}
            placeholder="Açıklama"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />

          <Text style={styles.inputLabel}>Etkinlik Türü:</Text>
          <View style={styles.typeContainer}>
            {EVENT_TYPES.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.typeOption,
                  { borderColor: type.color },
                  eventType === type.id && { backgroundColor: type.color }
                ]}
                onPress={() => setEventType(type.id)}
              >
                <Text style={styles.typeIcon}>{type.icon}</Text>
                <Text style={[
                  styles.typeText,
                  eventType === type.id && styles.selectedTypeText
                ]}>
                  {type.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.rowContainer}>
            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>Tarih *</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={date}
                onChangeText={setDate}
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>Saat</Text>
              <TextInput
                style={styles.input}
                placeholder="HH:MM"
                value={time}
                onChangeText={setTime}
              />
            </View>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Konum"
            value={location}
            onChangeText={setLocation}
          />

          <Text style={styles.sectionTitle}>👤 Müvekkil Bilgileri</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Müvekkil Adı"
            value={clientName}
            onChangeText={setClientName}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Dava Dosya No"
            value={caseNumber}
            onChangeText={setCaseNumber}
          />

          <Text style={styles.sectionTitle}>🔔 Hatırlatıcı</Text>
          
          <TouchableOpacity
            style={styles.reminderContainer}
            onPress={() => setIsReminder(!isReminder)}
          >
            <View style={[styles.checkbox, isReminder && styles.checkedBox]}>
              {isReminder && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.reminderLabel}>Hatırlatıcı Aktif</Text>
          </TouchableOpacity>

          {isReminder && (
            <TextInput
              style={styles.input}
              placeholder="Hatırlatma Zamanı (HH:MM)"
              value={reminderTime}
              onChangeText={setReminderTime}
            />
          )}

          <Text style={styles.inputLabel}>Durum:</Text>
          <View style={styles.statusContainer}>
            {statusOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.statusOption,
                  status === option && styles.selectedStatusOption
                ]}
                onPress={() => setStatus(option)}
              >
                <Text style={[
                  styles.statusText,
                  status === option && styles.selectedStatusText
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.inputLabel}>Sorumlu Avukat:</Text>
          <View style={styles.lawyerContainer}>
            {lawyers.map((lawyer) => (
              <TouchableOpacity
                key={lawyer.id}
                style={[
                  styles.lawyerOption,
                  selectedLawyerId === lawyer.id && styles.selectedLawyerOption
                ]}
                onPress={() => setSelectedLawyerId(lawyer.id)}
              >
                <View style={[styles.lawyerColor, { backgroundColor: lawyer.color }]} />
                <Text style={[
                  styles.lawyerName,
                  selectedLawyerId === lawyer.id && styles.selectedLawyerName
                ]}>
                  {lawyer.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>
                {isEdit ? 'Güncelle' : 'Kaydet'}
              </Text>
            </TouchableOpacity>
            
            {isEdit && (
              <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                <Text style={styles.deleteButtonText}>Sil</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flex: 1,
  },
  formContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  input: {
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  descriptionInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    flex: 1,
    marginHorizontal: 5,
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 2,
    backgroundColor: 'white',
  },
  typeIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  typeText: {
    fontSize: 14,
    color: '#666',
  },
  selectedTypeText: {
    color: 'white',
    fontWeight: 'bold',
  },
  reminderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 4,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkedBox: {
    backgroundColor: '#1976d2',
    borderColor: '#1976d2',
  },
  checkmark: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  reminderLabel: {
    fontSize: 16,
    color: '#333',
  },
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  statusOption: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: 'white',
  },
  selectedStatusOption: {
    backgroundColor: '#1976d2',
    borderColor: '#1976d2',
  },
  statusText: {
    fontSize: 14,
    color: '#666',
  },
  selectedStatusText: {
    color: 'white',
    fontWeight: 'bold',
  },
  lawyerContainer: {
    marginBottom: 20,
  },
  lawyerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedLawyerOption: {
    backgroundColor: '#e3f2fd',
    borderColor: '#1976d2',
  },
  lawyerColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  lawyerName: {
    fontSize: 16,
    color: '#333',
  },
  selectedLawyerName: {
    color: '#1976d2',
    fontWeight: 'bold',
  },
  buttonContainer: {
    marginTop: 30,
  },
  saveButton: {
    backgroundColor: '#1976d2',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#d32f2f',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default AddAdvancedEventScreen;
