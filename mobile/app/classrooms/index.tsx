import React, { useState, useEffect, useCallback } from "react";
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { getClassrooms } from "../../lib/api";
import { Colors, Radius, Shadow } from "../../lib/theme";

export default function ClassroomsScreen() {
  const router = useRouter();
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try { setClassrooms(await getClassrooms()); }
    catch (e) { console.warn(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
        <Text style={styles.title}>Classrooms</Text>
        <Text style={styles.subtitle}>Manage teachers and students</Text>
      </View>
      
      <FlatList
        data={classrooms}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => router.push(`/classrooms/${item.id}`)} activeOpacity={0.7}>
            <View style={styles.iconBox}>
              <Text style={styles.icon}>🏫</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.teacher}>Teacher: {item.teacher}</Text>
              <Text style={styles.studentCount}>{item.studentCount} students</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No classrooms found</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.bg },
  header: { paddingTop: 48, paddingHorizontal: 20, paddingBottom: 16 },
  backText: { color: Colors.primary, fontSize: 14, fontWeight: "600", marginBottom: 8 },
  title: { fontSize: 24, fontWeight: "800", color: Colors.text },
  subtitle: { fontSize: 13, color: Colors.text3, marginTop: 2 },
  list: { padding: 16 },
  card: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 16, marginBottom: 12, ...Shadow },
  iconBox: { width: 50, height: 50, borderRadius: 25, backgroundColor: Colors.primaryPale, alignItems: "center", justifyContent: "center", marginRight: 14 },
  icon: { fontSize: 24 },
  name: { fontSize: 17, fontWeight: "700", color: Colors.text },
  teacher: { fontSize: 13, color: Colors.text2, marginTop: 4 },
  studentCount: { fontSize: 12, color: Colors.text3, marginTop: 2 },
  arrow: { fontSize: 24, color: Colors.text3, marginLeft: 12 },
  empty: { textAlign: "center", color: Colors.text3, marginTop: 40 },
});
