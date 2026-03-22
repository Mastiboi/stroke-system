import "./global.css";
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import RootNavigator from "./src/navigation/RootNavigator";
import { usePushNotifications } from "./src/hooks/usePushNotifications"; // <-- Added

export default function App() {
  usePushNotifications(); // <-- Initialize push listeners globally

  return (
    <SafeAreaProvider>
      <RootNavigator />
    </SafeAreaProvider>
  );
}
