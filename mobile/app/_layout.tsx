import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "../lib/auth";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { Colors } from "../lib/theme";
import { connectSocket, disconnectSocket } from "../lib/socket";

function AuthGate() {
  const { isAuthenticated, isLoading, token } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && token) {
      connectSocket();
    } else {
      disconnectSocket();
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === "(tabs)";
    const onLoginPage = segments[0] === "login";

    if (!isAuthenticated && !onLoginPage) {
      router.replace("/login");
    } else if (isAuthenticated && onLoginPage) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
});
