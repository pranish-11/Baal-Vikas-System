import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, FlatList, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { createStudent, assignClassroom, getClassrooms } from "../../lib/api";
import { Colors, Radius, Shadow } from "../../lib/theme";

export default function AddStudentScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [fetchingClassrooms, setFetchingClassrooms] = useState(true);

  // Form State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [age, setAge] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [classroomId, setClassroomId] = useState("");

  useEffect(() => {
    getClassrooms()
      .then(setClassrooms)
      .catch(console.warn)
      .finally(() => setFetchingClassrooms(false));
  }, []);

  const handleCreate = async () => {
    if (!firstName.trim() || !lastName.trim() || !age.trim() || !parentEmail.trim() || !classroomId) {
      Alert.alert("Error", "Please fill in all required fields and select a classroom");
      return;
    }
    
    setLoading(true);
    try {
      await createStudent({ 
        firstName: firstName.trim(), 
        lastName: lastName.trim(), 
        age, 
        parentEmail: parentEmail.trim().toLowerCase(), 
        classroomId 
      });
      Alert.alert("Success", "Student created and assigned successfully");
      router.back();
    } catch (e: any) {
      Alert.alert("Error", e.response?.data?.error || e.message || "Failed to create student");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.backText}>← Cancel</Text></TouchableOpacity>
        <Text style={styles.title}>Add New Student</Text>
      </View>
      
      <ScrollView style={styles.formContainer}>
        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Student Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>First Name</Text>
            <TextInput style={styles.input} placeholder="e.g. Leo" value={firstName} onChangeText={setFirstName} />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Last Name</Text>
            <TextInput style={styles.input} placeholder="e.g. Smith" value={lastName} onChangeText={setLastName} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Age</Text>
            <TextInput style={styles.input} placeholder="e.g. 5" keyboardType="numeric" value={age} onChangeText={setAge} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Parent Email (Required)</Text>
            <TextInput style={styles.input} placeholder="parent@example.com" keyboardType="email-address" autoCapitalize="none" value={parentEmail} onChangeText={setParentEmail} />
          </View>

          <Text style={styles.sectionTitle}>Assign Classroom</Text>
          {fetchingClassrooms ? (
            <ActivityIndicator color={Colors.primary} />
          ) : (
            <View style={styles.classGrid}>
              {classrooms.map((c) => (
                <TouchableOpacity 
                  key={c.id} 
                  style={[styles.classItem, classroomId === c.id && styles.classItemActive]}
                  onPress={() => setClassroomId(c.id)}
                >
                  <Text style={[styles.classItemText, classroomId === c.id && styles.classItemTextActive]}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity style={styles.submitBtn} onPress={handleCreate} disabled={loading || fetchingClassrooms}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Add Student</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingTop: 48, paddingHorizontal: 20, paddingBottom: 16 },
  backText: { color: Colors.primary, fontSize: 14, fontWeight: "600", marginBottom: 8 },
  title: { fontSize: 24, fontWeight: "800", color: Colors.text },
  formContainer: { flex: 1 },
  form: { backgroundColor: Colors.surface, margin: 16, borderRadius: Radius.lg, padding: 20, ...Shadow, paddingBottom: 40 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: Colors.text, marginBottom: 12, marginTop: 8 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "600", color: Colors.text2, marginBottom: 8 },
  input: { backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: 14, fontSize: 15, color: Colors.text },
  classGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 },
  classItem: { borderWidth: 1, borderColor: Colors.border, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20 },
  classItemActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  classItemText: { color: Colors.text2, fontSize: 13, fontWeight: "600" },
  classItemTextActive: { color: "#fff" },
  submitBtn: { backgroundColor: Colors.primary, padding: 16, borderRadius: Radius.md, alignItems: "center", marginTop: 8 },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "700" }
});
