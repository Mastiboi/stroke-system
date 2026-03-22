import { useState, useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/useAuthStore";

// Configure foreground notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export function usePushNotifications() {
  const { session } = useAuthStore();
  const [deviceToken, setDeviceToken] = useState<string | undefined>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    if (!session?.user?.id) return;

    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        setDeviceToken(token);
        // Save the raw push token to the user's profile
        supabase
          .from("profiles")
          .update({ fcm_token: token })
          .eq("id", session.user.id)
          .then(({ error }) => {
            if (error) console.error("Failed to save push token:", error.message);
          });
      }
    });

    // Handle user tapping the notification (foreground/background)
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log("Notification tapped!");
      // Since the RootNavigator manages our secure auth flow, simply tapping 
      // the notification and opening the app will automatically route 
      // the clinician/radiologist to their real-time dashboard.
    });

    return () => {
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [session]);

  async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
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

      // We use getDevicePushTokenAsync() because our backend interfaces directly with FCM
      token = (await Notifications.getDevicePushTokenAsync()).data;
    } else {
      console.log("Must use physical device for Push Notifications");
    }

    return token;
  }

  return { deviceToken };
}