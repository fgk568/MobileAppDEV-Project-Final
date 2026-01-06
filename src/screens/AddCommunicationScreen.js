import React, { useState } from 'react';
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

const COMMUNICATION_TYPES = [
  'Telefon',
  'E-posta', 
  'Toplantı',
  'Duruşma',
  'Not',
  'Diğer'
];

const AddCommunicationScreen = ({ navigation, route }) => {
  const { clientId, communication: existingCommunication, isEdit } = route.params || {};
  const [type, setType] = useState(existingCommunication?.type || 'Telefon');
  const [subject, setSubject] = useState(existingCommunication?.subject || '');
  const [content, setContent] = useState(existingCommunication?.content || '');
  const [date, setDate] = useState(existingCommunication?.date || new Date().toISOString().split('T')[0]);
  const { db, isReady } = useDatabase();

  const handleSave = async () => {
    // Form validasyonu
    if (!content.trim()) {
      Alert.alert('Hata', 'Lütfen iletişim içeriğini girin');
      return;
    }

    if (!type) {
      Alert.alert('Hata', 'Lütfen iletişim türünü seçin');
      return;
    }

    if (!date.trim()) {
      Alert.alert('Hata', 'Lütfen tarih girin');
      return;
    }

    try {
      if (isEdit) {
        // Güncelleme
        await db.runAsync(`
          UPDATE client_communications 
          SET type = ?, subject = ?, content = ?, date = ?
          WHERE id = ?
        `, [type, subject, content, date, existingCommunication.id]);
        Alert.alert('Başarılı', 'İletişim kaydı güncellendi');
      } else {
        // Yeni iletişim kaydı
        await db.runAsync(`
          INSERT INTO client_communications (client_id, type, subject, content, date)
          VALUES (?, ?, ?, ?, ?)
        `, [clientId, type, subject, content, date]);
        Alert.alert('Başarılı', 'İletişim kaydı eklendi');
      }
      
      navigation.goBack();
    } catch (error) {
      console.error('Error saving communication:', error);
      Alert.alert('Hata', 'İletişim kaydı kaydedilirken bir hata oluştu');
    }
  };

  const handleDelete = () => {
    if (!isEdit) return;
    
    Alert.alert(
      'İletişim Kaydını Sil',
      'Bu iletişim kaydını silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await db.runAsync('DELETE FROM client_communications WHERE id = ?', [existingCommunication.id]);
              Alert.alert('Başarılı', 'İletişim kaydı silindi');
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting communication:', error);
              Alert.alert('Hata', 'İletişim kaydı silinirken bir hata oluştu');
            }
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>💬 İletişim Kaydı</Text>
          
          <Text style={styles.inputLabel}>İletişim Türü:</Text>
          <View style={styles.typeContainer}>
            {COMMUNICATION_TYPES.map((communicationType) => (
              <TouchableOpacity
                key={communicationType}
                style={[
                  styles.typeOption,
                  type === communicationType && styles.selectedTypeOption
                ]}
                onPress={() => setType(communicationType)}
              >
                <Text style={[
                  styles.typeOptionText,
                  type === communicationType && styles.selectedTypeOptionText
                ]}>
                  {communicationType}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.inputLabel}>Tarih:</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            value={date}
            onChangeText={setDate}
          />

          <Text style={styles.inputLabel}>Konu:</Text>
          <TextInput
            style={styles.input}
            placeholder="İletişim konusu (opsiyonel)"
            value={subject}
            onChangeText={setSubject}
          />

          <Text style={styles.inputLabel}>İçerik *</Text>
          <TextInput
            style={[styles.input, styles.contentInput]}
            placeholder="İletişim detaylarını yazın..."
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={6}
          />

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
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    marginTop: 15,
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  typeOption: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: 'white',
  },
  selectedTypeOption: {
    backgroundColor: '#1976d2',
    borderColor: '#1976d2',
  },
  typeOptionText: {
    fontSize: 14,
    color: '#666',
  },
  selectedTypeOptionText: {
    color: 'white',
    fontWeight: 'bold',
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
  contentInput: {
    height: 120,
    textAlignVertical: 'top',
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

export default AddCommunicationScreen;
