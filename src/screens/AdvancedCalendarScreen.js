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
  TextInput,
  Modal,
} from 'react-native';
import WebCompatibleIcon from '../components/WebCompatibleIcon';
import WebCompatibleCalendar from '../components/WebCompatibleCalendar';
import { useDatabase } from '../context/FirebaseDatabaseContext';
import { useFocusEffect } from '@react-navigation/native';
import { LocaleConfig } from 'react-native-calendars';

// Türkçe dil ayarları
LocaleConfig.locales['tr'] = {
  monthNames: [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ],
  monthNamesShort: [
    'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz',
    'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'
  ],
  dayNames: [
    'Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'
  ],
  dayNamesShort: ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'],
  today: 'Bugün'
};
LocaleConfig.defaultLocale = 'tr';

const EVENT_TYPES = [
  { id: 'Duruşma', name: 'Duruşma', color: '#f44336', icon: '⚖️' },
  { id: 'Toplantı', name: 'Toplantı', color: '#2196f3', icon: '🤝' },
  { id: 'Randevu', name: 'Müvekkil Randevusu', color: '#4caf50', icon: '👥' },
  { id: 'Dilekçe', name: 'Dilekçe', color: '#795548', icon: '📝' },
  { id: 'Arabulucuk', name: 'Arabulucuk', color: '#607d8b', icon: '📋' },
  { id: 'Genel', name: 'Genel', color: '#ff9800', icon: '📅' },
  { id: 'Önemli', name: 'Önemli', color: '#9c27b0', icon: '⭐' },
];

