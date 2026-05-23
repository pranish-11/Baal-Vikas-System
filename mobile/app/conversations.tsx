import React, { useState, useEffect, useCallback } from "react";
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { getConversations } from "../lib/api";
import { useSocketEvent } from "../lib/socket";
import { Colors, Radius, Shadow } from "../lib/theme";

export default function ConversationsScreen() {
  const router = useRouter();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try { setConversations(await getConversations()); }
    catch (e) { console.warn(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, []);
  useSocketEvent("new_message", () => load());

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Messages</Text>
      </View>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.partnerId}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => router.push(`/chat/${item.partnerId}`)} activeOpacity={0.7}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.partner?.name?.[0] || "?"}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.nameRow}>
                <Text style={styles.name} numberOfLines={1}>{item.partner?.name || "Unknown"}</Text>
                <Text style={styles.time}>
                  {item.lastMessage?.createdAt ? new Date(item.lastMessage.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                </Text>
              </View>
              <View style={styles.previewRow}>
                <Text style={styles.preview} numberOfLines={1}>{item.lastMessage?.preview || "No messages yet"}</Text>
                {item.unreadCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{item.unreadCount}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.role}>{item.partner?.role}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>💬</Text>
            <Text style={styles.emptyTitle}>No conversations yet</Text>
            <Text style={styles.emptyText}>Start a conversation from a student's profile</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.bg },
  header: { paddingTop: 48, paddingHorizontal: 20, paddingBottom: 12 },
  backBtn: { marginBottom: 8 },
  backText: { color: Colors.primary, fontSize: 14, fontWeight: "600" },
  title: { fontSize: 24, fontWeight: "800", color: Colors.text },
  list: { padding: 16 },
  card: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 14, marginBottom: 10, ...Shadow },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primaryPale, alignItems: "center", justifyContent: "center", marginRight: 12 },
  avatarText: { fontSize: 18, fontWeight: "700", color: Colors.primary },
  nameRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  name: { fontSize: 15, fontWeight: "600", color: Colors.text, flex: 1, marginRight: 8 },
  time: { fontSize: 11, color: Colors.text3 },
  previewRow: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  preview: { fontSize: 13, color: Colors.text3, flex: 1, marginRight: 8 },
  unreadBadge: { backgroundColor: Colors.primary, minWidth: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center", paddingHorizontal: 6 },
  unreadText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  role: { fontSize: 10, color: Colors.text3, marginTop: 2, textTransform: "uppercase", fontWeight: "600" },
  emptyBox: { alignItems: "center", marginTop: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: Colors.text },
  emptyText: { fontSize: 13, color: Colors.text3, marginTop: 4 },
});
