import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useDatabase } from '../context/FirebaseDatabaseContext';

const CASE_STAGES = [
  { id: 1, name: 'Açılış', description: 'Dava dosyası açıldı' },
  { id: 2, name: 'İnceleme', description: 'Belgeler inceleniyor' },
  { id: 3, name: 'Hazırlık', description: 'Duruşma hazırlığı' },
  { id: 4, name: 'Duruşma', description: 'Mahkeme duruşması' },
  { id: 5, name: 'Karar', description: 'Mahkeme kararı' },
  { id: 6, name: 'Temyiz', description: 'Temyiz süreci' },
  { id: 7, name: 'Sonuç', description: 'Dava sonuçlandı' },
];

const CaseProcessScreen = ({ navigation, route }) => {
  const { caseId } = route.params || {};
  const [caseData, setCaseData] = useState(null);
  const [processStages, setProcessStages] = useState([]);
  const [currentStage, setCurrentStage] = useState(null);
  const [showAddStageModal, setShowAddStageModal] = useState(false);
  const [newStage, setNewStage] = useState('');
  const [newNote, setNewNote] = useState('');
  const [selectedStageId, setSelectedStageId] = useState(null);
  const { db, isReady } = useDatabase();

  useEffect(() => {
    if (isReady && caseId) {
      loadCaseData();
      loadProcessStages();
    }
  }, [isReady, caseId]);

  const loadCaseData = async () => {
    try {
      const caseResult = await db.getFirstAsync(`
        SELECT c.*, l.name as lawyer_name, l.color as lawyer_color
        FROM cases c
        LEFT JOIN lawyers l ON c.lawyer_id = l.id
        WHERE c.id = ?
      `, [caseId]);
      setCaseData(caseResult);

      // Mevcut aşamayı bul
      const currentStageResult = await db.getFirstAsync(`
        SELECT * FROM case_process_stages 
        WHERE case_id = ? 
        ORDER BY created_at DESC 
        LIMIT 1
      `, [caseId]);
      setCurrentStage(currentStageResult);
    } catch (error) {
      console.error('Error loading case data:', error);
      Alert.alert('Hata', 'Dava bilgileri yüklenirken bir hata oluştu');
    }
  };

  const loadProcessStages = async () => {
    try {
      const stagesResult = await db.getAllAsync(`
        SELECT cps.*, cs.name as stage_name, cs.description as stage_description
        FROM case_process_stages cps
        LEFT JOIN case_stages cs ON cps.stage_id = cs.id
        WHERE cps.case_id = ?
        ORDER BY cps.created_at ASC
      `, [caseId]);
      setProcessStages(stagesResult);
    } catch (error) {
      console.error('Error loading process stages:', error);
    }
  };

  const addProcessStage = async () => {
    if (!newStage || !selectedStageId) {
      Alert.alert('Hata', 'Lütfen aşama seçin ve not ekleyin');
      return;
    }

    try {
      await db.runAsync(`
        INSERT INTO case_process_stages (case_id, stage_id, note, created_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      `, [caseId, selectedStageId, newNote]);

      // Dava durumunu güncelle
      const stageName = CASE_STAGES.find(s => s.id === selectedStageId)?.name;
      if (stageName === 'Sonuç') {
        await db.runAsync('UPDATE cases SET status = "Kapalı" WHERE id = ?', [caseId]);
      }

      setNewStage('');
      setNewNote('');
      setSelectedStageId(null);
      setShowAddStageModal(false);
      
      loadCaseData();
      loadProcessStages();
      
      Alert.alert('Başarılı', 'Aşama eklendi');
    } catch (error) {
      console.error('Error adding process stage:', error);
      Alert.alert('Hata', 'Aşama eklenirken bir hata oluştu');
    }
  };

  const getStageColor = (stageId) => {
    const colors = ['#4caf50', '#ff9800', '#2196f3', '#9c27b0', '#f44336', '#795548', '#607d8b'];
    return colors[(stageId - 1) % colors.length];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📝 Dava Süreç Takibi</Text>
        {caseData && (
          <Text style={styles.subtitle}>{caseData.title}</Text>
        )}
      </View>

      {caseData && (
        <View style={styles.caseInfo}>
          <Text style={styles.caseTitle}>{caseData.title}</Text>
          <Text style={styles.caseClient}>Müvekkil: {caseData.client_name}</Text>
          <View style={styles.caseFooter}>
            <View style={styles.lawyerInfo}>
              <View style={[styles.lawyerColor, { backgroundColor: caseData.lawyer_color }]} />
              <Text style={styles.lawyerName}>{caseData.lawyer_name}</Text>
            </View>
            <Text style={styles.caseStatus}>{caseData.status}</Text>
          </View>
        </View>
      )}

      {/* Mevcut Aşama */}
      {currentStage && (
        <View style={styles.currentStage}>
          <Text style={styles.currentStageTitle}>Mevcut Aşama</Text>
          <View style={[styles.stageCard, { borderLeftColor: getStageColor(currentStage.stage_id) }]}>
            <Text style={styles.stageName}>{currentStage.stage_name}</Text>
            <Text style={styles.stageDescription}>{currentStage.stage_description}</Text>
            {currentStage.note && (
              <Text style={styles.stageNote}>Not: {currentStage.note}</Text>
            )}
            <Text style={styles.stageDate}>{formatDate(currentStage.created_at)}</Text>
          </View>
        </View>
      )}

      {/* Aşama Geçmişi */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📋 Aşama Geçmişi</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowAddStageModal(true)}
          >
            <Text style={styles.addButtonText}>+ Yeni Aşama</Text>
          </TouchableOpacity>
        </View>

        {processStages.map((stage, index) => (
          <View key={stage.id} style={styles.processItem}>
            <View style={styles.processTimeline}>
              <View style={[styles.timelineDot, { backgroundColor: getStageColor(stage.stage_id) }]} />
              {index < processStages.length - 1 && <View style={styles.timelineLine} />}
            </View>
            <View style={styles.processContent}>
              <Text style={styles.processStageName}>{stage.stage_name}</Text>
              <Text style={styles.processDescription}>{stage.stage_description}</Text>
              {stage.note && (
                <Text style={styles.processNote}>Not: {stage.note}</Text>
              )}
              <Text style={styles.processDate}>{formatDate(stage.created_at)}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Yeni Aşama Modal */}
      <Modal
        visible={showAddStageModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Yeni Aşama Ekle</Text>
            
            <Text style={styles.inputLabel}>Aşama Seçin:</Text>
            <ScrollView style={styles.stageSelector}>
              {CASE_STAGES.map((stage) => (
                <TouchableOpacity
                  key={stage.id}
                  style={[
                    styles.stageOption,
                    selectedStageId === stage.id && styles.selectedStageOption
                  ]}
                  onPress={() => setSelectedStageId(stage.id)}
                >
                  <Text style={styles.stageOptionText}>{stage.name}</Text>
                  <Text style={styles.stageOptionDescription}>{stage.description}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.inputLabel}>Not:</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Aşama hakkında not ekleyin..."
              value={newNote}
              onChangeText={setNewNote}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddStageModal(false)}
              >
                <Text style={styles.cancelButtonText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={addProcessStage}
              >
                <Text style={styles.saveButtonText}>Kaydet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#1976d2',
    padding: 20,
    paddingTop: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#e3f2fd',
    textAlign: 'center',
  },
  caseInfo: {
    backgroundColor: 'white',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  caseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  caseClient: {
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
    fontSize: 14,
    color: '#666',
  },
  caseStatus: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  currentStage: {
    margin: 15,
  },
  currentStageTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  stageCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stageName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  stageDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  stageNote: {
    fontSize: 14,
    color: '#333',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  stageDate: {
    fontSize: 12,
    color: '#999',
  },
  section: {
    margin: 15,
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
    backgroundColor: '#1976d2',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  processItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  processTimeline: {
    alignItems: 'center',
    marginRight: 15,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  timelineLine: {
    width: 2,
    height: 40,
    backgroundColor: '#ddd',
    marginTop: 5,
  },
  processContent: {
    flex: 1,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  processStageName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  processDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  processNote: {
    fontSize: 14,
    color: '#333',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  processDate: {
    fontSize: 12,
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  stageSelector: {
    maxHeight: 200,
    marginBottom: 20,
  },
  stageOption: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 10,
  },
  selectedStageOption: {
    borderColor: '#1976d2',
    backgroundColor: '#e3f2fd',
  },
  stageOptionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  stageOptionDescription: {
    fontSize: 14,
    color: '#666',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#1976d2',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CaseProcessScreen;
