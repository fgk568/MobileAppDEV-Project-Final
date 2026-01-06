import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
} from 'react-native';
import { useDatabase } from '../context/FirebaseDatabaseContext';
import { logCaseDelete } from '../utils/logUtils';
import { useFocusEffect } from '@react-navigation/native';
import WebCompatibleIcon from '../components/WebCompatibleIcon';

const CasesScreen = ({ navigation }) => {
  const [cases, setCases] = useState([]);
  const [lawyers, setLawyers] = useState([]);
  const [selectedLawyer, setSelectedLawyer] = useState('all');
  const [showMenu, setShowMenu] = useState(false);
  const { db, isReady } = useDatabase();

  useEffect(() => {
    if (isReady) {
      loadLawyers();
      loadCases();
    }
  }, [isReady]);

  useEffect(() => {
    if (isReady) {
      loadCases();
    }
  }, [selectedLawyer]);

  useFocusEffect(
    React.useCallback(() => {
      if (isReady) {
        loadCases();
      }
    }, [isReady])
  );

  const loadLawyers = async () => {
    try {
      const result = await db.getAllAsync('lawyers');
      setLawyers(result);
    } catch (error) {
      console.error('Error loading lawyers:', error);
    }
  };

  const loadCases = async () => {
    try {
      const cases = await db.getAllAsync('cases');
      const lawyers = await db.getAllAsync('lawyers');
      
      // Lawyer bilgilerini ekle ve filtrele
      let filteredCases = cases.map(c => {
        const lawyer = lawyers.find(l => l.id === c.lawyer_id);
        return {
          ...c,
          lawyer_name: lawyer?.name || 'Bilinmeyen',
          lawyer_color: lawyer?.color || '#000000'
        };
      });
      
      // Avukat filtresi uygula
      if (selectedLawyer !== 'all') {
        filteredCases = filteredCases.filter(c => c.lawyer_id === selectedLawyer);
      }
      
      // Tarihe göre sırala
      filteredCases.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
      
      setCases(filteredCases);
    } catch (error) {
      console.error('Error loading cases:', error);
    }
  };

  const handleDeleteCase = (caseId) => {
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
              // Silinecek dosya bilgilerini al
              const caseToDelete = cases.find(c => c.id === caseId);
              
              await db.remove(`cases/${caseId}`);
              
              // Log kaydı
              if (caseToDelete) {
                await logCaseDelete(db, 'system', {
                  id: caseId,
                  title: caseToDelete.title,
                  client_name: caseToDelete.client_name,
                  lawyer_name: caseToDelete.lawyer_name || 'Bilinmeyen Avukat'
                });
              }
              
              loadCases();
              Alert.alert('Başarılı', 'Dosya silindi');
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

  const renderCase = ({ item }) => (
    <TouchableOpacity 
      style={styles.caseItem}
      onPress={() => navigation.navigate('CaseDetail', { case: item })}
    >
      <View style={styles.caseHeader}>
        <Text style={styles.caseNumber}>{item.case_number}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      <Text style={styles.caseTitle}>{item.title}</Text>
      <Text style={styles.clientName}>Müvekkil: {item.client_name}</Text>
      {item.description && (
        <Text style={styles.caseDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}
      
      <View style={styles.feeContainer}>
        <Text style={styles.feeText}>Toplam: ₺{item.total_fee || 0}</Text>
        <Text style={styles.feeText}>Alınan: ₺{item.paid_fee || 0}</Text>
        <Text style={[styles.feeText, { color: item.remaining_fee > 0 ? '#d32f2f' : '#4caf50' }]}>
          Kalan: ₺{item.remaining_fee || 0}
        </Text>
        {item.payment_date && (
          <Text style={[styles.feeText, { color: '#4a9eff', fontSize: 12 }]}>
            Ödeme: {item.payment_date}
          </Text>
        )}
      </View>
      
      <View style={styles.caseFooter}>
        <View style={styles.lawyerInfo}>
          <View style={[styles.lawyerColor, { backgroundColor: item.lawyer_color }]} />
          <Text style={styles.lawyerName}>{item.lawyer_name}</Text>
        </View>
        <Text style={styles.caseDate}>
          {new Date(item.updated_at).toLocaleDateString('tr-TR')}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderLawyerFilter = () => (
    <View style={styles.filterContainer}>
      <TouchableOpacity
        style={[styles.filterButton, selectedLawyer === 'all' && styles.activeFilter]}
        onPress={() => setSelectedLawyer('all')}
      >
        <Text style={[styles.filterText, selectedLawyer === 'all' && styles.activeFilterText]}>
          Tümü
        </Text>
      </TouchableOpacity>
      
      {lawyers.map((lawyer) => (
        <TouchableOpacity
          key={lawyer.id}
          style={[styles.filterButton, selectedLawyer === lawyer.id.toString() && styles.activeFilter]}
          onPress={() => setSelectedLawyer(lawyer.id.toString())}
        >
          <View style={[styles.filterColor, { backgroundColor: lawyer.color }]} />
          <Text style={[styles.filterText, selectedLawyer === lawyer.id.toString() && styles.activeFilterText]}>
            {lawyer.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

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
        <Text style={styles.headerTitle}>Dosyalar</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('AddCase')}
        >
          <WebCompatibleIcon name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Floating Action Buttons */}
      <TouchableOpacity 
        style={styles.floatingEDevletButton}
        onPress={() => navigation.navigate('EDevletIntegration')}
      >
        <WebCompatibleIcon name="account-balance" size={20} color="#4a9eff" />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.floatingAddButton}
        onPress={() => navigation.navigate('AddCase')}
      >
        <WebCompatibleIcon name="add" size={24} color="white" />
      </TouchableOpacity>

      {renderLawyerFilter()}

      <FlatList
        data={cases}
        renderItem={renderCase}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {selectedLawyer === 'all' ? 'Henüz dosya eklenmemiş' : 'Bu avukatın dosyası yok'}
          </Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
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
  addButton: {
    padding: 8,
  },
  floatingEDevletButton: {
    position: 'absolute',
    top: 50,
    right: 80,
    zIndex: 1000,
    backgroundColor: 'rgba(74, 158, 255, 0.1)',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4a9eff',
    shadowColor: '#4a9eff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingAddButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1000,
    backgroundColor: '#4a9eff',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4a9eff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#1a1a2e',
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d3d',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  edevletButton: {
    backgroundColor: 'rgba(74, 158, 255, 0.1)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#4a9eff',
  },
  addButton: {
    backgroundColor: '#4a9eff',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4a9eff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  addButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  activeFilter: {
    backgroundColor: '#1976d2',
  },
  filterColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 5,
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  activeFilterText: {
    color: 'white',
  },
  listContainer: {
    padding: 15,
  },
  caseItem: {
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
  caseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  caseNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  caseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  clientName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  caseDescription: {
    fontSize: 13,
    color: '#888',
    fontStyle: 'italic',
    marginBottom: 8,
    lineHeight: 18,
  },
  caseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lawyerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lawyerColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  lawyerName: {
    fontSize: 14,
    color: '#666',
  },
  caseDate: {
    fontSize: 12,
    color: '#999',
  },
  feeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  feeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 50,
  },
});

export default CasesScreen;
