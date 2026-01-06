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
import { logCaseCreate, logCaseUpdate } from '../utils/logUtils';
import WebCompatibleIcon from '../components/WebCompatibleIcon';

const AddCaseScreen = ({ navigation, route }) => {
  const { case: existingCase, isEdit } = route.params || {};
  const [caseNumber, setCaseNumber] = useState(existingCase?.case_number || '');
  const [title, setTitle] = useState(existingCase?.title || '');
  const [clientName, setClientName] = useState(existingCase?.client_name || '');
  const [courtName, setCourtName] = useState(existingCase?.court_name || '');
  const [caseType, setCaseType] = useState(existingCase?.case_type || '');
  const [opposingParty, setOpposingParty] = useState(existingCase?.opposing_party || '');
  const [status, setStatus] = useState(existingCase?.status || 'Açık');
  const [totalFee, setTotalFee] = useState(existingCase?.total_fee?.toString() || '');
  const [paidFee, setPaidFee] = useState(existingCase?.paid_fee?.toString() || '');
  const [paymentDate, setPaymentDate] = useState(existingCase?.payment_date || '');
  const [description, setDescription] = useState(existingCase?.description || '');
  const [selectedLawyerId, setSelectedLawyerId] = useState(existingCase?.lawyer_id || null);
  const [lawyers, setLawyers] = useState([]);
  const { db, isReady } = useDatabase();

  const statusOptions = ['Açık', 'Devam Ediyor', 'Kapalı'];
  const caseTypeOptions = [
    'Ticari Dava',
    'İş Davası',
    'Aile Hukuku',
    'Ceza Davası',
    'İdari Dava',
    'Tazminat Davası',
    'Sözleşme Davası',
    'Mülkiyet Davası',
    'Diğer'
  ];

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
    // Form validasyonu
    if (!caseNumber || !title || !clientName || !selectedLawyerId) {
      Alert.alert('Hata', 'Lütfen tüm zorunlu alanları doldurun');
      return;
    }

    if (totalFee && isNaN(parseFloat(totalFee))) {
      Alert.alert('Hata', 'Toplam ücret geçerli bir sayı olmalıdır');
      return;
    }

    if (paidFee && isNaN(parseFloat(paidFee))) {
      Alert.alert('Hata', 'Ödenen ücret geçerli bir sayı olmalıdır');
      return;
    }

    const totalFeeValue = parseFloat(totalFee) || 0;
    const paidFeeValue = parseFloat(paidFee) || 0;
    
    if (paidFeeValue > totalFeeValue) {
      Alert.alert('Hata', 'Ödenen ücret toplam ücretten fazla olamaz');
      return;
    }

    const remainingFeeValue = totalFeeValue - paidFeeValue;

    try {
      // Kullanıcı bilgilerini al
      const currentLawyer = lawyers.find(l => l.id === selectedLawyerId);
      const lawyerName = currentLawyer?.name || 'Bilinmeyen Kullanıcı';

      const caseData = {
        case_number: caseNumber,
        title,
        client_name: clientName,
        court_name: courtName,
        case_type: caseType,
        opposing_party: opposingParty,
        status,
        lawyer_id: selectedLawyerId,
        total_fee: totalFeeValue,
        paid_fee: paidFeeValue,
        remaining_fee: remainingFeeValue,
        payment_date: paymentDate,
        description,
        updated_at: new Date().toISOString()
      };

      if (isEdit) {
        // Güncelleme
        await db.set('cases', existingCase.id, caseData);
        
        // Log kaydı
        await logCaseUpdate(db, selectedLawyerId, {
          id: existingCase.id,
          title,
          client_name: clientName,
          lawyer_name: lawyerName
        });
        
        Alert.alert('Başarılı', 'Dosya güncellendi');
      } else {
        // Yeni dosya
        const result = await db.push('cases', caseData);
        
        // Log kaydı
        await logCaseCreate(db, selectedLawyerId, {
          id: result.key,
          title,
          client_name: clientName,
          lawyer_name: lawyerName
        });
        
        Alert.alert('Başarılı', 'Dosya eklendi');
      }
      
      navigation.goBack();
    } catch (error) {
      console.error('Error saving case:', error);
      Alert.alert('Hata', 'Dosya kaydedilirken bir hata oluştu');
    }
  };

  const handleDelete = () => {
    if (!isEdit) return;
    
    Alert.alert(
      'Dosyayı Sil',
      'Bu dosyayı silmek istediğinizden emin misiniz?',
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
              await LogService.logCaseDelete(db, selectedLawyerId, lawyerName, title);
              
              await db.runAsync('DELETE FROM cases WHERE id = ?', [existingCase.id]);
              Alert.alert('Başarılı', 'Dosya silindi');
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting case:', error);
              Alert.alert('Hata', 'Dosya silinirken bir hata oluştu');
            }
          }
        }
      ]
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <WebCompatibleIcon name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEdit ? 'Dosya Düzenle' : 'Yeni Dosya'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formContainer}>

          <TextInput
            style={styles.input}
            placeholder="Dosya Numarası *"
            value={caseNumber}
            onChangeText={setCaseNumber}
          />

          <TextInput
            style={styles.input}
            placeholder="Dosya Başlığı *"
            value={title}
            onChangeText={setTitle}
          />

          <TextInput
            style={styles.input}
            placeholder="Müvekkil Adı *"
            value={clientName}
            onChangeText={setClientName}
          />

          <TextInput
            style={styles.input}
            placeholder="Mahkeme İsmi"
            value={courtName}
            onChangeText={setCourtName}
          />

          <Text style={styles.label}>Dava Türü:</Text>
          <View style={styles.typeContainer}>
            {caseTypeOptions.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeOption,
                  caseType === type && styles.selectedTypeOption
                ]}
                onPress={() => setCaseType(type)}
              >
                <Text style={[
                  styles.typeText,
                  caseType === type && styles.selectedTypeText
                ]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.input}
            placeholder="Karşı Taraf"
            value={opposingParty}
            onChangeText={setOpposingParty}
          />

          <TextInput
            style={styles.input}
            placeholder="Toplam Ücret (TL)"
            value={totalFee}
            onChangeText={setTotalFee}
            keyboardType="numeric"
          />

          <TextInput
            style={styles.input}
            placeholder="Alınan Ücret (TL)"
            value={paidFee}
            onChangeText={setPaidFee}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Ödeme Tarihi</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD (örn: 2024-01-15)"
            value={paymentDate}
            onChangeText={setPaymentDate}
          />

          <Text style={styles.label}>Durum</Text>
          <View style={styles.statusContainer}>
            {statusOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.statusOption,
                  status === option && styles.selectedStatus
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

          <Text style={styles.label}>Açıklama</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Dosya hakkında açıklama yazın..."
            value={description}
            onChangeText={setDescription}
            multiline={true}
            numberOfLines={4}
            textAlignVertical="top"
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
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  typeOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedTypeOption: {
    backgroundColor: '#1976d2',
    borderColor: '#1976d2',
  },
  typeText: {
    fontSize: 14,
    color: '#666',
  },
  selectedTypeText: {
    color: 'white',
    fontWeight: 'bold',
  },
  statusContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  statusOption: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginRight: 10,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  selectedStatus: {
    backgroundColor: '#1976d2',
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
  textArea: {
    height: 100,
    textAlignVertical: 'top',
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

export default AddCaseScreen;
