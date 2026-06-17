import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  StyleSheet, Text, View, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Modal, Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "../../lib/auth";
import { getThread, sendMessage as apiSendMessage, editMessage as apiEditMessage, deleteMessage as apiDeleteMessage } from "../../lib/api";
import { useSocketEvent, emitTyping } from "../../lib/socket";
import { Colors, Radius, Shadow } from "../../lib/theme";

export default function ChatScreen() {
  const { recipientId } = useLocalSearchParams<{ recipientId: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeout = useRef<any>(null);

  // Edit/Delete state
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editText, setEditText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try { setMessages(await getThread(recipientId!)); }
    catch (e) { console.warn(e); }
    finally { setLoading(false); }
  }, [recipientId]);

  useEffect(() => { load(); }, []);

  // Real-time incoming messages
  useSocketEvent("new_message", (data: any) => {
    if (data.senderId === recipientId) {
      setMessages((prev) => [...prev, { id: data.id, senderId: data.senderId, content: data.content, createdAt: data.createdAt, isRead: true }]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  });

  // Real-time message edited
  useSocketEvent("message_edited", (data: any) => {
    setMessages((prev) =>
      prev.map((m) => m.id === data.messageId ? { ...m, content: data.content, editedAt: data.editedAt } : m)
    );
  });

  // Real-time message deleted
  useSocketEvent("message_deleted", (data: any) => {
    setMessages((prev) => prev.filter((m) => m.id !== data.messageId));
  });

  // Typing indicator
  useSocketEvent("typing", (data: any) => {
    if (data.userId === recipientId && data.isTyping) {
      setTypingUser(data.name);
      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => setTypingUser(null), 3000);
    } else if (data.userId === recipientId) {
      setTypingUser(null);
    }
  });

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    emitTyping(recipientId!, false);
    try {
      const msg = await apiSendMessage(recipientId!, text.trim());
      setMessages((prev) => [...prev, { id: msg.id, senderId: user?.id, content: text.trim(), createdAt: msg.createdAt, isRead: true }]);
      setText("");
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e: any) { console.warn(e.message); }
    finally { setSending(false); }
  };

  const handleTextChange = (val: string) => {
    setText(val);
    if (val.trim()) emitTyping(recipientId!, true);
    else emitTyping(recipientId!, false);
  };

  // Long-press handler
  const handleLongPress = (message: any) => {
    if (message.senderId !== user?.id) return; // Only own messages
    setSelectedMessage(message);
    setActionModalVisible(true);
  };

  // Edit message
  const handleEdit = () => {
    if (!selectedMessage) return;
    setEditMode(true);
    setEditText(selectedMessage.content);
    setEditingId(selectedMessage.id);
    setActionModalVisible(false);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editText.trim()) return;
    try {
      const result = await apiEditMessage(editingId, editText.trim());
      setMessages((prev) =>
        prev.map((m) => m.id === editingId ? { ...m, content: editText.trim(), editedAt: result.editedAt } : m)
      );
      setEditMode(false);
      setEditText("");
      setEditingId(null);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to edit message");
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditText("");
    setEditingId(null);
  };

  // Delete message
  const handleDelete = () => {
    if (!selectedMessage) return;
    setActionModalVisible(false);
    Alert.alert(
      "Delete Message",
      "Are you sure you want to delete this message? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await apiDeleteMessage(selectedMessage.id);
              setMessages((prev) => prev.filter((m) => m.id !== selectedMessage.id));
            } catch (e: any) {
              Alert.alert("Error", e.message || "Failed to delete message");
            }
          },
        },
      ]
    );
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={0}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chat</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item, i) => item.id || String(i)}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        renderItem={({ item }) => {
          const isMine = item.senderId === user?.id;
          const isEditing = editMode && editingId === item.id;
          return (
            <TouchableOpacity
              activeOpacity={isMine ? 0.7 : 1}
              onLongPress={() => handleLongPress(item)}
              delayLongPress={400}
            >
              <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs, isEditing && styles.bubbleEditing]}>
                <Text style={[styles.bubbleText, isMine ? styles.bubbleTextMine : styles.bubbleTextTheirs]}>{item.content}</Text>
                <View style={styles.bubbleFooter}>
                  <Text style={[styles.bubbleTime, isMine ? styles.bubbleTimeMine : styles.bubbleTimeTheirs]}>
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </Text>
                  {item.editedAt && (
                    <Text style={[styles.editedLabel, isMine ? styles.editedLabelMine : styles.editedLabelTheirs]}>
                      (edited)
                    </Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>✉</Text>
            <Text style={styles.emptyText}>Send a message to start the conversation</Text>
          </View>
        }
      />

      {typingUser && (
        <View style={styles.typingBar}>
          <Text style={styles.typingText}>{typingUser} is typing...</Text>
        </View>
      )}

      {/* Edit mode input bar */}
      {editMode ? (
        <View style={styles.editBar}>
          <View style={styles.editLabelRow}>
            <Text style={styles.editModeLabel}>✎ Editing message</Text>
            <TouchableOpacity onPress={handleCancelEdit}>
              <Text style={styles.editCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={editText}
              onChangeText={setEditText}
              multiline
              maxLength={1000}
              autoFocus
            />
            <TouchableOpacity
              style={[styles.sendBtn, !editText.trim() && { opacity: 0.4 }]}
              onPress={handleSaveEdit}
              disabled={!editText.trim()}
            >
              <Text style={styles.sendText}>✓</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.inputBar}>
          <TextInput style={styles.input} placeholder="Type a message..." placeholderTextColor={Colors.text3}
            value={text} onChangeText={handleTextChange} multiline maxLength={1000} />
          <TouchableOpacity style={[styles.sendBtn, (!text.trim() || sending) && { opacity: 0.4 }]}
            onPress={handleSend} disabled={!text.trim() || sending}>
            {sending ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.sendText}>➤</Text>}
          </TouchableOpacity>
        </View>
      )}

      {/* Action Modal */}
      <Modal visible={actionModalVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.actionOverlay}
          activeOpacity={1}
          onPress={() => setActionModalVisible(false)}
        >
          <View style={styles.actionSheet}>
            <Text style={styles.actionTitle}>Message Options</Text>
            <Text style={styles.actionPreview} numberOfLines={2}>
              "{selectedMessage?.content}"
            </Text>
            <TouchableOpacity style={styles.actionBtn} onPress={handleEdit} activeOpacity={0.7}>
              <Text style={styles.actionBtnIcon}>✎</Text>
              <Text style={styles.actionBtnText}>Edit Message</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.actionBtnDanger]} onPress={handleDelete} activeOpacity={0.7}>
              <Text style={[styles.actionBtnIcon, { color: Colors.coral }]}>✕</Text>
              <Text style={[styles.actionBtnText, { color: Colors.coral }]}>Delete Message</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCancelBtn} onPress={() => setActionModalVisible(false)} activeOpacity={0.7}>
              <Text style={styles.actionCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.bg },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 48, paddingBottom: 12, paddingHorizontal: 16, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backText: { color: Colors.primary, fontSize: 14, fontWeight: "600" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: Colors.text },
  messageList: { padding: 16, paddingBottom: 8 },
  bubble: { maxWidth: "78%", padding: 12, borderRadius: 16, marginBottom: 8 },
  bubbleMine: { alignSelf: "flex-end", backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  bubbleTheirs: { alignSelf: "flex-start", backgroundColor: Colors.surface, borderBottomLeftRadius: 4, ...Shadow },
  bubbleEditing: { borderWidth: 2, borderColor: Colors.gold },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  bubbleTextMine: { color: "#fff" },
  bubbleTextTheirs: { color: Colors.text },
  bubbleFooter: { flexDirection: "row", alignItems: "center", marginTop: 4, gap: 6 },
  bubbleTime: { fontSize: 10 },
  bubbleTimeMine: { color: "rgba(255,255,255,0.6)", textAlign: "right" },
  bubbleTimeTheirs: { color: Colors.text3 },
  editedLabel: { fontSize: 9, fontStyle: "italic" },
  editedLabelMine: { color: "rgba(255,255,255,0.5)" },
  editedLabelTheirs: { color: Colors.text3 },
  typingBar: { paddingHorizontal: 20, paddingVertical: 4 },
  typingText: { fontSize: 12, color: Colors.text3, fontStyle: "italic" },

  // Input bar
  inputBar: { flexDirection: "row", alignItems: "flex-end", padding: 12, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border },
  input: { flex: 1, backgroundColor: Colors.bg, borderRadius: Radius.md, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: Colors.text, maxHeight: 100 },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center", marginLeft: 8 },
  sendText: { color: "#fff", fontSize: 18 },

  // Edit bar
  editBar: { padding: 12, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.gold },
  editLabelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  editModeLabel: { fontSize: 12, fontWeight: "700", color: Colors.gold },
  editCancelText: { fontSize: 12, fontWeight: "600", color: Colors.coral },
  inputRow: { flexDirection: "row", alignItems: "flex-end" },

  // Action modal
  actionOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  actionSheet: { backgroundColor: Colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 36 },
  actionTitle: { fontSize: 16, fontWeight: "700", color: Colors.text, marginBottom: 8 },
  actionPreview: { fontSize: 13, color: Colors.text3, marginBottom: 16, fontStyle: "italic" },
  actionBtn: { flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  actionBtnDanger: { borderBottomWidth: 0 },
  actionBtnIcon: { fontSize: 16, color: Colors.primary, marginRight: 12 },
  actionBtnText: { fontSize: 15, fontWeight: "600", color: Colors.text },
  actionCancelBtn: { alignItems: "center", paddingVertical: 14, marginTop: 8, backgroundColor: Colors.bg, borderRadius: Radius.md },
  actionCancelText: { fontSize: 15, fontWeight: "600", color: Colors.text3 },

  emptyBox: { alignItems: "center", marginTop: 80 },
  emptyEmoji: { fontSize: 40, marginBottom: 8 },
  emptyText: { fontSize: 13, color: Colors.text3 },
});
