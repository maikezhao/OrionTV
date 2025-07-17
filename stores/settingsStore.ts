import { create } from "zustand";
import { SettingsManager } from "@/services/storage";
import { api, ServerConfig } from "@/services/api";
import { storageConfig } from "@/services/storageConfig";

interface SettingsState {
  apiBaseUrl: string;
  m3uUrl: string;
  remoteInputEnabled: boolean;
  videoSource: {
    enabledAll: boolean;
    sources: {
      [key: string]: boolean;
    };
  };
  isModalVisible: boolean;
  serverConfig: ServerConfig | null;
  loadSettings: () => Promise<void>;
  fetchServerConfig: () => Promise<void>;
  setApiBaseUrl: (url: string) => void;
  setM3uUrl: (url: string) => void;
  setRemoteInputEnabled: (enabled: boolean) => void;
  saveSettings: () => Promise<void>;
  setVideoSource: (config: { enabledAll: boolean; sources: { [key: string]: boolean } }) => void;
  showModal: () => void;
  hideModal: () => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  apiBaseUrl: "",
  m3uUrl: "",
  liveStreamSources: [],
  remoteInputEnabled: false,
  isModalVisible: false,
  serverConfig: null,
  videoSource: {
    enabledAll: true,
    sources: {},
  },
  loadSettings: async () => {
    const settings = await SettingsManager.get();
    set({
      apiBaseUrl: settings.apiBaseUrl,
      m3uUrl: settings.m3uUrl,
      remoteInputEnabled: settings.remoteInputEnabled || false,
      videoSource: settings.videoSource || {
        enabledAll: true,
        sources: {},
      },
    });
    api.setBaseUrl(settings.apiBaseUrl);
    await get().fetchServerConfig();
  },
  fetchServerConfig: async () => {
    try {
      const config = await api.getServerConfig();
      if (config) {
        storageConfig.setStorageType(config.StorageType);
      }
      set({ serverConfig: config });
    } catch (error) {
      console.info("Failed to fetch server config:", error);
    }
  },
  setApiBaseUrl: (url) => set({ apiBaseUrl: url }),
  setM3uUrl: (url) => set({ m3uUrl: url }),
  setRemoteInputEnabled: (enabled) => set({ remoteInputEnabled: enabled }),
  setVideoSource: (config) => set({ videoSource: config }),
  saveSettings: async () => {
    const { apiBaseUrl, m3uUrl, remoteInputEnabled, videoSource } = get();
    await SettingsManager.save({
      apiBaseUrl,
      m3uUrl,
      remoteInputEnabled,
      videoSource,
    });
    api.setBaseUrl(apiBaseUrl);
    set({ isModalVisible: false });
    await get().fetchServerConfig();
  },
  showModal: () => set({ isModalVisible: true }),
  hideModal: () => set({ isModalVisible: false }),
}));
