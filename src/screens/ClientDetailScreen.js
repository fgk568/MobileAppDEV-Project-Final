import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  FlatList,
} from 'react-native';
import { useDatabase } from '../context/FirebaseDatabaseContext';

const ClientDetailScreen = ({ navigation, route }) => {
  const { client } = route.params;
  const [clientData, setClientData] = useState(client);
  const [cases, setCases] = useState([]);
  const [communications, setCommunications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const { db, isReady } = useDatabase();

  useEffect(() => {
    if (isReady) {
      loadClientData();
    }
  }, [isReady]);

  const loadClientData = async () => {
    try {
      // Müvekkil davalarını yükle
      const allCases = await db.getAllAsync('cases');
      const lawyers = await db.getAllAsync('lawyers');
      
      const casesData = allCases
        .filter(c => c.client_name === client.name)
        .map(c => {
          const lawyer = lawyers.find(l => l.id === c.lawyer_id);
          return {
            ...c,
            lawyer_name: lawyer?.name || 'Bilinmeyen',
            lawyer_color: lawyer?.color || '#000000'
          };
        })
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      setCases(casesData);

      // İletişim geçmişini yükle
      const allCommunications = await db.getAllAsync('client_communications');
      const communicationsData = allCommunications
        .filter(comm => comm.client_id === client.id)
        .sort((a, b) => {
          if (a.date === b.date) {
            return new Date(b.created_at) - new Date(a.created_at);
          }
          return new Date(b.date) - new Date(a.date);
        });
      
      setCommunications(communicationsData);

    } catch (error) {
      console.error('Error loading client data:', error);
      Alert.alert('Hata', 'Müvekkil verileri yüklenirken bir hata oluştu');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadClientData();
    setRefreshing(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Açık': return '#4caf50';
      case 'Devam Ediyor': return '#ff9800';
      case 'Kapalı': return '#f44336';
      default: return '#666';
    }
  };

  const getCommunicationIcon = (type) => {
    switch (type) {
      case 'Telefon': return '📞';
      case 'E-posta': return '📧';
      case 'Toplantı': return '🤝';
      case 'Duruşma': return '⚖️';
      case 'Not': return '📝';
      default: return '💬';
    }
  };

  const renderCase = ({ item }) => (
    <TouchableOpacity
      style={styles.caseCard}
      onPress={() => navigation.navigate('CaseDetail', { case: item })}
    >
      <View style={styles.caseHeader}>
        <Text style={styles.caseTitle}>{item.title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      <Text style={styles.caseNumber}>Dosya No: {item.case_number}</Text>
      
      <View style={styles.caseFooter}>
        <View style={styles.lawyerInfo}>
          <View style={[styles.lawyerColor, { backgroundColor: item.lawyer_color }]} />
          <Text style={styles.lawyerName}>{item.lawyer_name}</Text>
        </View>
        <Text style={styles.caseDate}>{formatDate(item.created_at)}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderCommunication = ({ item }) => (
    <View style={styles.communicationCard}>
      <View style={styles.communicationHeader}>
        <Text style={styles.communicationIcon}>{getCommunicationIcon(item.type)}</Text>
        <View style={styles.communicationInfo}>
          <Text style={styles.communicationType}>{item.type}</Text>
          {item.subject && (
            <Text style={styles.communicationSubject}>{item.subject}</Text>
          )}
        </View>
        <Text style={styles.communicationDate}>{formatDate(item.date)}</Text>
      </View>
      
      {item.content && (
        <Text style={styles.communicationContent}>{item.content}</Text>
      )}
    </View>
  );

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>{clientData.name}</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate('AddClient', { client: clientData, isEdit: true })}
        >
          <Text style={styles.editButtonText}>Düzenle</Text>
        </TouchableOpacity>
      </View>

      {/* Müvekkil Bilgileri */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 Müvekkil Bilgileri</Text>
        <View style={styles.infoCard}>
          {clientData.email && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>E-posta:</Text>
              <Text style={styles.infoValue}>{clientData.email}</Text>
            </View>
          )}
          {clientData.phone && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Telefon:</Text>
              <Text style={styles.infoValue}>{clientData.phone}</Text>
            </View>
          )}
          {clientData.address && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Adres:</Text>
              <Text style={styles.infoValue}>{clientData.address}</Text>
            </View>
          )}
          {clientData.tc_number && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>TC No:</Text>
              <Text style={styles.infoValue}>{clientData.tc_number}</Text>
            </View>
          )}
          {clientData.birth_date && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Doğum Tarihi:</Text>
              <Text style={styles.infoValue}>{clientData.birth_date}</Text>
            </View>
          )}
          {clientData.notes && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Notlar:</Text>
              <Text style={styles.infoValue}>{clientData.notes}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Dava İstatistikleri */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Dava İstatistikleri</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{cases.length}</Text>
            <Text style={styles.statLabel}>Toplam Dava</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {formatCurrency(cases.reduce((sum, caseItem) => sum + (caseItem.total_fee || 0), 0))}
            </Text>
            <Text style={styles.statLabel}>Toplam Gelir</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {formatCurrency(cases.reduce((sum, caseItem) => sum + (caseItem.paid_fee || 0), 0))}
            </Text>
            <Text style={styles.statLabel}>Alınan Gelir</Text>
          </View>
        </View>
      </View>

      {/* Davalar */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>⚖️ Davalar</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('AddCase')}
          >
            <Text style={styles.addButtonText}>+ Yeni Dava</Text>
          </TouchableOpacity>
        </View>
        
        {cases.length > 0 ? (
          <FlatList
            data={cases}
            renderItem={renderCase}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Henüz dava eklenmemiş</Text>
          </View>
        )}
      </View>

      {/* İletişim Geçmişi */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>💬 İletişim Geçmişi</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('AddCommunication', { clientId: clientData.id })}
          >
            <Text style={styles.addButtonText}>+ Yeni Kayıt</Text>
          </TouchableOpacity>
        </View>
        
        {communications.length > 0 ? (
          <FlatList
            data={communications}
            renderItem={renderCommunication}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Henüz iletişim kaydı eklenmemiş</Text>
          </View>
        )}
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
  },
  editButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  section: {
    padding: 15,
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
    marginBottom: 15,
  },
  infoCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    width: 100,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#1976d2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  addButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  caseCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  caseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  caseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
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
  caseNumber: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
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
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  lawyerName: {
    fontSize: 12,
    color: '#666',
  },
  caseDate: {
    fontSize: 12,
    color: '#999',
  },
  communicationCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  communicationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  communicationIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  communicationInfo: {
    flex: 1,
  },
  communicationType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  communicationSubject: {
    fontSize: 14,
    color: '#666',
  },
  communicationDate: {
    fontSize: 12,
    color: '#999',
  },
  communicationContent: {
    fontSize: 14,
    color: '#333',
    marginTop: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
  },
});

export default ClientDetailScreen;
