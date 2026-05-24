import React, { useState, useEffect, useCallback } from "react";
import { StyleSheet, Text, View, FlatList, TouchableOpacity, TextInput, RefreshControl, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../lib/auth";
import { getStudents } from "../../lib/api";
import { Colors, Radius, Shadow } from "../../lib/theme";

export default function StudentsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try { const d = await getStudents(); setStudents(d); setFiltered(d); }
    catch (e) { console.warn(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (!search.trim()) { setFiltered(students); return; }
    const q = search.toLowerCase();
    setFiltered(students.filter((s: any) =>
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) || s.classroom.toLowerCase().includes(q)
    ));
  }, [search, students]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Students</Text>
        <Text style={styles.count}>{students.length} total</Text>
      </View>
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput style={styles.searchInput} placeholder="Search students..." placeholderTextColor={Colors.text3}
          value={search} onChangeText={setSearch} />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[Colors.primary]} />}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => router.push(`/student/${item.id}`)} activeOpacity={0.7}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.firstName[0]}{item.lastName[0]}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.firstName} {item.lastName}</Text>
              <Text style={styles.meta}>{item.classroom} • Age {item.age}</Text>
            </View>
            <View style={styles.pointsBadge}>
              <Text style={styles.pointsText}>{item.behaviorPoints}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No students found</Text>}
      />
      {(user?.role === "ADMIN" || user?.role === "TEACHER") && (
        <TouchableOpacity style={styles.fab} onPress={() => router.push("/students/add")}>
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.bg },
  header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  title: { fontSize: 24, fontWeight: "800", color: Colors.text },
  count: { fontSize: 13, color: Colors.text3, fontWeight: "600" },
  searchBox: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.surface, marginHorizontal: 16, borderRadius: Radius.md, paddingHorizontal: 14, marginBottom: 8, ...Shadow },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 14, color: Colors.text },
  list: { padding: 16, paddingTop: 4 },
  card: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 14, marginBottom: 10, ...Shadow },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primaryPale, alignItems: "center", justifyContent: "center", marginRight: 12 },
  avatarText: { fontSize: 15, fontWeight: "700", color: Colors.primary },
  name: { fontSize: 15, fontWeight: "600", color: Colors.text },
  meta: { fontSize: 12, color: Colors.text3, marginTop: 2 },
  pointsBadge: { backgroundColor: Colors.goldPale, width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  pointsText: { fontSize: 12, fontWeight: "700", color: Colors.gold },
  empty: { textAlign: "center", color: Colors.text3, marginTop: 40, fontSize: 14 },
  fab: { position: "absolute", bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center", ...Shadow, elevation: 6 },
  fabIcon: { fontSize: 30, color: "#fff", lineHeight: 32, fontWeight: "300" }
});
