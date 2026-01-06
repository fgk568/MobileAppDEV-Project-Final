import React, { useState } from 'react';
import { Platform, View, Text, TouchableOpacity, ScrollView } from 'react-native';

const WebCompatibleCalendar = ({ 
  onDayPress, 
  markedDates = {}, 
  current, 
  ...props 
}) => {
  const [selectedDate, setSelectedDate] = useState(current || new Date());

  if (Platform.OS === 'web') {
    // Web için basit HTML calendar kullan
    const today = new Date();
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    
    const monthNames = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];
    
    const dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
    
    const renderDays = () => {
      const days = [];
      
      // Boş günler
      for (let i = 0; i < firstDayOfMonth; i++) {
        days.push(<View key={`empty-${i}`} style={{ width: '14.28%', height: 40 }} />);
      }
      
      // Ayın günleri
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        // Timezone sorununu önlemek için manuel format
        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isToday = date.toDateString() === today.toDateString();
        const isMarked = markedDates[dateString];
        
        days.push(
          <TouchableOpacity
            key={day}
            style={{
              width: '14.28%',
              height: 40,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: isMarked ? '#4a9eff' : 'transparent',
              borderRadius: 4,
              margin: 1
            }}
            onPress={() => {
              setSelectedDate(date);
              if (onDayPress) {
                console.log('WebCompatibleCalendar tıklandı:', dateString);
                onDayPress({ dateString, day, month: month + 1, year });
              }
            }}
          >
            <Text style={{
              color: isMarked ? 'white' : (isToday ? '#4a9eff' : '#000'),
              fontWeight: isToday ? 'bold' : 'normal'
            }}>
              {day}
            </Text>
          </TouchableOpacity>
        );
      }
      
      return days;
    };

    const goToPreviousMonth = () => {
      setSelectedDate(new Date(year, month - 1, 1));
    };

    const goToNextMonth = () => {
      setSelectedDate(new Date(year, month + 1, 1));
    };

    return (
      <View style={{
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3
      }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16
        }}>
          <TouchableOpacity onPress={goToPreviousMonth}>
            <Text style={{ fontSize: 18, color: '#4a9eff' }}>‹</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
            {monthNames[month]} {year}
          </Text>
          <TouchableOpacity onPress={goToNextMonth}>
            <Text style={{ fontSize: 18, color: '#4a9eff' }}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Day names */}
        <View style={{ flexDirection: 'row', marginBottom: 8 }}>
          {dayNames.map(day => (
            <View key={day} style={{ width: '14.28%', alignItems: 'center' }}>
              <Text style={{ fontSize: 12, color: '#666', fontWeight: 'bold' }}>
                {day}
              </Text>
            </View>
          ))}
        </View>

        {/* Days */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {renderDays()}
        </View>
      </View>
    );
  } else {
    // Mobil için orijinal Calendar kullan
    const { Calendar } = require('react-native-calendars');
    return (
      <Calendar
        onDayPress={onDayPress}
        markedDates={markedDates}
        current={current}
        {...props}
      />
    );
  }
};

export default WebCompatibleCalendar;
