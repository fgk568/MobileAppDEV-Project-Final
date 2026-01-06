import React from 'react';
import { Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const WebCompatibleIcon = ({ name, size = 24, color = '#000', ...props }) => {
  if (Platform.OS === 'web') {
    // Web için Material Icons kullan
    return <MaterialIcons name={name} size={size} color={color} {...props} />;
  } else {
    // Mobil için react-native-vector-icons kullan
    const Icon = require('react-native-vector-icons/MaterialIcons').default;
    return <Icon name={name} size={size} color={color} {...props} />;
  }
};

export default WebCompatibleIcon;
