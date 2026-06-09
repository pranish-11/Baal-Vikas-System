import React, { useState, useEffect, useRef, useCallback } from "react";
import { StyleSheet, Text, View, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "../../lib/auth";
import { getThread, sendMessage as apiSendMessage } from "../../lib/api";
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
          return (
            <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
              <Text style={[styles.bubbleText, isMine ? styles.bubbleTextMine : styles.bubbleTextTheirs]}>{item.content}</Text>
              <Text style={[styles.bubbleTime, isMine ? styles.bubbleTimeMine : styles.bubbleTimeTheirs]}>
                {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </Text>
            </View>
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

      <View style={styles.inputBar}>
        <TextInput style={styles.input} placeholder="Type a message..." placeholderTextColor={Colors.text3}
          value={text} onChangeText={handleTextChange} multiline maxLength={1000} />
        <TouchableOpacity style={[styles.sendBtn, (!text.trim() || sending) && { opacity: 0.4 }]}
          onPress={handleSend} disabled={!text.trim() || sending}>
          {sending ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.sendText}>➤</Text>}
        </TouchableOpacity>
      </View>
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
  bubbleText: { fontSize: 14, lineHeight: 20 },
  bubbleTextMine: { color: "#fff" },
  bubbleTextTheirs: { color: Colors.text },
  bubbleTime: { fontSize: 10, marginTop: 4 },
  bubbleTimeMine: { color: "rgba(255,255,255,0.6)", textAlign: "right" },
  bubbleTimeTheirs: { color: Colors.text3 },
  typingBar: { paddingHorizontal: 20, paddingVertical: 4 },
  typingText: { fontSize: 12, color: Colors.text3, fontStyle: "italic" },
  inputBar: { flexDirection: "row", alignItems: "flex-end", padding: 12, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border },
  input: { flex: 1, backgroundColor: Colors.bg, borderRadius: Radius.md, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: Colors.text, maxHeight: 100 },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center", marginLeft: 8 },
  sendText: { color: "#fff", fontSize: 18 },
  emptyBox: { alignItems: "center", marginTop: 80 },
  emptyEmoji: { fontSize: 40, marginBottom: 8 },
  emptyText: { fontSize: 13, color: Colors.text3 },
});
