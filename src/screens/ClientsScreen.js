import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useDatabase } from '../context/FirebaseDatabaseContext';
import { useFocusEffect } from '@react-navigation/native';

const ClientsScreen = ({ navigation }) => {
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const { db, isReady } = useDatabase();

  useEffect(() => {
    if (isReady) {
      loadClients();
    }
  }, [isReady]);

  // Sayfa her açıldığında müvekkilleri yenile
  useFocusEffect(
    React.useCallback(() => {
      if (isReady) {
        loadClients();
      }
    }, [isReady])
  );

  useEffect(() => {
    filterClients();
  }, [searchText, clients]);

  const loadClients = async () => {
    try {
      console.log('Müvekkiller yükleniyor...');
      const clients = await db.getAllAsync('clients');
      const cases = await db.getAllAsync('cases');
      console.log('Yüklenen müvekkiller:', clients.length);
      
      // Her müvekkil için dava sayısı ve gelir hesapla
      const clientsData = clients.map(client => {
        const clientCases = cases.filter(c => c.client_name === client.name);
        const case_count = clientCases.length;
        const total_revenue = clientCases.reduce((sum, c) => sum + (c.total_fee || 0), 0);
        const paid_revenue = clientCases.reduce((sum, c) => sum + (c.paid_fee || 0), 0);
        
        return {
          ...client,
          case_count,
          total_revenue,
          paid_revenue
        };
      }).sort((a, b) => a.name.localeCompare(b.name));
      
      setClients(clientsData);
    } catch (error) {
      console.error('Error loading clients:', error);
      Alert.alert('Hata', 'Müvekkiller yüklenirken bir hata oluştu');
    }
  };

  const filterClients = () => {
    if (!searchText.trim()) {
      setFilteredClients(clients);
    } else {
      const filtered = clients.filter(client =>
        client.name.toLowerCase().includes(searchText.toLowerCase()) ||
        (client.email && client.email.toLowerCase().includes(searchText.toLowerCase())) ||
        (client.phone && client.phone.includes(searchText))
      );
      setFilteredClients(filtered);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadClients();
    setRefreshing(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount || 0);
  };

  const handleDeleteClient = (clientId) => {
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
              console.log('Müvekkil siliniyor:', clientId);
              await db.remove(`clients/${clientId}`);
              console.log('Müvekkil silindi');
              loadClients(); // Listeyi yenile
              Alert.alert('Başarılı', 'Müvekkil silindi');
            } catch (error) {
              console.error('Error deleting client:', error);
              Alert.alert('Hata', 'Müvekkil silinirken bir hata oluştu');
            }
          }
        }
      ]
    );
  };

  const renderClient = ({ item }) => (
    <View style={styles.clientCard}>
      <TouchableOpacity
        style={styles.clientContent}
        onPress={() => navigation.navigate('ClientDetail', { client: item })}
      >
        <View style={styles.clientHeader}>
          <Text style={styles.clientName}>{item.name}</Text>
          <View style={styles.clientStats}>
            <Text style={styles.statText}>{item.case_count} Dava</Text>
          </View>
        </View>
      
      {item.email && (
        <Text style={styles.clientInfo}>📧 {item.email}</Text>
      )}
      {item.phone && (
        <Text style={styles.clientInfo}>📞 {item.phone}</Text>
      )}
      
      <View style={styles.clientFooter}>
        <View style={styles.revenueInfo}>
          <Text style={styles.revenueLabel}>Toplam Gelir:</Text>
          <Text style={styles.revenueValue}>{formatCurrency(item.total_revenue)}</Text>
        </View>
        <View style={styles.revenueInfo}>
          <Text style={styles.revenueLabel}>Alınan:</Text>
          <Text style={[styles.revenueValue, { color: '#4caf50' }]}>
            {formatCurrency(item.paid_revenue)}
          </Text>
        </View>
      </View>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteClient(item.id)}
      >
        <Text style={styles.deleteButtonText}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>👥 Müvekkiller</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddClient')}
        >
          <Text style={styles.addButtonText}>+ Yeni Müvekkil</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Müvekkil ara..."
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      <FlatList
        data={filteredClients}
        renderItem={renderClient}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Henüz müvekkil eklenmemiş</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate('AddClient')}
            >
              <Text style={styles.emptyButtonText}>İlk Müvekkili Ekle</Text>
            </TouchableOpacity>
          </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1a1a2e',
    paddingTop: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d3d',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  addButton: {
    backgroundColor: '#4a9eff',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#4a9eff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  searchContainer: {
    padding: 15,
    backgroundColor: '#1e1e2e',
  },
  searchInput: {
    backgroundColor: '#2d2d3d',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#4a9eff',
  },
  listContainer: {
    padding: 15,
  },
  clientCard: {
    backgroundColor: '#1e1e2e',
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2d2d3d',
    shadowColor: '#4a9eff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  clientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  clientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
  },
  clientStats: {
    backgroundColor: '#4a9eff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  clientInfo: {
    fontSize: 14,
    color: '#b8c5d1',
    marginBottom: 5,
  },
  clientFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  revenueInfo: {
    alignItems: 'center',
  },
  revenueLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  revenueValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: '#1976d2',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  clientContent: {
    flex: 1,
  },
  deleteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#f44336',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default ClientsScreen;
