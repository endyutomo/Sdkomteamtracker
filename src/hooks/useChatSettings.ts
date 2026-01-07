import { useState, useEffect } from 'react';

const CHAT_SETTINGS_KEY = 'chat-settings';

export interface ChatSettings {
  soundEnabled: boolean;
}

const defaultSettings: ChatSettings = {
  soundEnabled: true,
};

export function useChatSettings() {
  const [settings, setSettings] = useState<ChatSettings>(defaultSettings);

  useEffect(() => {
    const stored = localStorage.getItem(CHAT_SETTINGS_KEY);
    if (stored) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(stored) });
      } catch {
        setSettings(defaultSettings);
      }
    }
  }, []);

  const updateSettings = (updates: Partial<ChatSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    localStorage.setItem(CHAT_SETTINGS_KEY, JSON.stringify(newSettings));
  };

  const toggleSound = () => {
    updateSettings({ soundEnabled: !settings.soundEnabled });
  };

  return {
    settings,
    updateSettings,
    toggleSound,
  };
}
