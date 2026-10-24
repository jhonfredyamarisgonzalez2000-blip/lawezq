import { useMemo, useRef, useState } from "react";
import { Image, LayoutChangeEvent, StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { artworkAssetUri } from "@/lib/artwork-assets";
import type { DrawingPoint, DrawingStroke } from "@/lib/artwork-storage";

const VIEW_SIZE = 1000;
const PAPER = "#FBF8F1";

type Props = {
  strokes: DrawingStroke[];
  assetKey?: string;
  color: string;
  brushSize: number;
  opacity: number;
  erasing: boolean;
  onStrokeComplete: (stroke: DrawingStroke) => void;
};

function pathFor(points: DrawingPoint[]): string {
  if (!points.length) return "";
  if (points.length === 1) {
    const point = points[0];
    return `M ${point.x} ${point.y} l 0.1 0`;
  }
  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
}

export function DrawingCanvas({
  strokes,
  assetKey,
  color,
  brushSize,
  opacity,
  erasing,
  onStrokeComplete,
}: Props) {
  const [size, setSize] = useState({ width: 1, height: 1 });
  const [previewPoints, setPreviewPoints] = useState<DrawingPoint[]>([]);
  const activePoints = useRef<DrawingPoint[]>([]);

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize({ width: Math.max(width, 1), height: Math.max(height, 1) });
  };

  const pointFromEvent = (event: { nativeEvent: { locationX: number; locationY: number } }) => ({
    x: Math.max(0, Math.min(VIEW_SIZE, (event.nativeEvent.locationX / size.width) * VIEW_SIZE)),
    y: Math.max(0, Math.min(VIEW_SIZE, (event.nativeEvent.locationY / size.height) * VIEW_SIZE)),
  });

  const startStroke = (event: { nativeEvent: { locationX: number; locationY: number } }) => {
    const point = pointFromEvent(event);
    activePoints.current = [point];
    setPreviewPoints([point]);
  };

  const moveStroke = (event: { nativeEvent: { locationX: number; locationY: number } }) => {
    if (!activePoints.current.length) return;
    const point = pointFromEvent(event);
    const last = activePoints.current[activePoints.current.length - 1];
    if (Math.hypot(point.x - last.x, point.y - last.y) < 1.5) return;
    activePoints.current = [...activePoints.current, point];
    setPreviewPoints(activePoints.current);
  };

  const finishStroke = () => {
    if (!activePoints.current.length) return;
    onStrokeComplete({
      id: `stroke-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      color: erasing ? PAPER : color,
      width: erasing ? brushSize * 2.3 : brushSize,
      opacity: erasing ? 1 : opacity,
      points: activePoints.current,
    });
    activePoints.current = [];
    setPreviewPoints([]);
  };

  const imageUri = assetKey ? artworkAssetUri(assetKey) : undefined;
  const renderedStrokes = useMemo(
    () => strokes.map((stroke) => ({ stroke, path: pathFor(stroke.points) })),
    [strokes],
  );

  return (
    <View
      accessibilityLabel="Lienzo de dibujo"
      onLayout={onLayout}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={startStroke}
      onResponderMove={moveStroke}
      onResponderRelease={finishStroke}
      onResponderTerminate={finishStroke}
      onResponderTerminationRequest={() => false}
      style={styles.canvas}
    >
      {imageUri ? <Image source={{ uri: imageUri }} resizeMode="cover" style={StyleSheet.absoluteFill} /> : null}
      <Svg pointerEvents="none" viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`} preserveAspectRatio="none" style={StyleSheet.absoluteFill}>
        {renderedStrokes.map(({ stroke, path }) => (
          <Path
            key={stroke.id}
            d={path}
            stroke={stroke.color}
            strokeWidth={stroke.width}
            strokeOpacity={stroke.opacity}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        ))}
        {previewPoints.length ? (
          <Path
            d={pathFor(previewPoints)}
            stroke={erasing ? PAPER : color}
            strokeWidth={erasing ? brushSize * 2.3 : brushSize}
            strokeOpacity={erasing ? 1 : opacity}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        ) : null}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    flex: 1,
    minHeight: 260,
    overflow: "hidden",
    backgroundColor: PAPER,
    borderRadius: 20,
  },
});
