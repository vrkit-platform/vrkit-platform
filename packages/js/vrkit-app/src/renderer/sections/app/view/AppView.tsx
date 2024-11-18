import { useTheme } from "@mui/material/styles"
import { AppContent } from "vrkit-app-renderer/layouts/app"
import React from "react"

export function AppView() {
  const theme = useTheme()

  return <AppContent />
}