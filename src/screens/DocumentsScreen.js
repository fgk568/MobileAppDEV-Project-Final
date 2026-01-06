import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  TextInput,
} from 'react-native';
import { useDatabase } from '../context/FirebaseDatabaseContext';
import WebCompatibleIcon from '../components/WebCompatibleIcon';
import { format } from 'date-fns';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

const DocumentsScreen = ({ navigation }) => {
  const { db, isReady } = useDatabase();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Dava Dosyası');
  const [selectedCase, setSelectedCase] = useState(null);
  const [cases, setCases] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const documentCategories = [
    'Dava Dosyası',
    'Sözleşme',
    'Fatura',
    'Makbuz',
    'Kimlik Belgesi',
    'Tapu',
    'Diğer',
  ];

  useEffect(() => {
    if (isReady) {
      loadDocuments();
      loadCases();
    }
  }, [isReady]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const documents = await db.getAllAsync('documents');
      const cases = await db.getAllAsync('cases');
      const lawyers = await db.getAllAsync('lawyers');
      
      // Dokümanları case ve lawyer bilgileri ile birleştir
      const documentsData = documents.map(doc => {
        const caseInfo = cases.find(c => c.id === doc.case_id);
        const lawyer = lawyers.find(l => l.id === doc.lawyer_id);
        
        return {
          ...doc,
          case_title: caseInfo?.title || 'Bilinmeyen Dava',
          case_number: caseInfo?.case_number || '',
          lawyer_name: lawyer?.name || 'Bilinmeyen Avukat',
          lawyer_color: lawyer?.color || '#000000'
        };
      }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      setDocuments(documentsData);
    } catch (error) {
      console.error('Error loading documents:', error);
      Alert.alert('Hata', 'Dokümanlar yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const loadCases = async () => {
    try {
      const casesData = await db.getAllAsync('cases');
      setCases(casesData);
    } catch (error) {
      console.error('Error loading cases:', error);
    }
  };

  const handleAddDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        
        // Dosyayı uygulama dizinine kopyala
        const fileName = `${Date.now()}_${file.name}`;
        const fileUri = `${FileSystem.documentDirectory}documents/${fileName}`;
        
        // Dizin yoksa oluştur
        await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}documents/`, { intermediates: true });
        
        // Dosyayı kopyala
        await FileSystem.copyAsync({
          from: file.uri,
          to: fileUri,
        });

        // Veritabanına kaydet
        await db.runAsync(
          'INSERT INTO documents (lawyer_id, case_id, title, file_name, file_path, file_size, category, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [
            1, // lawyer_id
            selectedCase?.id || null,
            file.name,
            fileName,
            fileUri,
            file.size || 0,
            selectedCategory,
            `Yüklenen dosya: ${file.name}`
          ]
        );

        Alert.alert('Başarılı', 'Doküman başarıyla yüklendi.');
        setShowAddModal(false);
        loadDocuments();
      }
    } catch (error) {
      console.error('Error adding document:', error);
      Alert.alert('Hata', 'Doküman yüklenirken bir hata oluştu.');
    }
  };

  const handleDeleteDocument = (documentId) => {
    Alert.alert(
      'Dokümanı Sil',
      'Bu dokümanı silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await db.runAsync('DELETE FROM documents WHERE id = ?', [documentId]);
              Alert.alert('Başarılı', 'Doküman silindi.');
              loadDocuments();
            } catch (error) {
              console.error('Error deleting document:', error);
              Alert.alert('Hata', 'Doküman silinirken bir hata oluştu.');
            }
          },
        },
      ]
    );
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf': return 'picture-as-pdf';
      case 'doc':
      case 'docx': return 'description';
      case 'xls':
      case 'xlsx': return 'table-chart';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif': return 'image';
      case 'txt': return 'text-snippet';
      default: return 'attach-file';
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Dava Dosyası': '#2196F3',
      'Sözleşme': '#4CAF50',
      'Fatura': '#FF9800',
      'Makbuz': '#9C27B0',
      'Kimlik Belgesi': '#F44336',
      'Tapu': '#607D8B',
      'Diğer': '#666',
    };
    return colors[category] || '#666';
  };

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.case_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderDocumentItem = ({ item }) => (
    <View style={styles.documentCard}>
      <View style={styles.documentHeader}>
        <View style={styles.documentIcon}>
          <WebCompatibleIcon name={getFileIcon(item.file_name)} size={24} color={getCategoryColor(item.category)} />
        </View>
        <View style={styles.documentContent}>
          <Text style={styles.documentTitle}>{item.title}</Text>
          <Text style={styles.documentCategory}>{item.category}</Text>
          {item.case_title && (
            <Text style={styles.documentCase}>Dava: {item.case_title}</Text>
          )}
        </View>
        <TouchableOpacity onPress={() => handleDeleteDocument(item.id)}>
          <WebCompatibleIcon name="delete" size={20} color="#f44336" />
        </TouchableOpacity>
      </View>

      <View style={styles.documentDetails}>
        <View style={styles.documentRow}>
          <Text style={styles.documentLabel}>Dosya Boyutu:</Text>
          <Text style={styles.documentValue}>{formatFileSize(item.file_size)}</Text>
        </View>
        <View style={styles.documentRow}>
          <Text style={styles.documentLabel}>Yüklenme Tarihi:</Text>
          <Text style={styles.documentValue}>
            {format(new Date(item.created_at), 'dd/MM/yyyy HH:mm')}
          </Text>
        </View>
        {item.lawyer_name && (
          <View style={styles.documentRow}>
            <Text style={styles.documentLabel}>Avukat:</Text>
            <Text style={styles.documentValue}>{item.lawyer_name}</Text>
          </View>
        )}
        {item.description && (
          <View style={styles.documentRow}>
            <Text style={styles.documentLabel}>Açıklama:</Text>
            <Text style={styles.documentValue}>{item.description}</Text>
          </View>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976d2" />
        <Text style={styles.loadingText}>Dokümanlar yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📄 Doküman Yönetimi</Text>
        <Text style={styles.subtitle}>Dava dosyaları ve belgeler</Text>
      </View>

      {/* Arama ve Filtreleme */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <WebCompatibleIcon name="search" size={24} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Doküman ara..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <WebCompatibleIcon name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Doküman Listesi */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          📋 Dokümanlar ({filteredDocuments.length})
        </Text>

        <FlatList
          data={filteredDocuments}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderDocumentItem}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <WebCompatibleIcon name="folder-open" size={48} color="#ccc" />
              <Text style={styles.emptyText}>Henüz doküman bulunmamaktadır.</Text>
              <Text style={styles.emptySubtext}>Yeni doküman yüklemek için + butonuna tıklayın.</Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
        />
      </View>

      {/* Doküman Ekleme Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Yeni Doküman Ekle</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <WebCompatibleIcon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Kategori *</Text>
              <View style={styles.categoryContainer}>
                {documentCategories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryOption,
                      selectedCategory === category && styles.selectedCategoryOption,
                    ]}
                    onPress={() => setSelectedCategory(category)}
                  >
                    <Text style={[
                      styles.categoryOptionText,
                      selectedCategory === category && styles.selectedCategoryOptionText,
                    ]}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Dava Dosyası (İsteğe Bağlı)</Text>
              <View style={styles.caseSelector}>
                <Text style={styles.caseSelectorText}>
                  {selectedCase ? `${selectedCase.title} (${selectedCase.case_number})` : 'Dava seçin...'}
                </Text>
                <TouchableOpacity
                  style={styles.caseSelectorButton}
                  onPress={() => {
                    // Basit bir case seçici modal açılabilir
                    Alert.alert(
                      'Dava Seç',
                      'Dava seçimi için Cases ekranına gidin.',
                      [
                        { text: 'İptal', style: 'cancel' },
                        { text: 'Cases\'e Git', onPress: () => navigation.navigate('Cases') }
                      ]
                    );
                  }}
                >
                  <WebCompatibleIcon name="arrow-drop-down" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Dosya Seç</Text>
              <TouchableOpacity
                style={styles.fileSelector}
                onPress={handleAddDocument}
              >
                <WebCompatibleIcon name="cloud-upload" size={24} color="#1976d2" />
                <Text style={styles.fileSelectorText}>Dosya Seç ve Yükle</Text>
                <Text style={styles.fileSelectorSubtext}>PDF, DOC, XLS, resim ve diğer dosya türleri desteklenir</Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>İptal</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#b8c5d1',
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
    backgroundColor: 'white',
    borderRadius: 25,
    paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  section: {
    flex: 1,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  listContent: {
    paddingBottom: 20,
  },
  documentCard: {
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
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  documentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  documentContent: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  documentCategory: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
  },
  documentCase: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  documentDetails: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  documentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  documentLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: 'bold',
  },
  documentValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  emptyContainer: {
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
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    marginTop: 15,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryOption: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#f9f9f9',
  },
  selectedCategoryOption: {
    backgroundColor: '#1976d2',
    borderColor: '#1976d2',
  },
  categoryOptionText: {
    color: '#555',
    fontSize: 14,
  },
  selectedCategoryOptionText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  caseSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  caseSelectorText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  caseSelectorButton: {
    padding: 5,
  },
  fileSelector: {
    backgroundColor: '#f9f9f9',
    padding: 30,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  fileSelectorText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976d2',
    marginTop: 10,
  },
  fileSelectorSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default DocumentsScreen;
