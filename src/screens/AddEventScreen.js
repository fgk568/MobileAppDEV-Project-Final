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

const AddEventScreen = ({ navigation, route }) => {
  const { event, isEdit } = route.params || {};
  const [title, setTitle] = useState(event?.title || '');
  const [description, setDescription] = useState(event?.description || '');
  const [date, setDate] = useState(event?.date || '');
  const [time, setTime] = useState(event?.time || '');
  const [selectedLawyerId, setSelectedLawyerId] = useState(event?.lawyer_id || null);
  const [lawyers, setLawyers] = useState([]);
  const { db, isReady } = useDatabase();

  useEffect(() => {
    if (isReady) {
      loadLawyers();
    }
  }, [isReady]);

  const loadLawyers = async () => {
    try {
      const result = await db.getAllAsync('lawyers');
      setLawyers(result);
      if (!isEdit && result.length > 0) {
        setSelectedLawyerId(result[0].id);
      }
    } catch (error) {
      console.error('Error loading lawyers:', error);
    }
  };

  const handleSave = async () => {
    if (!title || !date || !selectedLawyerId) {
      Alert.alert('Hata', 'Lütfen tüm zorunlu alanları doldurun');
      return;
    }

    try {
      const eventData = {
        title,
        description,
        date,
        time,
        lawyer_id: selectedLawyerId,
        created_at: new Date().toISOString()
      };

      if (isEdit) {
        // Güncelleme
        await db.set('calendar_events', event.id, eventData);
        
        // Avukat bilgisini al
        const selectedLawyer = lawyers.find(l => l.id === selectedLawyerId);
        const lawyerName = selectedLawyer?.name || 'Bilinmeyen Avukat';
        
        // Log kaydı
        await logEventUpdate(db, selectedLawyerId, {
          id: event.id,
          title,
          date,
          time,
          lawyer_name: lawyerName
        });
        
        Alert.alert('Başarılı', 'Etkinlik güncellendi');
      } else {
        // Yeni etkinlik
        const result = await db.push('calendar_events', eventData);
        if (result.success) {
          // Avukat bilgisini al
          const selectedLawyer = lawyers.find(l => l.id === selectedLawyerId);
          const lawyerName = selectedLawyer?.name || 'Bilinmeyen Avukat';
          
          // Log kaydı
          await logEventCreate(db, selectedLawyerId, {
            id: result.key,
            title,
            date,
            time,
            lawyer_name: lawyerName
          });
          
          Alert.alert('Başarılı', 'Etkinlik eklendi');
        } else {
          throw new Error('Failed to save event');
        }
      }
      
      navigation.goBack();
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
              await db.remove(`calendar_events/${event.id}`);
              
              // Avukat bilgisini al
              const selectedLawyer = lawyers.find(l => l.id === selectedLawyerId);
              const lawyerName = selectedLawyer?.name || 'Bilinmeyen Avukat';
              
              // Log kaydı
              await logEventDelete(db, selectedLawyerId, {
                id: event.id,
                title: event.title,
                date: event.date,
                lawyer_name: lawyerName
              });
              
              Alert.alert('Başarılı', 'Etkinlik silindi');
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting event:', error);
              Alert.alert('Hata', 'Etkinlik silinirken bir hata oluştu');
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    // Timezone sorununu önlemek için manuel format
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString;
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>
            {isEdit ? 'Etkinlik Düzenle' : 'Yeni Etkinlik'}
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Etkinlik Başlığı *"
            value={title}
            onChangeText={setTitle}
          />

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Açıklama"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />

          <TextInput
            style={styles.input}
            placeholder="Tarih (YYYY-MM-DD) *"
            value={date}
            onChangeText={setDate}
          />

          <TextInput
            style={styles.input}
            placeholder="Saat (HH:MM)"
            value={time}
            onChangeText={setTime}
          />

          <Text style={styles.label}>Avukat Seçin *</Text>
          <View style={styles.lawyerContainer}>
            {lawyers.map((lawyer) => (
              <TouchableOpacity
                key={lawyer.id}
                style={[
                  styles.lawyerOption,
                  selectedLawyerId === lawyer.id && styles.selectedLawyer
                ]}
                onPress={() => setSelectedLawyerId(lawyer.id)}
              >
                <View style={[styles.lawyerColor, { backgroundColor: lawyer.color }]} />
                <Text style={styles.lawyerName}>{lawyer.name}</Text>
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
    flexGrow: 1,
  },
  formContainer: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#1976d2',
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  lawyerContainer: {
    marginBottom: 30,
  },
  lawyerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedLawyer: {
    borderColor: '#1976d2',
    borderWidth: 2,
  },
  lawyerColor: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 15,
  },
  lawyerName: {
    fontSize: 16,
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  saveButton: {
    backgroundColor: '#1976d2',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
  },
  saveButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#d32f2f',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    flex: 1,
    marginLeft: 10,
  },
  deleteButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddEventScreen;
