import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
} from 'react-native';
import WebCompatibleCalendar from '../components/WebCompatibleCalendar';
import { useDatabase } from '../context/FirebaseDatabaseContext';
import WebCompatibleIcon from '../components/WebCompatibleIcon';

const CalendarScreen = ({ navigation }) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [events, setEvents] = useState([]);
  const [lawyers, setLawyers] = useState([]);
  const [markedDates, setMarkedDates] = useState({});
  const [showMenu, setShowMenu] = useState(false);
  const { db, isReady } = useDatabase();

  useEffect(() => {
    if (isReady) {
      loadLawyers();
      loadEvents();
    }
  }, [isReady]);

  useEffect(() => {
    if (selectedDate) {
      loadEventsForDate(selectedDate);
    }
  }, [selectedDate]);

  const loadLawyers = async () => {
    try {
      const result = await db.getAllAsync('lawyers');
      setLawyers(result);
    } catch (error) {
      console.error('Error loading lawyers:', error);
    }
  };

  const loadEvents = async () => {
    try {
      const events = await db.getAllAsync('calendar_events');
      const lawyers = await db.getAllAsync('lawyers');
      
      // Event'leri lawyer bilgileri ile birleştir
      const result = events.map(event => {
        const lawyer = lawyers.find(l => l.id === event.lawyer_id);
        return {
          ...event,
          lawyer_name: lawyer?.name || 'Bilinmeyen',
          lawyer_color: lawyer?.color || '#000000'
        };
      }).sort((a, b) => {
        if (a.date === b.date) {
          return a.time.localeCompare(b.time);
        }
        return a.date.localeCompare(b.date);
      });
      
      setEvents(result);
      updateMarkedDates(result);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const loadEventsForDate = async (date) => {
    try {
      console.log('loadEventsForDate çağrıldı, date:', date);
      const events = await db.getAllAsync('calendar_events');
      const lawyers = await db.getAllAsync('lawyers');
      
      // Belirli tarihteki event'leri filtrele ve lawyer bilgileri ile birleştir
      const result = events
        .filter(event => {
          console.log('Event tarihi:', event.date, 'Seçilen tarih:', date);
          return event.date === date;
        })
        .map(event => {
          const lawyer = lawyers.find(l => l.id === event.lawyer_id);
          return {
            ...event,
            lawyer_name: lawyer?.name || 'Bilinmeyen',
            lawyer_color: lawyer?.color || '#000000'
          };
        })
        .sort((a, b) => a.time.localeCompare(b.time));
      
      setEvents(result);
    } catch (error) {
      console.error('Error loading events for date:', error);
    }
  };

  const updateMarkedDates = (eventsList) => {
    const marked = {};
    eventsList.forEach(event => {
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
      
      marked[event.date].dots.push({
        color: event.lawyer_color,
        selectedDotColor: event.lawyer_color
      });
    });
    setMarkedDates(marked);
  };

  const onDayPress = (day) => {
    console.log('CalendarScreen tıklandı:', day.dateString);
    console.log('Seçilen tarih:', day.dateString);
    setSelectedDate(day.dateString);
  };

  const renderEvent = ({ item }) => (
    <TouchableOpacity 
      style={[styles.eventItem, { borderLeftColor: item.lawyer_color }]}
      onPress={() => navigation.navigate('AddEvent', { event: item, isEdit: true })}
    >
      <View style={styles.eventHeader}>
        <Text style={styles.eventTitle}>{item.title}</Text>
        <View style={[styles.lawyerColor, { backgroundColor: item.lawyer_color }]} />
      </View>
      <Text style={styles.eventLawyer}>{item.lawyer_name}</Text>
      {item.time && <Text style={styles.eventTime}>{item.time}</Text>}
      {item.description && <Text style={styles.eventDescription}>{item.description}</Text>}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <WebCompatibleCalendar
        onDayPress={onDayPress}
        markedDates={{
          ...markedDates,
          [selectedDate]: {
            ...markedDates[selectedDate],
            selected: true,
            selectedColor: '#1976d2'
          }
        }}
        theme={{
          selectedDayBackgroundColor: '#1976d2',
          todayTextColor: '#1976d2',
          dayTextColor: '#2d4150',
          textDisabledColor: '#d9e1e8',
          dotColor: '#1976d2',
          selectedDotColor: '#ffffff',
          arrowColor: '#1976d2',
          monthTextColor: '#2d4150',
          indicatorColor: '#1976d2',
          textDayFontWeight: '300',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: '300',
          textDayFontSize: 16,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 13
        }}
      />
      
      <View style={styles.eventsContainer}>
        <View style={styles.eventsHeader}>
          <Text style={styles.eventsTitle}>
            {selectedDate ? `${selectedDate} Etkinlikleri` : 'Tüm Etkinlikler'}
          </Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => navigation.navigate('AddEvent')}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>
        
        <FlatList
          data={events}
          renderItem={renderEvent}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {selectedDate ? 'Bu tarihte etkinlik yok' : 'Henüz etkinlik eklenmemiş'}
            </Text>
          }
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  eventsContainer: {
    flex: 1,
    padding: 15,
  },
  eventsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  eventsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#1976d2',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  eventItem: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    borderLeftWidth: 4,
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
    marginBottom: 5,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  lawyerColor: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  eventLawyer: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  eventTime: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: 'bold',
  },
  eventDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 50,
  },
});

export default CalendarScreen;
