import React, { useState, useEffect, useCallback } from "react";
import { StyleSheet, Text, View, FlatList, TouchableOpacity, TextInput, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { getContacts } from "../lib/api";
import { Colors, Radius, Shadow } from "../lib/theme";

const ROLE_COLOR: Record<string, string> = { ADMIN: Colors.coral, TEACHER: Colors.primary, PARENT: Colors.sky };

export default function ContactsScreen() {
  const router = useRouter();
  const [contacts, setContacts] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try { const d = await getContacts(); setContacts(d); setFiltered(d); }
    catch (e) { console.warn(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (!search.trim()) { setFiltered(contacts); return; }
    const q = search.toLowerCase();
    setFiltered(contacts.filter((c: any) => c.name.toLowerCase().includes(q) || c.role.toLowerCase().includes(q)));
  }, [search, contacts]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
        <Text style={styles.title}>People</Text>
        <Text style={styles.subtitle}>Tap to start a conversation</Text>
      </View>
      <View style={styles.searchBox}>
        <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
        <TextInput style={styles.searchInput} placeholder="Search people..." placeholderTextColor={Colors.text3} value={search} onChangeText={setSearch} />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => router.push(`/chat/${item.id}`)} activeOpacity={0.7}>
            <View style={[styles.avatar, { backgroundColor: (ROLE_COLOR[item.role] || Colors.primary) + "20" }]}>
              <Text style={[styles.avatarText, { color: ROLE_COLOR[item.role] || Colors.primary }]}>{item.name[0]}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.email}>{item.email}</Text>
            </View>
            <View style={[styles.roleBadge, { backgroundColor: (ROLE_COLOR[item.role] || Colors.primary) + "20" }]}>
              <Text style={[styles.roleText, { color: ROLE_COLOR[item.role] || Colors.primary }]}>{item.role}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No contacts found</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.bg },
  header: { paddingTop: 48, paddingHorizontal: 20, paddingBottom: 8 },
  backText: { color: Colors.primary, fontSize: 14, fontWeight: "600", marginBottom: 8 },
  title: { fontSize: 24, fontWeight: "800", color: Colors.text },
  subtitle: { fontSize: 13, color: Colors.text3, marginTop: 2 },
  searchBox: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.surface, marginHorizontal: 16, borderRadius: Radius.md, paddingHorizontal: 14, marginBottom: 8, ...Shadow },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 14, color: Colors.text },
  list: { padding: 16, paddingTop: 4 },
  card: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 14, marginBottom: 8, ...Shadow },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", marginRight: 12 },
  avatarText: { fontSize: 17, fontWeight: "700" },
  name: { fontSize: 15, fontWeight: "600", color: Colors.text },
  email: { fontSize: 11, color: Colors.text3, marginTop: 1 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  roleText: { fontSize: 9, fontWeight: "700" },
  empty: { textAlign: "center", color: Colors.text3, marginTop: 40 },
});
