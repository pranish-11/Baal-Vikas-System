import React, { useState, useEffect, useCallback } from "react";
import { StyleSheet, Text, View, FlatList, RefreshControl, ActivityIndicator } from "react-native";
import { getFees } from "../../lib/api";
import { Colors, Radius, Shadow } from "../../lib/theme";

export default function FeesScreen() {
  const [fees, setFees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try { setFees(await getFees()); } catch (e) { console.warn(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, []);

  const total = fees.reduce((s, f) => s + f.amount, 0);
  const paid = fees.reduce((s, f) => s + f.amountPaid, 0);
  const outstanding = total - paid;

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Fees</Text>
      </View>

      {/* Summary bar */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: Colors.skyPale }]}>
          <Text style={[styles.summaryValue, { color: Colors.sky }]}>₹{total.toLocaleString()}</Text>
          <Text style={[styles.summaryLabel, { color: Colors.sky }]}>Total</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: "#E8F5E9" }]}>
          <Text style={[styles.summaryValue, { color: "#4CAF50" }]}>₹{paid.toLocaleString()}</Text>
          <Text style={[styles.summaryLabel, { color: "#4CAF50" }]}>Paid</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: Colors.coralPale }]}>
          <Text style={[styles.summaryValue, { color: Colors.coral }]}>₹{outstanding.toLocaleString()}</Text>
          <Text style={[styles.summaryLabel, { color: Colors.coral }]}>Due</Text>
        </View>
      </View>

      <FlatList
        data={fees}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[Colors.primary]} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.feeTitle}>{item.title}</Text>
                <Text style={styles.feeName}>{item.student?.firstName} {item.student?.lastName}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: item.status === "PAID" ? "#E8F5E9" : Colors.coralPale }]}>
                <Text style={[styles.statusText, { color: item.status === "PAID" ? "#4CAF50" : Colors.coral }]}>
                  {item.status === "PAID" ? "✅ Paid" : "⚠️ Due"}
                </Text>
              </View>
            </View>
            <View style={styles.cardBottom}>
              <Text style={styles.feeAmount}>₹{item.amount.toLocaleString()}</Text>
              <Text style={styles.feeDue}>Due: {new Date(item.dueDate).toLocaleDateString()}</Text>
            </View>
            {item.amountPaid > 0 && item.amountPaid < item.amount && (
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${(item.amountPaid / item.amount) * 100}%` }]} />
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No fee records</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.bg },
  header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: "800", color: Colors.text },
  summaryRow: { flexDirection: "row", gap: 10, paddingHorizontal: 16, marginBottom: 8 },
  summaryCard: { flex: 1, borderRadius: Radius.sm, padding: 12, alignItems: "center" },
  summaryValue: { fontSize: 16, fontWeight: "800" },
  summaryLabel: { fontSize: 10, fontWeight: "600", marginTop: 2 },
  list: { padding: 16, paddingTop: 4 },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 16, marginBottom: 10, ...Shadow },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  feeTitle: { fontSize: 14, fontWeight: "600", color: Colors.text, maxWidth: "70%" },
  feeName: { fontSize: 12, color: Colors.text3, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: "600" },
  cardBottom: { flexDirection: "row", justifyContent: "space-between", marginTop: 12 },
  feeAmount: { fontSize: 18, fontWeight: "800", color: Colors.text },
  feeDue: { fontSize: 12, color: Colors.text3 },
  progressBar: { height: 4, backgroundColor: Colors.border, borderRadius: 2, marginTop: 10 },
  progressFill: { height: 4, backgroundColor: Colors.primary, borderRadius: 2 },
  empty: { textAlign: "center", color: Colors.text3, marginTop: 40 },
});
