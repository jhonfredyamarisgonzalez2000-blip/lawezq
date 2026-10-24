import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const colors = {
  paper: "#FBF8F1",
  ink: "#24322B",
  muted: "#899188",
  green: "#176B45",
  line: "#E7E2D8",
};

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 8 : Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.green,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          height: 58 + bottomPadding,
          paddingTop: 8,
          paddingBottom: bottomPadding,
          backgroundColor: colors.paper,
          borderTopColor: colors.line,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dibujar",
          tabBarIcon: ({ color, size }) => <Feather name="edit-3" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: "Crear con IA",
          tabBarIcon: ({ color, size }) => <Feather name="star" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="gallery"
        options={{
          title: "Mis obras",
          tabBarIcon: ({ color, size }) => <Feather name="image" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
