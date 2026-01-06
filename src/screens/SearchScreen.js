import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
  Modal,
} from 'react-native';
import { useDatabase } from '../context/FirebaseDatabaseContext';
import WebCompatibleIcon from '../components/WebCompatibleIcon';
import { format } from 'date-fns';

const SearchScreen = ({ navigation }) => {
  const { db, isReady } = useDatabase();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    status: '',
    lawyer: '',
    category: '',
  });

  const searchTabs = [
    { key: 'all', label: 'Tümü', icon: 'search' },
    { key: 'cases', label: 'Davalar', icon: 'folder' },
    { key: 'clients', label: 'Müvekkiller', icon: 'people' },
    { key: 'events', label: 'Etkinlikler', icon: 'event' },
    { key: 'expenses', label: 'Giderler', icon: 'account-balance-wallet' },
  ];

  const statusOptions = ['Açık', 'Devam Ediyor', 'Kapalı'];
  const categoryOptions = ['Ofis Giderleri', 'Ulaşım', 'Telefon/İnternet', 'Kırtasiye', 'Eğitim', 'Yemek', 'Diğer'];

  useEffect(() => {
    if (isReady && searchQuery.length > 2) {
      performSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, activeTab, filters]);

  const performSearch = async () => {
    setLoading(true);
    try {
      let results = [];

      if (activeTab === 'all' || activeTab === 'cases') {
        const casesQuery = `
          SELECT 
            c.*,
            l.name as lawyer_name,
            l.color as lawyer_color,
            'case' as result_type,
            'Dava Dosyası' as type_label
          FROM cases c
          LEFT JOIN lawyers l ON c.lawyer_id = l.id
          WHERE (
            c.title LIKE ? OR 
            c.case_number LIKE ? OR 
            c.client_name LIKE ?
          )
          ${filters.status ? 'AND c.status = ?' : ''}
          ${filters.lawyer ? 'AND l.name LIKE ?' : ''}
          ${filters.dateFrom ? 'AND c.created_at >= ?' : ''}
          ${filters.dateTo ? 'AND c.created_at <= ?' : ''}
          ORDER BY c.created_at DESC
        `;

        const caseParams = [
          `%${searchQuery}%`,
          `%${searchQuery}%`,
          `%${searchQuery}%`,
        ];

        if (filters.status) caseParams.push(filters.status);
        if (filters.lawyer) caseParams.push(`%${filters.lawyer}%`);
        if (filters.dateFrom) caseParams.push(filters.dateFrom);
        if (filters.dateTo) caseParams.push(filters.dateTo);

        const casesResults = await db.getAllAsync(casesQuery, caseParams);
        results = [...results, ...casesResults];
      }

      if (activeTab === 'all' || activeTab === 'clients') {
        const clientsQuery = `
          SELECT 
            c.*,
            'client' as result_type,
            'Müvekkil' as type_label
          FROM clients c
          WHERE (
            c.name LIKE ? OR 
            c.email LIKE ? OR 
            c.phone LIKE ? OR 
            c.tc_number LIKE ?
          )
          ORDER BY c.name ASC
        `;

        const clientParams = [
          `%${searchQuery}%`,
          `%${searchQuery}%`,
          `%${searchQuery}%`,
          `%${searchQuery}%`,
        ];

        const clientsResults = await db.getAllAsync(clientsQuery, clientParams);
        results = [...results, ...clientsResults];
      }

      if (activeTab === 'all' || activeTab === 'events') {
        const eventsQuery = `
          SELECT 
            ce.*,
            l.name as lawyer_name,
            l.color as lawyer_color,
            'event' as result_type,
            'Etkinlik' as type_label
          FROM calendar_events ce
          LEFT JOIN lawyers l ON ce.lawyer_id = l.id
          WHERE (
            ce.title LIKE ? OR 
            ce.description LIKE ? OR 
            ce.client_name LIKE ? OR 
            ce.case_number LIKE ?
          )
          ${filters.dateFrom ? 'AND ce.date >= ?' : ''}
          ${filters.dateTo ? 'AND ce.date <= ?' : ''}
          ORDER BY ce.date DESC
        `;

        const eventParams = [
          `%${searchQuery}%`,
          `%${searchQuery}%`,
          `%${searchQuery}%`,
          `%${searchQuery}%`,
        ];

        if (filters.dateFrom) eventParams.push(filters.dateFrom);
        if (filters.dateTo) eventParams.push(filters.dateTo);

        const eventsResults = await db.getAllAsync(eventsQuery, eventParams);
        results = [...results, ...eventsResults];
      }

      if (activeTab === 'all' || activeTab === 'expenses') {
        const expensesQuery = `
          SELECT 
            e.*,
            l.name as lawyer_name,
            l.color as lawyer_color,
            'expense' as result_type,
            'Gider' as type_label
          FROM expenses e
          LEFT JOIN lawyers l ON e.lawyer_id = l.id
          WHERE (
            e.title LIKE ? OR 
            e.description LIKE ? OR 
            e.category LIKE ?
          )
          ${filters.category ? 'AND e.category = ?' : ''}
          ${filters.dateFrom ? 'AND e.date >= ?' : ''}
          ${filters.dateTo ? 'AND e.date <= ?' : ''}
          ORDER BY e.date DESC
        `;

        const expenseParams = [
          `%${searchQuery}%`,
          `%${searchQuery}%`,
          `%${searchQuery}%`,
        ];

        if (filters.category) expenseParams.push(filters.category);
        if (filters.dateFrom) expenseParams.push(filters.dateFrom);
        if (filters.dateTo) expenseParams.push(filters.dateTo);

        const expensesResults = await db.getAllAsync(expensesQuery, expenseParams);
        results = [...results, ...expensesResults];
      }

      setSearchResults(results);
    } catch (error) {
      console.error('Error performing search:', error);
      Alert.alert('Hata', 'Arama yapılırken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleResultPress = (result) => {
    switch (result.result_type) {
      case 'case':
        navigation.navigate('Cases');
        break;
      case 'client':
        navigation.navigate('Clients');
        break;
      case 'event':
        navigation.navigate('Calendar');
        break;
      case 'expense':
        navigation.navigate('Financial');
        break;
    }
  };

  const clearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      status: '',
      lawyer: '',
      category: '',
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  };

  const getResultIcon = (resultType) => {
    switch (resultType) {
      case 'case': return 'folder';
      case 'client': return 'people';
      case 'event': return 'event';
      case 'expense': return 'account-balance-wallet';
      default: return 'search';
    }
  };

  const getResultColor = (resultType) => {
    switch (resultType) {
      case 'case': return '#2196F3';
      case 'client': return '#4CAF50';
      case 'event': return '#FF9800';
      case 'expense': return '#F44336';
      default: return '#666';
    }
  };

  const renderSearchResult = ({ item }) => (
    <TouchableOpacity
      style={styles.resultCard}
      onPress={() => handleResultPress(item)}
    >
      <View style={styles.resultHeader}>
        <View style={styles.resultIcon}>
          <WebCompatibleIcon name={getResultIcon(item.result_type)} size={24} color={getResultColor(item.result_type)} />
        </View>
        <View style={styles.resultContent}>
          <Text style={styles.resultTitle}>{item.title || item.name}</Text>
          <Text style={styles.resultType}>{item.type_label}</Text>
          {item.lawyer_name && (
            <Text style={styles.resultLawyer}>Avukat: {item.lawyer_name}</Text>
          )}
        </View>
        <WebCompatibleIcon name="chevron-right" size={24} color="#ccc" />
      </View>

      <View style={styles.resultDetails}>
        {item.case_number && (
          <Text style={styles.resultDetail}>Dava No: {item.case_number}</Text>
        )}
        {item.client_name && (
          <Text style={styles.resultDetail}>Müvekkil: {item.client_name}</Text>
        )}
        {item.email && (
          <Text style={styles.resultDetail}>E-posta: {item.email}</Text>
        )}
        {item.phone && (
          <Text style={styles.resultDetail}>Telefon: {item.phone}</Text>
        )}
        {item.amount && (
          <Text style={styles.resultDetail}>Tutar: {formatCurrency(item.amount)}</Text>
        )}
        {item.category && (
          <Text style={styles.resultDetail}>Kategori: {item.category}</Text>
        )}
        {item.date && (
          <Text style={styles.resultDetail}>
            Tarih: {format(new Date(item.date), 'dd/MM/yyyy')}
          </Text>
        )}
        {item.created_at && (
          <Text style={styles.resultDetail}>
            Oluşturulma: {format(new Date(item.created_at), 'dd/MM/yyyy')}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔍 Gelişmiş Arama</Text>
        <Text style={styles.subtitle}>Davalar, müvekkiller, etkinlikler ve giderlerde arama yapın</Text>
      </View>

      {/* Arama Çubuğu */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <WebCompatibleIcon name="search" size={24} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Arama yapın..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <WebCompatibleIcon name="clear" size={24} color="#666" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <WebCompatibleIcon name="filter-list" size={24} color="#1976d2" />
        </TouchableOpacity>
      </View>

      {/* Arama Kategorileri */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsContainer}>
        {searchTabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && styles.activeTab,
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <WebCompatibleIcon name={tab.icon} size={20} color={activeTab === tab.key ? '#1976d2' : '#666'} />
            <Text style={[
              styles.tabText,
              activeTab === tab.key && styles.activeTabText,
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Arama Sonuçları */}
      <View style={styles.resultsContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1976d2" />
            <Text style={styles.loadingText}>Aranıyor...</Text>
          </View>
        ) : searchResults.length > 0 ? (
          <FlatList
            data={searchResults}
            keyExtractor={(item, index) => `${item.result_type}-${item.id}-${index}`}
            renderItem={renderSearchResult}
            contentContainerStyle={styles.resultsList}
          />
        ) : searchQuery.length > 2 ? (
          <View style={styles.emptyContainer}>
            <WebCompatibleIcon name="search-off" size={48} color="#ccc" />
            <Text style={styles.emptyText}>Arama kriterlerinize uygun sonuç bulunamadı.</Text>
            <Text style={styles.emptySubtext}>Farklı anahtar kelimeler deneyin veya filtreleri değiştirin.</Text>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <WebCompatibleIcon name="search" size={48} color="#ccc" />
            <Text style={styles.emptyText}>Arama yapmak için en az 3 karakter girin.</Text>
            <Text style={styles.emptySubtext}>Davalar, müvekkiller, etkinlikler ve giderlerde arama yapabilirsiniz.</Text>
          </View>
        )}
      </View>

      {/* Filtre Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtreler</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <WebCompatibleIcon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.filterLabel}>Tarih Aralığı</Text>
              <View style={styles.dateInputContainer}>
                <TextInput
                  style={styles.dateInput}
                  placeholder="Başlangıç (YYYY-MM-DD)"
                  value={filters.dateFrom}
                  onChangeText={(text) => setFilters({ ...filters, dateFrom: text })}
                />
                <TextInput
                  style={styles.dateInput}
                  placeholder="Bitiş (YYYY-MM-DD)"
                  value={filters.dateTo}
                  onChangeText={(text) => setFilters({ ...filters, dateTo: text })}
                />
              </View>

              <Text style={styles.filterLabel}>Dava Durumu</Text>
              <View style={styles.optionsContainer}>
                {statusOptions.map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.optionButton,
                      filters.status === status && styles.selectedOption,
                    ]}
                    onPress={() => setFilters({ ...filters, status: filters.status === status ? '' : status })}
                  >
                    <Text style={[
                      styles.optionText,
                      filters.status === status && styles.selectedOptionText,
                    ]}>
                      {status}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.filterLabel}>Gider Kategorisi</Text>
              <View style={styles.optionsContainer}>
                {categoryOptions.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.optionButton,
                      filters.category === category && styles.selectedOption,
                    ]}
                    onPress={() => setFilters({ ...filters, category: filters.category === category ? '' : category })}
                  >
                    <Text style={[
                      styles.optionText,
                      filters.category === category && styles.selectedOptionText,
                    ]}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={clearFilters}
              >
                <Text style={styles.clearButtonText}>Temizle</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => setShowFilters(false)}
              >
                <Text style={styles.applyButtonText}>Uygula</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    backgroundColor: '#1a1a2e',
    padding: 20,
    paddingTop: 40,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d3d',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#b8c5d1',
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e2e',
    borderRadius: 25,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#4a9eff',
    shadowColor: '#4a9eff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    color: '#ffffff',
  },
  filterButton: {
    backgroundColor: '#4a9eff',
    padding: 12,
    borderRadius: 25,
    shadowColor: '#4a9eff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  tabsContainer: {
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    backgroundColor: 'white',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activeTab: {
    backgroundColor: '#1976d2',
  },
  tabText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#666',
    fontWeight: 'bold',
  },
  activeTabText: {
    color: 'white',
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 15,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  resultsList: {
    paddingBottom: 20,
  },
  resultCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  resultIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  resultType: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
  },
  resultLawyer: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  resultDetails: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  resultDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    padding: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    marginTop: 15,
  },
  dateInputContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  dateInput: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#f9f9f9',
  },
  selectedOption: {
    backgroundColor: '#1976d2',
    borderColor: '#1976d2',
  },
  optionText: {
    color: '#555',
    fontSize: 14,
  },
  selectedOptionText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 10,
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
  applyButton: {
    flex: 1,
    backgroundColor: '#1976d2',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SearchScreen;
