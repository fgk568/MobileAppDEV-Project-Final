import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { useDatabase } from '../context/FirebaseDatabaseContext';

const { width } = Dimensions.get('window');

const StatisticsScreen = ({ navigation }) => {
  const [monthlyData, setMonthlyData] = useState([]);
  const [lawyerStats, setLawyerStats] = useState([]);
  const [caseTypeStats, setCaseTypeStats] = useState([]);
  const [revenueStats, setRevenueStats] = useState({});
  const { db, isReady } = useDatabase();

  useEffect(() => {
    if (isReady) {
      loadStatistics();
    }
  }, [isReady]);

  const loadStatistics = async () => {
    try {
      // Son 6 ayın verilerini al
      const monthlyDataResult = await db.getAllAsync(`
        SELECT 
          strftime('%Y-%m', created_at) as month,
          COUNT(*) as case_count,
          SUM(total_fee) as total_revenue,
          SUM(paid_fee) as paid_revenue
        FROM cases 
        WHERE created_at >= date('now', '-6 months')
        GROUP BY strftime('%Y-%m', created_at)
        ORDER BY month
      `);
      setMonthlyData(monthlyDataResult);

      // Avukat bazlı istatistikler
      const lawyerStatsResult = await db.getAllAsync(`
        SELECT 
          l.name as lawyer_name,
          l.color as lawyer_color,
          COUNT(c.id) as case_count,
          SUM(c.total_fee) as total_revenue,
          SUM(c.paid_fee) as paid_revenue,
          AVG(c.total_fee) as avg_fee
        FROM lawyers l
        LEFT JOIN cases c ON l.id = c.lawyer_id
        GROUP BY l.id, l.name, l.color
        ORDER BY case_count DESC
      `);
      setLawyerStats(lawyerStatsResult);

      // Dava türü bazlı istatistikler (durum bazlı)
      const caseTypeStatsResult = await db.getAllAsync(`
        SELECT 
          status,
          COUNT(*) as count,
          SUM(total_fee) as total_revenue
        FROM cases
        GROUP BY status
        ORDER BY count DESC
      `);
      setCaseTypeStats(caseTypeStatsResult);

      // Genel gelir istatistikleri
      const revenueStatsResult = await db.getFirstAsync(`
        SELECT 
          SUM(total_fee) as total_revenue,
          SUM(paid_fee) as paid_revenue,
          SUM(remaining_fee) as pending_revenue,
          AVG(total_fee) as avg_case_fee
        FROM cases
      `);
      setRevenueStats(revenueStatsResult || {});

    } catch (error) {
      console.error('Error loading statistics:', error);
      Alert.alert('Hata', 'İstatistikler yüklenirken bir hata oluştu');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount || 0);
  };

  const getMaxValue = (data, field) => {
    return Math.max(...data.map(item => item[field] || 0));
  };

  const renderBarChart = (data, field, label, color = '#1976d2') => {
    const maxValue = getMaxValue(data, field);
    
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>{label}</Text>
        {data.map((item, index) => {
          const percentage = maxValue > 0 ? (item[field] / maxValue) * 100 : 0;
          return (
            <View key={index} style={styles.barItem}>
              <Text style={styles.barLabel}>{item.month || item.lawyer_name || item.status}</Text>
              <View style={styles.barContainer}>
                <View 
                  style={[
                    styles.bar, 
                    { 
                      width: `${percentage}%`, 
                      backgroundColor: color 
                    }
                  ]} 
                />
                <Text style={styles.barValue}>{item[field]}</Text>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const renderPieChart = (data, labelField, valueField, label) => {
    const total = data.reduce((sum, item) => sum + (item[valueField] || 0), 0);
    
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>{label}</Text>
        {data.map((item, index) => {
          const percentage = total > 0 ? ((item[valueField] || 0) / total) * 100 : 0;
          const colors = ['#4caf50', '#ff9800', '#f44336', '#2196f3', '#9c27b0'];
          const color = colors[index % colors.length];
          
          return (
            <View key={index} style={styles.pieItem}>
              <View style={[styles.pieColor, { backgroundColor: color }]} />
              <Text style={styles.pieLabel}>{item[labelField]}</Text>
              <Text style={styles.pieValue}>{item[valueField]} ({percentage.toFixed(1)}%)</Text>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📈 İstatistikler</Text>
        <Text style={styles.subtitle}>Detaylı Analiz ve Raporlar</Text>
      </View>

      {/* Genel İstatistikler */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💰 Gelir Özeti</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{formatCurrency(revenueStats.total_revenue)}</Text>
            <Text style={styles.statLabel}>Toplam Gelir</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{formatCurrency(revenueStats.paid_revenue)}</Text>
            <Text style={styles.statLabel}>Alınan Gelir</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{formatCurrency(revenueStats.pending_revenue)}</Text>
            <Text style={styles.statLabel}>Bekleyen Gelir</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{formatCurrency(revenueStats.avg_case_fee)}</Text>
            <Text style={styles.statLabel}>Ortalama Dava Ücreti</Text>
          </View>
        </View>
      </View>

      {/* Aylık Dava Trendi */}
      {monthlyData.length > 0 && (
        <View style={styles.section}>
          {renderBarChart(monthlyData, 'case_count', '📅 Aylık Dava Sayısı', '#4caf50')}
        </View>
      )}

      {/* Aylık Gelir Trendi */}
      {monthlyData.length > 0 && (
        <View style={styles.section}>
          {renderBarChart(monthlyData, 'total_revenue', '💰 Aylık Gelir Trendi', '#2196f3')}
        </View>
      )}

      {/* Avukat Performansı */}
      {lawyerStats.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👨‍💼 Avukat Performansı</Text>
          {lawyerStats.map((lawyer, index) => (
            <View key={index} style={styles.lawyerCard}>
              <View style={styles.lawyerHeader}>
                <View style={[styles.lawyerColor, { backgroundColor: lawyer.lawyer_color }]} />
                <Text style={styles.lawyerName}>{lawyer.lawyer_name}</Text>
              </View>
              <View style={styles.lawyerStats}>
                <View style={styles.lawyerStat}>
                  <Text style={styles.lawyerStatLabel}>Dava Sayısı</Text>
                  <Text style={styles.lawyerStatValue}>{lawyer.case_count}</Text>
                </View>
                <View style={styles.lawyerStat}>
                  <Text style={styles.lawyerStatLabel}>Toplam Gelir</Text>
                  <Text style={styles.lawyerStatValue}>{formatCurrency(lawyer.total_revenue)}</Text>
                </View>
                <View style={styles.lawyerStat}>
                  <Text style={styles.lawyerStatLabel}>Ortalama Ücret</Text>
                  <Text style={styles.lawyerStatValue}>{formatCurrency(lawyer.avg_fee)}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Dava Durumu Dağılımı */}
      {caseTypeStats.length > 0 && (
        <View style={styles.section}>
          {renderPieChart(caseTypeStats, 'status', 'count', '📊 Dava Durumu Dağılımı')}
        </View>
      )}

      {/* Gelir Dağılımı */}
      {caseTypeStats.length > 0 && (
        <View style={styles.section}>
          {renderPieChart(caseTypeStats, 'status', 'total_revenue', '💰 Durum Bazlı Gelir Dağılımı')}
        </View>
      )}
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
  },
  section: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'white',
    width: (width - 45) / 2,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  chartContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  barItem: {
    marginBottom: 15,
  },
  barLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bar: {
    height: 20,
    borderRadius: 10,
    marginRight: 10,
  },
  barValue: {
    fontSize: 12,
    color: '#333',
    fontWeight: 'bold',
  },
  pieItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  pieColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  pieLabel: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  pieValue: {
    fontSize: 12,
    color: '#666',
  },
  lawyerCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lawyerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  lawyerColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  lawyerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  lawyerStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  lawyerStat: {
    alignItems: 'center',
  },
  lawyerStatLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  lawyerStatValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default StatisticsScreen;
