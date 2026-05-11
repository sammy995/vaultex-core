"use client";

import { useEffect } from "react";
import { initTheme } from "./SettingsPanel";

export default function ThemeInit() {
  useEffect(() => {
    initTheme();
  }, []);
  return null;
}
