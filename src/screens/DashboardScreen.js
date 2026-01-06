import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import { useDatabase } from '../context/FirebaseDatabaseContext';
import WebCompatibleIcon from '../components/WebCompatibleIcon';

const DashboardScreen = ({ navigation }) => {
  const [stats, setStats] = useState({
    totalCases: 0,
    openCases: 0,
    closedCases: 0,
    totalRevenue: 0,
    pendingRevenue: 0,
    monthlyRevenue: 0,
    casesThisMonth: 0,
  });
  const [recentCases, setRecentCases] = useState([]);
  const [recentEvents, setRecentEvents] = useState([]);
  const [upcomingHearings, setUpcomingHearings] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const { db, isReady } = useDatabase();

  useEffect(() => {
    if (isReady) {
      loadDashboardData();
    }
  }, [isReady]);

  const loadDashboardData = async () => {
    try {
      // Firebase'den verileri yükle
      const [cases, lawyers, events] = await Promise.all([
        db.getAllAsync('cases'),
        db.getAllAsync('lawyers'),
        db.getAllAsync('calendar_events')
      ]);

      // Lawyer bilgilerini map'e çevir
      const lawyerMap = {};
      lawyers.forEach(lawyer => {
        lawyerMap[lawyer.id] = lawyer;
      });

      // Toplam dosya sayısı
      const totalCases = cases.length;

      // Açık dosyalar
      const openCases = cases.filter(c => c.status !== 'Kapalı').length;

      // Kapalı dosyalar
      const closedCases = totalCases - openCases;

      // Toplam gelir
      const totalRevenue = cases.reduce((sum, c) => sum + (parseFloat(c.total_fee) || 0), 0);

      // Bekleyen gelir
      const pendingRevenue = cases.reduce((sum, c) => sum + (parseFloat(c.remaining_fee) || 0), 0);

      // Bu ayki gelir
      const currentMonth = new Date().toISOString().slice(0, 7);
      const monthlyRevenue = cases
        .filter(c => c.created_at && c.created_at.startsWith(currentMonth))
        .reduce((sum, c) => sum + (parseFloat(c.paid_fee) || 0), 0);

      // Bu ayki dosya sayısı
      const casesThisMonth = cases.filter(c => c.created_at && c.created_at.startsWith(currentMonth)).length;

      setStats({
        totalCases,
        openCases,
        closedCases,
        totalRevenue,
        pendingRevenue,
        monthlyRevenue,
        casesThisMonth,
      });

      // Son dosyalar - lawyer bilgileri ile birleştir
      const recentCasesData = cases
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5)
        .map(c => ({
          ...c,
          lawyer_name: lawyerMap[c.lawyer_id]?.name || 'Bilinmeyen',
          lawyer_color: lawyerMap[c.lawyer_id]?.color || '#000000'
        }));
      setRecentCases(recentCasesData);

      // Son etkinlikler - lawyer bilgileri ile birleştir
      const recentEventsData = events
        .sort((a, b) => {
          if (a.date === b.date) {
            return b.time.localeCompare(a.time);
          }
          return b.date.localeCompare(a.date);
        })
        .slice(0, 5)
        .map(e => ({
          ...e,
          lawyer_name: lawyerMap[e.lawyer_id]?.name || 'Bilinmeyen',
          lawyer_color: lawyerMap[e.lawyer_id]?.color || '#000000'
        }));
      setRecentEvents(recentEventsData);

      // 1 haftalık tüm işler (sadece duruşma değil, tüm etkinlikler)
      const oneWeekFromNow = new Date();
      oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
      const oneWeekFromNowStr = oneWeekFromNow.toISOString().split('T')[0];
      const todayStr = new Date().toISOString().split('T')[0];

      const upcomingHearingsData = events
        .filter(e => e.date >= todayStr && e.date <= oneWeekFromNowStr)
        .sort((a, b) => {
          if (a.date === b.date) {
            return a.time.localeCompare(b.time);
          }
          return a.date.localeCompare(b.date);
        })
        .slice(0, 10)
        .map(e => ({
          ...e,
          lawyer_name: lawyerMap[e.lawyer_id]?.name || 'Bilinmeyen',
          lawyer_color: lawyerMap[e.lawyer_id]?.color || '#000000'
        }));
      setUpcomingHearings(upcomingHearingsData);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Hata', 'Dashboard verileri yüklenirken bir hata oluştu');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Açık': return '#4caf50';
      case 'Devam Ediyor': return '#ff9800';
      case 'Kapalı': return '#f44336';
      default: return '#666';
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Floating Menu Button */}
      <TouchableOpacity 
        style={styles.floatingMenuButton}
        onPress={() => setShowMenu(true)}
      >
        <WebCompatibleIcon name="menu" size={24} color="#4a9eff" />
      </TouchableOpacity>

      {/* İstatistik Kartları */}
      <View style={styles.statsContainer}>
        <View style={styles.statRow}>
          <View style={[styles.statCard, { backgroundColor: '#4caf50' }]}>
            <Text style={styles.statNumber}>{stats.totalCases}</Text>
            <Text style={styles.statLabel}>Toplam Dosya</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#ff9800' }]}>
            <Text style={styles.statNumber}>{stats.openCases}</Text>
            <Text style={styles.statLabel}>Açık Dosya</Text>
          </View>
        </View>

        <View style={styles.statRow}>
          <View style={[styles.statCard, { backgroundColor: '#f44336' }]}>
            <Text style={styles.statNumber}>{stats.closedCases}</Text>
            <Text style={styles.statLabel}>Kapalı Dosya</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#2196f3' }]}>
            <Text style={styles.statNumber}>{stats.casesThisMonth}</Text>
            <Text style={styles.statLabel}>Bu Ay</Text>
          </View>
        </View>
      </View>

      {/* Gelir Bilgileri */}
      <View style={styles.revenueSection}>
        <Text style={styles.sectionTitle}>💰 Gelir Bilgileri</Text>
        <View style={styles.revenueCard}>
          <View style={styles.revenueRow}>
            <Text style={styles.revenueLabel}>Toplam Gelir:</Text>
            <Text style={styles.revenueValue}>{formatCurrency(stats.totalRevenue)}</Text>
          </View>
          <View style={styles.revenueRow}>
            <Text style={styles.revenueLabel}>Bekleyen Gelir:</Text>
            <Text style={[styles.revenueValue, { color: '#f44336' }]}>
              {formatCurrency(stats.pendingRevenue)}
            </Text>
          </View>
          <View style={styles.revenueRow}>
            <Text style={styles.revenueLabel}>Bu Ayki Gelir:</Text>
            <Text style={[styles.revenueValue, { color: '#4caf50' }]}>
              {formatCurrency(stats.monthlyRevenue)}
            </Text>
          </View>
        </View>
      </View>

      {/* Son Davalar */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📋 Son Dosyalar</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Cases')}>
            <Text style={styles.seeAllText}>Tümünü Gör</Text>
          </TouchableOpacity>
        </View>
        {recentCases.map((caseItem) => (
          <View key={caseItem.id} style={styles.caseItem}>
            <View style={styles.caseHeader}>
              <Text style={styles.caseTitle}>{caseItem.title}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(caseItem.status) }]}>
                <Text style={styles.statusText}>{caseItem.status}</Text>
              </View>
            </View>
            <Text style={styles.caseClient}>Müvekkil: {caseItem.client_name}</Text>
            <View style={styles.caseFooter}>
              <View style={styles.lawyerInfo}>
                <View style={[styles.lawyerColor, { backgroundColor: caseItem.lawyer_color }]} />
                <Text style={styles.lawyerName}>{caseItem.lawyer_name}</Text>
              </View>
              <Text style={styles.caseDate}>
                {new Date(caseItem.created_at).toLocaleDateString('tr-TR')}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Son Etkinlikler */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📅 Son Etkinlikler</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Calendar')}>
            <Text style={styles.seeAllText}>Tümünü Gör</Text>
          </TouchableOpacity>
        </View>
        {recentEvents.map((event) => (
          <View key={event.id} style={styles.eventItem}>
            <View style={styles.eventHeader}>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <View style={[styles.eventColor, { backgroundColor: event.lawyer_color }]} />
            </View>
            <Text style={styles.eventDescription}>{event.description}</Text>
            <View style={styles.eventFooter}>
              <Text style={styles.eventDate}>
                {new Date(event.date).toLocaleDateString('tr-TR')} - {event.time}
              </Text>
              <Text style={styles.eventLawyer}>{event.lawyer_name}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* 1 Haftalık İşler */}
      {upcomingHearings.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📅 1 Haftalık İşler</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Calendar')}>
              <Text style={styles.seeAllText}>Tümünü Gör</Text>
            </TouchableOpacity>
          </View>
          {upcomingHearings.map((hearing) => (
            <View key={hearing.id} style={styles.hearingItem}>
              <View style={styles.hearingHeader}>
                <Text style={styles.hearingTitle}>{hearing.title}</Text>
                <View style={[styles.hearingColor, { backgroundColor: hearing.lawyer_color }]} />
              </View>
              <Text style={styles.hearingDescription}>{hearing.description}</Text>
              <View style={styles.hearingFooter}>
                <Text style={styles.hearingDate}>
                  {new Date(hearing.date).toLocaleDateString('tr-TR')} - {hearing.time}
                </Text>
                <Text style={styles.hearingLawyer}>{hearing.lawyer_name}</Text>
              </View>
              {hearing.location && (
                <Text style={styles.hearingLocation}>📍 {hearing.location}</Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Hamburger Menü Modal */}
      <Modal
        visible={showMenu}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMenu(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.menuContainer}>
            <View style={styles.menuHeader}>
              <Text style={styles.menuTitle}>Menü</Text>
              <TouchableOpacity onPress={() => setShowMenu(false)}>
                <WebCompatibleIcon name="close" size={24} color="#4a9eff" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.menuItems}>
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => {
                  setShowMenu(false);
                  navigation.navigate('Clients');
                }}
              >
                <WebCompatibleIcon name="people" size={24} color="#4a9eff" />
                <Text style={styles.menuItemText}>Müvekkiller</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => {
                  setShowMenu(false);
                  navigation.navigate('Financial');
                }}
              >
                <WebCompatibleIcon name="account-balance-wallet" size={24} color="#4a9eff" />
                <Text style={styles.menuItemText}>Finansal Yönetim</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => {
                  setShowMenu(false);
                  navigation.navigate('Notifications');
                }}
              >
                <WebCompatibleIcon name="notifications" size={24} color="#4a9eff" />
                <Text style={styles.menuItemText}>Bildirimler</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => {
                  setShowMenu(false);
                  navigation.navigate('Search');
                }}
              >
                <WebCompatibleIcon name="search" size={24} color="#4a9eff" />
                <Text style={styles.menuItemText}>Arama</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => {
                  setShowMenu(false);
                  navigation.navigate('Documents');
                }}
              >
                <WebCompatibleIcon name="folder" size={24} color="#4a9eff" />
                <Text style={styles.menuItemText}>Dokümanlar</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => {
                  setShowMenu(false);
                  navigation.navigate('Sync');
                }}
              >
                <WebCompatibleIcon name="sync" size={24} color="#4a9eff" />
                <Text style={styles.menuItemText}>Senkronizasyon</Text>
              </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => {
          setShowMenu(false);
          navigation.navigate('EDevletIntegration');
        }}
      >
        <WebCompatibleIcon name="account-balance" size={24} color="#4a9eff" />
        <Text style={styles.menuItemText}>E-Devlet Entegrasyonu</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => {
          setShowMenu(false);
          navigation.navigate('Chat');
        }}
      >
        <WebCompatibleIcon name="chat" size={24} color="#4a9eff" />
        <Text style={styles.menuItemText}>Kullanıcılar</Text>
      </TouchableOpacity>

              <TouchableOpacity
        style={styles.menuItem}
        onPress={() => {
          setShowMenu(false);
          navigation.navigate('Log');
        }}
      >
        <WebCompatibleIcon name="history" size={24} color="#4a9eff" />
        <Text style={styles.menuItemText}>Aktivite Logları</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => {
          setShowMenu(false);
          navigation.navigate('NotificationSettings');
        }}
      >
        <WebCompatibleIcon name="notifications-active" size={24} color="#4a9eff" />
        <Text style={styles.menuItemText}>Bildirim Ayarları</Text>
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
    backgroundColor: '#0a0a0a',
  },
  floatingMenuButton: {
    position: 'absolute',
    top: 50,
    right: 20,
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
      header: {
        backgroundColor: '#1a1a2e',
        padding: 20,
        paddingTop: 40,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#16213e',
      },
      headerContent: {
        flex: 1,
        alignItems: 'center',
      },
      menuButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: 'rgba(74, 158, 255, 0.1)',
      },
      title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 8,
        textShadowColor: '#4a9eff',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
      },
      subtitle: {
        fontSize: 16,
        color: '#b8c5d1',
        fontWeight: '500',
      },
  statsContainer: {
    padding: 15,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
      statCard: {
        flex: 1,
        marginHorizontal: 5,
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
        backgroundColor: '#1e1e2e',
        borderWidth: 1,
        borderColor: '#2d2d3d',
        shadowColor: '#4a9eff',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      },
      statNumber: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 8,
        textShadowColor: '#4a9eff',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
      },
      statLabel: {
        fontSize: 14,
        color: '#b8c5d1',
        textAlign: 'center',
        fontWeight: '500',
      },
  revenueSection: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 15,
    textShadowColor: '#4a9eff',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
      revenueCard: {
        backgroundColor: '#1e1e2e',
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#2d2d3d',
        shadowColor: '#4a9eff',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
      },
      revenueRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
        paddingVertical: 4,
      },
      revenueLabel: {
        fontSize: 16,
        color: '#b8c5d1',
        fontWeight: '500',
      },
      revenueValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#ffffff',
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
  seeAllText: {
    color: '#4a9eff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  caseItem: {
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
  caseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  caseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
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
  caseClient: {
    fontSize: 14,
    color: '#b8c5d1',
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
    color: '#b8c5d1',
  },
  caseDate: {
    fontSize: 12,
    color: '#8a9ba8',
  },
  eventItem: {
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
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
  },
  eventColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  eventDescription: {
    fontSize: 14,
    color: '#b8c5d1',
    marginBottom: 8,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventDate: {
    fontSize: 12,
    color: '#8a9ba8',
  },
  eventLawyer: {
    fontSize: 12,
    color: '#b8c5d1',
  },
  hearingItem: {
    backgroundColor: '#1e1e2e',
    padding: 15,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2d2d3d',
    shadowColor: '#f44336',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  hearingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  hearingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
  },
  hearingColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: 8,
  },
  hearingDescription: {
    fontSize: 14,
    color: '#b8c5d1',
    marginBottom: 10,
    lineHeight: 20,
  },
  hearingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hearingDate: {
    fontSize: 12,
    color: '#f44336',
    fontWeight: 'bold',
  },
  hearingLawyer: {
    fontSize: 12,
    color: '#8a9ba8',
  },
  hearingLocation: {
    fontSize: 12,
    color: '#4a9eff',
    marginTop: 8,
    fontStyle: 'italic',
  },
  // Menü Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d3d',
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  menuItems: {
    paddingTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d3d',
  },
  menuItemText: {
    fontSize: 16,
    color: '#ffffff',
    marginLeft: 15,
    fontWeight: '500',
  },
});

export default DashboardScreen;
