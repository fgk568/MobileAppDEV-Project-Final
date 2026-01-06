import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDatabase } from '../context/FirebaseDatabaseContext';
import { logLogin } from '../utils/logUtils';

const LoginScreen = ({ navigation }) => {
  console.log('LoginScreen render edildi');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { db, isReady } = useDatabase();
  let passwordInput;

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun');
      return;
    }

    if (!isReady) {
      Alert.alert('Hata', 'Veritabanı henüz hazır değil');
      return;
    }

    try {
      console.log('Giriş denemesi başlatıldı:', { email });
      
      // Firebase'den kullanıcıyı kontrol et
      const user = await db.get('lawyers', email);
      console.log('Kullanıcı bulundu:', user);

      if (user && user.password === password) {
        console.log('Giriş başarılı, ana sayfaya yönlendiriliyor');
        
        // Log kaydı
        await logLogin(db, email, {
          name: user.name,
          email: user.email
        });
        
        // Başarılı giriş - token'ı kaydet
        await AsyncStorage.setItem('userToken', 'authenticated');
        await AsyncStorage.setItem('userEmail', email);
        
        // Ana ekrana yönlendir
        navigation.replace('Main');
      } else {
        console.log('Giriş başarısız - kullanıcı bulunamadı veya şifre hatalı');
        Alert.alert('Hata', 'E-posta veya şifre hatalı');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Hata', 'Giriş yapılırken bir hata oluştu');
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
          <View style={styles.formContainer}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/images/logo.png')} 
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.title}>SY HUKUK</Text>
    

        <TextInput
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
          onSubmitEditing={handleLogin}
          returnKeyType="done"
        />

        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>Giriş Yap</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.registerButton}
          onPress={() => {
            console.log('Kayıt Ol butonuna tıklandı');
            navigation.navigate('Register');
          }}
        >
          <Text style={styles.registerButtonText}>Hesabınız yok mu? Kayıt olun</Text>
        </TouchableOpacity>
          </View>
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
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoText: {
    fontSize: 32,
  },
  logoImage: {
    width: 50,
    height: 50,
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
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
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
  loginButton: {
    backgroundColor: '#4a9eff',
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 10,
    shadowColor: '#4a9eff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loginButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerButton: {
    marginTop: 20,
  },
  registerButtonText: {
    color: '#4a9eff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default LoginScreen;
