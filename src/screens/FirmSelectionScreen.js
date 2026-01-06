import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { getAllFirms, getFirmConfig } from '../config/firms';
import { useMultiDatabase } from '../context/MultiDatabaseContext';

const FirmSelectionScreen = ({ navigation }) => {
  const [firms, setFirms] = useState([]);
  const [selectedFirm, setSelectedFirm] = useState(null);
  const { switchFirm, isReady } = useMultiDatabase();

  useEffect(() => {
    // Tüm büroları yükle
    const allFirms = getAllFirms();
    setFirms(allFirms);
    
    // Varsayılan büroyu seç
    if (allFirms.length > 0) {
      setSelectedFirm(allFirms[0]);
    }
  }, []);

  const handleFirmSelect = (firm) => {
    setSelectedFirm(firm);
  };

  const handleContinue = async () => {
    if (!selectedFirm) {
      Alert.alert('Uyarı', 'Lütfen bir büro seçin');
      return;
    }

    try {
      // Seçilen büroya geç
      await switchFirm(selectedFirm.id);
      
      // Login ekranına yönlendir
      navigation.navigate('Login');
    } catch (error) {
      console.error('Error switching firm:', error);
      Alert.alert('Hata', 'Büro değiştirilirken bir hata oluştu');
    }
  };

  const renderFirmCard = (firm) => {
    const isSelected = selectedFirm?.id === firm.id;
    
    return (
      <TouchableOpacity
        key={firm.id}
        style={[
          styles.firmCard,
          isSelected && styles.selectedFirmCard
        ]}
        onPress={() => handleFirmSelect(firm)}
      >
        <View style={styles.firmHeader}>
          <View style={[styles.logoContainer, { backgroundColor: firm.primaryColor }]}>
            <Text style={styles.logoText}>{firm.shortName}</Text>
          </View>
          <View style={styles.firmInfo}>
            <Text style={styles.firmName}>{firm.name}</Text>
            <Text style={styles.firmDescription}>{firm.description}</Text>
          </View>
        </View>
        
        <View style={styles.firmFeatures}>
          <Text style={styles.featuresTitle}>Özellikler:</Text>
          <View style={styles.featuresList}>
            {firm.features.map((feature, index) => (
              <Text key={index} style={styles.featureItem}>
                • {getFeatureName(feature)}
              </Text>
            ))}
          </View>
        </View>
        
        <View style={styles.firmColors}>
          <View style={[styles.colorDot, { backgroundColor: firm.primaryColor }]} />
          <View style={[styles.colorDot, { backgroundColor: firm.secondaryColor }]} />
          <View style={[styles.colorDot, { backgroundColor: firm.accentColor }]} />
        </View>
      </TouchableOpacity>
    );
  };

  const getFeatureName = (feature) => {
    const featureNames = {
      'calendar': 'Takvim',
      'cases': 'Dosyalar',
      'clients': 'Müvekkiller',
      'chat': 'Chat',
      'financial': 'Mali İşler'
    };
    return featureNames[feature] || feature;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Büro Seçimi</Text>
        <Text style={styles.subtitle}>Çalışmak istediğiniz büroyu seçin</Text>
      </View>

      <ScrollView style={styles.scrollContainer}>
        <View style={styles.firmsList}>
          {firms.map(renderFirmCard)}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedFirm && styles.disabledButton
          ]}
          onPress={handleContinue}
          disabled={!selectedFirm || !isReady}
        >
          <Text style={styles.continueButtonText}>
            {isReady ? 'Devam Et' : 'Yükleniyor...'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#1a1a2e',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
  },
  scrollContainer: {
    flex: 1,
    padding: 20,
  },
  firmsList: {
    gap: 15,
  },
  firmCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedFirmCard: {
    borderColor: '#4a9eff',
    shadowColor: '#4a9eff',
    shadowOpacity: 0.3,
  },
  firmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  logoText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  firmInfo: {
    flex: 1,
  },
  firmName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  firmDescription: {
    fontSize: 14,
    color: '#666',
  },
  firmFeatures: {
    marginBottom: 15,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  featuresList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  featureItem: {
    fontSize: 14,
    color: '#666',
    marginRight: 15,
    marginBottom: 4,
  },
  firmColors: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 8,
  },
  footer: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  continueButton: {
    backgroundColor: '#4a9eff',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default FirmSelectionScreen;
