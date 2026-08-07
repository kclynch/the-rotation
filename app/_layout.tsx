import { useEffect, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as Updates from "expo-updates";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator } from "react-native";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

SplashScreen.preventAutoHideAsync().catch(() => {});

function RouteGuard({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!session && !inAuthGroup) {
      router.replace("/(auth)/sign-in");
    } else if (session && inAuthGroup) {
      router.replace("/(app)");
    }

    SplashScreen.hideAsync().catch(() => {});
  }, [session, isLoading, segments, router]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#E8734A" />
      </View>
    );
  }

  return <>{children}</>;
}

function useOtaUpdates() {
  useEffect(() => {
    if (__DEV__) return;

    Updates.checkForUpdateAsync()
      .then(async (result) => {
        if (result.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      })
      .catch(() => {
        // Offline or update check failed - app continues on the version it has.
      });
  }, []);
}

export default function RootLayout() {
  useOtaUpdates();

  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <RouteGuard>
        <Stack screenOptions={{ headerShadowVisible: false }}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(app)" options={{ headerShown: false }} />
          <Stack.Screen name="recipe/[id]/index" options={{ title: "Recipe" }} />
          <Stack.Screen name="recipe/[id]/edit" options={{ title: "Edit Recipe" }} />
          <Stack.Screen name="recipe/new" options={{ title: "New Recipe", presentation: "modal" }} />
        </Stack>
      </RouteGuard>
    </AuthProvider>
  );
}
