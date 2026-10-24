import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useArtworks } from "@/hooks/use-artworks";
import { artworkAssetUri, extractArtworkAssetKey } from "@/lib/artwork-assets";
import { trpc } from "@/lib/trpc";

const C = {
  paper: "#FBF8F1",
  surface: "#FFFFFF",
  ink: "#24322B",
  muted: "#7D887F",
  green: "#176B45",
  greenSoft: "#E7F1E9",
  pink: "#D98BA4",
  line: "#E7E2D8",
  gold: "#C09A50",
  danger: "#A6424E",
};

const IDEAS = ["Un ciervo mágico en un bosque de cristal", "Una ciudad flotante al atardecer", "Una criatura guardiana de gemas"];

export default function AITab() {
  const router = useRouter();
  const { save } = useArtworks();
  const generate = trpc.art.generate.useMutation();
  const [prompt, setPrompt] = useState("");
  const [assetKey, setAssetKey] = useState<string>();
  const [notice, setNotice] = useState("");
  const [saved, setSaved] = useState(false);

  const createImage = async () => {
    setNotice("");
    setSaved(false);
    setAssetKey(undefined);
    try {
      const result = await generate.mutateAsync({ prompt: prompt.trim() });
      const key = result.url ? extractArtworkAssetKey(result.url) : undefined;
      if (!key) throw new Error("No se recibió una imagen guardable.");
      setAssetKey(key);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "No se pudo generar la imagen. Inténtalo de nuevo.");
    }
  };

  const saveGenerated = async () => {
    if (!assetKey) return;
    try {
      const title = prompt.trim().slice(0, 48) || "Arte creado con IA";
      await save({ title, kind: "generated", strokes: [], assetKey });
      setSaved(true);
      setNotice("Guardada en Mis obras.");
    } catch {
      setNotice("No se pudo guardar. Inténtalo de nuevo.");
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.brandMark}><Feather name="star" size={19} color={C.green} /></View>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>TRAZAARTE · ESTUDIO IA</Text>
            <Text style={styles.title}>Dale forma a tu idea</Text>
          </View>
        </View>

        <Text style={styles.intro}>Descríbela en español. La IA creará una imagen para que la guardes o la lleves al lienzo.</Text>
        <Text style={styles.fieldLabel}>¿Qué te gustaría imaginar?</Text>
        <TextInput
          multiline
          maxLength={1000}
          value={prompt}
          onChangeText={(text) => {
            setPrompt(text);
            setNotice("");
          }}
          placeholder="Ej.: Una guardiana del bosque con cabello rosa, cristales de diamante y hojas doradas…"
          placeholderTextColor="#9AA198"
          textAlignVertical="top"
          style={styles.promptInput}
          accessibilityLabel="Descripción para generar arte con IA"
        />
        <Text style={styles.counter}>{prompt.length}/1000</Text>

        <Text style={styles.fieldLabel}>Una chispa para empezar</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ideasRow}>
          {IDEAS.map((idea) => (
            <Pressable key={idea} onPress={() => setPrompt(idea)} style={styles.ideaChip}>
              <Text style={styles.ideaText}>{idea}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <Pressable disabled={generate.isPending || prompt.trim().length < 3} onPress={() => void createImage()} style={[styles.generateButton, (generate.isPending || prompt.trim().length < 3) && styles.disabled]}>
          {generate.isPending ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Feather name="star" color="#FFFFFF" size={17} />}
          <Text style={styles.generateText}>{generate.isPending ? "Creando tu imagen…" : "Generar imagen"}</Text>
        </Pressable>
        <Text style={styles.smallNote}>La generación puede tardar unos momentos. Tu imagen se conserva si la guardas en Mis obras.</Text>

        {notice ? <View style={[styles.noticeBox, assetKey ? styles.noticeSuccess : styles.noticeError]}><Text style={styles.noticeText}>{notice}</Text></View> : null}

        {assetKey ? (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <View>
                <Text style={styles.resultEyebrow}>TU CREACIÓN</Text>
                <Text style={styles.resultTitle}>¿Qué quieres hacer con ella?</Text>
              </View>
              <Feather name="check-circle" size={21} color={C.green} />
            </View>
            <Image source={{ uri: artworkAssetUri(assetKey) }} resizeMode="cover" style={styles.resultImage} />
            <View style={styles.resultActions}>
              <Pressable onPress={() => router.push({ pathname: "/editor", params: { assetKey } })} style={styles.secondaryButton}>
                <Feather name="edit-3" size={15} color={C.green} />
                <Text style={styles.secondaryButtonText}>Llevar al lienzo</Text>
              </Pressable>
              <Pressable disabled={saved} onPress={() => void saveGenerated()} style={[styles.primaryButton, saved && styles.savedButton]}>
                <Feather name={saved ? "check" : "bookmark"} size={15} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>{saved ? "Guardada" : "Guardar obra"}</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.paper },
  content: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 24, gap: 10 },
  header: { flexDirection: "row", alignItems: "center", gap: 11, marginBottom: 2 },
  brandMark: { width: 42, height: 42, borderRadius: 14, backgroundColor: C.greenSoft, alignItems: "center", justifyContent: "center" },
  headerText: { flex: 1 },
  eyebrow: { color: C.green, fontSize: 9, fontWeight: "800", letterSpacing: 1.5 },
  title: { color: C.ink, fontSize: 23, fontWeight: "800", marginTop: 3 },
  intro: { color: C.muted, fontSize: 13, lineHeight: 19, marginBottom: 6 },
  fieldLabel: { color: C.ink, fontWeight: "800", fontSize: 12, marginTop: 4 },
  promptInput: { minHeight: 118, borderRadius: 17, borderWidth: 1, borderColor: C.line, backgroundColor: C.surface, paddingHorizontal: 15, paddingVertical: 14, color: C.ink, fontSize: 14, lineHeight: 20 },
  counter: { alignSelf: "flex-end", color: C.muted, fontSize: 10, marginTop: -7 },
  ideasRow: { gap: 8, paddingVertical: 3 },
  ideaChip: { borderRadius: 16, borderWidth: 1, borderColor: "#E3DBCC", backgroundColor: "#F5EFE3", paddingHorizontal: 12, paddingVertical: 8 },
  ideaText: { color: C.ink, fontSize: 10, fontWeight: "600" },
  generateButton: { minHeight: 49, borderRadius: 16, backgroundColor: C.green, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 9, marginTop: 2 },
  disabled: { opacity: 0.5 },
  generateText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  smallNote: { color: C.muted, fontSize: 10, lineHeight: 15, textAlign: "center", marginHorizontal: 12 },
  noticeBox: { padding: 11, borderRadius: 12, borderWidth: 1 },
  noticeSuccess: { backgroundColor: C.greenSoft, borderColor: "#D0E2D4" },
  noticeError: { backgroundColor: "#FFF0EE", borderColor: "#F1D4D0" },
  noticeText: { color: C.ink, fontSize: 12, fontWeight: "600" },
  resultCard: { backgroundColor: C.surface, borderRadius: 20, padding: 12, borderWidth: 1, borderColor: C.line, marginTop: 4 },
  resultHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 3, paddingBottom: 10 },
  resultEyebrow: { color: C.gold, fontSize: 9, fontWeight: "800", letterSpacing: 1.4 },
  resultTitle: { color: C.ink, fontSize: 14, fontWeight: "800", marginTop: 3 },
  resultImage: { width: "100%", aspectRatio: 0.9, borderRadius: 14, backgroundColor: "#F1EEE6" },
  resultActions: { flexDirection: "row", gap: 8, marginTop: 11 },
  secondaryButton: { flex: 1, minHeight: 43, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 12, backgroundColor: C.greenSoft },
  secondaryButtonText: { color: C.green, fontSize: 11, fontWeight: "800" },
  primaryButton: { flex: 1, minHeight: 43, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 12, backgroundColor: C.green },
  savedButton: { backgroundColor: C.gold },
  primaryButtonText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800" },
});
