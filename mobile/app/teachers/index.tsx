import React, { useState, useEffect, useCallback } from "react";
import { StyleSheet, Text, View, FlatList, TouchableOpacity, TextInput, ActivityIndicator, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { getContacts } from "../../lib/api";
import { Colors, Radius, Shadow } from "../../lib/theme";

export default function TeachersScreen() {
  const router = useRouter();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try { 
      const d = await getContacts();
      const teacherList = d.filter((c: any) => c.role === "TEACHER");
      setTeachers(teacherList); 
      setFiltered(teacherList); 
    }
    catch (e) { console.warn(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  
  useEffect(() => {
    if (!search.trim()) { setFiltered(teachers); return; }
    const q = search.toLowerCase();
    setFiltered(teachers.filter((c: any) => c.name.toLowerCase().includes(q)));
  }, [search, teachers]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Teachers</Text>
            <Text style={styles.subtitle}>{teachers.length} teachers found</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => router.push("/teachers/add")}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.searchBox}>
        <Text style={{ fontSize: 14, marginRight: 8, color: Colors.text3 }}>⊙</Text>
        <TextInput style={styles.searchInput} placeholder="Search teachers..." placeholderTextColor={Colors.text3} value={search} onChangeText={setSearch} />
      </View>
      
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[Colors.primary]} />}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => router.push(`/chat/${item.id}`)} activeOpacity={0.7}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.name[0]}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.email}>{item.email}</Text>
            </View>
            <Text style={{fontSize: 18, color: Colors.text3}}>✉</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No teachers found</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.bg },
  header: { paddingTop: 48, paddingHorizontal: 20, paddingBottom: 12 },
  backText: { color: Colors.primary, fontSize: 14, fontWeight: "600", marginBottom: 8 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "800", color: Colors.text },
  subtitle: { fontSize: 13, color: Colors.text3, marginTop: 2 },
  addBtn: { backgroundColor: Colors.primaryPale, paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full },
  addBtnText: { color: Colors.primary, fontWeight: "700", fontSize: 14 },
  searchBox: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.surface, marginHorizontal: 16, borderRadius: Radius.md, paddingHorizontal: 14, marginBottom: 8, ...Shadow },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 14, color: Colors.text },
  list: { padding: 16, paddingTop: 4 },
  card: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 14, marginBottom: 8, ...Shadow },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primaryPale, alignItems: "center", justifyContent: "center", marginRight: 12 },
  avatarText: { fontSize: 17, fontWeight: "700", color: Colors.primary },
  name: { fontSize: 15, fontWeight: "600", color: Colors.text },
  email: { fontSize: 11, color: Colors.text3, marginTop: 1 },
  empty: { textAlign: "center", color: Colors.text3, marginTop: 40 },
});
