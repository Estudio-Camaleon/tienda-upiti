"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { CONFIG } from "../data/config";

const StoreConfigContext = createContext();

export function StoreConfigProvider({ children }) {
  const [storeConfig, setStoreConfig] = useState({
    storeName: CONFIG.storeName,
    logoUrl: CONFIG.logoUrl,
    heroImage: CONFIG.heroImage,
    mainColor: CONFIG.mainColor,
    currency: CONFIG.currency,
    whatsappNumber: CONFIG.whatsappNumber,
    loaded: false,
  });

  useEffect(() => {
    async function loadConfig() {
      const { data } = await supabase
        .from("store_config")
        .select("*")
        .eq("id", 1)
        .single();

      if (data) {
        setStoreConfig({
          storeName: data.store_name || CONFIG.storeName,
          logoUrl: data.logo_url || CONFIG.logoUrl,
          heroImage: data.hero_image || CONFIG.heroImage,
          mainColor: data.main_color || CONFIG.mainColor,
          currency: data.currency || CONFIG.currency,
          whatsappNumber: data.whatsapp_number || CONFIG.whatsappNumber,
          loaded: true,
        });
      } else {
        setStoreConfig((prev) => ({ ...prev, loaded: true }));
      }
    }
    loadConfig();
  }, []);

  return (
    <StoreConfigContext.Provider value={storeConfig}>
      {children}
    </StoreConfigContext.Provider>
  );
}

export const useStoreConfig = () => useContext(StoreConfigContext);
