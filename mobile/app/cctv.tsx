import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet, Text, View, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Modal, ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { getCCTVClassrooms, getCCTVAnalysis, triggerCCTVAnalysis } from "../lib/api";
import { Colors, Radius, Shadow } from "../lib/theme";

interface Activity {
  activity: string;
  count: number;
  description: string;
}

interface Emotion {
  emotion: string;
  percentage: number;
  icon: string;
}

interface Analysis {
  classroomId: string;
  childCount: number;
  activities: Activity[];
  emotions: Emotion[];
  summary: string;
  analyzedAt: string | null;
}

interface Classroom {
  id: string;
  name: string;
  cameraUrl: string | null;
  hasCamera: boolean;
  teacherName: string;
  studentCount: number;
  lastAnalysis: Analysis | null;
}

export default function CCTVScreen() {
  const router = useRouter();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const load = useCallback(async () => {
    try {
      setClassrooms(await getCCTVClassrooms());
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  const openClassroom = async (classroom: Classroom) => {
    setSelectedClassroom(classroom);
    setAnalysis(classroom.lastAnalysis || null);
    setModalVisible(true);

    try {
      const data = await getCCTVAnalysis(classroom.id);
      setAnalysis(data);
    } catch (e) {
      console.warn(e);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedClassroom || analyzing) return;
    setAnalyzing(true);
    try {
      const data = await triggerCCTVAnalysis(selectedClassroom.id);
      setAnalysis(data);
      // Refresh main list to update lastAnalysis
      load();
    } catch (e: any) {
      console.warn(e.message);
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>CCTV Monitor</Text>
        <Text style={styles.subtitle}>AI-powered classroom monitoring</Text>
      </View>

      <FlatList
        data={classrooms}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[Colors.primary]} />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => openClassroom(item)}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cameraIcon}>
                <Text style={styles.cameraEmoji}>{item.hasCamera ? "◉" : "○"}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.classroomName}>{item.name}</Text>
                <Text style={styles.classroomMeta}>
                  {item.teacherName} • {item.studentCount} students
                </Text>
              </View>
              <View style={[styles.statusDot, { backgroundColor: item.hasCamera ? "#4CAF50" : Colors.text3 }]} />
            </View>

            {item.lastAnalysis && (
              <View style={styles.quickAnalysis}>
                <View style={styles.emotionRow}>
                  {item.lastAnalysis.emotions.slice(0, 3).map((e, i) => (
                    <View key={i} style={styles.emotionChip}>
                      <Text style={styles.emotionIcon}>{e.icon}</Text>
                      <Text style={styles.emotionText}>{e.emotion} {e.percentage}%</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.analysisTime}>
                  Last analyzed: {new Date(item.lastAnalysis.analyzedAt!).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </Text>
              </View>
            )}

            {!item.hasCamera && (
              <View style={styles.noCameraBadge}>
                <Text style={styles.noCameraText}>No camera configured</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>◉</Text>
            <Text style={styles.emptyTitle}>No classrooms available</Text>
            <Text style={styles.emptyText}>You don't have access to any classroom cameras</Text>
          </View>
        }
      />

      {/* Analysis Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedClassroom?.name}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Camera Feed Placeholder */}
              <View style={styles.feedPlaceholder}>
                <View style={styles.feedContent}>
                  <Text style={styles.feedIcon}>◉</Text>
                  <Text style={styles.feedLabel}>
                    {selectedClassroom?.hasCamera ? "Live Camera Feed" : "No Camera Connected"}
                  </Text>
                  {selectedClassroom?.hasCamera && (
                    <Text style={styles.feedSub}>Stream URL configured</Text>
                  )}
                </View>
                <View style={styles.liveIndicator}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>
                    {selectedClassroom?.hasCamera ? "LIVE" : "OFFLINE"}
                  </Text>
                </View>
              </View>

              {/* Analyze Button */}
              {selectedClassroom?.hasCamera && (
                <TouchableOpacity
                  style={[styles.analyzeBtn, analyzing && { opacity: 0.6 }]}
                  onPress={handleAnalyze}
                  disabled={analyzing}
                  activeOpacity={0.7}
                >
                  {analyzing ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.analyzeBtnText}>◎ Analyze Now</Text>
                  )}
                </TouchableOpacity>
              )}

              {/* Analysis Results */}
              {analysis && analysis.analyzedAt && (
                <>
                  {/* Summary */}
                  <View style={styles.summaryCard}>
                    <Text style={styles.sectionTitle}>AI Summary</Text>
                    <Text style={styles.summaryText}>{analysis.summary}</Text>
                    <Text style={styles.childCountLabel}>
                      Children detected: <Text style={styles.childCountValue}>{analysis.childCount}</Text>
                    </Text>
                  </View>

                  {/* Emotions */}
                  <Text style={styles.sectionTitle}>Emotional State</Text>
                  <View style={styles.emotionGrid}>
                    {analysis.emotions.map((e, i) => (
                      <View key={i} style={styles.emotionCard}>
                        <Text style={styles.emotionCardIcon}>{e.icon}</Text>
                        <Text style={styles.emotionCardLabel}>{e.emotion}</Text>
                        <View style={styles.emotionBarBg}>
                          <View style={[styles.emotionBarFill, { width: `${e.percentage}%` }]} />
                        </View>
                        <Text style={styles.emotionCardPct}>{e.percentage}%</Text>
                      </View>
                    ))}
                  </View>

                  {/* Activities */}
                  <Text style={styles.sectionTitle}>Activities Detected</Text>
                  {analysis.activities.map((a, i) => (
                    <View key={i} style={styles.activityCard}>
                      <View style={styles.activityHeader}>
                        <Text style={styles.activityName}>{a.activity}</Text>
                        <View style={styles.activityCountBadge}>
                          <Text style={styles.activityCountText}>{a.count} children</Text>
                        </View>
                      </View>
                      <Text style={styles.activityDesc}>{a.description}</Text>
                    </View>
                  ))}

                  <Text style={styles.analysisTimestamp}>
                    Analysis from {new Date(analysis.analyzedAt).toLocaleString()}
                  </Text>
                </>
              )}

              {(!analysis || !analysis.analyzedAt) && (
                <View style={styles.noAnalysisBox}>
                  <Text style={styles.noAnalysisText}>
                    {selectedClassroom?.hasCamera
                      ? "No analysis available yet. Tap 'Analyze Now' to run AI analysis."
                      : "Configure a camera URL for this classroom to enable monitoring."}
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.bg },
  header: { paddingTop: 48, paddingHorizontal: 20, paddingBottom: 12 },
  backBtn: { marginBottom: 8 },
  backText: { color: Colors.primary, fontSize: 14, fontWeight: "600" },
  title: { fontSize: 24, fontWeight: "800", color: Colors.text },
  subtitle: { fontSize: 13, color: Colors.text3, marginTop: 2 },
  list: { padding: 16 },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 16, marginBottom: 12, ...Shadow },
  cardHeader: { flexDirection: "row", alignItems: "center" },
  cameraIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#F1EEF9", alignItems: "center", justifyContent: "center", marginRight: 12 },
  cameraEmoji: { fontSize: 20, color: "#7C5CBF" },
  classroomName: { fontSize: 16, fontWeight: "700", color: Colors.text },
  classroomMeta: { fontSize: 12, color: Colors.text3, marginTop: 2 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  quickAnalysis: { marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border },
  emotionRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  emotionChip: { flexDirection: "row", alignItems: "center", backgroundColor: "#F8F6FF", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, gap: 4 },
  emotionIcon: { fontSize: 14 },
  emotionText: { fontSize: 11, fontWeight: "600", color: Colors.text2 },
  analysisTime: { fontSize: 10, color: Colors.text3, marginTop: 8 },
  noCameraBadge: { marginTop: 10, backgroundColor: Colors.border, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, alignSelf: "flex-start" },
  noCameraText: { fontSize: 11, color: Colors.text3, fontWeight: "600" },
  emptyBox: { alignItems: "center", marginTop: 80 },
  emptyEmoji: { fontSize: 48, color: Colors.text3, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: Colors.text },
  emptyText: { fontSize: 13, color: Colors.text3, marginTop: 4 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: Colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "90%", paddingBottom: 32 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle: { fontSize: 18, fontWeight: "800", color: Colors.text },
  closeBtn: { fontSize: 20, color: Colors.text3, padding: 4 },
  modalBody: { padding: 16 },

  // Feed
  feedPlaceholder: { backgroundColor: "#1A1A2E", borderRadius: Radius.lg, padding: 24, alignItems: "center", marginBottom: 16 },
  feedContent: { alignItems: "center" },
  feedIcon: { fontSize: 40, color: "#7C5CBF", marginBottom: 8 },
  feedLabel: { fontSize: 15, fontWeight: "700", color: "#fff" },
  feedSub: { fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 4 },
  liveIndicator: { flexDirection: "row", alignItems: "center", marginTop: 16, backgroundColor: "rgba(255,255,255,0.1)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#E8614A", marginRight: 6 },
  liveText: { fontSize: 11, fontWeight: "700", color: "#fff", letterSpacing: 1 },

  // Analyze
  analyzeBtn: { backgroundColor: Colors.primary, paddingVertical: 14, borderRadius: Radius.md, alignItems: "center", marginBottom: 16 },
  analyzeBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },

  // Summary
  summaryCard: { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 16, marginBottom: 16, ...Shadow },
  summaryText: { fontSize: 14, lineHeight: 21, color: Colors.text2 },
  childCountLabel: { fontSize: 13, color: Colors.text3, marginTop: 10 },
  childCountValue: { fontWeight: "800", color: Colors.primary },

  sectionTitle: { fontSize: 15, fontWeight: "700", color: Colors.text, marginBottom: 10, marginTop: 4 },

  // Emotions
  emotionGrid: { gap: 8, marginBottom: 16 },
  emotionCard: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 12, ...Shadow },
  emotionCardIcon: { fontSize: 20, marginRight: 10 },
  emotionCardLabel: { fontSize: 13, fontWeight: "600", color: Colors.text, width: 70 },
  emotionBarBg: { flex: 1, height: 6, backgroundColor: Colors.border, borderRadius: 3, marginHorizontal: 8 },
  emotionBarFill: { height: 6, backgroundColor: Colors.primary, borderRadius: 3 },
  emotionCardPct: { fontSize: 12, fontWeight: "700", color: Colors.primary, width: 36, textAlign: "right" },

  // Activities
  activityCard: { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 14, marginBottom: 8, ...Shadow },
  activityHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  activityName: { fontSize: 14, fontWeight: "600", color: Colors.text },
  activityCountBadge: { backgroundColor: Colors.primaryPale, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  activityCountText: { fontSize: 11, fontWeight: "700", color: Colors.primary },
  activityDesc: { fontSize: 12, color: Colors.text3, marginTop: 6, lineHeight: 17 },

  analysisTimestamp: { fontSize: 11, color: Colors.text3, textAlign: "center", marginTop: 12, marginBottom: 20 },
  noAnalysisBox: { alignItems: "center", paddingVertical: 30 },
  noAnalysisText: { fontSize: 14, color: Colors.text3, textAlign: "center", lineHeight: 20 },
});
