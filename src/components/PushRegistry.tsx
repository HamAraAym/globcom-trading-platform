"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { useSession } from "next-auth/react";
import { registerPushToken } from "@/actions/userActions";

export default function PushRegistry() {
  const { data: session } = useSession();

  useEffect(() => {
    // Only run this on actual iOS/Android devices for logged-in users
    if (typeof window !== "undefined" && Capacitor.isNativePlatform() && session?.user) {
      
      const setupPushNotifications = async () => {
        try {
          let permStatus = await PushNotifications.checkPermissions();

          if (permStatus.receive === 'prompt') {
            permStatus = await PushNotifications.requestPermissions();
          }

          if (permStatus.receive !== 'granted') {
            console.warn("User denied push notification permissions.");
            return;
          }

          // Register with Apple/Google to get the unique device token
          await PushNotifications.register();

          // Listen for the token assignment
          PushNotifications.addListener('registration', async (token) => {
            console.log("Device Push Token received:", token.value);
            // Fire the server action to save this token to the Postgres DB!
            await registerPushToken(token.value);
          });

        } catch (error) {
          console.error("Failed to initialize push notifications:", error);
        }
      };

      setupPushNotifications();

      return () => {
        PushNotifications.removeAllListeners();
      };
    }
  }, [session]);

  return null; // This component renders absolutely nothing to the screen
}