import React, { useState } from "react";
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { createTeacher } from "../../lib/api";
import { Colors, Radius, Shadow } from "../../lib/theme";

export default function AddTeacherScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    
    setLoading(true);
    try {
      await createTeacher({ name: name.trim(), email: email.trim().toLowerCase(), password });
      Alert.alert("Success", "Teacher created successfully");
      router.back();
    } catch (e: any) {
      Alert.alert("Error", e.response?.data?.error || e.message || "Failed to create teacher");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.backText}>← Cancel</Text></TouchableOpacity>
        <Text style={styles.title}>Add New Teacher</Text>
      </View>
      
      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput style={styles.input} placeholder="e.g. Jane Doe" value={name} onChangeText={setName} />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput style={styles.input} placeholder="teacher@axionschool.edu" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Temporary Password</Text>
          <TextInput style={styles.input} placeholder="Enter password" secureTextEntry value={password} onChangeText={setPassword} />
        </View>
        
        <TouchableOpacity style={styles.submitBtn} onPress={handleCreate} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Create Teacher</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingTop: 48, paddingHorizontal: 20, paddingBottom: 16 },
  backText: { color: Colors.primary, fontSize: 14, fontWeight: "600", marginBottom: 8 },
  title: { fontSize: 24, fontWeight: "800", color: Colors.text },
  form: { backgroundColor: Colors.surface, margin: 16, borderRadius: Radius.lg, padding: 20, ...Shadow },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "600", color: Colors.text2, marginBottom: 8 },
  input: { backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: 14, fontSize: 15, color: Colors.text },
  submitBtn: { backgroundColor: Colors.primary, padding: 16, borderRadius: Radius.md, alignItems: "center", marginTop: 8 },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "700" }
});
