import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ArtworkPreview } from "@/components/artwork-preview";
import { useArtworks } from "@/hooks/use-artworks";
import type { Artwork } from "@/lib/artwork-storage";

const C = {
  paper: "#FBF8F1",
  surface: "#FFFFFF",
  ink: "#24322B",
  muted: "#7D887F",
  green: "#176B45",
  greenSoft: "#E7F1E9",
  pink: "#D98BA4",
  line: "#E7E2D8",
  danger: "#A6424E",
};

function formatDate(date: string) {
  try {
    return new Intl.DateTimeFormat("es", { day: "numeric", month: "short" }).format(new Date(date));
  } catch {
    return "Reciente";
  }
}

export default function GalleryTab() {
  const router = useRouter();
  const { artworks, loading, reload, remove } = useArtworks();
  const [pendingDelete, setPendingDelete] = useState<Artwork>();

  useFocusEffect(useCallback(() => { void reload(); }, [reload]));

  const openArtwork = (artwork: Artwork) => router.push({ pathname: "/editor", params: { artworkId: artwork.id } });
  const confirmDelete = async () => {
    if (!pendingDelete) return;
    await remove(pendingDelete.id);
    setPendingDelete(undefined);
  };

  const renderItem = ({ item }: { item: Artwork }) => (
    <View style={styles.card}>
      <Pressable onPress={() => openArtwork(item)} accessibilityRole="button" accessibilityLabel={`Abrir ${item.title}`}>
        <ArtworkPreview assetKey={item.assetKey} strokes={item.strokes} />
        <View style={styles.cardInfo}>
          <Text numberOfLines={1} style={styles.artTitle}>{item.title}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.meta}>{item.kind === "generated" ? "Creada con IA" : "Dibujo"}</Text>
            <Text style={styles.meta}>{formatDate(item.modifiedAt)}</Text>
          </View>
        </View>
      </Pressable>
      <View style={styles.cardActions}>
        <Pressable onPress={() => openArtwork(item)} style={styles.editAction}>
          <Feather name="edit-3" size={13} color={C.green} />
          <Text style={styles.editText}>Editar</Text>
        </Pressable>
        <Pressable accessibilityLabel={`Eliminar ${item.title}`} onPress={() => setPendingDelete(item)} style={styles.deleteAction}>
          <Feather name="trash-2" size={14} color={C.danger} />
        </Pressable>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <View style={styles.brandMark}><Feather name="image" size={18} color={C.green} /></View>
        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>TU COLECCIÓN</Text>
          <Text style={styles.title}>Mis obras</Text>
        </View>
        <Text style={styles.count}>{artworks.length} {artworks.length === 1 ? "obra" : "obras"}</Text>
      </View>
      {loading && !artworks.length ? (
        <View style={styles.center}><ActivityIndicator color={C.green} /><Text style={styles.emptyCaption}>Cargando tu galería…</Text></View>
      ) : artworks.length ? (
        <FlatList
          data={artworks}
          keyExtractor={(item) => item.id}
          numColumns={2}
          renderItem={renderItem}
          columnWrapperStyle={styles.columns}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onRefresh={() => void reload()}
          refreshing={loading}
        />
      ) : (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}><Feather name="feather" size={30} color={C.green} /></View>
          <Text style={styles.emptyTitle}>Tu próxima obra empieza aquí</Text>
          <Text style={styles.emptyCaption}>Guarda un dibujo o crea una imagen con IA. Tus obras aparecerán en esta galería.</Text>
          <Pressable onPress={() => router.navigate("/(tabs)/ai")} style={styles.emptyButton}>
            <Feather name="star" size={15} color="#FFFFFF" />
            <Text style={styles.emptyButtonText}>Crear con IA</Text>
          </Pressable>
        </View>
      )}

      <Modal transparent visible={Boolean(pendingDelete)} animationType="fade" onRequestClose={() => setPendingDelete(undefined)}>
        <View style={styles.modalShade}>
          <View style={styles.modalCard}>
            <Text style={styles.modalEyebrow}>MIS OBRAS</Text>
            <Text style={styles.modalTitle}>¿Eliminar esta obra?</Text>
            <Text style={styles.modalBody}>“{pendingDelete?.title}” se quitará de la galería de este dispositivo.</Text>
            <View style={styles.modalActions}>
              <Pressable onPress={() => setPendingDelete(undefined)} style={styles.cancelButton}><Text style={styles.cancelText}>Cancelar</Text></Pressable>
              <Pressable onPress={() => void confirmDelete()} style={styles.deleteConfirm}><Text style={styles.deleteConfirmText}>Eliminar</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.paper },
  header: { minHeight: 70, paddingHorizontal: 17, flexDirection: "row", alignItems: "center", gap: 11 },
  brandMark: { width: 40, height: 40, borderRadius: 14, backgroundColor: C.greenSoft, alignItems: "center", justifyContent: "center" },
  headerText: { flex: 1 },
  eyebrow: { color: C.green, fontSize: 9, fontWeight: "800", letterSpacing: 1.6 },
  title: { color: C.ink, fontSize: 23, fontWeight: "800", marginTop: 2 },
  count: { color: C.muted, fontSize: 11, fontWeight: "700" },
  listContent: { paddingHorizontal: 13, paddingTop: 9, paddingBottom: 20, gap: 11 },
  columns: { gap: 11 },
  card: { flex: 1, minWidth: 0, backgroundColor: C.surface, borderRadius: 18, padding: 8, borderWidth: 1, borderColor: C.line },
  cardInfo: { paddingHorizontal: 4, paddingTop: 8 },
  artTitle: { color: C.ink, fontSize: 12, fontWeight: "800" },
  metaRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 3, gap: 4 },
  meta: { color: C.muted, fontSize: 9, flexShrink: 1 },
  cardActions: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 3, paddingTop: 8 },
  editAction: { flexDirection: "row", alignItems: "center", gap: 5, paddingVertical: 5, paddingHorizontal: 6 },
  editText: { color: C.green, fontSize: 10, fontWeight: "800" },
  deleteAction: { width: 31, height: 31, alignItems: "center", justifyContent: "center", borderRadius: 10, backgroundColor: "#FFF2F0" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  emptyState: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 34, paddingBottom: 50 },
  emptyIcon: { width: 72, height: 72, borderRadius: 26, backgroundColor: C.greenSoft, alignItems: "center", justifyContent: "center", marginBottom: 18 },
  emptyTitle: { color: C.ink, fontSize: 19, fontWeight: "800", textAlign: "center" },
  emptyCaption: { color: C.muted, fontSize: 12, lineHeight: 18, textAlign: "center", marginTop: 8, maxWidth: 290 },
  emptyButton: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 20, borderRadius: 13, paddingHorizontal: 16, paddingVertical: 11, backgroundColor: C.green },
  emptyButtonText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },
  modalShade: { flex: 1, backgroundColor: "rgba(28, 38, 32, 0.35)", justifyContent: "center", alignItems: "center", padding: 22 },
  modalCard: { width: "100%", maxWidth: 420, borderRadius: 22, padding: 22, backgroundColor: C.paper, borderWidth: 1, borderColor: C.line },
  modalEyebrow: { color: C.green, fontSize: 9, letterSpacing: 1.4, fontWeight: "800" },
  modalTitle: { color: C.ink, fontSize: 20, fontWeight: "800", marginTop: 8 },
  modalBody: { color: C.muted, fontSize: 13, lineHeight: 19, marginTop: 8 },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 9, marginTop: 20 },
  cancelButton: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, backgroundColor: "#EEEAE1" },
  cancelText: { color: C.ink, fontWeight: "700", fontSize: 12 },
  deleteConfirm: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 11, backgroundColor: C.danger },
  deleteConfirmText: { color: "#FFFFFF", fontWeight: "800", fontSize: 12 },
});
