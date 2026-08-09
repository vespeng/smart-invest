"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AIConfig, DataConfig } from "@/types";

interface ConfigState {
  data: DataConfig;
  ai: AIConfig;
  setData: (data: Partial<DataConfig>) => void;
  setAI: (ai: Partial<AIConfig>) => void;
}

export const useConfigStore = create<ConfigState>()(persist((set) => ({
  data: { refreshInterval: 60 },
  ai: { apiKey: "", baseUrl: "https://api.deepseek.com", model: "deepseek-v4-flash", temperature: .2 },
  setData: (data) => set((state) => ({ data: { ...state.data, ...data } })),
  setAI: (ai) => set((state) => ({ ai: { ...state.ai, ...ai } })),
}), { name: "smart-invest-config" }));
