import React, { useState, useEffect, useCallback } from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from "react-native";
import { useAuth } from "../../lib/auth";
import { getTodayAttendance, markAttendance, getDashboard, getAttendance, getClassrooms } from "../../lib/api";
import { Colors, Radius, Shadow } from "../../lib/theme";

const STATUS_OPTIONS = ["PRESENT", "ABSENT", "LATE", "LEAVE"];
const STATUS_EMOJI: Record<string, string> = { PRESENT: "✅", ABSENT: "❌", LATE: "⏰", LEAVE: "📝" };
const STATUS_COLOR: Record<string, string> = { PRESENT: "#4CAF50", ABSENT: Colors.coral, LATE: Colors.gold, LEAVE: Colors.lavender };

export default function AttendanceScreen() {
  const { user } = useAuth();
  if (user?.role === "ADMIN") return <AdminView />;
  if (user?.role === "TEACHER") return <TeacherView />;
  return <ParentView />;
}

function AdminView() {
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [selectedClassroom, setSelectedClassroom] = useState<string | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [allRecords, setAllRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const [mode, setMode] = useState<"overview" | "mark">("overview");

  const load = useCallback(async () => {
    try {
      const [cls, records] = await Promise.all([getClassrooms(), getAttendance()]);
      setClassrooms(cls);
      setAllRecords(records);
    } catch (e) { console.warn(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, []);

  const loadClassroom = async (classroomId: string) => {
    setSelectedClassroom(classroomId);
    setMode("mark");
    try {
      const today = await getTodayAttendance(classroomId);
      setStudents(today);
      const map: Record<string, string> = {};
      today.forEach((s: any) => { if (s.status) map[s.studentId] = s.status; });
      setStatuses(map);
    } catch (e) { console.warn(e); }
  };

  const toggleStatus = (studentId: string) => {
    setStatuses((prev) => {
      const current = prev[studentId] || "";
      const idx = STATUS_OPTIONS.indexOf(current);
      return { ...prev, [studentId]: STATUS_OPTIONS[(idx + 1) % STATUS_OPTIONS.length] };
    });
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      const records = Object.entries(statuses).map(([studentId, status]) => ({ studentId, status }));
      if (records.length === 0) { Alert.alert("No attendance", "Tap on students first"); setSaving(false); return; }
      await markAttendance(records);
      Alert.alert("Saved", `Marked attendance for ${records.length} students`);
    } catch (e: any) { Alert.alert("Error", e.message); }
    finally { setSaving(false); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  if (mode === "mark" && selectedClassroom) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setMode("overview")}><Text style={styles.backLink}>← All Classrooms</Text></TouchableOpacity>
          <Text style={styles.title}>Mark Attendance</Text>
          <Text style={styles.subtitle}>Today • {new Date().toLocaleDateString()}</Text>
        </View>
        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
          {students.map((s: any) => (
            <TouchableOpacity key={s.studentId} style={styles.attendCard} onPress={() => toggleStatus(s.studentId)} activeOpacity={0.7}>
              <View style={styles.attendAvatar}><Text style={styles.attendInitial}>{s.firstName[0]}</Text></View>
              <Text style={styles.attendName}>{s.firstName} {s.lastName}</Text>
              <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[statuses[s.studentId]] ? STATUS_COLOR[statuses[s.studentId]] + "20" : Colors.border }]}>
                <Text style={styles.statusEmoji}>{STATUS_EMOJI[statuses[s.studentId]] || "—"}</Text>
                <Text style={[styles.statusText, { color: STATUS_COLOR[statuses[s.studentId]] || Colors.text3 }]}>{statuses[s.studentId] || "Tap"}</Text>
              </View>
            </TouchableOpacity>
          ))}
          {students.length === 0 && <Text style={styles.empty}>No students in this classroom</Text>}
        </ScrollView>
        <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={saveAll} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Attendance</Text>}
        </TouchableOpacity>
      </View>
    );
  }

  // Overview mode — show all classrooms + recent records
  const present = allRecords.filter((r: any) => r.status === "PRESENT").length;
  const absent = allRecords.filter((r: any) => r.status === "ABSENT").length;
  const late = allRecords.filter((r: any) => r.status === "LATE").length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>All Attendance</Text>
        <Text style={styles.subtitle}>{allRecords.length} records total</Text>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {/* Summary stats */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: "#E8F5E9" }]}>
            <Text style={[styles.summaryValue, { color: "#4CAF50" }]}>{present}</Text>
            <Text style={[styles.summaryLabel, { color: "#4CAF50" }]}>Present</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: Colors.coralPale }]}>
            <Text style={[styles.summaryValue, { color: Colors.coral }]}>{absent}</Text>
            <Text style={[styles.summaryLabel, { color: Colors.coral }]}>Absent</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: Colors.goldPale }]}>
            <Text style={[styles.summaryValue, { color: Colors.gold }]}>{late}</Text>
            <Text style={[styles.summaryLabel, { color: Colors.gold }]}>Late</Text>
          </View>
        </View>

        {/* Classrooms */}
        <Text style={styles.sectionTitle}>Classrooms — Tap to Mark</Text>
        {classrooms.map((c: any) => (
          <TouchableOpacity key={c.id} style={styles.classCard} onPress={() => loadClassroom(c.id)} activeOpacity={0.7}>
            <View style={styles.classAvatar}><Text style={styles.classEmoji}>🏫</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.className}>{c.name}</Text>
              <Text style={styles.classMeta}>{c.teacher || "No teacher"} • {c.studentCount || 0} students</Text>
            </View>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>
        ))}

        {/* Recent records */}
        <Text style={styles.sectionTitle}>Recent Records</Text>
        {allRecords.slice(0, 30).map((r: any) => (
          <View key={r.id} style={styles.historyCard}>
            <Text style={styles.historyEmoji}>{STATUS_EMOJI[r.status]}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.historyName}>{r.student?.firstName} {r.student?.lastName}</Text>
              <Text style={styles.historyDate}>{new Date(r.date).toLocaleDateString()}</Text>
            </View>
            <View style={[styles.historyBadge, { backgroundColor: STATUS_COLOR[r.status] + "20" }]}>
              <Text style={[styles.historyStatus, { color: STATUS_COLOR[r.status] }]}>{r.status}</Text>
            </View>
          </View>
        ))}
        {allRecords.length === 0 && <Text style={styles.empty}>No attendance records yet</Text>}
      </ScrollView>
    </View>
  );
}

