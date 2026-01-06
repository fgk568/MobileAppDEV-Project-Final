import React, { useState } from 'react';
import { Platform, View, Text, TouchableOpacity, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const WebCompatibleDateTimePicker = ({ 
  value, 
  mode = 'date', 
  display = 'default', 
  onChange, 
  ...props 
}) => {
  const [showPicker, setShowPicker] = useState(false);

  if (Platform.OS === 'web') {
    // Web için basit input kullan
    const handleDateChange = (event) => {
      const selectedDate = new Date(event.target.value);
      onChange({ nativeEvent: { timestamp: selectedDate.getTime() } }, selectedDate);
    };

    const formatDateForInput = (date) => {
      if (!date) return '';
      const d = new Date(date);
      return d.toISOString().split('T')[0];
    };

    const formatTimeForInput = (date) => {
      if (!date) return '';
      const d = new Date(date);
      return d.toTimeString().split(' ')[0].substring(0, 5);
    };

    if (mode === 'time') {
      return (
        <input
          type="time"
          value={formatTimeForInput(value)}
          onChange={handleDateChange}
          style={{
            padding: '8px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '16px',
            width: '100%'
          }}
          {...props}
        />
      );
    }

    return (
      <input
        type="date"
        value={formatDateForInput(value)}
        onChange={handleDateChange}
        style={{
          padding: '8px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          fontSize: '16px',
          width: '100%'
        }}
        {...props}
      />
    );
  } else {
    // Mobil için orijinal DateTimePicker kullan
    const DateTimePicker = require('@react-native-community/datetimepicker').default;
    return (
      <DateTimePicker
        value={value}
        mode={mode}
        display={display}
        onChange={onChange}
        {...props}
      />
    );
  }
};

export default WebCompatibleDateTimePicker;
