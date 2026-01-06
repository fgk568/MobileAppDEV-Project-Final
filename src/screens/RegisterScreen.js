import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
  Button,
} from 'react-native';
import { useDatabase } from '../context/FirebaseDatabaseContext';

const AVAILABLE_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8C471', '#82E0AA', '#F1948A', '#D7BDE2', '#A8E6CF',
  '#FFB6C1', '#87CEEB', '#DEB887', '#F0E68C', '#FFA07A',
  '#20B2AA', '#FF6347', '#32CD32', '#FFD700', '#FF69B4',
  '#00CED1', '#FF1493', '#00FF7F', '#FF4500', '#8A2BE2'
];

const RegisterScreen = ({ navigation }) => {
  console.log('RegisterScreen render edildi');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const { db, isReady } = useDatabase();
  let emailInput, passwordInput, confirmPasswordInput;
  
  console.log('Database durumu:', { db, isReady });

  const handleRegister = async () => {
    console.log('Kayıt işlemi başlatıldı');
    console.log('Form verileri:', { name, email, password, confirmPassword, selectedColor });
    
    // Form validasyonu
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Hata', 'Şifreler eşleşmiyor');
      return;
    }

    if (!selectedColor) {
      Alert.alert('Hata', 'Lütfen bir renk seçin');
      return;
    }

    console.log('Validasyon geçildi');

    if (!isReady) {
      Alert.alert('Hata', 'Veritabanı henüz hazır değil');
      return;
    }

    try {
      // E-posta kontrolü
      const existingUser = await db.get('lawyers', email);

      if (existingUser) {
        Alert.alert('Hata', 'Bu e-posta adresi zaten kullanılıyor');
        return;
      }

      // Renk kontrolü - tüm avukatları kontrol et
      const allLawyers = await db.getAllAsync('lawyers');
      const existingColor = allLawyers.find(lawyer => lawyer.color === selectedColor);

      if (existingColor) {
        Alert.alert('Hata', 'Bu renk zaten başka bir avukat tarafından seçilmiş');
        return;
      }

      // Yeni avukat kaydı
      const newLawyer = {
        name,
        email,
        password,
        color: selectedColor,
        createdAt: new Date().toISOString()
      };

      await db.set('lawyers', email, newLawyer);

      console.log('Kayıt başarılı, giriş sayfasına yönlendiriliyor');
      // Direkt yönlendirme yap
      navigation.navigate('Login');

    } catch (error) {
      console.error('Register error:', error);
      Alert.alert('Hata', 'Kayıt sırasında bir hata oluştu');
    }
  };

  return (
    <ImageBackground 
      source={{ uri: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80' }} 
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.overlay}>
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.formContainer}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>⚖️</Text>
            </View>
          </View>
          <Text style={styles.title}>SY HUKUK</Text>
          <Text style={styles.subtitle}>Avukat Kayıt</Text>

          <TextInput
            style={styles.input}
            placeholder="Ad Soyad"
            value={name}
            onChangeText={setName}
            onSubmitEditing={() => emailInput.focus()}
            returnKeyType="next"
          />

          <TextInput
            ref={(input) => { emailInput = input; }}
            style={styles.input}
            placeholder="E-posta"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            onSubmitEditing={() => passwordInput.focus()}
            returnKeyType="next"
          />

          <TextInput
            ref={(input) => { passwordInput = input; }}
            style={styles.input}
            placeholder="Şifre"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            onSubmitEditing={() => confirmPasswordInput.focus()}
            returnKeyType="next"
          />

          <TextInput
            ref={(input) => { confirmPasswordInput = input; }}
            style={styles.input}
            placeholder="Şifre Tekrar"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            onSubmitEditing={handleRegister}
            returnKeyType="done"
          />

          <Text style={styles.colorLabel}>Renk Seçin:</Text>
          <View style={styles.colorContainer}>
            {AVAILABLE_COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorOption,
                  { backgroundColor: color },
                  selectedColor === color && styles.selectedColor
                ]}
                onPress={() => setSelectedColor(color)}
              />
            ))}
          </View>

          <Button 
            title="Kayıt Ol" 
            onPress={() => {
              console.log('Buton tıklandı!');
              handleRegister();
            }}
            color="#1976d2"
          />

          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginButtonText}>Zaten hesabınız var mı? Giriş yapın</Text>
          </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 30,
    paddingVertical: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4a9eff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4a9eff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    fontSize: 32,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#4a9eff',
    letterSpacing: 2,
    textShadowColor: '#4a9eff',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
    color: '#b8c5d1',
    fontWeight: '500',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#4a9eff',
    color: '#ffffff',
  },
  colorLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#ffffff',
  },
  colorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 30,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    margin: 5,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: '#1976d2',
    borderWidth: 3,
  },
  registerButton: {
    backgroundColor: '#1976d2',
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  registerButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginButton: {
    marginTop: 10,
  },
  loginButtonText: {
    color: '#4a9eff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default RegisterScreen;
