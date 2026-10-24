import { Platform } from "react-native";

import { getApiBaseUrl } from "@/constants/oauth";

export function extractArtworkAssetKey(url: string): string | undefined {
  const marker = "/manus-storage/";
  const markerIndex = url.indexOf(marker);
  if (markerIndex < 0) return undefined;
  return url.slice(markerIndex + marker.length).split(/[?#]/, 1)[0] || undefined;
}

export function artworkAssetUri(assetKey: string): string {
  const path = `/manus-storage/${assetKey}`;
  // Stable Preview/published web hosts resolve this reserved route before the app listener.
  if (Platform.OS === "web") return path;
  // Expo Go receives the current API origin through the project's public runtime environment.
  const apiBaseUrl = getApiBaseUrl();
  return apiBaseUrl ? `${apiBaseUrl.replace(/\/$/, "")}${path}` : path;
}
