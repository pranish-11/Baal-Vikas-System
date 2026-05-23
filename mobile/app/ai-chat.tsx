import React, { useState, useRef } from "react";
import { StyleSheet, Text, View, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Animated } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../lib/auth";
import { sendChatMessage } from "../lib/api";
import { Colors, Radius, Shadow } from "../lib/theme";

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
}

const SUGGESTIONS = [
  "How is my child doing?",
  "Any pending fees?",
  "Attendance this week?",
  "Is my child eating well?",
  "Behavior update?",
];

export default function AIChatScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", role: "ai", content: `Hello ${user?.name?.split(" ")[0] || "there"}! 👋\n\nI'm Axion, your school assistant. Ask me anything about your children — attendance, fees, activities, eating habits, or how they're doing in class.\n\nWhat would you like to know?` },
  ]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const dotAnim = useRef(new Animated.Value(0)).current;

  const startDotAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(dotAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ])
    ).start();
  };

  const send = async (msg?: string) => {
    const content = msg || text.trim();
    if (!content || loading) return;
    setText("");

    const userMsg: Message = { id: Date.now().toString(), role: "user", content };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    startDotAnimation();

    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const response = await sendChatMessage(content);
      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: "ai", content: response.reply || response.error || "Sorry, I couldn't process that." };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (e: any) {
      setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), role: "ai", content: `Sorry, I'm having trouble right now. ${e.message}` }]);
    } finally {
      setLoading(false);
      dotAnim.stopAnimation();
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.aiAvatar}>
            <Text style={styles.aiEmoji}>🤖</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>Axion Assistant</Text>
            <Text style={styles.headerSub}>AI-powered school assistant</Text>
          </View>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.role === "user" ? styles.bubbleUser : styles.bubbleAi]}>
            {item.role === "ai" && <Text style={styles.aiLabel}>🤖 Axion</Text>}
            <Text style={[styles.bubbleText, item.role === "user" ? styles.textUser : styles.textAi]}>{item.content}</Text>
          </View>
        )}
      />

      {/* Typing indicator */}
      {loading && (
        <View style={styles.typingRow}>
          <View style={styles.typingBubble}>
            <Animated.Text style={[styles.typingDots, { opacity: dotAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }]}>
              ● ● ●
            </Animated.Text>
          </View>
        </View>
      )}

      {/* Suggestions */}
      {messages.length <= 1 && (
        <View style={styles.suggestionsRow}>
          {SUGGESTIONS.map((s, i) => (
            <TouchableOpacity key={i} style={styles.chip} onPress={() => send(s)} activeOpacity={0.7}>
              <Text style={styles.chipText}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Input */}
      <View style={styles.inputBar}>
        <TextInput style={styles.input} placeholder="Ask about your children..." placeholderTextColor={Colors.text3}
          value={text} onChangeText={setText} multiline maxLength={500} editable={!loading} />
        <TouchableOpacity style={[styles.sendBtn, (!text.trim() || loading) && { opacity: 0.4 }]}
          onPress={() => send()} disabled={!text.trim() || loading}>
          {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.sendText}>➤</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 48, paddingBottom: 12, paddingHorizontal: 16, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backText: { color: Colors.primary, fontSize: 14, fontWeight: "600" },
  headerCenter: { flexDirection: "row", alignItems: "center" },
  aiAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primaryPale, alignItems: "center", justifyContent: "center", marginRight: 10 },
  aiEmoji: { fontSize: 18 },
  headerTitle: { fontSize: 15, fontWeight: "700", color: Colors.text },
  headerSub: { fontSize: 11, color: Colors.text3 },
  messageList: { padding: 16, paddingBottom: 8 },
  bubble: { maxWidth: "85%", padding: 14, borderRadius: 16, marginBottom: 10 },
  bubbleUser: { alignSelf: "flex-end", backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  bubbleAi: { alignSelf: "flex-start", backgroundColor: Colors.surface, borderBottomLeftRadius: 4, ...Shadow },
  aiLabel: { fontSize: 11, fontWeight: "700", color: Colors.primary, marginBottom: 4 },
  bubbleText: { fontSize: 14, lineHeight: 21 },
  textUser: { color: "#fff" },
  textAi: { color: Colors.text },
  typingRow: { paddingHorizontal: 16, paddingBottom: 4 },
  typingBubble: { alignSelf: "flex-start", backgroundColor: Colors.surface, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, ...Shadow },
  typingDots: { fontSize: 14, color: Colors.primary, letterSpacing: 4 },
  suggestionsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 16, paddingBottom: 8 },
  chip: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.primary + "40", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, ...Shadow },
  chipText: { fontSize: 12, fontWeight: "600", color: Colors.primary },
  inputBar: { flexDirection: "row", alignItems: "flex-end", padding: 12, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border },
  input: { flex: 1, backgroundColor: Colors.bg, borderRadius: Radius.md, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: Colors.text, maxHeight: 80 },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center", marginLeft: 8 },
  sendText: { color: "#fff", fontSize: 18 },
});
