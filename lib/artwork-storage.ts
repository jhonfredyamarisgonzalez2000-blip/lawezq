import AsyncStorage from "@react-native-async-storage/async-storage";

export type DrawingPoint = { x: number; y: number };

export type DrawingStroke = {
  id: string;
  color: string;
  /** Width in viewBox units, so saved strokes scale across phone sizes. */
  width: number;
  opacity: number;
  points: DrawingPoint[];
};

export type Artwork = {
  id: string;
  title: string;
  kind: "drawing" | "generated";
  strokes: DrawingStroke[];
  /** Durable managed-storage object key for an AI-generated image, not a signed URL. */
  assetKey?: string;
  modifiedAt: string;
};

export type ArtworkDraft = Omit<Artwork, "id" | "modifiedAt"> & { id?: string };

const ARTWORKS_KEY = "@trazarte/artworks/v1";

export async function listArtworks(): Promise<Artwork[]> {
  const raw = await AsyncStorage.getItem(ARTWORKS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Artwork[];
    return Array.isArray(parsed)
      ? parsed
          .filter((item) => item && typeof item.id === "string")
          .sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt))
      : [];
  } catch {
    return [];
  }
}

export async function getArtwork(id: string): Promise<Artwork | undefined> {
  const artworks = await listArtworks();
  return artworks.find((artwork) => artwork.id === id);
}

export async function upsertArtwork(draft: ArtworkDraft): Promise<Artwork> {
  const artworks = await listArtworks();
  const id = draft.id ?? `art-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const saved: Artwork = {
    id,
    title: draft.title.trim() || "Mi obra",
    kind: draft.kind,
    strokes: draft.strokes,
    ...(draft.assetKey ? { assetKey: draft.assetKey } : {}),
    modifiedAt: new Date().toISOString(),
  };
  const existing = artworks.some((artwork) => artwork.id === id);
  const next = existing
    ? artworks.map((artwork) => (artwork.id === id ? saved : artwork))
    : [saved, ...artworks];
  await AsyncStorage.setItem(ARTWORKS_KEY, JSON.stringify(next));
  return saved;
}

export async function deleteArtwork(id: string): Promise<void> {
  const artworks = await listArtworks();
  await AsyncStorage.setItem(
    ARTWORKS_KEY,
    JSON.stringify(artworks.filter((artwork) => artwork.id !== id)),
  );
}
