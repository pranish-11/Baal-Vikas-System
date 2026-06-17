import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../lib/auth";
import { getNotices, getNotifications, markAllNotificationsRead, checkHealth, api, createNotice } from "../../lib/api";
import { useSocketEvent } from "../../lib/socket";
import { Colors, Radius, Shadow } from "../../lib/theme";
import { LinkIcon } from "../../lib/icons";

export default function MoreScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [notices, setNotices] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [online, setOnline] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  // Notice creation state
  const [noticeModal, setNoticeModal] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeBody, setNoticeBody] = useState("");
  const [noticeTargets, setNoticeTargets] = useState<string[]>(["TEACHER", "PARENT"]);
  const [submittingNotice, setSubmittingNotice] = useState(false);

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

  const toggleTarget = (role: string) => {
    setNoticeTargets((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleCreateNotice = async () => {
    if (!noticeTitle.trim() || !noticeBody.trim()) {
      Alert.alert("Missing Fields", "Please enter both title and body for the notice.");
      return;
    }
    if (noticeTargets.length === 0) {
      Alert.alert("Select Audience", "Please select at least one target audience.");
      return;
    }
    setSubmittingNotice(true);
    try {
      await createNotice({ title: noticeTitle.trim(), body: noticeBody.trim(), targetRoles: noticeTargets });
      setNoticeModal(false);
      setNoticeTitle("");
      setNoticeBody("");
      setNoticeTargets(["TEACHER", "PARENT"]);
      load();
      Alert.alert("Notice Published", "Your notice has been sent to the selected audience.");
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to create notice");
    } finally {
      setSubmittingNotice(false);
    }
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
          <LinkIcon name="people" label="People" onPress={() => router.push("/contacts")} />
          <LinkIcon name="message" label="Messages" onPress={() => router.push("/conversations")} />
          <LinkIcon name="complaint" label="Complaints" onPress={() => router.push("/complaints")} />
          <LinkIcon name="cctv" label="CCTV" onPress={() => router.push("/cctv")} />
          {user?.role === "ADMIN" && (
            <>
              <LinkIcon name="classroom" label="Classrooms" onPress={() => router.push("/classrooms")} />
              <LinkIcon name="teacher" label="Teachers" onPress={() => router.push("/teachers")} />
            </>
          )}
          {user?.role === "PARENT" && (
            <LinkIcon name="ai" label="AI Chat" onPress={() => router.push("/ai-chat")} />
          )}
          <LinkIcon name="trophy" label="Leaderboard" onPress={() => router.push("/leaderboard")} />
        </View>

        {/* Server Status */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Server Status</Text>
          <View style={styles.serverRow}>
            <View style={[styles.dot, { backgroundColor: online ? "#4CAF50" : Colors.coral }]} />
            <Text style={styles.serverText}>{online ? "Connected" : "Unreachable"}</Text>
          </View>
          <Text style={styles.serverUrl}>{api.defaults.baseURL}</Text>
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
        <View style={styles.noticeHeader}>
          <Text style={styles.sectionTitle}>School Notices</Text>
          {user?.role === "ADMIN" && (
            <TouchableOpacity style={styles.writeNoticeBtn} onPress={() => setNoticeModal(true)} activeOpacity={0.7}>
              <Text style={styles.writeNoticeBtnText}>+ Write Notice</Text>
            </TouchableOpacity>
          )}
        </View>
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

      {/* Notice Creation Modal */}
      <Modal visible={noticeModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Write Notice</Text>
              <TouchableOpacity onPress={() => setNoticeModal(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.fieldLabel}>Title</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Notice title..."
                placeholderTextColor={Colors.text3}
                value={noticeTitle}
                onChangeText={setNoticeTitle}
                maxLength={100}
              />

              <Text style={styles.fieldLabel}>Body</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Write your notice here..."
                placeholderTextColor={Colors.text3}
                value={noticeBody}
                onChangeText={setNoticeBody}
                multiline
                maxLength={1000}
                textAlignVertical="top"
              />

              <Text style={styles.fieldLabel}>Target Audience</Text>
              <View style={styles.targetRow}>
                {["TEACHER", "PARENT"].map((role) => (
                  <TouchableOpacity
                    key={role}
                    style={[styles.targetChip, noticeTargets.includes(role) && styles.targetChipActive]}
                    onPress={() => toggleTarget(role)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.targetChipText, noticeTargets.includes(role) && styles.targetChipTextActive]}>
                      {role === "TEACHER" ? "Teachers" : "Parents"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, submittingNotice && { opacity: 0.6 }]}
                onPress={handleCreateNotice}
                disabled={submittingNotice}
                activeOpacity={0.7}
              >
                {submittingNotice ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>Publish Notice</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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

  // Notices with write button
  noticeHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  writeNoticeBtn: { backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.md },
  writeNoticeBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  noticeCard: { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 14, marginBottom: 8, ...Shadow },
  noticeTitle: { fontSize: 14, fontWeight: "700", color: Colors.text },
  noticeBody: { fontSize: 13, color: Colors.text2, marginTop: 4, lineHeight: 18 },
  noticeDate: { fontSize: 11, color: Colors.text3, marginTop: 6 },
  empty: { textAlign: "center", color: Colors.text3, marginVertical: 20 },
  logoutBtn: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.coral, paddingVertical: 14, borderRadius: Radius.md, alignItems: "center", marginTop: 16 },
  logoutText: { color: Colors.coral, fontSize: 15, fontWeight: "700" },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: Colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "80%", paddingBottom: 32 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle: { fontSize: 18, fontWeight: "800", color: Colors.text },
  closeBtn: { fontSize: 20, color: Colors.text3, padding: 4 },
  modalBody: { padding: 20 },
  fieldLabel: { fontSize: 13, fontWeight: "700", color: Colors.text, marginBottom: 6, marginTop: 12 },
  textInput: { backgroundColor: Colors.surface, borderRadius: Radius.md, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: Colors.text, borderWidth: 1, borderColor: Colors.border },
  textArea: { minHeight: 100, maxHeight: 160, paddingTop: 12 },
  targetRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  targetChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface },
  targetChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryPale },
  targetChipText: { fontSize: 13, fontWeight: "600", color: Colors.text3 },
  targetChipTextActive: { color: Colors.primary },
  submitBtn: { backgroundColor: Colors.primary, paddingVertical: 14, borderRadius: Radius.md, alignItems: "center", marginTop: 24 },
  submitBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
