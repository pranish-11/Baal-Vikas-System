import React, { useState, useEffect, useCallback } from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from "react-native";
import { useAuth } from "../../lib/auth";
import { getTodayAttendance, markAttendance, getDashboard, getAttendance, getClassrooms } from "../../lib/api";
import { Colors, Radius, Shadow } from "../../lib/theme";

const STATUS_OPTIONS = ["PRESENT", "ABSENT", "LATE", "LEAVE"];
const STATUS_EMOJI: Record<string, string> = { PRESENT: "✓", ABSENT: "✕", LATE: "◔", LEAVE: "▤" };
const STATUS_COLOR: Record<string, string> = { PRESENT: "#4CAF50", ABSENT: Colors.coral, LATE: Colors.gold, LEAVE: Colors.lavender };

export default function AttendanceScreen() {
  const { user } = useAuth();
  if (user?.role === "ADMIN") return <AdminView />;
  if (user?.role === "TEACHER") return <TeacherView />;
  return <ParentView />;
}

// Reusable Monthly Report Component
function MonthlyReportView({
  records,
  students,
  selectedStudentId,
  setSelectedStudentId,
  classrooms,
  selectedClassroomId,
  setSelectedClassroomId,
  refreshing,
  onRefresh,
}: {
  records: any[];
  students?: { id: string; name: string }[];
  selectedStudentId?: string | null;
  setSelectedStudentId?: (id: string | null) => void;
  classrooms?: { id: string; name: string }[];
  selectedClassroomId?: string | null;
  setSelectedClassroomId?: (id: string | null) => void;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const [selectedMonthKey, setSelectedMonthKey] = useState<string | null>(null);

  // Group months
  const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  const monthMap = new Map<string, { key: string; label: string }>();
  
  // Always include the current month
  const now = new Date();
  const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  monthMap.set(currentKey, {
    key: currentKey,
    label: `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`
  });

  records.forEach((r: any) => {
    const d = new Date(r.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthMap.set(key, {
      key,
      label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`
    });
  });

  const availableMonths = Array.from(monthMap.values()).sort((a, b) => b.key.localeCompare(a.key));

  useEffect(() => {
    if (availableMonths.length > 0 && !selectedMonthKey) {
      setSelectedMonthKey(availableMonths[0].key);
    }
  }, [availableMonths, selectedMonthKey]);

  // Filter records
  const filtered = records.filter((r: any) => {
    const d = new Date(r.date);
    const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (selectedMonthKey && mKey !== selectedMonthKey) return false;
    if (selectedStudentId && r.studentId !== selectedStudentId) return false;
    return true;
  });

  const total = filtered.length;
  const present = filtered.filter((r: any) => r.status === "PRESENT").length;
  const absent = filtered.filter((r: any) => r.status === "ABSENT").length;
  const late = filtered.filter((r: any) => r.status === "LATE").length;
  const leave = filtered.filter((r: any) => r.status === "LEAVE").length;

  const presentPct = total > 0 ? Math.round((present / total) * 100) : 0;
  const absentPct = total > 0 ? Math.round((absent / total) * 100) : 0;
  const latePct = total > 0 ? Math.round((late / total) * 100) : 0;

  return (
    <ScrollView 
      style={styles.body}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      contentContainerStyle={styles.bodyContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Classroom Filter (Admin only) */}
      {classrooms && classrooms.length > 0 && setSelectedClassroomId && (
        <View style={{ marginBottom: 12 }}>
          <Text style={styles.sectionTitle}>Classrooms</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            <TouchableOpacity
              style={[styles.filterPill, !selectedClassroomId && styles.filterPillActive]}
              onPress={() => setSelectedClassroomId(null)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterPillText, !selectedClassroomId && styles.filterPillTextActive]}>All Classrooms</Text>
            </TouchableOpacity>
            {classrooms.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[styles.filterPill, selectedClassroomId === c.id && styles.filterPillActive]}
                onPress={() => setSelectedClassroomId(c.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterPillText, selectedClassroomId === c.id && styles.filterPillTextActive]}>{c.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Student/Child Filter (Parents, Teachers, Admins) */}
      {students && students.length > 1 && setSelectedStudentId && (
        <View style={{ marginBottom: 12 }}>
          <Text style={styles.sectionTitle}>Select Student</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            <TouchableOpacity
              style={[styles.filterPill, !selectedStudentId && styles.filterPillActive]}
              onPress={() => setSelectedStudentId(null)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterPillText, !selectedStudentId && styles.filterPillTextActive]}>All Students</Text>
            </TouchableOpacity>
            {students.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={[styles.filterPill, selectedStudentId === s.id && styles.filterPillActive]}
                onPress={() => setSelectedStudentId(s.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterPillText, selectedStudentId === s.id && styles.filterPillTextActive]}>{s.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Month Selection */}
      <Text style={styles.sectionTitle}>Select Month</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthScroll}>
        {availableMonths.map((m) => (
          <TouchableOpacity
            key={m.key}
            style={[styles.monthPill, selectedMonthKey === m.key && styles.monthPillActive]}
            onPress={() => setSelectedMonthKey(m.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.monthPillText, selectedMonthKey === m.key && styles.monthPillTextActive]}>{m.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Metric stats card */}
      <Text style={styles.sectionTitle}>Monthly Metrics</Text>
      <View style={styles.reportStatsGrid}>
        <View style={[styles.reportStatCard, { borderLeftColor: "#4CAF50" }]}>
          <View style={styles.reportStatHeader}>
            <Text style={[styles.reportStatLabel, { color: "#4CAF50" }]}>PRESENT</Text>
            <Text style={[styles.reportStatValue, { color: "#4CAF50" }]}>{presentPct}%</Text>
          </View>
          <View style={styles.barContainer}>
            <View style={[styles.barFill, { backgroundColor: "#4CAF50", width: `${presentPct}%` }]} />
          </View>
          <Text style={styles.reportStatSub}>{present} of {total} days</Text>
        </View>

        <View style={[styles.reportStatCard, { borderLeftColor: Colors.coral }]}>
          <View style={styles.reportStatHeader}>
            <Text style={[styles.reportStatLabel, { color: Colors.coral }]}>ABSENT</Text>
            <Text style={[styles.reportStatValue, { color: Colors.coral }]}>{absentPct}%</Text>
          </View>
          <View style={styles.barContainer}>
            <View style={[styles.barFill, { backgroundColor: Colors.coral, width: `${absentPct}%` }]} />
          </View>
          <Text style={styles.reportStatSub}>{absent} of {total} days</Text>
        </View>

        <View style={[styles.reportStatCard, { borderLeftColor: Colors.gold }]}>
          <View style={styles.reportStatHeader}>
            <Text style={[styles.reportStatLabel, { color: Colors.gold }]}>LATE</Text>
            <Text style={[styles.reportStatValue, { color: Colors.gold }]}>{latePct}%</Text>
          </View>
          <View style={styles.barContainer}>
            <View style={[styles.barFill, { backgroundColor: Colors.gold, width: `${latePct}%` }]} />
          </View>
          <Text style={styles.reportStatSub}>{late} of {total} days</Text>
        </View>
      </View>

      {/* Records list */}
      <Text style={styles.sectionTitle}>Attendance Logs</Text>
      <View style={{ marginTop: 4 }}>
        {filtered.map((r: any) => {
          const dateObj = new Date(r.date);
          const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
          const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          return (
            <View key={r.id} style={styles.historyCard}>
              <Text style={styles.historyEmoji}>{STATUS_EMOJI[r.status] || "—"}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.historyName}>{r.student?.firstName} {r.student?.lastName}</Text>
                <Text style={styles.historyDate}>{weekday} • {dateStr}</Text>
                {r.note && <Text style={styles.remarkText}>Remark: {r.note}</Text>}
              </View>
              <View style={[styles.historyBadge, { backgroundColor: STATUS_COLOR[r.status] + "20" }]}>
                <Text style={[styles.historyStatus, { color: STATUS_COLOR[r.status] }]}>{r.status}</Text>
              </View>
            </View>
          );
        })}
        {filtered.length === 0 && (
          <Text style={styles.reportEmpty}>No records found for this month.</Text>
        )}
      </View>
    </ScrollView>
  );
}

function AdminView() {
  const [activeTab, setActiveTab] = useState<"mark" | "reports">("mark");
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [selectedClassroom, setSelectedClassroom] = useState<string | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [allRecords, setAllRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const [mode, setMode] = useState<"overview" | "mark">("overview");

  // Reports-specific state
  const [selectedClassroomId, setSelectedClassroomId] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [reportRecords, setReportRecords] = useState<any[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [cls, records] = await Promise.all([getClassrooms(), getAttendance()]);
      setClassrooms(cls);
      setAllRecords(records);
    } catch (e) { console.warn(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, []);

  // Fetch reports when reports tab is selected or filtered classroom changes
  const loadReports = useCallback(async () => {
    setReportsLoading(true);
    try {
      const params: any = {};
      if (selectedClassroomId) params.classroomId = selectedClassroomId;
      const data = await getAttendance(params);
      setReportRecords(data);
    } catch (e) { console.warn(e); }
    finally { setReportsLoading(false); }
  }, [selectedClassroomId]);

  useEffect(() => {
    if (activeTab === "reports") {
      loadReports();
    }
  }, [activeTab, selectedClassroomId, loadReports]);

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

  // MARK TODAY SUB-VIEW (Marking specific classroom today)
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

  // Extract unique students in report records
  const studentMap = new Map<string, { id: string; name: string }>();
  reportRecords.forEach(r => {
    if (r.student) {
      studentMap.set(r.studentId, {
        id: r.studentId,
        name: `${r.student.firstName} ${r.student.lastName}`
      });
    }
  });
  const uniqueStudents = Array.from(studentMap.values());

  const presentCount = allRecords.filter((r: any) => r.status === "PRESENT").length;
  const absentCount = allRecords.filter((r: any) => r.status === "ABSENT").length;
  const lateCount = allRecords.filter((r: any) => r.status === "LATE").length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Attendance</Text>
        <Text style={styles.subtitle}>
          {activeTab === "mark" ? "School Administration Dashboard" : "Administrative Monthly Reports"}
        </Text>
      </View>

      {/* Tab Toggle */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tabBarItem, activeTab === "mark" && styles.tabBarActive]}
          onPress={() => setActiveTab("mark")}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabBarItemText, activeTab === "mark" && styles.tabBarActiveText]}>Mark Today</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabBarItem, activeTab === "reports" && styles.tabBarActive]}
          onPress={() => setActiveTab("reports")}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabBarItemText, activeTab === "reports" && styles.tabBarActiveText]}>Monthly Reports</Text>
        </TouchableOpacity>
      </View>

      {activeTab === "reports" ? (
        reportsLoading ? (
          <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
        ) : (
          <MonthlyReportView
            records={reportRecords}
            classrooms={classrooms}
            selectedClassroomId={selectedClassroomId}
            setSelectedClassroomId={(id) => { setSelectedClassroomId(id); setSelectedStudentId(null); }}
            students={uniqueStudents}
            selectedStudentId={selectedStudentId}
            setSelectedStudentId={setSelectedStudentId}
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadReports(); }}
          />
        )
      ) : (
        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
          {/* Summary stats */}
          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, { backgroundColor: "#E8F5E9" }]}>
              <Text style={[styles.summaryValue, { color: "#4CAF50" }]}>{presentCount}</Text>
              <Text style={[styles.summaryLabel, { color: "#4CAF50" }]}>Present</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: Colors.coralPale }]}>
              <Text style={[styles.summaryValue, { color: Colors.coral }]}>{absentCount}</Text>
              <Text style={[styles.summaryLabel, { color: Colors.coral }]}>Absent</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: Colors.goldPale }]}>
              <Text style={[styles.summaryValue, { color: Colors.gold }]}>{lateCount}</Text>
              <Text style={[styles.summaryLabel, { color: Colors.gold }]}>Late</Text>
            </View>
          </View>

          {/* Classrooms */}
          <Text style={styles.sectionTitle}>Classrooms — Tap to Mark</Text>
          {classrooms.map((c: any) => (
            <TouchableOpacity key={c.id} style={styles.classCard} onPress={() => loadClassroom(c.id)} activeOpacity={0.7}>
              <View style={styles.classAvatar}><Text style={styles.classEmoji}>⊞</Text></View>
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
      )}
    </View>
  );
}

function TeacherView() {
  const [activeTab, setActiveTab] = useState<"mark" | "reports">("mark");
  const [students, setStudents] = useState<any[]>([]);
  const [reportRecords, setReportRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const [classroomId, setClassroomId] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const dash = await getDashboard();
      if (dash.classroomId) {
        setClassroomId(dash.classroomId);
        const today = await getTodayAttendance(dash.classroomId);
        setStudents(today);
        const map: Record<string, string> = {};
        today.forEach((s: any) => { if (s.status) map[s.studentId] = s.status; });
        setStatuses(map);
      }
    } catch (e) { console.warn(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, []);

  // Fetch reports when reports tab is selected
  const loadReports = useCallback(async () => {
    if (!classroomId) return;
    setReportsLoading(true);
    try {
      const data = await getAttendance({ classroomId });
      setReportRecords(data);
    } catch (e) { console.warn(e); }
    finally { setReportsLoading(false); }
  }, [classroomId]);

  useEffect(() => {
    if (activeTab === "reports") {
      loadReports();
    }
  }, [activeTab, loadReports]);

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

  // Extract student details for reports dropdown
  const studentMap = new Map<string, { id: string; name: string }>();
  reportRecords.forEach(r => {
    if (r.student) {
      studentMap.set(r.studentId, {
        id: r.studentId,
        name: `${r.student.firstName} ${r.student.lastName}`
      });
    }
  });
  const uniqueStudents = Array.from(studentMap.values());

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Attendance</Text>
        <Text style={styles.subtitle}>Classroom Dashboard</Text>
      </View>

      {/* Top Tab Bar Toggle */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tabBarItem, activeTab === "mark" && styles.tabBarActive]}
          onPress={() => setActiveTab("mark")}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabBarItemText, activeTab === "mark" && styles.tabBarActiveText]}>Mark Today</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabBarItem, activeTab === "reports" && styles.tabBarActive]}
          onPress={() => setActiveTab("reports")}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabBarItemText, activeTab === "reports" && styles.tabBarActiveText]}>Monthly Reports</Text>
        </TouchableOpacity>
      </View>

      {activeTab === "mark" ? (
        <>
          <ScrollView 
            style={styles.body} 
            contentContainerStyle={styles.bodyContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[Colors.primary]} />}
          >
            <Text style={[styles.sectionTitle, { marginHorizontal: 16, marginBottom: 8 }]}>Mark Today's Attendance</Text>
            <View style={{ paddingHorizontal: 16 }}>
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
            </View>
          </ScrollView>
          <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={saveAll} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Attendance</Text>}
          </TouchableOpacity>
        </>
      ) : reportsLoading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
      ) : (
        <MonthlyReportView
          records={reportRecords}
          students={uniqueStudents}
          selectedStudentId={selectedStudentId}
          setSelectedStudentId={setSelectedStudentId}
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); loadReports(); }}
        />
      )}
    </View>
  );
}

function ParentView() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try { 
      const data = await getAttendance(); 
      setRecords(data); 
    } catch (e) { 
      console.warn(e); 
    } finally { 
      setLoading(false); 
      setRefreshing(false); 
    }
  }, []);

  useEffect(() => { load(); }, []);

  // Extract unique students in records
  const studentMap = new Map<string, { id: string; name: string }>();
  records.forEach(r => {
    if (r.student) {
      studentMap.set(r.studentId, {
        id: r.studentId,
        name: `${r.student.firstName} ${r.student.lastName}`
      });
    }
  });
  const students = Array.from(studentMap.values());

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Monthly Reports</Text>
        <Text style={styles.subtitle}>Track your child's attendance metrics</Text>
      </View>
      <MonthlyReportView
        records={records}
        students={students}
        selectedStudentId={selectedStudentId}
        setSelectedStudentId={setSelectedStudentId}
        refreshing={refreshing}
        onRefresh={() => { setRefreshing(true); load(); }}
      />
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
  bodyContent: { paddingBottom: 100 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: Colors.text, marginBottom: 10, marginTop: 14, marginHorizontal: 16 },
  summaryRow: { flexDirection: "row", gap: 10, paddingHorizontal: 16, marginBottom: 12 },
  summaryCard: { flex: 1, borderRadius: Radius.sm, padding: 14, alignItems: "center" },
  summaryValue: { fontSize: 20, fontWeight: "800" },
  summaryLabel: { fontSize: 10, fontWeight: "600", marginTop: 2 },
  classCard: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 14, marginHorizontal: 16, marginBottom: 8, ...Shadow },
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
  remarkText: { fontSize: 11, color: Colors.primary, marginTop: 4, fontStyle: "italic" },

  // Top Tab Bar Navigation
  tabBar: { flexDirection: "row", backgroundColor: Colors.surface, marginHorizontal: 16, borderRadius: Radius.md, padding: 4, marginBottom: 12, ...Shadow },
  tabBarItem: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: Radius.sm },
  tabBarActive: { backgroundColor: Colors.primaryPale },
  tabBarItemText: { fontSize: 13, fontWeight: "600", color: Colors.text3 },
  tabBarActiveText: { color: Colors.primary, fontWeight: "700" },

  // Filters scroll lists
  filterScroll: { paddingHorizontal: 16, marginBottom: 4 },
  filterPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full, backgroundColor: Colors.surface, marginRight: 8, borderWidth: 1, borderColor: Colors.border },
  filterPillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterPillText: { fontSize: 12, fontWeight: "600", color: Colors.text2 },
  filterPillTextActive: { color: "#fff", fontWeight: "700" },

  // Month selection scroll list
  monthScroll: { paddingHorizontal: 16, marginBottom: 4 },
  monthPill: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: Radius.md, backgroundColor: Colors.surface, marginRight: 10, borderWidth: 1, borderColor: Colors.border },
  monthPillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  monthPillText: { fontSize: 13, fontWeight: "600", color: Colors.text2 },
  monthPillTextActive: { color: "#fff", fontWeight: "700" },

  // Metric stats layout
  reportStatsGrid: { flexDirection: "row", gap: 10, paddingHorizontal: 16, marginBottom: 6 },
  reportStatCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 12, borderLeftWidth: 4, ...Shadow },
  reportStatHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 },
  reportStatLabel: { fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
  reportStatValue: { fontSize: 18, fontWeight: "800" },
  barContainer: { height: 4, backgroundColor: Colors.border, borderRadius: 2, marginBottom: 6 },
  barFill: { height: 4, borderRadius: 2 },
  reportStatSub: { fontSize: 10, color: Colors.text3, fontWeight: "600" },

  reportEmpty: { textAlign: "center", color: Colors.text3, marginTop: 40, paddingHorizontal: 20 },
});
