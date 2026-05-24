import React, { useState, useEffect, useCallback } from "react";
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, Modal, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getClassroom, getContacts, assignTeacher } from "../../lib/api";
import { Colors, Radius, Shadow } from "../../lib/theme";

export default function ClassroomDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  
  const [classroom, setClassroom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [teachers, setTeachers] = useState<any[]>([]);

  const load = useCallback(async () => {
    try { 
      const c = await getClassroom(id!); 
      setClassroom(c); 
    } catch (e) { console.warn(e); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const openTeacherModal = async () => {
    setShowTeacherModal(true);
    try {
      const contacts = await getContacts();
      setTeachers(contacts.filter((c: any) => c.role === "TEACHER"));
    } catch (e) { console.warn(e); }
  };

  const handleAssignTeacher = async (teacherId: string) => {
    setAssigning(true);
    try {
      await assignTeacher(id!, teacherId);
      await load();
      setShowTeacherModal(false);
      Alert.alert("Success", "Teacher assigned successfully");
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to assign teacher");
    } finally {
      setAssigning(false);
    }
  };

  if (loading || !classroom) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
        <Text style={styles.title}>{classroom.name}</Text>
        <Text style={styles.subtitle}>{classroom.school?.name}</Text>
      </View>
      
      <View style={styles.infoCard}>
        <Text style={styles.sectionTitle}>Class Teacher</Text>
        <View style={styles.teacherRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.teacherName}>{classroom.teacher?.name || "Unassigned"}</Text>
            {classroom.teacher?.email && <Text style={styles.teacherEmail}>{classroom.teacher.email}</Text>}
          </View>
          <TouchableOpacity style={styles.btnOutline} onPress={openTeacherModal}>
            <Text style={styles.btnOutlineText}>Change</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.sectionTitle}>Students ({classroom.students?.length || 0})</Text>
      </View>
      
      <FlatList
        data={classroom.students}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.studentCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.firstName[0]}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.studentName}>{item.firstName} {item.lastName}</Text>
              <Text style={styles.studentDetails}>Age: {item.age} • Points: {item.behaviorPoints}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No students in this class</Text>}
      />

      <Modal visible={showTeacherModal} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Assign Teacher</Text>
              <TouchableOpacity onPress={() => setShowTeacherModal(false)}><Text style={styles.closeBtn}>Close</Text></TouchableOpacity>
            </View>
            {assigning ? (
              <ActivityIndicator size="large" color={Colors.primary} style={{ marginVertical: 40 }} />
            ) : (
              <FlatList
                data={teachers}
                keyExtractor={(t) => t.id}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.teacherItem} onPress={() => handleAssignTeacher(item.id)}>
                    <Text style={styles.teacherItemName}>{item.name}</Text>
                    <Text style={styles.teacherItemEmail}>{item.email}</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={styles.empty}>No teachers found</Text>}
              />
            )}
            <TouchableOpacity style={styles.newTeacherBtn} onPress={() => { setShowTeacherModal(false); router.push("/teachers/add"); }}>
              <Text style={styles.newTeacherBtnText}>+ Create New Teacher</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.bg },
  header: { paddingTop: 48, paddingHorizontal: 20, paddingBottom: 16, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backText: { color: Colors.primary, fontSize: 14, fontWeight: "600", marginBottom: 8 },
  title: { fontSize: 24, fontWeight: "800", color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.text3, marginTop: 4 },
  infoCard: { backgroundColor: Colors.surface, margin: 16, borderRadius: Radius.md, padding: 16, ...Shadow },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: Colors.text, marginBottom: 12 },
  teacherRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  teacherName: { fontSize: 16, fontWeight: "600", color: Colors.text },
  teacherEmail: { fontSize: 12, color: Colors.text3, marginTop: 2 },
  btnOutline: { borderWidth: 1, borderColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  btnOutlineText: { color: Colors.primary, fontSize: 12, fontWeight: "600" },
  listHeader: { paddingHorizontal: 20, paddingTop: 8 },
  list: { padding: 16 },
  studentCard: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 12, marginBottom: 8, ...Shadow },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.skyPale, alignItems: "center", justifyContent: "center", marginRight: 12 },
  avatarText: { fontSize: 16, fontWeight: "700", color: Colors.sky },
  studentName: { fontSize: 15, fontWeight: "600", color: Colors.text },
  studentDetails: { fontSize: 12, color: Colors.text3, marginTop: 2 },
  empty: { textAlign: "center", color: Colors.text3, marginVertical: 30 },
  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "80%", padding: 20 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: "700", color: Colors.text },
  closeBtn: { fontSize: 15, color: Colors.coral, fontWeight: "600" },
  teacherItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  teacherItemName: { fontSize: 16, fontWeight: "600", color: Colors.text },
  teacherItemEmail: { fontSize: 12, color: Colors.text3, marginTop: 2 },
  newTeacherBtn: { marginTop: 20, backgroundColor: Colors.primaryPale, padding: 16, borderRadius: Radius.md, alignItems: "center" },
  newTeacherBtnText: { color: Colors.primary, fontSize: 15, fontWeight: "700" }
});
