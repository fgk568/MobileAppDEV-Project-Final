import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  ScrollView,
} from 'react-native';
import { useDatabase } from '../context/FirebaseDatabaseContext';
import { logClientCreate, logClientUpdate } from '../utils/logUtils';
import WebCompatibleIcon from '../components/WebCompatibleIcon';

const AddClientScreen = ({ navigation, route }) => {
  const { client: existingClient, isEdit } = route.params || {};
  const [name, setName] = useState(existingClient?.name || '');
  const [email, setEmail] = useState(existingClient?.email || '');
  const [phone, setPhone] = useState(existingClient?.phone || '');
  const [address, setAddress] = useState(existingClient?.address || '');
  const [tcNumber, setTcNumber] = useState(existingClient?.tc_number || '');
  const [birthDate, setBirthDate] = useState(existingClient?.birth_date || '');
  const [notes, setNotes] = useState(existingClient?.notes || '');
  const [availableCases, setAvailableCases] = useState([]);
  const [selectedCases, setSelectedCases] = useState([]);
  const [showCaseSelection, setShowCaseSelection] = useState(false);
  const { db, isReady } = useDatabase();

  useEffect(() => {
    if (isReady) {
      loadAvailableCases();
      if (isEdit && existingClient) {
        loadClientCases();
      }
    }
  }, [isReady, isEdit, existingClient]);

  const loadAvailableCases = async () => {
    try {
      const cases = await db.getAllAsync('cases');
      const lawyers = await db.getAllAsync('lawyers');
      
      // Client_id'si null olan dosyaları filtrele ve lawyer bilgilerini ekle
      const availableCases = cases
        .filter(c => !c.client_id)
        .map(c => {
          const lawyer = lawyers.find(l => l.id === c.lawyer_id);
          return {
            ...c,
            lawyer_name: lawyer?.name || 'Bilinmeyen',
            lawyer_color: lawyer?.color || '#000000'
          };
        })
        .sort((a, b) => a.title.localeCompare(b.title));
        
      setAvailableCases(availableCases);
    } catch (error) {
      console.error('Error loading available cases:', error);
    }
  };

  const loadClientCases = async () => {
    try {
      const cases = await db.getAllAsync('cases');
      const lawyers = await db.getAllAsync('lawyers');
      
      // Bu müvekkile ait dosyaları filtrele ve lawyer bilgilerini ekle
      const clientCases = cases
        .filter(c => c.client_id === existingClient.id)
        .map(c => {
          const lawyer = lawyers.find(l => l.id === c.lawyer_id);
          return {
            ...c,
            lawyer_name: lawyer?.name || 'Bilinmeyen',
            lawyer_color: lawyer?.color || '#000000'
          };
        })
        .sort((a, b) => a.title.localeCompare(b.title));
        
      setSelectedCases(clientCases);
    } catch (error) {
      console.error('Error loading client cases:', error);
    }
  };

  const toggleCaseSelection = (caseItem) => {
    const isSelected = selectedCases.some(c => c.id === caseItem.id);
    if (isSelected) {
      setSelectedCases(selectedCases.filter(c => c.id !== caseItem.id));
    } else {
      setSelectedCases([...selectedCases, caseItem]);
    }
  };

  const handleSave = async () => {
    console.log('Müvekkil kaydetme başlatıldı:', { name, email, phone });
    
    // Form validasyonu
    if (!name.trim()) {
      Alert.alert('Hata', 'Lütfen müvekkil adını girin');
      return;
    }

    if (email && !email.includes('@')) {
      Alert.alert('Hata', 'Geçerli bir e-posta adresi girin');
      return;
    }

    if (tcNumber && tcNumber.length !== 11) {
      Alert.alert('Hata', 'TC Kimlik No 11 haneli olmalıdır');
      return;
    }

    try {
      let clientId;
      
      const clientData = {
        name,
        email,
        phone,
        address,
        tc_number: tcNumber,
        birth_date: birthDate,
        notes,
        updated_at: new Date().toISOString()
      };
      
      if (isEdit) {
        // Güncelleme
        await db.set('clients', existingClient.id, clientData);
        clientId = existingClient.id;
        
        // Log kaydı
        await logClientUpdate(db, 'system', {
          id: existingClient.id,
          name,
          email,
          lawyer_name: 'Sistem'
        });
        
        Alert.alert('Başarılı', 'Müvekkil bilgileri güncellendi');
      } else {
        // Yeni müvekkil
        console.log('Yeni müvekkil ekleniyor:', clientData);
        const newClientRef = await db.push('clients', clientData);
        console.log('Müvekkil eklendi, ID:', newClientRef.key);
        clientId = newClientRef.key;
        
        // Log kaydı
        await logClientCreate(db, 'system', {
          id: newClientRef.key,
          name,
          email,
          lawyer_name: 'Sistem'
        });
        
        Alert.alert('Başarılı', 'Müvekkil eklendi');
      }

      // Seçilen dosyaları müvekkile bağla
      if (selectedCases.length > 0) {
        for (const caseItem of selectedCases) {
          const caseData = {
            ...caseItem,
            client_id: clientId,
            client_name: name
          };
          await db.set('cases', caseItem.id, caseData);
        }
            }
            
            // Başarılı kayıt sonrası geri dön
            navigation.goBack();
    } catch (error) {
      console.error('Error saving client:', error);
      Alert.alert('Hata', 'Müvekkil kaydedilirken bir hata oluştu');
    }
  };

  const handleDelete = () => {
    if (!isEdit) return;
    
    Alert.alert(
      'Müvekkili Sil',
      'Bu müvekkili silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await db.runAsync('DELETE FROM clients WHERE id = ?', [existingClient.id]);
              Alert.alert('Başarılı', 'Müvekkil silindi');
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting client:', error);
              Alert.alert('Hata', 'Müvekkil silinirken bir hata oluştu');
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
          <Text style={styles.sectionTitle}>📋 Temel Bilgiler</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Ad Soyad *"
            value={name}
            onChangeText={setName}
          />
          
          <TextInput
            style={styles.input}
            placeholder="E-posta"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Telefon"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Adres"
            value={address}
            onChangeText={setAddress}
            multiline
            numberOfLines={3}
          />

          <Text style={styles.sectionTitle}>🆔 Kimlik Bilgileri</Text>
          
          <TextInput
            style={styles.input}
            placeholder="TC Kimlik No"
            value={tcNumber}
            onChangeText={setTcNumber}
            keyboardType="numeric"
            maxLength={11}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Doğum Tarihi (GG.AA.YYYY)"
            value={birthDate}
            onChangeText={setBirthDate}
          />

          <Text style={styles.sectionTitle}>📝 Notlar</Text>
          
          <TextInput
            style={[styles.input, styles.notesInput]}
            placeholder="Müvekkil hakkında notlar..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
          />

          <Text style={styles.sectionTitle}>📁 Dosya Seçimi</Text>
          
          <TouchableOpacity 
            style={styles.caseSelectionButton}
            onPress={() => setShowCaseSelection(!showCaseSelection)}
          >
            <Text style={styles.caseSelectionButtonText}>
              {selectedCases.length > 0 
                ? `${selectedCases.length} dosya seçildi` 
                : 'Dosya seç (isteğe bağlı)'
              }
            </Text>
            <WebCompatibleIcon 
              name={showCaseSelection ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} 
              size={24} 
              color="#666" 
            />
          </TouchableOpacity>

          {showCaseSelection && (
            <View style={styles.caseSelectionContainer}>
              <Text style={styles.caseSelectionTitle}>Mevcut Dosyalar:</Text>
              <FlatList
                data={availableCases}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => {
                  const isSelected = selectedCases.some(c => c.id === item.id);
                  return (
                    <TouchableOpacity
                      style={[styles.caseItem, isSelected && styles.selectedCaseItem]}
                      onPress={() => toggleCaseSelection(item)}
                    >
                      <View style={styles.caseItemContent}>
                        <Text style={styles.caseTitle}>{item.title}</Text>
                        <Text style={styles.caseNumber}>Dosya No: {item.case_number}</Text>
                        <Text style={styles.caseLawyer}>
                          Avukat: {item.lawyer_name}
                        </Text>
                      </View>
                      <WebCompatibleIcon 
                        name={isSelected ? 'check-circle' : 'radio-button-unchecked'} 
                        size={24} 
                        color={isSelected ? '#4caf50' : '#ccc'} 
                      />
                    </TouchableOpacity>
                  );
                }}
                style={styles.caseList}
                removeClippedSubviews={false}
                initialNumToRender={10}
                maxToRenderPerBatch={5}
                windowSize={10}
                getItemLayout={(data, index) => ({
                  length: 80,
                  offset: 80 * index,
                  index,
                })}
              />
            </View>
          )}

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
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 15,
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
  notesInput: {
    height: 100,
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
  caseSelectionButton: {
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  caseSelectionButtonText: {
    fontSize: 16,
    color: '#333',
  },
  caseSelectionContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 15,
    maxHeight: 200,
  },
  caseSelectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  caseList: {
    maxHeight: 150,
  },
  caseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedCaseItem: {
    backgroundColor: '#e8f5e8',
  },
  caseItemContent: {
    flex: 1,
  },
  caseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  caseNumber: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  caseLawyer: {
    fontSize: 12,
    color: '#888',
  },
});

export default AddClientScreen;
