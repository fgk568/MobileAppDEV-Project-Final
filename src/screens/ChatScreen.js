import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useDatabase } from '../context/FirebaseDatabaseContext';
import WebCompatibleIcon from '../components/WebCompatibleIcon';

const ChatScreen = ({ navigation }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [lawyers, setLawyers] = useState([]);
  const [selectedLawyer, setSelectedLawyer] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const { db, isReady } = useDatabase();
  const flatListRef = useRef(null);

  useEffect(() => {
    if (isReady) {
      loadLawyers();
      loadCurrentUser();
    }
  }, [isReady]);

  useEffect(() => {
    if (selectedLawyer) {
      loadMessages();
    }
  }, [selectedLawyer]);

  const loadCurrentUser = async () => {
    try {
      // İlk avukatı mevcut kullanıcı olarak alıyoruz (gerçek uygulamada auth'dan gelecek)
      const lawyers = await db.getAllAsync('lawyers');
      if (lawyers.length > 0) {
        setCurrentUser(lawyers[0]);
      }
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const loadLawyers = async () => {
    try {
      const result = await db.getAllAsync('lawyers');
      setLawyers(result);
    } catch (error) {
      console.error('Error loading lawyers:', error);
    }
  };

  const loadMessages = async () => {
    if (!selectedLawyer || !currentUser) return;

    try {
      const result = await db.getAllAsync('chat_messages');
      
      // Mesajları filtrele ve avukat bilgileri ile birleştir
      const filteredMessages = result
        .filter(msg => 
          (msg.sender_id === currentUser.id && msg.receiver_id === selectedLawyer.id) ||
          (msg.sender_id === selectedLawyer.id && msg.receiver_id === currentUser.id)
        )
        .map(msg => {
          const sender = lawyers.find(l => l.id === msg.sender_id);
          return {
            ...msg,
            sender_name: sender?.name || 'Bilinmeyen',
            sender_color: sender?.color || '#000000'
          };
        })
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      
      setMessages(filteredMessages);
      
      // Mesajları okundu olarak işaretle (Firebase'de güncelleme)
      const unreadMessages = result.filter(msg => 
        msg.sender_id === selectedLawyer.id && 
        msg.receiver_id === currentUser.id && 
        !msg.is_read
      );
      
      for (const msg of unreadMessages) {
        await db.set('chat_messages', msg.id, { ...msg, is_read: true });
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedLawyer || !currentUser) return;

    try {
      const messageData = {
        sender_id: currentUser.id,
        receiver_id: selectedLawyer.id,
        message: newMessage.trim(),
        message_type: 'text',
        is_read: false,
        created_at: new Date().toISOString()
      };
      
      await db.push('chat_messages', messageData);
      
      setNewMessage('');
      loadMessages();
      
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Hata', 'Mesaj gönderilirken bir hata oluştu');
    }
  };

  const renderMessage = ({ item }) => {
    const isMyMessage = item.sender_id === currentUser?.id;
    
    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessage : styles.otherMessage
      ]}>
        <View style={[
          styles.messageBubble,
          isMyMessage ? styles.myBubble : styles.otherBubble
        ]}>
          <Text style={[
            styles.messageText,
            isMyMessage ? styles.myMessageText : styles.otherMessageText
          ]}>
            {item.message}
          </Text>
          <Text style={[
            styles.messageTime,
            isMyMessage ? styles.myMessageTime : styles.otherMessageTime
          ]}>
            {new Date(item.created_at).toLocaleTimeString('tr-TR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
        </View>
      </View>
    );
  };

  const renderLawyerItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.lawyerItem,
        selectedLawyer?.id === item.id && styles.selectedLawyer
      ]}
      onPress={() => setSelectedLawyer(item)}
    >
      <View style={[styles.lawyerColor, { backgroundColor: item.color }]} />
      <View style={styles.lawyerInfo}>
        <Text style={styles.lawyerName}>{item.name}</Text>
        <Text style={styles.lawyerEmail}>{item.email}</Text>
      </View>
    </TouchableOpacity>
  );

  if (!currentUser) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Kullanıcılar</Text>
        <Text style={styles.subtitle}>Mesajlaşma</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.lawyersList}>
          <Text style={styles.sectionTitle}>Avukatlar</Text>
          <FlatList
            data={lawyers.filter(lawyer => lawyer.id !== currentUser.id)}
            renderItem={renderLawyerItem}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
          />
        </View>

        {selectedLawyer ? (
          <View style={styles.chatContainer}>
            <View style={styles.chatHeader}>
              <View style={[styles.selectedLawyerColor, { backgroundColor: selectedLawyer.color }]} />
              <Text style={styles.selectedLawyerName}>{selectedLawyer.name}</Text>
            </View>

            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id.toString()}
              style={styles.messagesList}
              contentContainerStyle={styles.messagesContainer}
            />

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.messageInput}
                placeholder="Mesajınızı yazın..."
                value={newMessage}
                onChangeText={setNewMessage}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
                onPress={sendMessage}
                disabled={!newMessage.trim()}
              >
                <WebCompatibleIcon name="send" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <WebCompatibleIcon name="chat" size={64} color="#666" />
            <Text style={styles.emptyText}>Bir avukat seçin</Text>
            <Text style={styles.emptySubtext}>Mesajlaşmaya başlamak için yukarıdan bir avukat seçin</Text>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
  },
  header: {
    padding: 20,
    backgroundColor: '#1a1a2e',
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d3d',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: '#4a9eff',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#8a9ba8',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  lawyersList: {
    padding: 15,
    backgroundColor: '#1a1a2e',
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d3d',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  lawyerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginRight: 10,
    backgroundColor: '#2d2d3d',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3d3d4d',
  },
  selectedLawyer: {
    borderColor: '#4a9eff',
    backgroundColor: '#1a2a3a',
  },
  lawyerColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  lawyerInfo: {
    flex: 1,
  },
  lawyerName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  lawyerEmail: {
    color: '#8a9ba8',
    fontSize: 12,
  },
  chatContainer: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#1a1a2e',
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d3d',
  },
  selectedLawyerColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  selectedLawyerName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: 15,
  },
  messageContainer: {
    marginBottom: 10,
  },
  myMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  myBubble: {
    backgroundColor: '#4a9eff',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#2d2d3d',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#fff',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  myMessageTime: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'right',
  },
  otherMessageTime: {
    color: '#8a9ba8',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#1a1a2e',
    borderTopWidth: 1,
    borderTopColor: '#2d2d3d',
    alignItems: 'flex-end',
  },
  messageInput: {
    flex: 1,
    backgroundColor: '#2d2d3d',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    color: '#fff',
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#4a9eff',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySubtext: {
    color: '#8a9ba8',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
});

export default ChatScreen;
