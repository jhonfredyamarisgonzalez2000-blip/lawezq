import { useLocalSearchParams } from "expo-router";

import { DrawingWorkspace } from "@/components/drawing-workspace";

export default function EditorScreen() {
  const params = useLocalSearchParams<{ artworkId?: string | string[]; assetKey?: string | string[] }>();
  const artworkId = Array.isArray(params.artworkId) ? params.artworkId[0] : params.artworkId;
  const assetKey = Array.isArray(params.assetKey) ? params.assetKey[0] : params.assetKey;
  return <DrawingWorkspace key={artworkId ?? assetKey ?? "new-editor"} initialArtworkId={artworkId} initialAssetKey={assetKey} showBackButton />;
}