const AdvancedCalendarScreen = ({ navigation, route }) => {
  const [selectedDate, setSelectedDate] = useState(() => {
    // Bugünün tarihini doğru şekilde al
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [selectedDateEvents, setSelectedDateEvents] = useState([]);
  const [markedDates, setMarkedDates] = useState({});
  const [selectedType, setSelectedType] = useState('Tümü');
  const [searchText, setSearchText] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const { db, isReady } = useDatabase();

  useEffect(() => {
    if (isReady) {
      loadEvents();
    }
  }, [isReady]);

  useEffect(() => {
    filterEvents();
    loadSelectedDateEvents();
  }, [selectedType, searchText, events, selectedDate]);

  useEffect(() => {
    updateMarkedDates();
  }, [events]);

  // Ekran odaklandığında etkinlikleri yeniden yükle
  useFocusEffect(
    React.useCallback(() => {
      if (isReady) {
        loadEvents();
      }
    }, [isReady])
  );

  // Route parametrelerinden refresh kontrolü
  useEffect(() => {
    if (route.params?.refresh && isReady) {
      loadEvents();
      // Parametreyi temizle
      navigation.setParams({ refresh: undefined });
    }
  }, [route.params?.refresh, isReady]);

  const loadEvents = async () => {
    try {
      // Firebase'den etkinlikleri ve avukatları yükle
      const [eventsData, lawyers] = await Promise.all([
        db.getAllAsync('calendar_events'),
        db.getAllAsync('lawyers')
      ]);
      
      // Lawyer bilgilerini map'e çevir
      const lawyerMap = {};
      lawyers.forEach(lawyer => {
        lawyerMap[lawyer.id] = lawyer;
      });
      
      // Etkinlikleri avukat bilgileri ile birleştir
      const eventsWithLawyers = eventsData.map(event => ({
        ...event,
        lawyer_name: lawyerMap[event.lawyer_id]?.name || 'Bilinmeyen Avukat',
        lawyer_color: lawyerMap[event.lawyer_id]?.color || '#000000'
      }));
      
      // Tarih ve saate göre sırala
      const sortedEvents = eventsWithLawyers.sort((a, b) => {
        if (a.date === b.date) {
          return (a.time || '').localeCompare(b.time || '');
        }
        return a.date.localeCompare(b.date);
      });
      
      setEvents(sortedEvents);
    } catch (error) {
      console.error('Error loading events:', error);
      setEvents([]);
      Alert.alert('Hata', 'Etkinlikler yüklenirken bir hata oluştu');
    }
  };

  const loadSelectedDateEvents = () => {
    try {
      console.log('loadSelectedDateEvents çağrıldı, selectedDate:', selectedDate);
      // Seçilen güne ait etkinlikleri filtrele
      let selectedEvents = (events || []).filter(event => {
        if (!event || !event.date) return false;
        console.log('Event tarihi:', event.date, 'Seçilen tarih:', selectedDate);
        return event.date === selectedDate;
      });
      
      // Eğer bir tür seçiliyse, sadece o türdeki etkinlikleri göster
      if (selectedType !== 'Tümü') {
        selectedEvents = selectedEvents.filter(event => event && event.event_type === selectedType);
      }
      
      // Saat sırasına göre sırala (sabah erken saatler önce)
      const sortedEvents = selectedEvents.sort((a, b) => {
        if (!a.time && !b.time) return 0;
        if (!a.time) return 1;
        if (!b.time) return -1;
        
        // Saat formatını normalize et (HH:MM)
        const timeA = a.time.includes(':') ? a.time : a.time + ':00';
        const timeB = b.time.includes(':') ? b.time : b.time + ':00';
        
        return timeA.localeCompare(timeB);
      });
      
      setSelectedDateEvents(sortedEvents || []);
      
      // Debug için console log
      console.log(`Seçilen tarih: ${selectedDate}`);
      console.log(`Seçilen tür: ${selectedType}`);
      console.log(`Bu tarihte ${sortedEvents.length} etkinlik bulundu`);
      console.log('Etkinlikler:', sortedEvents.map(e => `${e.title} - ${e.time} - ${e.event_type}`));
    } catch (error) {
      console.error('Error loading selected date events:', error);
      setSelectedDateEvents([]);
    }
  };

  const filterEvents = () => {
    try {
      let filtered = events || [];

      // Tarih filtresi
      filtered = filtered.filter(event => event && event.date === selectedDate);

      // Tip filtresi
      if (selectedType !== 'Tümü') {
        filtered = filtered.filter(event => event && event.event_type === selectedType);
      }

      // Arama filtresi
      if (searchText.trim()) {
        filtered = filtered.filter(event =>
          event && event.title && event.title.toLowerCase().includes(searchText.toLowerCase()) ||
          (event && event.client_name && event.client_name.toLowerCase().includes(searchText.toLowerCase())) ||
          (event && event.description && event.description.toLowerCase().includes(searchText.toLowerCase()))
        );
      }

      setFilteredEvents(filtered || []);
    } catch (error) {
      console.error('Error filtering events:', error);
      setFilteredEvents([]);
    }
  };

  const updateMarkedDates = () => {
    const marked = {};
    
    // Seçili tarihi işaretle
    marked[selectedDate] = {
      selected: true,
      selectedColor: '#1976d2'
    };

    // Etkinlikleri işaretle - aynı güne birden fazla etkinlik eklenebilir
    events.forEach(event => {
      if (!marked[event.date]) {
        marked[event.date] = {
          marked: true,
          dots: []
        };
      }
      
      // dots array'ini kontrol et ve gerekirse oluştur
      if (!marked[event.date].dots) {
        marked[event.date].dots = [];
      }
      
      const eventType = EVENT_TYPES.find(type => type.id === event.event_type);
      const color = eventType ? eventType.color : '#666';
      
      // Her etkinlik için ayrı dot ekle
      marked[event.date].dots.push({
        color: color,
        selectedDotColor: color
      });
    });

    setMarkedDates(marked);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'Saat belirtilmemiş';
    return timeString;
  };

  const getEventTypeInfo = (eventType) => {
    return EVENT_TYPES.find(type => type.id === eventType) || EVENT_TYPES[3];
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Planlandı': return '#2196f3';
      case 'Tamamlandı': return '#4caf50';
      case 'İptal': return '#f44336';
      case 'Ertelendi': return '#ff9800';
      default: return '#666';
    }
  };

  const showEventDetails = (event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const closeEventModal = () => {
    setShowEventModal(false);
    setSelectedEvent(null);
  };

  const renderEvent = ({ item }) => {
    const eventTypeInfo = getEventTypeInfo(item.event_type);
    
    return (
      <TouchableOpacity
        style={styles.eventCard}
        onPress={() => navigation.navigate('EventDetail', { event: item })}
      >
        <View style={styles.eventHeader}>
          <View style={styles.eventTypeContainer}>
            <Text style={styles.eventIcon}>{eventTypeInfo.icon}</Text>
            <Text style={styles.eventType}>{eventTypeInfo.name}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
        
        <Text style={styles.eventTitle}>{item.title}</Text>
        
        {item.client_name && (
          <Text style={styles.eventClient}>👤 {item.client_name}</Text>
        )}
        
        {item.location && (
          <Text style={styles.eventLocation}>📍 {item.location}</Text>
        )}
        
        {item.description && (
          <Text style={styles.eventDescription}>{item.description}</Text>
        )}
        
        <View style={styles.eventFooter}>
          <View style={styles.timeContainer}>
            <Text style={styles.eventTime}>
              🕐 {formatTime(item.time)}
            </Text>
          </View>
          
          <View style={styles.lawyerInfo}>
            <View style={[styles.lawyerColor, { backgroundColor: item.lawyer_color }]} />
            <Text style={styles.lawyerName}>{item.lawyer_name}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📅 Gelişmiş Takvim</Text>
      </View>

      <FlatList
        data={[
          { type: 'calendar', id: 'calendar' },
          { type: 'filters', id: 'filters' },
          { type: 'dateHeader', id: 'dateHeader' },
          { type: 'selectedDateSection', id: 'selectedDateSection' },
          { type: 'search', id: 'search' },
          { type: 'filteredEvents', id: 'filteredEvents' }
        ]}
        renderItem={({ item }) => {
          switch (item.type) {
            case 'calendar':
              return (
                <WebCompatibleCalendar
                  onDayPress={(day) => {
                    console.log('Takvim tıklandı:', day.dateString);
                    // Timezone sorununu önlemek için tarihi doğru şekilde al
                    const dateStr = day.dateString;
                    console.log('Seçilen tarih:', dateStr);
                    setSelectedDate(dateStr);
                    loadSelectedDateEvents();
                  }}
                  markedDates={markedDates}
                  monthFormat={'MMMM yyyy'}
                  hideArrows={false}
                  hideExtraDays={true}
                  firstDay={1}
                  hideDayNames={false}
                  showWeekNumbers={false}
                  onPressArrowLeft={(subtractMonth) => subtractMonth()}
                  onPressArrowRight={(addMonth) => addMonth()}
                  locale="tr"
                  theme={{
                    selectedDayBackgroundColor: '#4a9eff',
                    selectedDayTextColor: 'white',
                    todayTextColor: '#4a9eff',
                    dayTextColor: '#ffffff',
                    textDisabledColor: '#8a9ba8',
                    dotColor: '#4a9eff',
                    selectedDotColor: 'white',
                    arrowColor: '#4a9eff',
                    monthTextColor: '#ffffff',
                    indicatorColor: '#4a9eff',
                    backgroundColor: '#1a1a2e',
                    calendarBackground: '#1a1a2e',
                    textSectionTitleColor: '#b8c5d1',
                  }}
                />
              );
            
            case 'filters':
              return (
                <View style={styles.filtersContainer}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <TouchableOpacity
                      style={[styles.filterButton, selectedType === 'Tümü' && styles.activeFilter]}
                      onPress={() => setSelectedType('Tümü')}
                    >
                      <Text style={[styles.filterText, selectedType === 'Tümü' && styles.activeFilterText]}>
                        Tümü
                      </Text>
                    </TouchableOpacity>
                    
                    {EVENT_TYPES.map((type) => (
                      <TouchableOpacity
                        key={type.id}
                        style={[styles.filterButton, selectedType === type.id && styles.activeFilter]}
                        onPress={() => setSelectedType(type.id)}
                      >
                        <Text style={[styles.filterText, selectedType === type.id && styles.activeFilterText]}>
                          {type.icon} {type.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              );
            
            case 'dateHeader':
              return (
                <View style={styles.dateHeader}>
                  <Text style={styles.dateText}>
                    {new Date(selectedDate).toLocaleDateString('tr-TR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Text>
                  <Text style={styles.eventCount}>
                    {selectedDateEvents.length} etkinlik
                  </Text>
                </View>
              );
            
            case 'selectedDateSection':
              return (
                <View style={styles.selectedDateSection}>
                  <View style={styles.selectedDateHeader}>
                    <View style={styles.selectedDateTitleContainer}>
                      <Text style={styles.selectedDateTitle}>
                        📅 {new Date(selectedDate).toLocaleDateString('tr-TR', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </Text>
                      <Text style={styles.selectedDateCount}>
                        {selectedDateEvents.length} etkinlik
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.addEventToDateButton}
                      onPress={() => navigation.navigate('AddEvent', { selectedDate: selectedDate })}
                    >
                      <WebCompatibleIcon name="add" size={20} color="#4a9eff" />
                      <Text style={styles.addEventToDateButtonText}>Etkinlik Ekle</Text>
                    </TouchableOpacity>
                  </View>
                  
                  {selectedDateEvents.length > 0 ? (
                    <View>
                      {selectedDateEvents.map((event, index) => (
                        <TouchableOpacity
                          key={event?.id?.toString() || index.toString()}
                          style={styles.selectedDateEventCard}
                          onPress={() => showEventDetails(event)}
                        >
                          <View style={styles.selectedDateEventHeader}>
                            <View style={styles.selectedDateEventTypeContainer}>
                              <Text style={styles.selectedDateEventIcon}>
                                {getEventTypeInfo(event.event_type).icon}
                              </Text>
                              <Text style={styles.selectedDateEventType}>
                                {getEventTypeInfo(event.event_type).name}
                              </Text>
                            </View>
                            <View style={[styles.selectedDateStatusBadge, { backgroundColor: getStatusColor(event.status) }]}>
                              <Text style={styles.selectedDateStatusText}>{event.status}</Text>
                            </View>
                          </View>
                          
                          <Text style={styles.selectedDateEventTitle}>{event.title}</Text>
                          
                          {event.client_name && (
                            <Text style={styles.selectedDateEventClient}>👤 {event.client_name}</Text>
                          )}
                          
                          {event.location && (
                            <Text style={styles.selectedDateEventLocation}>📍 {event.location}</Text>
                          )}
                          
                          <View style={styles.selectedDateEventFooter}>
                            <Text style={styles.selectedDateEventTime}>
                              🕐 {formatTime(event.time)}
                            </Text>
                            <View style={styles.selectedDateLawyerInfo}>
                              <View style={[styles.selectedDateLawyerColor, { backgroundColor: event.lawyer_color }]} />
                              <Text style={styles.selectedDateLawyerName}>{event.lawyer_name}</Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : (
                    <View style={styles.noEventsContainer}>
                      <Text style={styles.noEventsText}>
                        Bu tarihte etkinlik bulunmuyor
                      </Text>
                      <TouchableOpacity
                        style={styles.addEventButton}
                        onPress={() => navigation.navigate('AddEvent', { selectedDate: selectedDate })}
                      >
                        <Text style={styles.addEventButtonText}>+ Etkinlik Ekle</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            
            case 'search':
              return (
                <View style={styles.searchContainer}>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="🔍 Etkinlik ara..."
                    placeholderTextColor="#8a9ba8"
                    value={searchText}
                    onChangeText={setSearchText}
                  />
                </View>
              );
            
            case 'filteredEvents':
              return (
                <View style={styles.filteredEventsSection}>
                  <Text style={styles.filteredEventsTitle}>Filtrelenmiş Etkinlikler</Text>
                  {filteredEvents.length > 0 ? (
                    <View>
                      {filteredEvents.map((event, index) => (
                        <View key={event?.id?.toString() || index.toString()}>
                          {renderEvent({ item: event })}
                        </View>
                      ))}
                    </View>
                  ) : (
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>Bu tarihte etkinlik bulunmuyor</Text>
                      <TouchableOpacity
                        style={styles.emptyButton}
                        onPress={() => navigation.navigate('AddEvent')}
                      >
                        <Text style={styles.emptyButtonText}>Etkinlik Ekle</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            
            default:
              return null;
          }
        }}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => navigation.navigate('AddEvent', { selectedDate: selectedDate })}
      >
        <WebCompatibleIcon name="add" size={24} color="white" />
      </TouchableOpacity>

      {/* Etkinlik Detay Modal */}
      <Modal
        visible={showEventModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeEventModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.eventModalContainer}>
            {selectedEvent && (
              <>
                <View style={styles.eventModalHeader}>
                  <Text style={styles.eventModalTitle}>Etkinlik Detayı</Text>
                  <TouchableOpacity onPress={closeEventModal}>
                    <WebCompatibleIcon name="close" size={24} color="#4a9eff" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.eventModalContent}>
                  <View style={styles.eventDetailSection}>
                    <Text style={styles.eventDetailLabel}>Etkinlik Türü:</Text>
                    <View style={styles.eventDetailRow}>
                      <Text style={styles.eventDetailIcon}>
                        {getEventTypeInfo(selectedEvent.event_type).icon}
                      </Text>
                      <Text style={styles.eventDetailValue}>
                        {getEventTypeInfo(selectedEvent.event_type).name}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.eventDetailSection}>
                    <Text style={styles.eventDetailLabel}>Başlık:</Text>
                    <Text style={styles.eventDetailValue}>{selectedEvent.title}</Text>
                  </View>

                  {selectedEvent.description && (
                    <View style={styles.eventDetailSection}>
                      <Text style={styles.eventDetailLabel}>Açıklama:</Text>
                      <Text style={styles.eventDetailValue}>{selectedEvent.description}</Text>
                    </View>
                  )}

                  <View style={styles.eventDetailSection}>
                    <Text style={styles.eventDetailLabel}>Tarih:</Text>
                    <Text style={styles.eventDetailValue}>
                      {new Date(selectedEvent.date).toLocaleDateString('tr-TR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </Text>
                  </View>

                  {selectedEvent.time && (
                    <View style={styles.eventDetailSection}>
                      <Text style={styles.eventDetailLabel}>Saat:</Text>
                      <Text style={styles.eventDetailValue}>{selectedEvent.time}</Text>
                    </View>
                  )}

                  {selectedEvent.location && (
                    <View style={styles.eventDetailSection}>
                      <Text style={styles.eventDetailLabel}>Konum:</Text>
                      <Text style={styles.eventDetailValue}>📍 {selectedEvent.location}</Text>
                    </View>
                  )}

                  {selectedEvent.client_name && (
                    <View style={styles.eventDetailSection}>
                      <Text style={styles.eventDetailLabel}>Müvekkil:</Text>
                      <Text style={styles.eventDetailValue}>👤 {selectedEvent.client_name}</Text>
                    </View>
                  )}

                  {selectedEvent.case_number && (
                    <View style={styles.eventDetailSection}>
                      <Text style={styles.eventDetailLabel}>Dosya No:</Text>
                      <Text style={styles.eventDetailValue}>{selectedEvent.case_number}</Text>
                    </View>
                  )}

                  <View style={styles.eventDetailSection}>
                    <Text style={styles.eventDetailLabel}>Durum:</Text>
                    <View style={[styles.eventDetailStatus, { backgroundColor: getStatusColor(selectedEvent.status) }]}>
                      <Text style={styles.eventDetailStatusText}>{selectedEvent.status}</Text>
                    </View>
                  </View>

                  {selectedEvent.lawyer_name && (
                    <View style={styles.eventDetailSection}>
                      <Text style={styles.eventDetailLabel}>Sorumlu Avukat:</Text>
                      <View style={styles.eventDetailLawyer}>
                        <View style={[styles.eventDetailLawyerColor, { backgroundColor: selectedEvent.lawyer_color }]} />
                        <Text style={styles.eventDetailValue}>{selectedEvent.lawyer_name}</Text>
                      </View>
                    </View>
                  )}

                  {selectedEvent.is_reminder && (
                    <View style={styles.eventDetailSection}>
                      <Text style={styles.eventDetailLabel}>Hatırlatıcı:</Text>
                      <Text style={styles.eventDetailValue}>
                        🔔 {selectedEvent.reminder_time || 'Hatırlatıcı aktif'}
                      </Text>
                    </View>
                  )}
                </ScrollView>

                <View style={styles.eventModalFooter}>
                  <TouchableOpacity
                    style={styles.eventModalButton}
                    onPress={() => {
                      closeEventModal();
                      navigation.navigate('EventDetail', { event: selectedEvent });
                    }}
                  >
                    <Text style={styles.eventModalButtonText}>Detaylı Görünüm</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
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
  scrollContent: {
    paddingBottom: 100, // Floating button için boşluk
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
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
  filtersContainer: {
    backgroundColor: '#1e1e2e',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d3d',
  },
  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginHorizontal: 5,
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
  searchContainer: {
    backgroundColor: '#1a1a2e',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d3d',
  },
  searchInput: {
    backgroundColor: '#2d2d3d',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#4a9eff',
    shadowColor: '#4a9eff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#1e1e2e',
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d3d',
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  eventCount: {
    fontSize: 14,
    color: '#4a9eff',
    fontWeight: 'bold',
  },
  eventsList: {
    padding: 15,
  },
  eventCard: {
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
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  eventTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  eventType: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
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
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  eventClient: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  eventLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  eventDescription: {
    fontSize: 14,
    color: '#333',
    marginBottom: 10,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventTime: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: 'bold',
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
  // Seçilen güne ait etkinlikler stilleri
  selectedDateSection: {
    backgroundColor: '#1a1a2e',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d3d',
  },
  selectedDateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  selectedDateTitleContainer: {
    flex: 1,
  },
  selectedDateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  selectedDateCount: {
    fontSize: 14,
    color: '#4a9eff',
    fontWeight: 'bold',
    marginTop: 2,
  },
  addEventToDateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 158, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4a9eff',
    shadowColor: '#4a9eff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addEventToDateButtonText: {
    color: '#4a9eff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  selectedDateEventsList: {
    // maxHeight kaldırıldı - artık sınırsız yükseklik
  },
  selectedDateEventCard: {
    backgroundColor: '#2d2d3d',
    padding: 15,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3d3d4d',
    shadowColor: '#4a9eff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedDateEventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  selectedDateEventTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedDateEventIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  selectedDateEventType: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  selectedDateStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  selectedDateStatusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  selectedDateEventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  selectedDateEventClient: {
    fontSize: 14,
    color: '#b8c5d1',
    marginBottom: 4,
  },
  selectedDateEventLocation: {
    fontSize: 14,
    color: '#b8c5d1',
    marginBottom: 10,
  },
  selectedDateEventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedDateEventTime: {
    fontSize: 14,
    color: '#4a9eff',
    fontWeight: 'bold',
  },
  selectedDateLawyerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedDateLawyerColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  selectedDateLawyerName: {
    fontSize: 12,
    color: '#8a9ba8',
  },
  filteredEventsSection: {
    // flex: 1 kaldırıldı - ScrollView içinde otomatik boyutlanacak
  },
  filteredEventsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    padding: 15,
    backgroundColor: '#1a1a2e',
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d3d',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#4a9eff',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4a9eff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  // Modal stilleri
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventModalContainer: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: '#2d2d3d',
    shadowColor: '#4a9eff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  eventModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d3d',
  },
  eventModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  eventModalContent: {
    maxHeight: 400,
    padding: 20,
  },
  eventDetailSection: {
    marginBottom: 15,
  },
  eventDetailLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4a9eff',
    marginBottom: 5,
  },
  eventDetailValue: {
    fontSize: 16,
    color: '#ffffff',
    lineHeight: 22,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventDetailIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  eventDetailStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    alignSelf: 'flex-start',
  },
  eventDetailStatusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  eventDetailLawyer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventDetailLawyerColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  eventModalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#2d2d3d',
  },
  eventModalButton: {
    backgroundColor: '#4a9eff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  eventModalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Etkinlik yoksa gösterilecek stiller
  noEventsContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#2d2d3d',
    borderRadius: 12,
    marginTop: 10,
  },
  noEventsText: {
    color: '#b8c5d1',
    fontSize: 16,
    marginBottom: 15,
    textAlign: 'center',
  },
  addEventButton: {
    backgroundColor: '#4a9eff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    shadowColor: '#4a9eff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addEventButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default AdvancedCalendarScreen;
