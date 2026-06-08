"use client";

import { useEffect } from "react";
import { useStoreConfig } from "../context/StoreConfigContext";

export default function ThemeColor() {
  const { mainColor } = useStoreConfig();

  useEffect(() => {
    document.documentElement.style.setProperty("--theme-color", mainColor);
  }, [mainColor]);

  return null;
}
