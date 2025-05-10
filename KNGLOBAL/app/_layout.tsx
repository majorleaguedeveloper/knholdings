import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { AuthProvider } from "../contexts/Authcontext"; // Adjust the path if necessary
import * as Updates from "expo-updates";

export default function RootLayout() {
  useEffect(() => {
    async function checkForUpdates() {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          // Reload the app after fetching the update
          await Updates.reloadAsync();
        }
      } catch (error) {
        console.log("Error checking for updates:", error);
      }
    }
    
    checkForUpdates();
  }, []);

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthProvider>
  );
}