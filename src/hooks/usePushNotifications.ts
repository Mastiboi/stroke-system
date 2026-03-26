import { useState, useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/useAuthStore";

// 1. FIX: Added shouldShowBanner and shouldShowList for Expo SDK 50+
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true, 
    shouldShowList: true,
  }),
});

export function usePushNotifications() {
  const { session } = useAuthStore();
  const [deviceToken, setDeviceToken] = useState<string | undefined>();
  
  // 2. FIX: Passed 'null' as the initial argument for React 19 strict mode
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    if (!session?.user?.id) return;

    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        setDeviceToken(token);
        supabase
          .from("profiles")
          .update({ fcm_token: token })
          .eq("id", session.user.id)
          .then(({ error }) => {
            if (error) console.error("Failed to save push token:", error.message);
          });
      }
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log("Notification tapped!");
    });

    return () => {
      // 3. FIX: Call .remove() directly on the subscription object
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [session]);

  async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === "android") {
      try {
        await Notifications.setNotificationChannelAsync("default", {
          name: "Urgent Alerts",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C",
        });
      } catch (error) {
        console.warn("OS blocked notification channel creation:", error);
      }
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== "granted") {
        console.warn("Failed to get push token for push notification!");
        return;
      }

      token = (await Notifications.getDevicePushTokenAsync()).data;
    } else {
      console.log("Must use physical device for Push Notifications");
    }

    return token;
  }

  return { deviceToken };
}