function TeacherView() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statuses, setStatuses] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    try {
      const dash = await getDashboard();
      if (dash.classroomId) {
        const today = await getTodayAttendance(dash.classroomId);
        setStudents(today);
        const map: Record<string, string> = {};
        today.forEach((s: any) => { if (s.status) map[s.studentId] = s.status; });
        setStatuses(map);
      }
    } catch (e) { console.warn(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, []);

  const toggleStatus = (studentId: string) => {
    setStatuses((prev) => {
      const current = prev[studentId] || "";
      const idx = STATUS_OPTIONS.indexOf(current);
      return { ...prev, [studentId]: STATUS_OPTIONS[(idx + 1) % STATUS_OPTIONS.length] };
    });
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      const records = Object.entries(statuses).map(([studentId, status]) => ({ studentId, status }));
      if (records.length === 0) { Alert.alert("No attendance", "Tap on students to mark attendance"); setSaving(false); return; }
      await markAttendance(records);
      Alert.alert("Saved", `Marked attendance for ${records.length} students`);
    } catch (e: any) { Alert.alert("Error", e.message); }
    finally { setSaving(false); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mark Attendance</Text>
        <Text style={styles.subtitle}>Today • {new Date().toLocaleDateString()}</Text>
      </View>
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {students.map((s: any) => (
          <TouchableOpacity key={s.studentId} style={styles.attendCard} onPress={() => toggleStatus(s.studentId)} activeOpacity={0.7}>
            <View style={styles.attendAvatar}><Text style={styles.attendInitial}>{s.firstName[0]}</Text></View>
            <Text style={styles.attendName}>{s.firstName} {s.lastName}</Text>
            <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[statuses[s.studentId]] ? STATUS_COLOR[statuses[s.studentId]] + "20" : Colors.border }]}>
              <Text style={styles.statusEmoji}>{STATUS_EMOJI[statuses[s.studentId]] || "—"}</Text>
              <Text style={[styles.statusText, { color: STATUS_COLOR[statuses[s.studentId]] || Colors.text3 }]}>{statuses[s.studentId] || "Tap"}</Text>
            </View>
          </TouchableOpacity>
        ))}
        {students.length === 0 && <Text style={styles.empty}>No classroom assigned or no students</Text>}
      </ScrollView>
      <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={saveAll} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Attendance</Text>}
      </TouchableOpacity>
    </View>
  );
}

