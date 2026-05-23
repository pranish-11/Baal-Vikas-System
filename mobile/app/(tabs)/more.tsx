import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../lib/auth";
import { getNotices, getNotifications, markAllNotificationsRead, checkHealth, API_BASE_URL } from "../../lib/api";
import { useSocketEvent } from "../../lib/socket";
import { Colors, Radius, Shadow } from "../../lib/theme";

export default function MoreScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [notices, setNotices] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [online, setOnline] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [n, h, notif] = await Promise.all([getNotices(), checkHealth(), getNotifications()]);
      setNotices(n);
      setOnline(h);
      setNotifications(notif);
    } catch { setOnline(false); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);
  useSocketEvent("notification", () => load());

  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  const handleMarkAllRead = async () => {
    try { await markAllNotificationsRead(); load(); } catch {}
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>More</Text>
      </View>
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {/* Profile */}
        <View style={styles.card}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.name?.[0] ?? "U"}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName}>{user?.name}</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
              <View style={styles.roleBadge}><Text style={styles.roleText}>{user?.role}</Text></View>
            </View>
          </View>
        </View>

        {/* Quick Links */}
        <View style={styles.linksRow}>
          <TouchableOpacity style={styles.linkCard} onPress={() => router.push("/contacts")}>
            <Text style={styles.linkEmoji}>👥</Text>
            <Text style={styles.linkLabel}>People</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkCard} onPress={() => router.push("/conversations")}>
            <Text style={styles.linkEmoji}>💬</Text>
            <Text style={styles.linkLabel}>Messages</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkCard} onPress={() => router.push("/complaints")}>
            <Text style={styles.linkEmoji}>📮</Text>
            <Text style={styles.linkLabel}>Complaints</Text>
          </TouchableOpacity>
          {user?.role === "PARENT" && (
            <TouchableOpacity style={styles.linkCard} onPress={() => router.push("/ai-chat")}>
              <Text style={styles.linkEmoji}>🤖</Text>
              <Text style={styles.linkLabel}>AI Chat</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Server Status */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Server Status</Text>
          <View style={styles.serverRow}>
            <View style={[styles.dot, { backgroundColor: online ? "#4CAF50" : Colors.coral }]} />
            <Text style={styles.serverText}>{online ? "Connected" : "Unreachable"}</Text>
          </View>
          <Text style={styles.serverUrl}>{API_BASE_URL}</Text>
        </View>

        {/* Notifications */}
        <View style={styles.notifHeader}>
          <Text style={styles.sectionTitle}>Notifications {unreadCount > 0 ? `(${unreadCount} new)` : ""}</Text>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={handleMarkAllRead}><Text style={styles.markRead}>Mark all read</Text></TouchableOpacity>
          )}
        </View>
        {loading ? <ActivityIndicator color={Colors.primary} /> : notifications.length === 0 ? (
          <Text style={styles.empty}>No notifications</Text>
        ) : notifications.slice(0, 20).map((n: any) => (
          <View key={n.id} style={[styles.notifCard, !n.isRead && styles.notifUnread]}>
            <View style={styles.notifDot}>
              {!n.isRead && <View style={styles.unreadDot} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.notifTitle}>{n.title}</Text>
              <Text style={styles.notifBody}>{n.body}</Text>
              <Text style={styles.notifDate}>{new Date(n.createdAt).toLocaleString()}</Text>
            </View>
          </View>
        ))}

        {/* Notices */}
        <Text style={styles.sectionTitle}>School Notices</Text>
        {notices.length === 0 ? (
          <Text style={styles.empty}>No notices</Text>
        ) : notices.map((n: any) => (
          <View key={n.id} style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>{n.title}</Text>
            <Text style={styles.noticeBody}>{n.body}</Text>
            <Text style={styles.noticeDate}>{new Date(n.createdAt).toLocaleDateString()}</Text>
          </View>
        ))}

        <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.7}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: "800", color: Colors.text },
  body: { flex: 1 },
  bodyContent: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 18, marginBottom: 12, ...Shadow },
  cardTitle: { fontSize: 14, fontWeight: "700", color: Colors.text, marginBottom: 8 },
  profileRow: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: Colors.primaryPale, alignItems: "center", justifyContent: "center", marginRight: 14 },
  avatarText: { fontSize: 20, fontWeight: "700", color: Colors.primary },
  profileName: { fontSize: 17, fontWeight: "700", color: Colors.text },
  profileEmail: { fontSize: 12, color: Colors.text3, marginTop: 2 },
  roleBadge: { backgroundColor: Colors.primaryPale, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: "flex-start", marginTop: 4 },
  roleText: { fontSize: 10, fontWeight: "700", color: Colors.primary },
  linksRow: { flexDirection: "row", gap: 10, flexWrap: "wrap", marginBottom: 12 },
  linkCard: { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 14, alignItems: "center", minWidth: 72, ...Shadow },
  linkEmoji: { fontSize: 22 },
  linkLabel: { fontSize: 10, fontWeight: "600", color: Colors.text2, marginTop: 4 },
  serverRow: { flexDirection: "row", alignItems: "center" },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  serverText: { fontSize: 14, fontWeight: "600", color: Colors.text },
  serverUrl: { fontSize: 11, color: Colors.text3, marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: Colors.text, marginBottom: 10, marginTop: 4 },
  notifHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  markRead: { fontSize: 12, color: Colors.primary, fontWeight: "600" },
  notifCard: { flexDirection: "row", alignItems: "flex-start", backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 12, marginBottom: 6, ...Shadow },
  notifUnread: { borderLeftWidth: 3, borderLeftColor: Colors.primary },
  notifDot: { width: 16, marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  notifTitle: { fontSize: 13, fontWeight: "700", color: Colors.text },
  notifBody: { fontSize: 12, color: Colors.text2, marginTop: 2, lineHeight: 16 },
  notifDate: { fontSize: 10, color: Colors.text3, marginTop: 4 },
  noticeCard: { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 14, marginBottom: 8, ...Shadow },
  noticeTitle: { fontSize: 14, fontWeight: "700", color: Colors.text },
  noticeBody: { fontSize: 13, color: Colors.text2, marginTop: 4, lineHeight: 18 },
  noticeDate: { fontSize: 11, color: Colors.text3, marginTop: 6 },
  empty: { textAlign: "center", color: Colors.text3, marginVertical: 20 },
  logoutBtn: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.coral, paddingVertical: 14, borderRadius: Radius.md, alignItems: "center", marginTop: 16 },
  logoutText: { color: Colors.coral, fontSize: 15, fontWeight: "700" },
});
