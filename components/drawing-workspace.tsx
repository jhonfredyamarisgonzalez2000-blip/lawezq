import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { DrawingCanvas } from "@/components/drawing-canvas";
import { getArtwork } from "@/lib/artwork-storage";
import type { Artwork, DrawingStroke } from "@/lib/artwork-storage";
import { useArtworks } from "@/hooks/use-artworks";

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

const PALETTE = [
  { name: "Verde intenso", color: "#176B45" },
  { name: "Rosa", color: "#D98BA4" },
  { name: "Plata", color: "#9EA7AA" },
  { name: "Oro", color: "#C09A50" },
  { name: "Diamante", color: "#B8E4E7" },
  { name: "Café", color: "#70523B" },
  { name: "Blanco", color: "#FFFFFF" },
  { name: "Gris", color: "#7D8586" },
  { name: "Violeta rojizo", color: "#874F78" },
  { name: "Rubí", color: "#B8263E" },
  { name: "Tinta", color: "#26312D" },
];
const SIZES = [5, 9, 15, 23];
const OPACITIES = [0.35, 0.65, 1];

type Props = {
  initialArtworkId?: string;
  initialAssetKey?: string;
  showBackButton?: boolean;
};

type HistoryEntry =
  | { type: "stroke"; stroke: DrawingStroke }
  | { type: "clear"; strokes: DrawingStroke[]; assetKey?: string; kind: Artwork["kind"] };

