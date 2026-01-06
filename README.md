<div align="center">

# ⚖️ SY HUKUK Mobil Uygulaması

Geliştirici: Fehmi Göktuğ Katırcılar

### *Modern Avukatlık Ofisi Yönetim Sistemi*

[![React Native](https://img.shields.io/badge/React%20Native-0.81.4-61DAFB?style=for-the-badge&logo=react)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-~54.0.0-000020?style=for-the-badge&logo=expo)](https://expo.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-10.7.1-FFCA28?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/License-Private-red?style=for-the-badge)](LICENSE)

**Avukatlar için tasarlanmış, kapsamlı ve kullanıcı dostu mobil ofis yönetim platformu**

[Özellikler](#-temel-özellikler) • [Kurulum](#-kurulum) • [Teknolojiler](#-teknolojiler) • [Mimari](#-mimari) • [Ekran Görüntüleri](#-ekran-görüntüleri)

</div>

---

## 📋 İçindekiler

- [Proje Hakkında](#-proje-hakkında)
- [Temel Özellikler](#-temel-özellikler)
- [Teknolojiler](#-teknolojiler)
- [Mimari](#-mimari)
- [Kurulum](#-kurulum)
- [Kullanım](#-kullanım)
- [Ekran Görüntüleri](#-ekran-görüntüleri)
- [Commit Geçmişi](#-commit-geçmişi-development-timeline)
- [Geliştirme Notları](#-geliştirme-notları)

---

## 🎯 Proje Hakkında

**SY HUKUK Mobil Uygulaması**, avukatlık bürolarının günlük operasyonlarını dijitalleştiren, bulut tabanlı bir yönetim platformudur. Müvekkil takibinden dava yönetimine, duruşma hatırlatmalarından finansal analizlere kadar geniş bir yelpazede profesyonel çözümler sunar.



## 🚀 Temel Özellikler

### 👥 Müvekkil Yönetimi
- Kapsamlı müvekkil profilleri (Ad, TC, İletişim, Adres)
- Müvekkil bazlı dava ve evrak listeleme
- Detaylı iletişim geçmişi
- Müvekkil arama ve filtreleme
- Müvekkil notları ve etiketleri

### ⚖️ Dava Takip Sistemi
- Dava oluşturma ve düzenleme
- Dava süreçleri ve aşamaları
- Dosya numarası ve mahkeme bilgileri
- Durum takibi (Açık, Kapalı, Beklemede)
- Dava bazlı evrak yönetimi
- Karşı taraf ve vekil bilgileri

### 📅 Akıllı Takvim & Etkinlik Yönetimi
- İki farklı takvim görünümü:
  - **Basit Takvim**: Hızlı etkinlik ekleme
  - **Gelişmiş Takvim**: Detaylı planlama ve tekrarlayan etkinlikler
- Duruşma, toplantı, randevu yönetimi
- Hatırlatıcı sistemi (5, 15, 30, 60 dakika öncesi)
- Renkli etkinlik kategorileri
- Tekrarlayan etkinlik desteği (Günlük, Haftalık, Aylık, Yıllık)
- Tam gün etkinlikler
- Katılımcı yönetimi

### 📄 Doküman & Evrak Yönetimi
- Evrak yükleme ve kategorilendirme
- Dava ve müvekkil bazlı evrak ilişkilendirme
- Evrak arama ve filtreleme
- Evrak notları ve açıklamaları
- Dosya formatı desteği (PDF, DOC, DOCX, vb.)

### 💰 Finansal Yönetim
- Gelir/Gider takibi
- Dava bazlı maliyet analizi
- Ödeme planları ve taksitlendirme
- Finansal raporlama
- Kategori bazlı harcama analizi

### 🔔 Bildirim Sistemi
- Push notification desteği
- Duruşma hatırlatıcıları
- Önemli tarih bildirimleri
- Özelleştirilebilir bildirim ayarları
- Bildirim geçmişi

### 📊 İstatistik & Analiz
- Dava istatistikleri
- Müvekkil analizleri
- Finansal grafikler ve raporlar
- Performans metrikleri
- Aylık/Yıllık karşılaştırmalar

### 🔍 Gelişmiş Arama
- Global arama özelliği
- Müvekkil, dava, etkinlik ve evrak araması
- Filtreleme ve sıralama seçenekleri
- Hızlı erişim sonuçları

### 🏢 Çoklu Firma Desteği
- Birden fazla hukuk bürosu yönetimi
- Firma bazlı veri izolasyonu
- Firma geçişi
- Firma özelleştirmeleri

### 🔐 Güvenlik & Yetkilendirme
- Firebase Authentication entegrasyonu
- Email/Password ile güvenli giriş
- Kullanıcı kayıt ve profil yönetimi
- Secure Storage ile hassas veri saklama
- Oturum yönetimi

### 🎨 Tema & Özelleştirme
- Açık/Koyu tema desteği
- Material Design
- Responsive tasarım
- Özelleştirilebilir renkler

### 🌐 E-Devlet Entegrasyonu (Geliştirme Aşamasında)
- E-Devlet API entegrasyonu
- UYAP bağlantısı
- Otomatik dava bilgisi güncelleme

### 📱 Çoklu Platform Desteği
- iOS Desteği
- Android Desteği
- Web Desteği (PWA)
- Expo Go ile anlık test

### 💬 İletişim & Mesajlaşma
- Müvekkil ile mesajlaşma
- İletişim geçmişi
- Hızlı notlar ve yorumlar

### 📝 Log & İzleme Sistemi
- Detaylı uygulama logları
- Hata takibi
- Kullanıcı aktivite kaydı
- Debug modu

---

## 🛠 Teknolojiler

### Frontend Framework & UI
- **React Native** `0.81.4` - Mobil uygulama framework'ü
- **React** `19.1.0` - UI kütüphanesi
- **React Native Paper** `5.10.6` - Material Design bileşenleri
- **React Native Vector Icons** `10.0.0` - İkon kütüphanesi
- **@expo/vector-icons** `14.0.0` - Expo ikon seti

### Navigation & Routing
- **React Navigation** `6.1.7` - Navigation library
  - `@react-navigation/stack` `6.3.17` - Stack navigasyon
  - `@react-navigation/bottom-tabs` `6.5.8` - Tab navigasyon
- **React Native Screens** `4.16.0` - Native ekran optimizasyonu
- **React Native Gesture Handler** `2.28.0` - Gesture yönetimi
- **React Native Safe Area Context** `5.6.0` - Safe area yönetimi

### State Management & Storage
- **@react-native-async-storage/async-storage** `2.2.0` - Async storage
- **Expo Secure Store** `14.0.0` - Güvenli veri saklama
- **Expo SQLite** `16.0.8` - Yerel veritabanı
- **React Context API** - Global state yönetimi

### Backend & Database
- **Firebase** `10.7.1` - Backend as a Service (BaaS)
  - Firebase Authentication
  - Firebase Realtime Database
  - Firebase Cloud Messaging (Planlanan)
  - Firebase Storage (Planlanan)

### UI/UX Components
- **React Native Calendars** `1.1302.0` - Takvim bileşeni
- **React Native Modal** `13.0.0` - Modal yönetimi
- **React Native Color Picker** `0.6.0` - Renk seçici
- **@react-native-community/datetimepicker** `8.4.4` - Tarih/Saat seçici

### File Management
- **Expo Document Picker** `14.0.7` - Dosya seçici
- **Expo File System** `19.0.16` - Dosya sistemi yönetimi

### Notifications & Device
- **Expo Notifications** `0.32.12` - Push notification
- **Expo Device** `8.0.9` - Cihaz bilgisi

### Networking & API
- **Axios** `1.12.2` - HTTP client

### Utilities
- **date-fns** `4.1.0` - Tarih yönetimi ve formatlama

### Development Platform
- **Expo SDK** `54.0.0` - Development platform
  - Expo Go desteği
  - Over-the-air (OTA) updates
  - Development server
  - Build tools
- **Expo Status Bar** `3.0.8` - Status bar yönetimi

### Web Support
- **React Native Web** `0.21.0` - Web platformu desteği
- **React DOM** `19.1.0` - DOM renderer

### Build & Development Tools
- **Babel** `7.20.0` - JavaScript derleyici
- **babel-preset-expo** `54.0.3` - Expo Babel preset
- **Node.js** - Runtime environment
- **npm** - Paket yöneticisi

### Architecture Patterns
- **Context API Pattern** - State management
- **Provider Pattern** - Dependency injection
- **Component-Based Architecture** - Modüler yapı
- **Screen-Based Navigation** - Ekran yönlendirme
- **Service Layer Pattern** - İş mantığı ayrımı

---

## 🏗 Mimari

### Proje Yapısı

```
syhukukmobilapp-expogo/
├── App.js                          # Ana uygulama entry point
├── app.json                        # Expo konfigürasyonu
├── package.json                    # Bağımlılıklar
├── babel.config.js                 # Babel yapılandırması
│
├── assets/                         # Medya dosyaları
│   ├── images/
│   │   └── logo.png               # Uygulama logosu
│   └── notification-icon.png      # Bildirim ikonu
│
└── src/
    ├── components/                # Yeniden kullanılabilir bileşenler
    │   ├── WebCompatibleCalendar.js
    │   ├── WebCompatibleDateTimePicker.js
    │   └── WebCompatibleIcon.js
    │
    ├── config/                    # Yapılandırma dosyaları
    │   ├── firebaseConfig.js      # Firebase ayarları
    │   ├── firmConfig.js          # Firma yapılandırması
    │   └── firms.js               # Firma listesi
    │
    ├── context/                   # Context API providers
    │   ├── DatabaseContext.js
    │   ├── FirebaseDatabaseContext.js
    │   ├── MultiDatabaseContext.js
    │   ├── ThemeContext.js
    │   └── WebCompatibleDatabaseContext.js
    │
    ├── navigation/                # Navigasyon yapılandırması
    │   └── MainTabNavigator.js    # Ana tab navigasyonu
    │
    ├── screens/                   # Uygulama ekranları
    │   ├── Auth/
    │   │   ├── LoginScreen.js
    │   │   └── RegisterScreen.js
    │   ├── Client/
    │   │   ├── ClientsScreen.js
    │   │   ├── ClientDetailScreen.js
    │   │   └── AddClientScreen.js
    │   ├── Case/
    │   │   ├── CasesScreen.js
    │   │   ├── CaseDetailScreen.js
    │   │   ├── AddCaseScreen.js
    │   │   └── CaseProcessScreen.js
    │   ├── Calendar/
    │   │   ├── CalendarScreen.js
    │   │   ├── AdvancedCalendarScreen.js
    │   │   ├── AddEventScreen.js
    │   │   ├── AddAdvancedEventScreen.js
    │   │   └── EventDetailScreen.js
    │   ├── Dashboard/
    │   │   └── DashboardScreen.js
    │   ├── Documents/
    │   │   └── DocumentsScreen.js
    │   ├── Financial/
    │   │   └── FinancialScreen.js
    │   ├── Notifications/
    │   │   ├── NotificationsScreen.js
    │   │   └── NotificationSettingsScreen.js
    │   ├── Profile/
    │   │   └── ProfileScreen.js
    │   ├── Statistics/
    │   │   └── StatisticsScreen.js
    │   ├── Search/
    │   │   └── SearchScreen.js
    │   ├── Settings/
    │   │   ├── FirmSelectionScreen.js
    │   │   ├── SyncScreen.js
    │   │   └── LogScreen.js
    │   ├── Integration/
    │   │   └── EDevletIntegrationScreen.js
    │   └── Communication/
    │       ├── ChatScreen.js
    │       └── AddCommunicationScreen.js
    │
    ├── services/                  # İş mantığı servisleri
    │   ├── EDevletService.js      # E-Devlet entegrasyon servisi
    │   ├── LogService.js          # Log servisi
    │   └── NotificationService.js # Bildirim servisi
    │
    └── utils/                     # Yardımcı fonksiyonlar
        └── logUtils.js            # Log utilities
```

### Veri Akışı


### Design Patterns

- **Context Provider Pattern**: Global state yönetimi için
- **Service Layer**: İş mantığı ve API çağrıları için
- **Component Composition**: Yeniden kullanılabilir UI bileşenleri
- **Screen-Based Architecture**: Navigasyon ve ekran yönetimi

---

## 💻 Kurulum

### Gereksinimler

- **Node.js** (v16 veya üzeri)
- **npm** veya **yarn**
- **Expo CLI** (global kurulum önerilir)
- **Expo Go** uygulaması (iOS/Android - test için)

### Adımlar

1. **Projeyi klonlayın**

```bash
git clone https://github.com/your-username/syhukukmobilapp-expogo.git
cd syhukukmobilapp-expogo
```

2. **Bağımlılıkları yükleyin**

```bash
npm install
# veya
yarn install
```

3. **Firebase yapılandırması**

`src/config/firebaseConfig.js` dosyasını kendi Firebase bilgilerinizle güncelleyin:

```javascript
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  databaseURL: "YOUR_DATABASE_URL",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

4. **Uygulamayı başlatın**

```bash
npm start
# veya
expo start
```

---

## 🎮 Kullanım

### Expo Go ile Test Etme

1. Terminalden `npm start` komutunu çalıştırın
2. QR kod ekrana gelecektir
3. **iOS**: Camera uygulamasıyla QR kodu tarayın
4. **Android**: Expo Go uygulamasıyla QR kodu tarayın

### Platform Bazlı Çalıştırma

```bash
# iOS Simulator (macOS gerekli)
npm run ios

# Android Emulator
npm run android

# Web Browser
npm run web
```

### İlk Kullanım

1. **Kayıt Olun**: Yeni bir hesap oluşturun
2. **Firma Seçimi**: Çalışacağınız firmayı seçin veya yeni firma oluşturun
3. **Dashboard**: Ana ekranda genel bakışı görün
4. **Müvekkil Ekleyin**: İlk müvekkilinizi ekleyin
5. **Dava Oluşturun**: Yeni bir dava dosyası açın
6. **Etkinlik Planlayın**: Duruşma veya toplantı ekleyin

---

## 📸 Ekran Görüntüleri

<div align="center">

### 🔐 Giriş & Kayıt
*Modern ve güvenli kimlik doğrulama ekranları*

### 📊 Dashboard
*Genel bakış ve hızlı erişim paneli*

### 👥 Müvekkil Yönetimi
*Detaylı müvekkil profilleri ve listeleme*

### ⚖️ Dava Takibi
*Kapsamlı dava yönetim sistemi*

### 📅 Takvim & Etkinlikler
*Akıllı takvim ve hatırlatıcı sistemi*

### 💰 Finansal Yönetim
*Gelir/Gider takibi ve raporlama*

</div>

---

## 📅 Commit Geçmişi (Development Timeline)

Proje, planlı geliştirme sürecinde 4 ana fazda tamamlanmıştır:

### 📌 Faz 1: Proje Temelinin Atılması
**📅 15.09.2025 - Initial Commit**
- Proje iskelet yapısı oluşturuldu
- Expo SDK 54 kurulumu ve yapılandırması
- React Navigation entegrasyonu
- Temel klasör yapısı ve dosya organizasyonu
- Package.json bağımlılıkları tanımlandı
- Git repository başlatıldı

### 📌 Faz 2: Kimlik Doğrulama & Mimari Kurulum
**📅 22.10.2025 - Auth & Architecture Setup**
- Firebase Authentication entegrasyonu
- Login ve Register ekranları geliştirildi
- Context API ile state management kuruldu
- AsyncStorage ve SecureStore entegrasyonu
- Multi-database context yapısı oluşturuldu
- Theme provider eklendi (Açık/Koyu tema)
- Ana navigasyon yapısı (Stack & Tab Navigation)

### 📌 Faz 3: Core Features & Business Logic
**📅 28.11.2025 - Core Features Implementation**
- **Müvekkil Yönetimi**: CRUD operasyonları, detay ekranları
- **Dava Takip Sistemi**: Dava oluşturma, düzenleme, listeleme
- **Takvim Sistemi**: İki farklı takvim görünümü (Basit & Gelişmiş)
- **Etkinlik Yönetimi**: Duruşma, toplantı, hatırlatıcı sistemi
- **Doküman Yönetimi**: Evrak yükleme ve kategorilendirme
- **Finansal Modül**: Gelir/Gider takibi
- **Bildirim Servisi**: Push notification altyapısı
- **Arama Sistemi**: Global arama özelliği
- **İstatistik Ekranları**: Grafikler ve raporlar
- Firebase Realtime Database entegrasyonu
- Çoklu firma desteği

### 📌 Faz 4: Polish & Production Ready
**📅 04.01.2026 - Final Release & Optimization**
- **UI/UX İyileştirmeleri**:
  - Material Design refinement
  - Responsive tasarım optimizasyonu
  - Loading states ve error handling
  - Toast notifications
  - Modal improvements
- **Bug Fixes**:
  - Form validation düzeltmeleri
  - Navigation bug'ları giderildi
  - Memory leak'ler düzeltildi
  - Date picker platform compatibility
  - Calendar sync issues çözüldü
- **Performance Optimizations**:
  - React.memo optimizasyonları
  - Lazy loading implementasyonu
  - Image caching
  - Database query optimization
- **Final Touches**:
  - E-Devlet entegrasyon altyapısı
  - Log sistemi
  - Error tracking
  - Production build konfigürasyonu
  - README ve dokümantasyon
  - Code cleanup ve refactoring

---

## 🔧 Geliştirme Notları

### Expo Go Uyumluluğu

Bu proje, Expo Go ile tam uyumlu çalışacak şekilde geliştirilmiştir:

- ✅ `expo-dev-client` yerine native Expo Go modülleri kullanılmıştır
- ✅ `react-native-keychain` yerine `expo-secure-store` tercih edilmiştir
- ✅ Tüm native modüller Expo SDK 54 ile uyumludur
- ✅ Firebase web SDK kullanılarak platform bağımsızlık sağlanmıştır
- ✅ Custom native modules kullanılmamıştır

### Web Platformu Desteği

Bazı özellikler web platformunda sınırlı çalışabilir:

- Takvim bileşenleri için `WebCompatibleCalendar` wrapper'ı kullanılmıştır
- DateTimePicker için platform-specific implementasyonlar mevcuttur
- Push notifications web'de farklı şekilde çalışabilir

### Firebase Realtime Database Yapısı

```
database/
├── firms/
│   └── {firmId}/
│       ├── clients/
│       ├── cases/
│       ├── events/
│       ├── documents/
│       ├── financial/
│       └── communications/
└── users/
    └── {userId}/
        ├── profile/
        └── settings/
```

### Bilinen Limitasyonlar

- E-Devlet entegrasyonu henüz geliştirme aşamasındadır
- Offline mode kısıtlı desteklenmektedir
- File upload büyük dosyalar için optimize edilmelidir

### Gelecek Güncellemeler

- [ ] Offline mode tam desteği
- [ ] E-Devlet UYAP entegrasyonu
- [ ] Otomatik yedekleme sistemi
- [ ] Gelişmiş raporlama modülü
- [ ] Multi-language desteği
- [ ] Dark mode detay iyileştirmeleri
- [ ] Biometric authentication

---

## 📜 Lisans

Bu proje özel bir projedir ve telif hakları saklıdır.

---

## 👨‍💻 Geliştirici

Fehmi Göktuğ Katırcılar

---

## 🙏 Teşekkürler

Bu projenin geliştirilmesinde kullanılan açık kaynak kütüphanelere ve topluluklara teşekkürlerimizi sunarız:

- React Native & Expo Team
- Firebase Team
- React Navigation Team
- React Native Paper Team
- Tüm açık kaynak katkıda bulunanlar

---

<div align="center">



**© 2025 SY HUKUK - Tüm Hakları Saklıdır**

</div>
