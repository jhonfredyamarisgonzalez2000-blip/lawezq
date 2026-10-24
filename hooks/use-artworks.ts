import { useCallback, useEffect, useState } from "react";

import {
  deleteArtwork as deleteStoredArtwork,
  listArtworks,
  upsertArtwork,
  type Artwork,
  type ArtworkDraft,
} from "@/lib/artwork-storage";

export function useArtworks() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setArtworks(await listArtworks());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const save = useCallback(
    async (draft: ArtworkDraft) => {
      const artwork = await upsertArtwork(draft);
      await reload();
      return artwork;
    },
    [reload],
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteStoredArtwork(id);
      await reload();
    },
    [reload],
  );

  return { artworks, loading, reload, save, remove };
}
