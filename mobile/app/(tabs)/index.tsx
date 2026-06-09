import React, { useState, useEffect, useCallback } from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useAuth } from "../../lib/auth";
import { getDashboard, checkHealth } from "../../lib/api";
import { useSocketEvent } from "../../lib/socket";
import { Colors, Radius, Shadow } from "../../lib/theme";
import { ActionIcon } from "../../lib/icons";

export default function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [online, setOnline] = useState<boolean | null>(null);

  const load = useCallback(async () => {
    try {
      const [d, h] = await Promise.all([getDashboard(), checkHealth()]);
      setData(d);
      setOnline(h);
    } catch { setOnline(false); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, []);
  useSocketEvent("notification", () => load());

  const onRefresh = () => { setRefreshing(true); load(); };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.name}>{user?.name ?? "User"}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: online ? "#4CAF5030" : "#E8614A30" }]}>
            <View style={[styles.dot, { backgroundColor: online ? "#4CAF50" : Colors.coral }]} />
            <Text style={[styles.badgeText, { color: online ? "#4CAF50" : Colors.coral }]}>
              {online ? "Online" : "Offline"}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      >
        {/* Stats */}
        {data?.role === "ADMIN" && (
          <View style={styles.statsRow}>
            <StatCard label="Students" value={data.totalStudents} color={Colors.primary} bg={Colors.primaryPale} />
            <StatCard label="Teachers" value={data.totalTeachers} color={Colors.sky} bg={Colors.skyPale} />
            <StatCard label="Classes" value={data.totalClassrooms} color={Colors.lavender} bg={Colors.lavenderPale} />
          </View>
        )}
        {data?.role === "ADMIN" && (
          <View style={styles.statsRow}>
            <StatCard label="Outstanding" value={data.outstandingFees} color={Colors.coral} bg={Colors.coralPale} />
            <StatCard label="Attendance" value={`${data.attendanceRate}%`} color={Colors.gold} bg={Colors.goldPale} />
          </View>
        )}

        {data?.role === "TEACHER" && (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Your Classroom</Text>
              <Text style={styles.cardValue}>{data.classroomName}</Text>
              <Text style={styles.cardMeta}>{data.studentCount} students</Text>
            </View>
            <View style={styles.statsRow}>
              <StatCard label="Present" value={data.todayPresent} color="#4CAF50" bg="#E8F5E9" />
              <StatCard label="Total" value={data.todayTotal} color={Colors.sky} bg={Colors.skyPale} />
            </View>
          </>
        )}

        {data?.role === "PARENT" && (
          <>
            <Text style={styles.sectionTitle}>Your Children</Text>
            {data.children?.map((child: any) => (
              <TouchableOpacity key={child.id} style={styles.childCard}
                onPress={() => router.push(`/student/${child.id}`)}>
                <View style={styles.childAvatar}>
                  <Text style={styles.childInitial}>{child.name[0]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.childName}>{child.name}</Text>
                  <Text style={styles.childMeta}>{child.classroom} • Age {child.age}</Text>
                </View>
                <View style={styles.pointsBadge}>
                  <Text style={styles.pointsText}>{child.behaviorPoints}pts</Text>
                </View>
              </TouchableOpacity>
            ))}
            <View style={styles.statsRow}>
              <StatCard label="Total Fees" value={`Rs. ${data.totalFees}`} color={Colors.sky} bg={Colors.skyPale} />
              <StatCard label="Outstanding" value={`Rs. ${data.outstandingFees}`} color={Colors.coral} bg={Colors.coralPale} />
            </View>
          </>
        )}

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          {(user?.role === "TEACHER" || user?.role === "ADMIN") && (
            <ActionIcon name="attendance" label="Attendance" onPress={() => router.push("/(tabs)/attendance")} />
          )}
          <ActionIcon name="people" label="People" onPress={() => router.push("/contacts")} />
          <ActionIcon name="message" label="Messages" onPress={() => router.push("/conversations")} />
          <ActionIcon name="complaint" label="Complaints" onPress={() => router.push("/complaints")} />
          {user?.role === "PARENT" && (
            <ActionIcon name="ai" label="Ask AI" onPress={() => router.push("/ai-chat")} />
          )}
          <ActionIcon name="fees" label="Fees" onPress={() => router.push("/(tabs)/fees")} />
        </View>
      </ScrollView>
    </View>
  );
}

function StatCard({ label, value, color, bg }: any) {
  return (
    <View style={[styles.statCard, { backgroundColor: bg }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color }]}>{label}</Text>
    </View>
  );
}

// ActionBtn removed — replaced by ActionIcon from lib/icons

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.bg },
  header: { backgroundColor: Colors.primary, paddingTop: 56, paddingBottom: 24, paddingHorizontal: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  greeting: { fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: "500" },
  name: { fontSize: 22, fontWeight: "800", color: "#fff", marginTop: 2 },
  badge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  badgeText: { fontSize: 11, fontWeight: "600" },
  body: { flex: 1 },
  bodyContent: { padding: 16, paddingBottom: 32 },
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  statCard: { flex: 1, borderRadius: Radius.md, padding: 16, alignItems: "center" },
  statValue: { fontSize: 22, fontWeight: "800" },
  statLabel: { fontSize: 11, fontWeight: "600", marginTop: 4 },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 20, marginBottom: 12, ...Shadow },
  cardTitle: { fontSize: 14, color: Colors.text3, fontWeight: "600" },
  cardValue: { fontSize: 20, fontWeight: "700", color: Colors.text, marginTop: 4 },
  cardMeta: { fontSize: 13, color: Colors.text2, marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: Colors.text, marginBottom: 12, marginTop: 8 },
  childCard: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 14, marginBottom: 10, ...Shadow },
  childAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.primaryPale, alignItems: "center", justifyContent: "center", marginRight: 12 },
  childInitial: { fontSize: 18, fontWeight: "700", color: Colors.primary },
  childName: { fontSize: 15, fontWeight: "600", color: Colors.text },
  childMeta: { fontSize: 12, color: Colors.text3, marginTop: 2 },
  pointsBadge: { backgroundColor: Colors.goldPale, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  pointsText: { fontSize: 11, fontWeight: "700", color: Colors.gold },
  actionsRow: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
});
