import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Image } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../lib/auth";
import { getLeaderboard, getClassrooms } from "../lib/api";
import { Colors, Radius, Shadow } from "../lib/theme";

export default function LeaderboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"SCHOOL" | "CLASS">("SCHOOL");
  const [students, setStudents] = useState<any[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const classes = await getClassrooms();
        setClassrooms(classes);
        if (classes.length > 0) setSelectedClass(classes[0].id);
        
        // Initial load for school
        setStudents(await getLeaderboard());
      } catch (e) {
        console.warn(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedClass && tab === "CLASS") return;
    (async () => {
      setLoading(true);
      try {
        setStudents(await getLeaderboard(tab === "CLASS" ? selectedClass : undefined));
      } catch (e) {
        console.warn(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [tab, selectedClass]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>★ Leaderboard</Text>
        <Text style={styles.subtitle}>Top Behavior Points</Text>

        <View style={styles.tabsRow}>
          <TouchableOpacity style={[styles.tabBtn, tab === "SCHOOL" && styles.tabActive]} onPress={() => setTab("SCHOOL")}>
            <Text style={[styles.tabText, tab === "SCHOOL" && styles.tabTextActive]}>Whole School</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabBtn, tab === "CLASS" && styles.tabActive]} onPress={() => setTab("CLASS")}>
            <Text style={[styles.tabText, tab === "CLASS" && styles.tabTextActive]}>By Class</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.body}>
        {tab === "CLASS" && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.classFilters} contentContainerStyle={styles.classFiltersContent}>
            {classrooms.map((c) => (
              <TouchableOpacity key={c.id} style={[styles.classChip, selectedClass === c.id && styles.classChipActive]}
                onPress={() => setSelectedClass(c.id)}>
                <Text style={[styles.classChipText, selectedClass === c.id && styles.classChipTextActive]}>{c.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {loading ? (
          <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
        ) : (
          <ScrollView contentContainerStyle={styles.listContent}>
            {students.length === 0 ? (
              <Text style={styles.empty}>No points awarded yet</Text>
            ) : (
              students.map((student, index) => {
                let badge = "";
                let color = Colors.text;
                let bg = Colors.surface;
                
                if (index === 0) { badge = "1st"; color = "#B8860B"; bg = "#FFF9C4"; }
                else if (index === 1) { badge = "2nd"; color = "#757575"; bg = "#F5F5F5"; }
                else if (index === 2) { badge = "3rd"; color = "#A0522D"; bg = "#FBE9E7"; }
                else { badge = `#${index + 1}`; }

                return (
                  <View key={student.id} style={[styles.studentCard, { backgroundColor: bg }]}>
                    <View style={styles.rankBadge}>
                      <Text style={styles.rankText}>{badge}</Text>
                    </View>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{student.firstName[0]}</Text>
                    </View>
                    <View style={styles.info}>
                      <Text style={styles.name}>{student.firstName} {student.lastName}</Text>
                      <Text style={styles.className}>{student.classroom}</Text>
                    </View>
                    <View style={styles.pointsBadge}>
                      <Text style={styles.pointsText}>{student.behaviorPoints} pts</Text>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { backgroundColor: Colors.primary, paddingTop: 48, paddingBottom: 16, paddingHorizontal: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  backBtn: { marginBottom: 12 },
  backText: { color: "rgba(255,255,255,0.8)", fontSize: 14, fontWeight: "600" },
  title: { fontSize: 26, fontWeight: "800", color: "#fff" },
  subtitle: { fontSize: 14, color: "rgba(255,255,255,0.8)", marginTop: 2, marginBottom: 16 },
  tabsRow: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.2)", borderRadius: Radius.full, padding: 4 },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: Radius.full },
  tabActive: { backgroundColor: "#fff" },
  tabText: { color: "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: "700" },
  tabTextActive: { color: Colors.primary },
  body: { flex: 1 },
  classFilters: { maxHeight: 54, borderBottomWidth: 1, borderBottomColor: Colors.border },
  classFiltersContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, alignItems: "center" },
  classChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  classChipActive: { backgroundColor: Colors.primaryPale, borderColor: Colors.primary },
  classChipText: { fontSize: 12, fontWeight: "600", color: Colors.text2 },
  classChipTextActive: { color: Colors.primary },
  listContent: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 40 },
  empty: { textAlign: "center", color: Colors.text3, marginTop: 40, fontSize: 15 },
  studentCard: { flexDirection: "row", alignItems: "center", borderRadius: Radius.md, padding: 12, marginBottom: 10, ...Shadow, elevation: 2 },
  rankBadge: { width: 32, alignItems: "center", marginRight: 8 },
  rankText: { fontSize: 18, fontWeight: "800", color: Colors.text2 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(0,0,0,0.05)", alignItems: "center", justifyContent: "center", marginRight: 12 },
  avatarText: { fontSize: 16, fontWeight: "800", color: Colors.text },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: "700", color: Colors.text },
  className: { fontSize: 12, color: Colors.text3, marginTop: 2 },
  pointsBadge: { backgroundColor: Colors.goldPale, paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.md },
  pointsText: { fontSize: 13, fontWeight: "800", color: Colors.gold },
});
