import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Bildirim ayarları
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  constructor() {
    this.isInitialized = false;
  }

  // Bildirim izni iste
  async requestPermissions() {
    try {
      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        
        if (finalStatus !== 'granted') {
          console.log('Bildirim izni verilmedi');
          return false;
        }
        
        this.isInitialized = true;
        return true;
      } else {
        console.log('Bildirimler sadece fiziksel cihazlarda çalışır');
        return false;
      }
    } catch (error) {
      console.error('Bildirim izni hatası:', error);
      return false;
    }
  }

  // Yerel bildirim gönder
  async scheduleLocalNotification(title, body, data = {}, trigger = null) {
    try {
      if (!this.isInitialized) {
        await this.requestPermissions();
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: title,
          body: body,
          data: data,
          sound: 'default',
        },
        trigger: trigger,
      });

      console.log(`Bildirim planlandı: ${notificationId}`);
      return notificationId;
    } catch (error) {
      console.error('Bildirim gönderme hatası:', error);
      return null;
    }
  }

  // Duruşma hatırlatması (1 gün önceden)
  async scheduleHearingReminder(event) {
    const eventDate = new Date(event.date);
    const reminderDate = new Date(eventDate.getTime() - 24 * 60 * 60 * 1000); // 1 gün önceden
    
    // Geçmiş tarihse hatırlatma gönderme
    if (reminderDate < new Date()) {
      return null;
    }

    const title = `🔔 Duruşma Hatırlatması`;
    const body = `${event.title} - Yarın ${event.time || '09:00'}`;
    
    return await this.scheduleLocalNotification(
      title,
      body,
      { 
        type: 'hearing_reminder',
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.date,
        eventTime: event.time
      },
      { date: reminderDate }
    );
  }

  // Toplantı hatırlatması (30 dakika önceden)
  async scheduleMeetingReminder(event) {
    const eventDate = new Date(`${event.date} ${event.time || '09:00'}`);
    const reminderDate = new Date(eventDate.getTime() - 30 * 60 * 1000); // 30 dakika önceden
    
    // Geçmiş tarihse hatırlatma gönderme
    if (reminderDate < new Date()) {
      return null;
    }

    const title = `📅 Toplantı Hatırlatması`;
    const body = `${event.title} - 30 dakika sonra`;
    
    return await this.scheduleLocalNotification(
      title,
      body,
      { 
        type: 'meeting_reminder',
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.date,
        eventTime: event.time
      },
      { date: reminderDate }
    );
  }

  // Dilekçe hatırlatması (1 hafta önceden)
  async schedulePetitionReminder(event) {
    const eventDate = new Date(event.date);
    const reminderDate = new Date(eventDate.getTime() - 7 * 24 * 60 * 60 * 1000); // 1 hafta önceden
    
    // Geçmiş tarihse hatırlatma gönderme
    if (reminderDate < new Date()) {
      return null;
    }

    const title = `📝 Dilekçe Hatırlatması`;
    const body = `${event.title} - 1 hafta sonra`;
    
    return await this.scheduleLocalNotification(
      title,
      body,
      { 
        type: 'petition_reminder',
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.date,
        eventTime: event.time
      },
      { date: reminderDate }
    );
  }

  // Arabuluculuk hatırlatması (2 gün önceden)
  async scheduleMediationReminder(event) {
    const eventDate = new Date(event.date);
    const reminderDate = new Date(eventDate.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 gün önceden
    
    // Geçmiş tarihse hatırlatma gönderme
    if (reminderDate < new Date()) {
      return null;
    }

    const title = `🤝 Arabuluculuk Hatırlatması`;
    const body = `${event.title} - 2 gün sonra`;
    
    return await this.scheduleLocalNotification(
      title,
      body,
      { 
        type: 'mediation_reminder',
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.date,
        eventTime: event.time
      },
      { date: reminderDate }
    );
  }

  // Etkinlik türüne göre hatırlatma planla
  async scheduleEventReminder(event) {
    switch (event.event_type) {
      case 'Duruşma':
        return await this.scheduleHearingReminder(event);
      case 'Toplantı':
        return await this.scheduleMeetingReminder(event);
      case 'Dilekçe':
        return await this.schedulePetitionReminder(event);
      case 'Arabulucuk':
        return await this.scheduleMediationReminder(event);
      default:
        return await this.scheduleHearingReminder(event);
    }
  }

  // Tüm planlanmış bildirimleri iptal et
  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('Tüm bildirimler iptal edildi');
    } catch (error) {
      console.error('Bildirim iptal hatası:', error);
    }
  }

  // Belirli bir bildirimi iptal et
  async cancelNotification(notificationId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log(`Bildirim iptal edildi: ${notificationId}`);
    } catch (error) {
      console.error('Bildirim iptal hatası:', error);
    }
  }

  // Planlanmış bildirimleri listele
  async getScheduledNotifications() {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      return notifications;
    } catch (error) {
      console.error('Bildirim listesi hatası:', error);
      return [];
    }
  }

  // Bildirim dinleyicisi ekle
  addNotificationListener(listener) {
    return Notifications.addNotificationReceivedListener(listener);
  }

  // Bildirim yanıt dinleyicisi ekle
  addNotificationResponseListener(listener) {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }
}

// Singleton instance
const notificationService = new NotificationService();
export default notificationService;
