import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useDatabase } from '../context/FirebaseDatabaseContext';
import { useFocusEffect } from '@react-navigation/native';
import WebCompatibleIcon from '../components/WebCompatibleIcon';

const LogScreen = ({ navigation }) => {
  const [logs, setLogs] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('Tümü');
  const { db, isReady } = useDatabase();

  const filterOptions = ['Tümü', 'Dosya', 'Etkinlik', 'Müvekkil', 'Finansal'];

  useEffect(() => {
    if (isReady) {
      loadLogs();
    }
  }, [isReady, filter]);

  useFocusEffect(
    React.useCallback(() => {
      if (isReady) {
        loadLogs();
      }
    }, [isReady])
  );

  const loadLogs = async () => {
    try {
      // Firebase'den logları yükle
      const logsData = await db.getAllAsync('activity_logs');
      const lawyers = await db.getAllAsync('lawyers');
      
      // Lawyer bilgilerini map'e çevir
      const lawyerMap = {};
      lawyers.forEach(lawyer => {
        lawyerMap[lawyer.id] = lawyer;
      });
      
      // Logları lawyer bilgileri ile birleştir ve filtrele
      let filteredLogs = logsData.map(log => ({
        ...log,
        user_name: log.user_name || lawyerMap[log.user_id]?.name || 'Bilinmeyen',
        user_color: lawyerMap[log.user_id]?.color || '#000000'
      }));
      
      // Filtrele
      if (filter !== 'Tümü') {
        filteredLogs = filteredLogs.filter(log => log.target_type === filter);
      }
      
      // Tarihe göre sırala
      filteredLogs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      setLogs(filteredLogs);
    } catch (error) {
      console.error('Error loading logs:', error);
      Alert.alert('Hata', 'Loglar yüklenirken bir hata oluştu');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLogs();
    setRefreshing(false);
  };

  const getActionIcon = (actionType) => {
    switch (actionType) {
      case 'CREATE':
        return 'add-circle';
      case 'UPDATE':
        return 'edit';
      case 'DELETE':
        return 'delete';
      case 'VIEW':
        return 'visibility';
      default:
        return 'info';
    }
  };

  const getActionColor = (actionType) => {
    switch (actionType) {
      case 'CREATE':
        return '#4caf50';
      case 'UPDATE':
        return '#ff9800';
      case 'DELETE':
        return '#f44336';
      case 'VIEW':
        return '#2196f3';
      default:
        return '#666';
    }
  };

  const getTargetTypeIcon = (targetType) => {
    switch (targetType) {
      case 'Dosya':
        return '📁';
      case 'Etkinlik':
        return '📅';
      case 'Müvekkil':
        return '👤';
      case 'Finansal':
        return '💰';
      default:
        return '📋';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderLog = ({ item }) => (
    <View style={styles.logItem}>
      <View style={styles.logHeader}>
        <View style={styles.logUserInfo}>
          <View style={[styles.userColor, { backgroundColor: item.user_color }]} />
          <Text style={styles.userName}>{item.user_name}</Text>
        </View>
        <View style={styles.logTime}>
          <Text style={styles.timeText}>{formatDate(item.created_at)}</Text>
        </View>
      </View>

      <View style={styles.logContent}>
        <View style={styles.logAction}>
          <WebCompatibleIcon 
            name={getActionIcon(item.action_type)} 
            size={20} 
            color={getActionColor(item.action_type)} 
          />
          <Text style={styles.actionText}>{item.action_description}</Text>
        </View>

        {item.target_name && (
          <View style={styles.logTarget}>
            <Text style={styles.targetIcon}>
              {getTargetTypeIcon(item.target_type)}
            </Text>
            <Text style={styles.targetText}>{item.target_name}</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📋 Aktivite Logları</Text>
        <Text style={styles.subtitle}>Kullanıcı işlem geçmişi</Text>
      </View>

      {/* Filtreler */}
      <View style={styles.filtersContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScrollContent}
        >
          {filterOptions.map((option) => (
            <TouchableOpacity
              key={option}
              style={[styles.filterButton, filter === option && styles.activeFilter]}
              onPress={() => setFilter(option)}
            >
              <Text style={[styles.filterText, filter === option && styles.activeFilterText]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Log Listesi */}
      <FlatList
        data={logs}
        renderItem={renderLog}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <WebCompatibleIcon name="history" size={64} color="#8a9ba8" />
            <Text style={styles.emptyText}>Henüz aktivite logu bulunmuyor</Text>
            <Text style={styles.emptySubtext}>
              Kullanıcılar işlem yaptıkça burada görünecek
            </Text>
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
  filtersContainer: {
    padding: 15,
    backgroundColor: '#1e1e2e',
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d3d',
  },
  filtersScrollContent: {
    paddingHorizontal: 5,
  },
  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#2d2d3d',
    borderWidth: 1,
    borderColor: '#4a9eff',
  },
  activeFilter: {
    backgroundColor: '#4a9eff',
  },
  filterText: {
    fontSize: 14,
    color: '#b8c5d1',
  },
  activeFilterText: {
    color: 'white',
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 15,
  },
  logItem: {
    backgroundColor: '#1e1e2e',
    padding: 15,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2d2d3d',
    shadowColor: '#4a9eff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  logUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  userName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  logTime: {
    backgroundColor: '#2d2d3d',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timeText: {
    fontSize: 12,
    color: '#8a9ba8',
  },
  logContent: {
    marginTop: 5,
  },
  logAction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 16,
    color: '#ffffff',
    marginLeft: 8,
    flex: 1,
  },
  logTarget: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d2d3d',
    padding: 8,
    borderRadius: 8,
  },
  targetIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  targetText: {
    fontSize: 14,
    color: '#b8c5d1',
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    color: '#b8c5d1',
    marginTop: 15,
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8a9ba8',
    textAlign: 'center',
  },
});

export default LogScreen;
