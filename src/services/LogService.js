import { useDatabase } from '../context/FirebaseDatabaseContext';

class LogService {
  static async logActivity(db, userId, userName, actionType, actionDescription, targetType = null, targetId = null, targetName = null) {
    try {
      await db.runAsync(
        `INSERT INTO activity_logs (user_id, user_name, action_type, action_description, target_type, target_id, target_name) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, userName, actionType, actionDescription, targetType, targetId, targetName]
      );
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }

  // Dosya işlemleri
  static async logCaseCreate(db, userId, userName, caseId, caseTitle) {
    await this.logActivity(
      db, 
      userId, 
      userName, 
      'CREATE', 
      'Yeni dosya oluşturdu', 
      'Dosya', 
      caseId, 
      caseTitle
    );
  }

  static async logCaseUpdate(db, userId, userName, caseId, caseTitle) {
    await this.logActivity(
      db, 
      userId, 
      userName, 
      'UPDATE', 
      'Dosyayı güncelledi', 
      'Dosya', 
      caseId, 
      caseTitle
    );
  }

  static async logCaseDelete(db, userId, userName, caseTitle) {
    await this.logActivity(
      db, 
      userId, 
      userName, 
      'DELETE', 
      'Dosyayı sildi', 
      'Dosya', 
      null, 
      caseTitle
    );
  }

  static async logCaseView(db, userId, userName, caseId, caseTitle) {
    await this.logActivity(
      db, 
      userId, 
      userName, 
      'VIEW', 
      'Dosyayı görüntüledi', 
      'Dosya', 
      caseId, 
      caseTitle
    );
  }

  // Etkinlik işlemleri
  static async logEventCreate(db, userId, userName, eventId, eventTitle) {
    await this.logActivity(
      db, 
      userId, 
      userName, 
      'CREATE', 
      'Yeni etkinlik oluşturdu', 
      'Etkinlik', 
      eventId, 
      eventTitle
    );
  }

  static async logEventUpdate(db, userId, userName, eventId, eventTitle) {
    await this.logActivity(
      db, 
      userId, 
      userName, 
      'UPDATE', 
      'Etkinliği güncelledi', 
      'Etkinlik', 
      eventId, 
      eventTitle
    );
  }

  static async logEventDelete(db, userId, userName, eventTitle) {
    await this.logActivity(
      db, 
      userId, 
      userName, 
      'DELETE', 
      'Etkinliği sildi', 
      'Etkinlik', 
      null, 
      eventTitle
    );
  }

  static async logEventView(db, userId, userName, eventId, eventTitle) {
    await this.logActivity(
      db, 
      userId, 
      userName, 
      'VIEW', 
      'Etkinliği görüntüledi', 
      'Etkinlik', 
      eventId, 
      eventTitle
    );
  }

  // Müvekkil işlemleri
  static async logClientCreate(db, userId, userName, clientId, clientName) {
    await this.logActivity(
      db, 
      userId, 
      userName, 
      'CREATE', 
      'Yeni müvekkil ekledi', 
      'Müvekkil', 
      clientId, 
      clientName
    );
  }

  static async logClientUpdate(db, userId, userName, clientId, clientName) {
    await this.logActivity(
      db, 
      userId, 
      userName, 
      'UPDATE', 
      'Müvekkil bilgilerini güncelledi', 
      'Müvekkil', 
      clientId, 
      clientName
    );
  }

  static async logClientDelete(db, userId, userName, clientName) {
    await this.logActivity(
      db, 
      userId, 
      userName, 
      'DELETE', 
      'Müvekkili sildi', 
      'Müvekkil', 
      null, 
      clientName
    );
  }

  // Finansal işlemler
  static async logPaymentReceived(db, userId, userName, caseId, caseTitle, amount) {
    await this.logActivity(
      db, 
      userId, 
      userName, 
      'UPDATE', 
      `Ödeme alındı (${amount} TL)`, 
      'Finansal', 
      caseId, 
      caseTitle
    );
  }

  static async logFeeUpdate(db, userId, userName, caseId, caseTitle, amount) {
    await this.logActivity(
      db, 
      userId, 
      userName, 
      'UPDATE', 
      `Ücret güncellendi (${amount} TL)`, 
      'Finansal', 
      caseId, 
      caseTitle
    );
  }

  // Genel işlemler
  static async logLogin(db, userId, userName) {
    await this.logActivity(
      db, 
      userId, 
      userName, 
      'VIEW', 
      'Sisteme giriş yaptı', 
      null, 
      null, 
      null
    );
  }

  static async logLogout(db, userId, userName) {
    await this.logActivity(
      db, 
      userId, 
      userName, 
      'VIEW', 
      'Sistemden çıkış yaptı', 
      null, 
      null, 
      null
    );
  }
}

export default LogService;
