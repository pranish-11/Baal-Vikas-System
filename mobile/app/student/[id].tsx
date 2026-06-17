import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, TouchableOpacity, TextInput, Alert, Modal } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "../../lib/auth";
import { getStudent, updateBehaviorPoints, createObservation, getClassrooms, assignClassroom } from "../../lib/api";
import { Colors, Radius, Shadow } from "../../lib/theme";

const OBS_TAGS = ["focused", "social", "eating well", "creative", "active", "curious", "helpful", "good listener", "energetic", "needs support", "quiet today"];

const STATUS_COLOR: Record<string, string> = { PRESENT: "#4CAF50", ABSENT: "#E8614A", LATE: "#F5A623", LEAVE: "#7C6EE7" };

export default function StudentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showObs, setShowObs] = useState(false);
  const [obsTags, setObsTags] = useState<string[]>([]);
  const [obsNote, setObsNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [showClassModal, setShowClassModal] = useState(false);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const isStaff = user?.role === "TEACHER" || user?.role === "ADMIN";

  const reload = async () => { try { setStudent(await getStudent(id!)); } catch {} };

  const handlePoints = async (pts: number) => {
    try {
      await updateBehaviorPoints(id!, pts, pts > 0 ? "Good behavior" : "Needs improvement");
      Alert.alert("Updated", `${pts > 0 ? "+" : ""}${pts} behavior points`);
      reload();
    } catch (e: any) { Alert.alert("Error", e.message); }
  };

  const handleObsSubmit = async () => {
    if (obsTags.length === 0) { Alert.alert("Error", "Select at least one tag"); return; }
    setSaving(true);
    try {
      await createObservation({ studentId: id!, tags: obsTags, note: obsNote || undefined });
      Alert.alert("Saved", "Observation recorded and parent notified");
      setShowObs(false); setObsTags([]); setObsNote("");
      reload();
    } catch (e: any) { Alert.alert("Error", e.message); }
    finally { setSaving(false); }
  };

  const handleReassign = async (classroomId: string) => {
    setSaving(true);
    try {
      await assignClassroom(id!, classroomId);
      Alert.alert("Success", "Student reassigned successfully");
      setShowClassModal(false);
      reload();
    } catch (e: any) { Alert.alert("Error", e.message); }
    finally { setSaving(false); }
  };

  const openClassModal = async () => {
    setShowClassModal(true);
    try { setClassrooms(await getClassrooms()); } catch (e) { console.warn(e); }
  };

  useEffect(() => {
    (async () => {
      try { setStudent(await getStudent(id!)); }
      catch (e) { console.warn(e); }
      finally { setLoading(false); }
    })();
  }, [id]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  if (!student) return <View style={styles.center}><Text style={styles.empty}>Student not found</Text></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{student.firstName[0]}{student.lastName[0]}</Text>
          </View>
          <View>
            <Text style={styles.name}>{student.firstName} {student.lastName}</Text>
            <Text style={styles.meta}>{student.classroom} • Age {student.age}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {/* Info Cards */}
        <View style={styles.infoRow}>
          <InfoCard label="Behavior" value={`${student.behaviorPoints} pts`} color={Colors.gold} bg={Colors.goldPale} />
          <InfoCard label="Attendance" value={`${student.attendance.rate}%`} color="#4CAF50" bg="#E8F5E9" />
          <InfoCard label="Enrolled" value={new Date(student.enrollmentDate).toLocaleDateString(undefined, { year: "numeric", month: "short" })} color={Colors.sky} bg={Colors.skyPale} />
        </View>

        {/* Teacher Actions */}
        {isStaff && (
          <>
            <Text style={styles.sectionTitle}>Teacher Actions</Text>
            <View style={styles.teacherActions}>
              <TouchableOpacity style={styles.rewardBtn} onPress={() => handlePoints(5)}>
                <Text style={styles.rewardText}>★ +5 Points</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.rewardBtn} onPress={() => handlePoints(1)}>
                <Text style={styles.rewardText}>☆ +1 Point</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.rewardBtn, { backgroundColor: Colors.coralPale }]} onPress={() => handlePoints(-1)}>
                <Text style={[styles.rewardText, { color: Colors.coral }]}>−1 Point</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.obsBtn} onPress={() => setShowObs(true)}>
                <Text style={styles.obsBtnText}>✎ Add Observation</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.obsBtn, { backgroundColor: Colors.skyPale }]} onPress={openClassModal}>
                <Text style={[styles.obsBtnText, { color: Colors.sky }]}>⇄ Reassign</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Attendance Summary */}
        <Text style={styles.sectionTitle}>Attendance (Last 30 Days)</Text>
        <View style={styles.card}>
          <View style={styles.attRow}>
            <AttStat label="Present" value={student.attendance.present} color="#4CAF50" />
            <AttStat label="Absent" value={student.attendance.absent} color="#E8614A" />
            <AttStat label="Late" value={student.attendance.late} color="#F5A623" />
            <AttStat label="Total" value={student.attendance.total} color={Colors.text2} />
          </View>
        </View>

        {/* Recent Attendance */}
        {student.attendance.recent?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Recent Attendance</Text>
            {student.attendance.recent.map((a: any, i: number) => (
              <View key={i} style={styles.historyItem}>
                <View style={[styles.statusDot, { backgroundColor: STATUS_COLOR[a.status] || Colors.text3 }]} />
                <Text style={styles.historyDate}>{new Date(a.date).toLocaleDateString()}</Text>
                <Text style={[styles.historyStatus, { color: STATUS_COLOR[a.status] }]}>{a.status}</Text>
              </View>
            ))}
          </>
        )}

        {/* Teacher Observations */}
        {student.observations?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Teacher Observations</Text>
            {student.observations.map((o: any) => (
              <View key={o.id} style={styles.obsCard}>
                <View style={styles.tagsRow}>
                  {o.tags.map((t: string, i: number) => (
                    <View key={i} style={styles.tag}>
                      <Text style={styles.tagText}>{t}</Text>
                    </View>
                  ))}
                </View>
                {o.note && <Text style={styles.obsNote}>{o.note}</Text>}
                <Text style={styles.obsDate}>{new Date(o.date).toLocaleDateString()}</Text>
              </View>
            ))}
          </>
        )}

        {/* Fees */}
        {student.fees?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Fees</Text>
            {student.fees.map((f: any) => (
              <View key={f.id} style={styles.feeCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.feeTitle}>{f.title}</Text>
                  <Text style={styles.feeDue}>Due: {new Date(f.dueDate).toLocaleDateString()}</Text>
                </View>
                <View>
                  <Text style={styles.feeAmount}>NPR {f.amount.toLocaleString()}</Text>
                  <View style={[styles.feeBadge, { backgroundColor: f.status === "PAID" ? "#E8F5E9" : "#FDE8E4" }]}>
                    <Text style={[styles.feeStatus, { color: f.status === "PAID" ? "#4CAF50" : Colors.coral }]}>{f.status}</Text>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Message button */}
        <TouchableOpacity style={styles.msgBtn} onPress={() => router.push(`/chat/${isStaff ? student.parentId || "" : student.teacherId || ""}`)}
          disabled={!(isStaff ? true : true)}>
          <Text style={styles.msgBtnText}>✉ {isStaff ? "Message Parent" : "Message Teacher"}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Observation Modal */}
      <Modal visible={showObs} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Add Observation</Text>
            <Text style={styles.modalLabel}>Tags (tap to select)</Text>
            <View style={styles.obsTagsRow}>
              {OBS_TAGS.map((t) => (
                <TouchableOpacity key={t} style={[styles.obsTag, obsTags.includes(t) && styles.obsTagActive]}
                  onPress={() => setObsTags((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t])}>
                  <Text style={[styles.obsTagText, obsTags.includes(t) && styles.obsTagTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={styles.obsInput} placeholder="Notes (optional)" value={obsNote} onChangeText={setObsNote}
              multiline placeholderTextColor={Colors.text3} />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn2} onPress={() => setShowObs(false)}><Text style={styles.cancelText2}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn2, saving && { opacity: 0.5 }]} onPress={handleObsSubmit} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveText2}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reassign Modal */}
      <Modal visible={showClassModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <Text style={styles.modalTitle}>Reassign Classroom</Text>
              <TouchableOpacity onPress={() => setShowClassModal(false)}><Text style={{ color: Colors.coral, fontWeight: "600" }}>Close</Text></TouchableOpacity>
            </View>
            {saving ? <ActivityIndicator size="large" color={Colors.primary} style={{ marginVertical: 40 }} /> : (
              classrooms.map(c => (
                <TouchableOpacity key={c.id} style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border }} onPress={() => handleReassign(c.id)}>
                  <Text style={{ fontSize: 16, fontWeight: "600", color: Colors.text }}>{c.name}</Text>
                  <Text style={{ fontSize: 12, color: Colors.text3, marginTop: 4 }}>Teacher: {c.teacher}</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function InfoCard({ label, value, color, bg }: any) {
  return (
    <View style={[styles.infoCard, { backgroundColor: bg }]}>
      <Text style={[styles.infoValue, { color }]}>{value}</Text>
      <Text style={[styles.infoLabel, { color }]}>{label}</Text>
    </View>
  );
}

function AttStat({ label, value, color }: any) {
  return (
    <View style={styles.attStat}>
      <Text style={[styles.attValue, { color }]}>{value}</Text>
      <Text style={styles.attLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.bg },
  empty: { color: Colors.text3, fontSize: 15 },
  header: { backgroundColor: Colors.primary, paddingTop: 48, paddingBottom: 20, paddingHorizontal: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  backBtn: { marginBottom: 12 },
  backText: { color: "rgba(255,255,255,0.8)", fontSize: 14, fontWeight: "600" },
  profileRow: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", marginRight: 14 },
  avatarText: { fontSize: 18, fontWeight: "700", color: "#fff" },
  name: { fontSize: 20, fontWeight: "800", color: "#fff" },
  meta: { fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 2 },
  body: { flex: 1 },
  bodyContent: { padding: 16, paddingBottom: 40 },
  infoRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  infoCard: { flex: 1, borderRadius: Radius.sm, padding: 14, alignItems: "center" },
  infoValue: { fontSize: 16, fontWeight: "800" },
  infoLabel: { fontSize: 10, fontWeight: "600", marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: Colors.text, marginBottom: 10, marginTop: 8 },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 16, marginBottom: 12, ...Shadow },
  attRow: { flexDirection: "row", justifyContent: "space-around" },
  attStat: { alignItems: "center" },
  attValue: { fontSize: 20, fontWeight: "800" },
  attLabel: { fontSize: 11, color: Colors.text3, marginTop: 2 },
  historyItem: { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  historyDate: { flex: 1, fontSize: 13, color: Colors.text2 },
  historyStatus: { fontSize: 12, fontWeight: "600" },
  obsCard: { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 14, marginBottom: 8, ...Shadow },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 6 },
  tag: { backgroundColor: Colors.primaryPale, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  tagText: { fontSize: 11, fontWeight: "600", color: Colors.primary },
  obsNote: { fontSize: 13, color: Colors.text2, lineHeight: 18 },
  obsDate: { fontSize: 11, color: Colors.text3, marginTop: 6 },
  feeCard: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 14, marginBottom: 8, ...Shadow },
  feeTitle: { fontSize: 13, fontWeight: "600", color: Colors.text },
  feeDue: { fontSize: 11, color: Colors.text3, marginTop: 2 },
  feeAmount: { fontSize: 16, fontWeight: "800", color: Colors.text, textAlign: "right" },
  feeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 2, alignSelf: "flex-end" },
  feeStatus: { fontSize: 9, fontWeight: "700" },
  teacherActions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  rewardBtn: { backgroundColor: Colors.goldPale, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
  rewardText: { fontSize: 13, fontWeight: "700", color: Colors.gold },
  obsBtn: { backgroundColor: Colors.primaryPale, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
  obsBtnText: { fontSize: 13, fontWeight: "700", color: Colors.primary },
  msgBtn: { backgroundColor: Colors.primary, paddingVertical: 14, borderRadius: Radius.md, alignItems: "center", marginTop: 16 },
  msgBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modal: { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: "800", color: Colors.text, marginBottom: 12 },
  modalLabel: { fontSize: 13, fontWeight: "600", color: Colors.text2, marginBottom: 8 },
  obsTagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 },
  obsTag: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: Colors.border },
  obsTagActive: { backgroundColor: Colors.primaryPale, borderColor: Colors.primary },
  obsTagText: { fontSize: 12, color: Colors.text3 },
  obsTagTextActive: { color: Colors.primary, fontWeight: "600" },
  obsInput: { backgroundColor: Colors.bg, borderRadius: Radius.md, padding: 12, fontSize: 14, color: Colors.text, height: 80, textAlignVertical: "top", borderWidth: 1, borderColor: Colors.border, marginBottom: 16 },
  modalBtns: { flexDirection: "row", gap: 12 },
  cancelBtn2: { flex: 1, paddingVertical: 14, borderRadius: Radius.md, alignItems: "center", borderWidth: 1, borderColor: Colors.border },
  cancelText2: { color: Colors.text2, fontWeight: "600" },
  saveBtn2: { flex: 1, backgroundColor: Colors.primary, paddingVertical: 14, borderRadius: Radius.md, alignItems: "center" },
  saveText2: { color: "#fff", fontWeight: "700" },
});
