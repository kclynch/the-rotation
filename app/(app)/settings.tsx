import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ScrollView,
  Share,
  ActivityIndicator,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import Constants from "expo-constants";
import { useAuth } from "@/contexts/AuthContext";
import { theme } from "@/lib/theme";

export default function Settings() {
  const { household, session, signOut, joinHousehold, renameHousehold } = useAuth();
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(household?.name ?? "");

  const handleCopyCode = async () => {
    if (!household) return;
    await Clipboard.setStringAsync(household.invite_code);
    Alert.alert("Copied", "Invite code copied to clipboard.");
  };

  const handleShareCode = async () => {
    if (!household) return;
    await Share.share({
      message: `Join my recipe book on Rotaysh! Use invite code: ${household.invite_code}`,
    });
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    Alert.alert(
      "Join this recipe book?",
      "You'll leave your current book and start sharing recipes with this one instead.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Join",
          onPress: async () => {
            setJoining(true);
            try {
              await joinHousehold(joinCode.trim());
              setJoinCode("");
              Alert.alert("You're in!", "You're now sharing a recipe book together.");
            } catch (err: any) {
              Alert.alert("Couldn't join", err.message ?? "Check the code and try again.");
            } finally {
              setJoining(false);
            }
          },
        },
      ]
    );
  };

  const handleRename = async () => {
    if (!name.trim() || name === household?.name) return;
    setRenaming(true);
    try {
      await renameHousehold(name.trim());
    } catch (err: any) {
      Alert.alert("Couldn't rename", err.message ?? "Please try again.");
    } finally {
      setRenaming(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert("Sign out?", undefined, [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: () => signOut() },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Your Book</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Book name</Text>
        <View style={styles.renameRow}>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            onSubmitEditing={handleRename}
            placeholder="Our Recipe Book"
            placeholderTextColor={theme.colors.muted}
          />
          {renaming ? <ActivityIndicator color={theme.colors.primary} /> : null}
        </View>
      </View>

      <Text style={styles.sectionTitle}>Share With Your Partner</Text>
      <View style={styles.card}>
        <Text style={styles.helperText}>
          Share this invite code so they can see and edit the same recipes as you.
        </Text>
        <Pressable style={styles.codeBox} onPress={handleCopyCode}>
          <Text style={styles.code}>{household?.invite_code ?? "------"}</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={handleShareCode}>
          <Text style={styles.secondaryButtonText}>Share Invite Code</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Join a Different Book</Text>
      <View style={styles.card}>
        <Text style={styles.helperText}>
          Got an invite code from your partner? Enter it here to start sharing their book.
        </Text>
        <TextInput
          style={styles.input}
          value={joinCode}
          onChangeText={(text) => setJoinCode(text.toUpperCase())}
          placeholder="ABC123"
          placeholderTextColor={theme.colors.muted}
          autoCapitalize="characters"
          maxLength={6}
        />
        <Pressable style={styles.primaryButton} onPress={handleJoin} disabled={joining}>
          {joining ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Join Book</Text>
          )}
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Account</Text>
      <View style={styles.card}>
        <Text style={styles.helperText}>{session?.user.email}</Text>
        <Text style={styles.versionText}>
          Rotaysh v{Constants.expoConfig?.version ?? "1.0.0"}
        </Text>
        <Pressable style={styles.dangerButton} onPress={handleSignOut}>
          <Text style={styles.dangerButtonText}>Sign Out</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 48,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 20,
    marginBottom: 8,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
  },
  label: {
    fontSize: 13,
    color: theme.colors.muted,
    marginBottom: 6,
  },
  helperText: {
    fontSize: 13,
    color: theme.colors.muted,
    marginBottom: 12,
    lineHeight: 18,
  },
  renameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: theme.colors.text,
    marginBottom: 12,
  },
  codeBox: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  code: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 6,
    color: theme.colors.primaryDark,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius,
    paddingVertical: 13,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  secondaryButton: {
    borderRadius: theme.radius,
    paddingVertical: 13,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  secondaryButtonText: {
    color: theme.colors.primaryDark,
    fontWeight: "700",
    fontSize: 15,
  },
  dangerButton: {
    marginTop: 4,
    paddingVertical: 13,
    alignItems: "center",
  },
  dangerButtonText: {
    color: theme.colors.danger,
    fontWeight: "700",
    fontSize: 15,
  },
  versionText: {
    fontSize: 12,
    color: theme.colors.muted,
    marginBottom: 8,
  },
});
