import { useDatabase } from '../context/FirebaseDatabaseContext';

// Log sistemi yardımcı fonksiyonları
export const logAction = async (db, actionData) => {
  try {
    const logEntry = {
      user_id: actionData.user_id,
      user_name: actionData.user_name || 'Sistem',
      action_type: actionData.action_type, // CREATE, UPDATE, DELETE, VIEW
      action_description: actionData.action_description,
      target_type: actionData.target_type, // Dosya, Etkinlik, Müvekkil, Finansal
      target_name: actionData.target_name,
      target_id: actionData.target_id,
      details: actionData.details || '',
      created_at: new Date().toISOString()
    };

    const result = await db.push('activity_logs', logEntry);
    return result.success;
  } catch (error) {
    console.error('Error logging action:', error);
    return false;
  }
};

// Önceden tanımlanmış log fonksiyonları
export const logCaseCreate = async (db, userId, caseData) => {
  return await logAction(db, {
    user_id: userId,
    user_name: caseData.lawyer_name || 'Bilinmeyen Avukat',
    action_type: 'CREATE',
    action_description: 'Yeni dosya oluşturuldu',
    target_type: 'Dosya',
    target_name: caseData.title,
    target_id: caseData.id,
    details: `Müvekkil: ${caseData.client_name}, Avukat: ${caseData.lawyer_name}`
  });
};

export const logCaseUpdate = async (db, userId, caseData) => {
  return await logAction(db, {
    user_id: userId,
    user_name: caseData.lawyer_name || 'Bilinmeyen Avukat',
    action_type: 'UPDATE',
    action_description: 'Dosya güncellendi',
    target_type: 'Dosya',
    target_name: caseData.title,
    target_id: caseData.id,
    details: `Müvekkil: ${caseData.client_name}`
  });
};

export const logCaseDelete = async (db, userId, caseData) => {
  return await logAction(db, {
    user_id: userId,
    user_name: caseData.lawyer_name || 'Bilinmeyen Avukat',
    action_type: 'DELETE',
    action_description: 'Dosya silindi',
    target_type: 'Dosya',
    target_name: caseData.title,
    target_id: caseData.id,
    details: `Müvekkil: ${caseData.client_name}`
  });
};

export const logClientCreate = async (db, userId, clientData) => {
  return await logAction(db, {
    user_id: userId,
    user_name: clientData.lawyer_name || 'Sistem',
    action_type: 'CREATE',
    action_description: 'Yeni müvekkil eklendi',
    target_type: 'Müvekkil',
    target_name: clientData.name,
    target_id: clientData.id,
    details: `E-posta: ${clientData.email}`
  });
};

export const logClientUpdate = async (db, userId, clientData) => {
  return await logAction(db, {
    user_id: userId,
    user_name: clientData.lawyer_name || 'Sistem',
    action_type: 'UPDATE',
    action_description: 'Müvekkil güncellendi',
    target_type: 'Müvekkil',
    target_name: clientData.name,
    target_id: clientData.id,
    details: `E-posta: ${clientData.email}`
  });
};

export const logEventCreate = async (db, userId, eventData) => {
  return await logAction(db, {
    user_id: userId,
    user_name: eventData.lawyer_name || 'Bilinmeyen Avukat',
    action_type: 'CREATE',
    action_description: 'Yeni etkinlik eklendi',
    target_type: 'Etkinlik',
    target_name: eventData.title,
    target_id: eventData.id,
    details: `Tarih: ${eventData.date}, Saat: ${eventData.time}`
  });
};

export const logEventUpdate = async (db, userId, eventData) => {
  return await logAction(db, {
    user_id: userId,
    user_name: eventData.lawyer_name || 'Bilinmeyen Avukat',
    action_type: 'UPDATE',
    action_description: 'Etkinlik güncellendi',
    target_type: 'Etkinlik',
    target_name: eventData.title,
    target_id: eventData.id,
    details: `Tarih: ${eventData.date}, Saat: ${eventData.time}`
  });
};

export const logEventDelete = async (db, userId, eventData) => {
  return await logAction(db, {
    user_id: userId,
    user_name: eventData.lawyer_name || 'Bilinmeyen Avukat',
    action_type: 'DELETE',
    action_description: 'Etkinlik silindi',
    target_type: 'Etkinlik',
    target_name: eventData.title,
    target_id: eventData.id,
    details: `Tarih: ${eventData.date}`
  });
};

export const logFinancialUpdate = async (db, userId, financialData) => {
  return await logAction(db, {
    user_id: userId,
    user_name: financialData.lawyer_name || 'Bilinmeyen Avukat',
    action_type: 'UPDATE',
    action_description: 'Finansal işlem güncellendi',
    target_type: 'Finansal',
    target_name: financialData.description || 'Finansal İşlem',
    target_id: financialData.id,
    details: `Tutar: ${financialData.amount} TL`
  });
};

export const logLogin = async (db, userId, userData) => {
  return await logAction(db, {
    user_id: userId,
    user_name: userData.name || 'Bilinmeyen Kullanıcı',
    action_type: 'VIEW',
    action_description: 'Sisteme giriş yapıldı',
    target_type: 'Sistem',
    target_name: 'Giriş',
    target_id: userId,
    details: `Kullanıcı: ${userData.name}`
  });
};

export const logLogout = async (db, userId, userData) => {
  return await logAction(db, {
    user_id: userId,
    user_name: userData.name || 'Bilinmeyen Kullanıcı',
    action_type: 'VIEW',
    action_description: 'Sistemden çıkış yapıldı',
    target_type: 'Sistem',
    target_name: 'Çıkış',
    target_id: userId,
    details: `Kullanıcı: ${userData.name}`
  });
};
