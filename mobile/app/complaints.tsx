import React, { useState, useEffect, useCallback } from "react";
import { StyleSheet, Text, View, FlatList, TouchableOpacity, TextInput, Modal, Alert, ActivityIndicator, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../lib/auth";
import { getComplaints, createComplaint, updateComplaint } from "../lib/api";
import { useSocketEvent } from "../lib/socket";
import { Colors, Radius, Shadow } from "../lib/theme";

const STATUS_COLOR: Record<string, string> = { OPEN: Colors.coral, UNDER_REVIEW: Colors.gold, RESOLVED: "#4CAF50" };
const STATUS_EMOJI: Record<string, string> = { OPEN: "🔴", UNDER_REVIEW: "🔍", RESOLVED: "✅" };
const PRIORITIES = ["LOW", "MEDIUM", "HIGH"];

export default function ComplaintsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showReply, setShowReply] = useState<any>(null);

  // New complaint form
  const [subject, setSubject] = useState("");
  const [details, setDetails] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [submitting, setSubmitting] = useState(false);

  // Reply form
  const [replyText, setReplyText] = useState("");
  const [replyStatus, setReplyStatus] = useState("");

  const load = useCallback(async () => {
    try { setComplaints(await getComplaints()); }
    catch (e) { console.warn(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, []);
  useSocketEvent("notification", (d: any) => {
    if (d.type === "COMPLAINT" || d.type === "COMPLAINT_UPDATE") load();
  });

  const handleSubmit = async () => {
    if (!subject.trim() || !details.trim()) { Alert.alert("Error", "Subject and details required"); return; }
    setSubmitting(true);
    try {
      await createComplaint({ subject: subject.trim(), details: details.trim(), priority });
      Alert.alert("Submitted", "Your complaint has been filed.");
      setSubject(""); setDetails(""); setPriority("MEDIUM"); setShowNew(false);
      load();
    } catch (e: any) { Alert.alert("Error", e.message); }
    finally { setSubmitting(false); }
  };

  const handleReply = async () => {
    if (!replyText.trim() && !replyStatus) { Alert.alert("Error", "Add a reply or change status"); return; }
    setSubmitting(true);
    try {
      await updateComplaint(showReply.id, {
        ...(replyStatus ? { status: replyStatus } : {}),
        ...(replyText.trim() ? { reply: replyText.trim() } : {}),
      });
      Alert.alert("Updated", "Complaint has been updated.");
      setReplyText(""); setReplyStatus(""); setShowReply(null);
      load();
    } catch (e: any) { Alert.alert("Error", e.message); }
    finally { setSubmitting(false); }
  };

  const isStaff = user?.role === "ADMIN" || user?.role === "TEACHER";

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
        <Text style={styles.title}>Complaint Box</Text>
      </View>

      <FlatList
        data={complaints}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        ListHeaderComponent={
          !isStaff ? (
            <TouchableOpacity style={styles.newBtn} onPress={() => setShowNew(true)}>
              <Text style={styles.newBtnText}>+ File New Complaint</Text>
            </TouchableOpacity>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardSubject}>{item.subject}</Text>
                <Text style={styles.cardDate}>{new Date(item.createdAt).toLocaleDateString()} • {item.priority}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLOR[item.status] || Colors.text3) + "20" }]}>
                <Text style={styles.statusEmoji}>{STATUS_EMOJI[item.status] || "❓"}</Text>
                <Text style={[styles.statusText, { color: STATUS_COLOR[item.status] || Colors.text3 }]}>
                  {item.status === "UNDER_REVIEW" ? "Under Review" : item.status}
                </Text>
              </View>
            </View>
            <Text style={styles.cardDetails}>{item.details}</Text>
            {item.resolvedAt && <Text style={styles.resolvedText}>Resolved: {new Date(item.resolvedAt).toLocaleDateString()}</Text>}
            {isStaff && (
              <TouchableOpacity style={styles.replyBtn} onPress={() => { setShowReply(item); setReplyStatus(item.status); }}>
                <Text style={styles.replyBtnText}>Reply / Update Status</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No complaints filed yet</Text>}
      />

      {/* New Complaint Modal */}
      <Modal visible={showNew} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>File a Complaint</Text>
            <TextInput style={styles.modalInput} placeholder="Subject" value={subject} onChangeText={setSubject} placeholderTextColor={Colors.text3} />
            <TextInput style={[styles.modalInput, { height: 100, textAlignVertical: "top" }]} placeholder="Details — describe your concern" value={details} onChangeText={setDetails} multiline placeholderTextColor={Colors.text3} />
            <Text style={styles.label}>Priority</Text>
            <View style={styles.priorityRow}>
              {PRIORITIES.map((p) => (
                <TouchableOpacity key={p} style={[styles.priorityBtn, priority === p && styles.priorityActive]} onPress={() => setPriority(p)}>
                  <Text style={[styles.priorityText, priority === p && styles.priorityTextActive]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowNew(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.submitBtn, submitting && { opacity: 0.5 }]} onPress={handleSubmit} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.submitText}>Submit</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reply Modal (Staff) */}
      <Modal visible={!!showReply} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Respond to Complaint</Text>
            <Text style={styles.modalSubject}>{showReply?.subject}</Text>
            <Text style={styles.label}>Update Status</Text>
            <View style={styles.priorityRow}>
              {["OPEN", "UNDER_REVIEW", "RESOLVED"].map((s) => (
                <TouchableOpacity key={s} style={[styles.priorityBtn, replyStatus === s && { backgroundColor: STATUS_COLOR[s] + "30", borderColor: STATUS_COLOR[s] }]}
                  onPress={() => setReplyStatus(s)}>
                  <Text style={[styles.priorityText, replyStatus === s && { color: STATUS_COLOR[s] }]}>{STATUS_EMOJI[s]} {s === "UNDER_REVIEW" ? "Review" : s}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={[styles.modalInput, { height: 80, textAlignVertical: "top" }]} placeholder="Your reply (optional)" value={replyText} onChangeText={setReplyText} multiline placeholderTextColor={Colors.text3} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowReply(null)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.submitBtn, submitting && { opacity: 0.5 }]} onPress={handleReply} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.submitText}>Update</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.bg },
  header: { paddingTop: 48, paddingHorizontal: 20, paddingBottom: 12 },
  backText: { color: Colors.primary, fontSize: 14, fontWeight: "600", marginBottom: 8 },
  title: { fontSize: 24, fontWeight: "800", color: Colors.text },
  list: { padding: 16 },
  newBtn: { backgroundColor: Colors.primary, paddingVertical: 14, borderRadius: Radius.md, alignItems: "center", marginBottom: 16 },
  newBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 16, marginBottom: 10, ...Shadow },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  cardSubject: { fontSize: 15, fontWeight: "700", color: Colors.text, flex: 1, marginRight: 8 },
  cardDate: { fontSize: 11, color: Colors.text3, marginTop: 2 },
  statusBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusEmoji: { fontSize: 12, marginRight: 4 },
  statusText: { fontSize: 10, fontWeight: "700" },
  cardDetails: { fontSize: 13, color: Colors.text2, lineHeight: 18 },
  resolvedText: { fontSize: 11, color: "#4CAF50", marginTop: 6, fontWeight: "600" },
  replyBtn: { marginTop: 10, backgroundColor: Colors.primaryPale, paddingVertical: 8, borderRadius: 6, alignItems: "center" },
  replyBtnText: { color: Colors.primary, fontSize: 12, fontWeight: "700" },
  empty: { textAlign: "center", color: Colors.text3, marginTop: 40 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modal: { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: "800", color: Colors.text, marginBottom: 16 },
  modalSubject: { fontSize: 14, fontWeight: "600", color: Colors.text2, marginBottom: 12 },
  modalInput: { backgroundColor: Colors.bg, borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: Colors.text, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  label: { fontSize: 13, fontWeight: "600", color: Colors.text2, marginBottom: 6 },
  priorityRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  priorityBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: Colors.border },
  priorityActive: { backgroundColor: Colors.primaryPale, borderColor: Colors.primary },
  priorityText: { fontSize: 12, fontWeight: "600", color: Colors.text3 },
  priorityTextActive: { color: Colors.primary },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: Radius.md, alignItems: "center", borderWidth: 1, borderColor: Colors.border },
  cancelText: { color: Colors.text2, fontSize: 14, fontWeight: "600" },
  submitBtn: { flex: 1, backgroundColor: Colors.primary, paddingVertical: 14, borderRadius: Radius.md, alignItems: "center" },
  submitText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});
