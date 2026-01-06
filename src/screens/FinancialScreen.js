import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { useDatabase } from '../context/FirebaseDatabaseContext';
import WebCompatibleIcon from '../components/WebCompatibleIcon';
import WebCompatibleDateTimePicker from '../components/WebCompatibleDateTimePicker';
import { format } from 'date-fns';

const FinancialScreen = ({ navigation }) => {
  const { db, isReady } = useDatabase();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [newExpense, setNewExpense] = useState({
    title: '',
    amount: '',
    category: 'Ofis Giderleri',
    description: '',
  });
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);

  const expenseCategories = [
    'Ofis Giderleri',
    'Ulaşım',
    'Telefon/İnternet',
    'Kırtasiye',
    'Eğitim',
    'Yemek',
    'Diğer',
  ];

  useEffect(() => {
    if (isReady) {
      loadExpenses();
    }
  }, [isReady]);

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const expensesData = await db.getAllAsync(`
        SELECT e.*, l.name as lawyer_name, l.color as lawyer_color
        FROM expenses e
        LEFT JOIN lawyers l ON e.lawyer_id = l.id
        ORDER BY e.date DESC
      `);
      setExpenses(expensesData);

      // Toplam gider hesapla
      const totalResult = await db.getFirstAsync('SELECT SUM(amount) as total FROM expenses');
      setTotalExpenses(totalResult?.total || 0);

      // Bu ayki gider hesapla
      const currentMonth = new Date().toISOString().slice(0, 7);
      const monthlyResult = await db.getFirstAsync(`
        SELECT SUM(amount) as total FROM expenses 
        WHERE strftime('%Y-%m', date) = ?
      `, [currentMonth]);
      setMonthlyExpenses(monthlyResult?.total || 0);
    } catch (error) {
      console.error('Error loading expenses:', error);
      Alert.alert('Hata', 'Giderler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async () => {
    if (!newExpense.title || !newExpense.amount) {
      Alert.alert('Hata', 'Lütfen başlık ve tutar alanlarını doldurun.');
      return;
    }

    try {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      await db.runAsync(
        'INSERT INTO expenses (lawyer_id, title, amount, category, description, date) VALUES (?, ?, ?, ?, ?, ?)',
        [1, newExpense.title, parseFloat(newExpense.amount), newExpense.category, newExpense.description, formattedDate]
      );
      
      Alert.alert('Başarılı', 'Gider kaydı eklendi.');
      setShowAddModal(false);
      setNewExpense({ title: '', amount: '', category: 'Ofis Giderleri', description: '' });
      loadExpenses();
    } catch (error) {
      console.error('Error adding expense:', error);
      Alert.alert('Hata', 'Gider kaydedilirken bir hata oluştu.');
    }
  };

  const handleDeleteExpense = (expenseId) => {
    Alert.alert(
      'Gideri Sil',
      'Bu gider kaydını silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await db.runAsync('DELETE FROM expenses WHERE id = ?', [expenseId]);
              Alert.alert('Başarılı', 'Gider kaydı silindi.');
              loadExpenses();
            } catch (error) {
              console.error('Error deleting expense:', error);
              Alert.alert('Hata', 'Gider silinirken bir hata oluştu.');
            }
          },
        },
      ]
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Ofis Giderleri': '#2196F3',
      'Ulaşım': '#4CAF50',
      'Telefon/İnternet': '#FF9800',
      'Kırtasiye': '#9C27B0',
      'Eğitim': '#F44336',
      'Yemek': '#FF5722',
      'Diğer': '#607D8B',
    };
    return colors[category] || '#666';
  };

  const renderExpenseItem = ({ item }) => (
    <View style={styles.expenseCard}>
      <View style={styles.expenseHeader}>
        <Text style={styles.expenseTitle}>{item.title}</Text>
        <TouchableOpacity onPress={() => handleDeleteExpense(item.id)}>
          <WebCompatibleIcon name="delete" size={20} color="#f44336" />
        </TouchableOpacity>
      </View>
      <View style={styles.expenseDetails}>
        <View style={styles.expenseRow}>
          <Text style={styles.expenseLabel}>Tutar:</Text>
          <Text style={styles.expenseAmount}>{formatCurrency(item.amount)}</Text>
        </View>
        <View style={styles.expenseRow}>
          <Text style={styles.expenseLabel}>Kategori:</Text>
          <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) }]}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
        </View>
        <View style={styles.expenseRow}>
          <Text style={styles.expenseLabel}>Tarih:</Text>
          <Text style={styles.expenseDate}>{format(new Date(item.date), 'dd/MM/yyyy')}</Text>
        </View>
        {item.description && (
          <View style={styles.expenseRow}>
            <Text style={styles.expenseLabel}>Açıklama:</Text>
            <Text style={styles.expenseDescription}>{item.description}</Text>
          </View>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976d2" />
        <Text style={styles.loadingText}>Giderler yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>💰 Finansal Yönetim</Text>
        <Text style={styles.subtitle}>Gider Takibi ve Analizi</Text>
      </View>

      {/* Özet Kartları */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{formatCurrency(totalExpenses)}</Text>
          <Text style={styles.summaryLabel}>Toplam Gider</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{formatCurrency(monthlyExpenses)}</Text>
          <Text style={styles.summaryLabel}>Bu Ayki Gider</Text>
        </View>
      </View>

      {/* Gider Listesi */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📋 Gider Listesi</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <WebCompatibleIcon name="add" size={20} color="white" />
            <Text style={styles.addButtonText}>Gider Ekle</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={expenses}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderExpenseItem}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Henüz gider kaydı bulunmamaktadır.</Text>
          }
          contentContainerStyle={styles.listContent}
        />
      </View>

      {/* Gider Ekleme Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Yeni Gider Ekle</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <WebCompatibleIcon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Başlık *</Text>
              <TextInput
                style={styles.input}
                placeholder="Gider başlığı"
                value={newExpense.title}
                onChangeText={(text) => setNewExpense({ ...newExpense, title: text })}
              />

              <Text style={styles.inputLabel}>Tutar *</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                value={newExpense.amount}
                onChangeText={(text) => setNewExpense({ ...newExpense, amount: text })}
                keyboardType="numeric"
              />

              <Text style={styles.inputLabel}>Kategori</Text>
              <View style={styles.categoryContainer}>
                {expenseCategories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryOption,
                      newExpense.category === category && styles.selectedCategoryOption,
                    ]}
                    onPress={() => setNewExpense({ ...newExpense, category })}
                  >
                    <Text style={[
                      styles.categoryOptionText,
                      newExpense.category === category && styles.selectedCategoryOptionText,
                    ]}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Tarih</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateButtonText}>
                  {format(selectedDate, 'dd/MM/yyyy')}
                </Text>
              </TouchableOpacity>

              <Text style={styles.inputLabel}>Açıklama</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Ek açıklama (isteğe bağlı)"
                value={newExpense.description}
                onChangeText={(text) => setNewExpense({ ...newExpense, description: text })}
                multiline
              />

              {showDatePicker && (
                <WebCompatibleDateTimePicker
                  value={selectedDate}
                  mode="date"
                  display="default"
                  onChange={(event, date) => {
                    setShowDatePicker(false);
                    if (date) setSelectedDate(date);
                  }}
                />
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleAddExpense}
              >
                <Text style={styles.saveButtonText}>Kaydet</Text>
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
  summaryContainer: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#1e1e2e',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2d2d3d',
    shadowColor: '#4a9eff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  summaryNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4a9eff',
    marginBottom: 5,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#b8c5d1',
    textAlign: 'center',
  },
  section: {
    flex: 1,
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
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: 'white',
    marginLeft: 5,
    fontWeight: 'bold',
  },
  listContent: {
    paddingBottom: 20,
  },
  expenseCard: {
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
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  expenseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  expenseDetails: {
    gap: 8,
  },
  expenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expenseLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: 'bold',
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f44336',
  },
  expenseDate: {
    fontSize: 14,
    color: '#666',
  },
  expenseDescription: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#777',
    fontSize: 16,
    marginTop: 50,
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
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  textArea: {
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    minHeight: 80,
    textAlignVertical: 'top',
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
  dateButton: {
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 10,
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
  saveButton: {
    flex: 1,
    backgroundColor: '#1976d2',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default FinancialScreen;
