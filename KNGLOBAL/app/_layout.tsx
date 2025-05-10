import React from "react";
import { Stack } from "expo-router";
import { AuthProvider } from "../contexts/Authcontext"; // Adjust the path if necessary

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthProvider>
  );
}