import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { useDatabase } from '../context/FirebaseDatabaseContext';
import WebCompatibleIcon from '../components/WebCompatibleIcon';

const CaseDetailScreen = ({ navigation, route }) => {
  const { case: caseData } = route.params;
  const [lawyer, setLawyer] = useState(null);
  const { db, isReady } = useDatabase();

  useEffect(() => {
    if (isReady && caseData) {
      loadLawyerInfo();
    }
  }, [isReady, caseData]);

  const loadLawyerInfo = async () => {
    try {
      const result = await db.getFirstAsync(
        'SELECT * FROM lawyers WHERE id = ?',
        [caseData.lawyer_id]
      );
      setLawyer(result);
    } catch (error) {
      console.error('Error loading lawyer info:', error);
    }
  };

  const handleEdit = () => {
    navigation.navigate('AddCase', { case: caseData, isEdit: true });
  };

  const handleDelete = () => {
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
              await db.runAsync('DELETE FROM cases WHERE id = ?', [caseData.id]);
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'Açık': return '#4CAF50';
      case 'Devam Ediyor': return '#FF9800';
      case 'Kapalı': return '#F44336';
      default: return '#666';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <WebCompatibleIcon name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dosya Detayı</Text>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={handleEdit}
        >
          <WebCompatibleIcon name="edit" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.caseNumber}>{caseData.case_number}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(caseData.status) }]}>
            <Text style={styles.statusText}>{caseData.status}</Text>
          </View>
        </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dosya Bilgileri</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Başlık:</Text>
            <Text style={styles.value}>{caseData.title}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Müvekkil:</Text>
            <Text style={styles.value}>{caseData.client_name}</Text>
          </View>
          {caseData.court_name && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Mahkeme:</Text>
              <Text style={styles.value}>{caseData.court_name}</Text>
            </View>
          )}
          {caseData.case_type && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Dava Türü:</Text>
              <Text style={[styles.value, { color: '#4a9eff', fontWeight: 'bold' }]}>
                {caseData.case_type}
              </Text>
            </View>
          )}
          {caseData.opposing_party && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Karşı Taraf:</Text>
              <Text style={styles.value}>{caseData.opposing_party}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.label}>Durum:</Text>
            <Text style={[styles.value, { color: getStatusColor(caseData.status) }]}>
              {caseData.status}
            </Text>
          </View>
          {caseData.description && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Açıklama:</Text>
              <Text style={[styles.value, styles.descriptionText]}>
                {caseData.description}
              </Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.label}>Toplam Ücret:</Text>
            <Text style={styles.value}>₺{caseData.total_fee || 0}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Alınan Ücret:</Text>
            <Text style={styles.value}>₺{caseData.paid_fee || 0}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Kalan Ücret:</Text>
            <Text style={[styles.value, { color: caseData.remaining_fee > 0 ? '#d32f2f' : '#4caf50' }]}>
              ₺{caseData.remaining_fee || 0}
            </Text>
          </View>
          {caseData.payment_date && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Ödeme Tarihi:</Text>
              <Text style={[styles.value, { color: '#4a9eff' }]}>
                {caseData.payment_date}
              </Text>
            </View>
          )}
        </View>

        {lawyer && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sorumlu Avukat</Text>
            <View style={styles.lawyerInfo}>
              <View style={[styles.lawyerColor, { backgroundColor: lawyer.color }]} />
              <View style={styles.lawyerDetails}>
                <Text style={styles.lawyerName}>{lawyer.name}</Text>
                <Text style={styles.lawyerEmail}>{lawyer.email}</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tarih Bilgileri</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Oluşturulma:</Text>
            <Text style={styles.value}>
              {new Date(caseData.created_at).toLocaleDateString('tr-TR')}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Son Güncelleme:</Text>
            <Text style={styles.value}>
              {new Date(caseData.updated_at).toLocaleDateString('tr-TR')}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={[styles.actionButton, styles.editButton]} onPress={handleEdit}>
            <Text style={styles.editButtonText}>Düzenle</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.processButton]} 
            onPress={() => navigation.navigate('CaseProcess', { caseId: caseData.id })}
          >
            <Text style={styles.processButtonText}>Süreç Takibi</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Sil</Text>
        </TouchableOpacity>
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
  topHeader: {
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
  editButton: {
    padding: 8,
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  caseNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 10,
  },
  statusBadge: {
    alignSelf: 'flex-start',
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
  section: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
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
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    width: 120,
  },
  value: {
    fontSize: 16,
    color: '#333',
    flex: 1,
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
  },
  descriptionText: {
    fontStyle: 'italic',
    lineHeight: 20,
    color: '#555',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  editButton: {
    backgroundColor: '#1976d2',
  },
  processButton: {
    backgroundColor: '#4caf50',
  },
  editButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  processButtonText: {
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

export default CaseDetailScreen;