export function DrawingWorkspace({ initialArtworkId, initialAssetKey, showBackButton = false }: Props) {
  const router = useRouter();
  const { save } = useArtworks();
  const [strokes, setStrokes] = useState<DrawingStroke[]>([]);
  const [undoStack, setUndoStack] = useState<HistoryEntry[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryEntry[]>([]);
  const [assetKey, setAssetKey] = useState<string | undefined>(initialAssetKey);
  const [artworkId, setArtworkId] = useState<string | undefined>(initialArtworkId);
  const [title, setTitle] = useState("Mi dibujo");
  const [artworkKind, setArtworkKind] = useState<Artwork["kind"]>("drawing");
  const [color, setColor] = useState(PALETTE[0].color);
  const [tool, setTool] = useState<"brush" | "eraser">("brush");
  const [brushSize, setBrushSize] = useState(9);
  const [opacity, setOpacity] = useState(1);
  const [saveOpen, setSaveOpen] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    if (initialArtworkId) {
      void getArtwork(initialArtworkId).then((artwork) => {
        if (!active || !artwork) return;
        setArtworkId(artwork.id);
        setTitle(artwork.title);
        setStrokes(artwork.strokes);
        setAssetKey(artwork.assetKey);
        setArtworkKind(artwork.kind);
        setUndoStack([]);
        setRedoStack([]);
      });
    } else {
      setArtworkId(undefined);
      setTitle(initialAssetKey ? "Arte con IA" : "Mi dibujo");
      setStrokes([]);
      setAssetKey(initialAssetKey);
      setArtworkKind(initialAssetKey ? "generated" : "drawing");
      setUndoStack([]);
      setRedoStack([]);
    }
    return () => {
      active = false;
    };
  }, [initialArtworkId, initialAssetKey]);

  const addStroke = (stroke: DrawingStroke) => {
    setStrokes((current) => [...current, stroke]);
    setUndoStack((history) => [...history, { type: "stroke", stroke }]);
    setRedoStack([]);
    setNotice("");
  };

  const undo = () => {
    const action = undoStack[undoStack.length - 1];
    if (!action) return;
    setUndoStack((history) => history.slice(0, -1));
    setRedoStack((history) => [...history, action]);
    if (action.type === "stroke") {
      setStrokes((current) => current.filter((stroke) => stroke.id !== action.stroke.id));
    } else {
      setStrokes(action.strokes);
      setAssetKey(action.assetKey);
      setArtworkKind(action.kind);
    }
  };

  const redo = () => {
    const action = redoStack[redoStack.length - 1];
    if (!action) return;
    setRedoStack((history) => history.slice(0, -1));
    setUndoStack((history) => [...history, action]);
    if (action.type === "stroke") {
      setStrokes((current) => [...current, action.stroke]);
    } else {
      setStrokes([]);
      setAssetKey(undefined);
      setArtworkKind("drawing");
    }
  };

  const confirmClear = () => {
    if (!strokes.length && !assetKey) {
      setClearOpen(false);
      setNotice("El lienzo ya está limpio.");
      return;
    }
    setUndoStack((history) => [...history, { type: "clear", strokes, assetKey, kind: artworkKind }]);
    setRedoStack([]);
    setStrokes([]);
    setAssetKey(undefined);
    setArtworkKind("drawing");
    setNotice("Lienzo limpio. Usa Deshacer para restaurar el contenido.");
    setClearOpen(false);
  };

  const saveArtwork = async () => {
    if (!strokes.length && !assetKey) {
      setSaveOpen(false);
      setNotice("Haz un trazo o abre una imagen antes de guardar.");
      return;
    }
    try {
      const saved = await save({
        id: artworkId,
        title,
        kind: assetKey ? artworkKind : "drawing",
        strokes,
        ...(assetKey ? { assetKey } : {}),
      });
      setArtworkId(saved.id);
      setTitle(saved.title);
      setSaveOpen(false);
      setNotice("Guardado en Mis obras.");
    } catch {
      setNotice("No se pudo guardar. Inténtalo de nuevo.");
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        {showBackButton ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Volver" onPress={() => router.back()} style={styles.backButton}>
            <Feather name="arrow-left" size={20} color={C.ink} />
          </Pressable>
        ) : (
          <View style={styles.brandMark}>
            <Feather name="feather" size={18} color={C.green} />
          </View>
        )}
        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>TRAZAARTE</Text>
          <Text style={styles.heading}>{artworkId ? title : "Tu lienzo"}</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={() => setSaveOpen(true)} style={styles.saveButton}>
          <Feather name="bookmark" size={16} color="#FFFFFF" />
          <Text style={styles.saveButtonText}>Guardar</Text>
        </Pressable>
      </View>

      <View style={styles.canvasLabelRow}>
        <Text style={styles.sectionLabel}>{assetKey ? "TU IMAGEN + TUS TRAZOS" : "DIBUJA CON EL DEDO"}</Text>
        <Text style={styles.canvasHint}>Desliza para dibujar</Text>
      </View>
      <View style={styles.canvasWrap}>
        <DrawingCanvas
          strokes={strokes}
          assetKey={assetKey}
          color={color}
          brushSize={brushSize}
          opacity={opacity}
          erasing={tool === "eraser"}
          onStrokeComplete={addStroke}
        />
      </View>

      <View style={styles.tools}>
        <View style={styles.toolRow}>
          <Pressable onPress={() => setTool("brush")} style={[styles.toolButton, tool === "brush" && styles.toolButtonActive]}>
            <Feather name="edit-3" size={16} color={tool === "brush" ? C.green : C.muted} />
            <Text style={[styles.toolText, tool === "brush" && styles.toolTextActive]}>Pincel</Text>
          </Pressable>
          <Pressable onPress={() => setTool("eraser")} style={[styles.toolButton, tool === "eraser" && styles.toolButtonActive]}>
            <Feather name="delete" size={16} color={tool === "eraser" ? C.green : C.muted} />
            <Text style={[styles.toolText, tool === "eraser" && styles.toolTextActive]}>Borrador</Text>
          </Pressable>
          <View style={styles.rowSpacer} />
          <Pressable accessibilityLabel="Deshacer" disabled={!undoStack.length} onPress={undo} style={styles.iconButton}>
            <Feather name="corner-up-left" size={18} color={undoStack.length ? C.ink : "#C8CDC8"} />
          </Pressable>
          <Pressable accessibilityLabel="Rehacer" disabled={!redoStack.length} onPress={redo} style={styles.iconButton}>
            <Feather name="corner-up-right" size={18} color={redoStack.length ? C.ink : "#C8CDC8"} />
          </Pressable>
          <Pressable accessibilityLabel="Limpiar lienzo" onPress={() => setClearOpen(true)} style={styles.iconButton}>
            <Feather name="trash-2" size={17} color={C.danger} />
          </Pressable>
        </View>

        <View style={styles.paletteHeader}>
          <Text style={styles.controlLabel}>Color</Text>
          <Text style={styles.selectedColorName}>{PALETTE.find((item) => item.color === color)?.name ?? "Personalizado"}</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.palette}>
          {PALETTE.map((item) => {
            const selected = item.color === color;
            return (
              <Pressable
                key={item.color}
                accessibilityRole="button"
                accessibilityLabel={`Color ${item.name}`}
                accessibilityState={{ selected }}
                onPress={() => {
                  setColor(item.color);
                  setTool("brush");
                }}
                style={[styles.swatchOuter, selected && styles.swatchSelected]}
              >
                <View style={[styles.swatch, { backgroundColor: item.color, borderColor: item.color === "#FFFFFF" ? C.line : item.color }]} />
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.adjustRow}>
          <Text style={styles.controlLabel}>Grosor</Text>
          {SIZES.map((value) => (
            <Pressable key={value} accessibilityRole="button" accessibilityLabel={`Grosor ${value}`} onPress={() => setBrushSize(value)} style={[styles.sizeChoice, brushSize === value && styles.choiceActive]}>
              <View style={[styles.sizeDot, { width: Math.max(value, 5), height: Math.max(value, 5) }]} />
            </Pressable>
          ))}
          <View style={styles.rowSpacer} />
          <Text style={styles.controlLabel}>Opacidad</Text>
          {OPACITIES.map((value) => (
            <Pressable key={value} onPress={() => setOpacity(value)} style={[styles.opacityChoice, opacity === value && styles.choiceActive]}>
              <Text style={[styles.opacityText, opacity === value && styles.opacityTextActive]}>{Math.round(value * 100)}%</Text>
            </Pressable>
          ))}
        </View>
        {notice ? <Text accessibilityLiveRegion="polite" style={styles.notice}>{notice}</Text> : null}
      </View>

      <Modal transparent visible={saveOpen} animationType="fade" onRequestClose={() => setSaveOpen(false)}>
        <View style={styles.modalShade}>
          <View style={styles.modalCard}>
            <Text style={styles.modalEyebrow}>GUARDAR EN TU GALERÍA</Text>
            <Text style={styles.modalTitle}>Ponle nombre a tu obra</Text>
            <TextInput value={title} onChangeText={setTitle} maxLength={50} placeholder="Mi dibujo" placeholderTextColor={C.muted} style={styles.nameInput} returnKeyType="done" />
            <View style={styles.modalActions}>
              <Pressable onPress={() => setSaveOpen(false)} style={styles.cancelButton}><Text style={styles.cancelText}>Cancelar</Text></Pressable>
              <Pressable onPress={() => void saveArtwork()} style={styles.confirmButton}><Text style={styles.confirmText}>Guardar obra</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={clearOpen} animationType="fade" onRequestClose={() => setClearOpen(false)}>
        <View style={styles.modalShade}>
          <View style={styles.modalCard}>
            <Text style={styles.modalEyebrow}>LIENZO</Text>
            <Text style={styles.modalTitle}>¿Limpiar el lienzo?</Text>
            <Text style={styles.modalBody}>Se quitarán los trazos y la imagen de fondo, si hay una. Usa Deshacer para restaurar el contenido antes de guardar.</Text>
            <View style={styles.modalActions}>
              <Pressable onPress={() => setClearOpen(false)} style={styles.cancelButton}><Text style={styles.cancelText}>Conservar</Text></Pressable>
              <Pressable onPress={confirmClear} style={[styles.confirmButton, styles.dangerButton]}><Text style={styles.confirmText}>Limpiar</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.paper },
  header: { minHeight: 62, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 10 },
  brandMark: { width: 38, height: 38, borderRadius: 13, backgroundColor: C.greenSoft, alignItems: "center", justifyContent: "center" },
  backButton: { width: 38, height: 38, borderRadius: 13, backgroundColor: "#F1EEE6", alignItems: "center", justifyContent: "center" },
  headerText: { flex: 1 },
  eyebrow: { color: C.green, fontSize: 9, fontWeight: "800", letterSpacing: 1.7 },
  heading: { color: C.ink, fontSize: 19, fontWeight: "800", marginTop: 1 },
  saveButton: { flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: C.green, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11 },
  saveButtonText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },
  canvasLabelRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, paddingTop: 8, paddingBottom: 7 },
  sectionLabel: { color: C.muted, fontSize: 9, fontWeight: "800", letterSpacing: 1.3 },
  canvasHint: { color: C.muted, fontSize: 11 },
  canvasWrap: { flex: 1, minHeight: 270, marginHorizontal: 14, marginBottom: 7, borderRadius: 20, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, padding: 4 },
  tools: { paddingHorizontal: 14, paddingTop: 7, paddingBottom: Platform.OS === "web" ? 8 : 5, gap: 7 },
  toolRow: { minHeight: 40, flexDirection: "row", alignItems: "center", gap: 4 },
  toolButton: { minHeight: 38, flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 12, paddingHorizontal: 10, backgroundColor: "transparent" },
  toolButtonActive: { backgroundColor: C.greenSoft },
  toolText: { fontSize: 11, color: C.muted, fontWeight: "600" },
  toolTextActive: { color: C.green, fontWeight: "800" },
  rowSpacer: { flex: 1 },
  iconButton: { width: 35, height: 35, alignItems: "center", justifyContent: "center", borderRadius: 11, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line },
  paletteHeader: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 2 },
  controlLabel: { color: C.ink, fontSize: 11, fontWeight: "700" },
  selectedColorName: { color: C.muted, fontSize: 10 },
  palette: { alignItems: "center", gap: 8, paddingVertical: 3, paddingHorizontal: 2 },
  swatchOuter: { width: 31, height: 31, borderRadius: 16, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "transparent" },
  swatchSelected: { borderColor: C.ink },
  swatch: { width: 21, height: 21, borderRadius: 11, borderWidth: 1 },
  adjustRow: { minHeight: 35, flexDirection: "row", alignItems: "center", gap: 5 },
  sizeChoice: { minWidth: 30, height: 30, borderRadius: 10, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "transparent" },
  choiceActive: { backgroundColor: C.greenSoft, borderColor: "#D4E6D8" },
  sizeDot: { borderRadius: 20, backgroundColor: C.ink },
  opacityChoice: { paddingHorizontal: 7, height: 29, borderRadius: 9, justifyContent: "center", borderWidth: 1, borderColor: "transparent" },
  opacityText: { color: C.muted, fontSize: 9, fontWeight: "700" },
  opacityTextActive: { color: C.green },
  notice: { color: C.green, fontSize: 11, fontWeight: "600", paddingHorizontal: 2 },
  modalShade: { flex: 1, backgroundColor: "rgba(28, 38, 32, 0.35)", justifyContent: "center", alignItems: "center", padding: 22 },
  modalCard: { width: "100%", maxWidth: 420, borderRadius: 22, padding: 22, backgroundColor: C.paper, borderWidth: 1, borderColor: C.line },
  modalEyebrow: { color: C.green, fontSize: 9, letterSpacing: 1.4, fontWeight: "800" },
  modalTitle: { color: C.ink, fontSize: 20, fontWeight: "800", marginTop: 8 },
  modalBody: { color: C.muted, fontSize: 13, lineHeight: 19, marginTop: 8 },
  nameInput: { borderColor: C.line, borderWidth: 1, backgroundColor: C.surface, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 12, marginTop: 16, color: C.ink, fontSize: 15 },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 9, marginTop: 20 },
  cancelButton: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, backgroundColor: "#EEEAE1" },
  cancelText: { color: C.ink, fontWeight: "700", fontSize: 12 },
  confirmButton: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 11, backgroundColor: C.green },
  confirmText: { color: "#FFFFFF", fontWeight: "800", fontSize: 12 },
  dangerButton: { backgroundColor: C.danger },
});
