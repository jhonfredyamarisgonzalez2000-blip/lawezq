import { Image, StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { artworkAssetUri } from "@/lib/artwork-assets";
import type { DrawingPoint, DrawingStroke } from "@/lib/artwork-storage";

const PAPER = "#FBF8F1";

function pathFor(points: DrawingPoint[]): string {
  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
}

type Props = { assetKey?: string; strokes: DrawingStroke[] };

export function ArtworkPreview({ assetKey, strokes }: Props) {
  const uri = assetKey ? artworkAssetUri(assetKey) : undefined;
  return (
    <View style={styles.frame}>
      {uri ? <Image source={{ uri }} resizeMode="cover" style={StyleSheet.absoluteFill} /> : null}
      <Svg pointerEvents="none" viewBox="0 0 1000 1000" preserveAspectRatio="none" style={StyleSheet.absoluteFill}>
        {strokes.map((stroke) => (
          <Path
            key={stroke.id}
            d={pathFor(stroke.points)}
            stroke={stroke.color}
            strokeWidth={stroke.width}
            strokeOpacity={stroke.opacity}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: "100%",
    aspectRatio: 0.9,
    overflow: "hidden",
    backgroundColor: PAPER,
    borderRadius: 16,
  },
});