function ParentView() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { setRecords(await getAttendance()); } catch (e) { console.warn(e); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Attendance History</Text></View>
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {records.map((r: any) => (
          <View key={r.id} style={styles.historyCard}>
            <Text style={styles.historyEmoji}>{STATUS_EMOJI[r.status]}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.historyName}>{r.student?.firstName} {r.student?.lastName}</Text>
              <Text style={styles.historyDate}>{new Date(r.date).toLocaleDateString()}</Text>
            </View>
            <View style={[styles.historyBadge, { backgroundColor: STATUS_COLOR[r.status] + "20" }]}>
              <Text style={[styles.historyStatus, { color: STATUS_COLOR[r.status] }]}>{r.status}</Text>
            </View>
          </View>
        ))}
        {records.length === 0 && <Text style={styles.empty}>No attendance records yet</Text>}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.bg },
  header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: "800", color: Colors.text },
  subtitle: { fontSize: 13, color: Colors.text3, marginTop: 2 },
  backLink: { color: Colors.primary, fontSize: 14, fontWeight: "600", marginBottom: 6 },
  body: { flex: 1 },
  bodyContent: { padding: 16, paddingBottom: 100 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: Colors.text, marginBottom: 10, marginTop: 8 },
  summaryRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  summaryCard: { flex: 1, borderRadius: Radius.sm, padding: 14, alignItems: "center" },
  summaryValue: { fontSize: 20, fontWeight: "800" },
  summaryLabel: { fontSize: 10, fontWeight: "600", marginTop: 2 },
  classCard: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 14, marginBottom: 8, ...Shadow },
  classAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primaryPale, alignItems: "center", justifyContent: "center", marginRight: 12 },
  classEmoji: { fontSize: 18 },
  className: { fontSize: 15, fontWeight: "600", color: Colors.text },
  classMeta: { fontSize: 12, color: Colors.text3, marginTop: 2 },
  arrow: { fontSize: 18, color: Colors.text3 },
  attendCard: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 14, marginBottom: 8, ...Shadow },
  attendAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.primaryPale, alignItems: "center", justifyContent: "center", marginRight: 12 },
  attendInitial: { fontSize: 16, fontWeight: "700", color: Colors.primary },
  attendName: { flex: 1, fontSize: 15, fontWeight: "600", color: Colors.text },
  statusBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  statusEmoji: { fontSize: 14, marginRight: 4 },
  statusText: { fontSize: 11, fontWeight: "600" },
  saveBtn: { position: "absolute", bottom: 20, left: 16, right: 16, backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: Radius.md, alignItems: "center", ...Shadow },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  empty: { textAlign: "center", color: Colors.text3, marginTop: 40 },
  historyCard: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 14, marginBottom: 8, ...Shadow },
  historyEmoji: { fontSize: 20, marginRight: 12 },
  historyName: { fontSize: 14, fontWeight: "600", color: Colors.text },
  historyDate: { fontSize: 12, color: Colors.text3, marginTop: 2 },
  historyBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  historyStatus: { fontSize: 10, fontWeight: "700" },
});
