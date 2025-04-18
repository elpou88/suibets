import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface SettingsContextType {
  language: string;
  setLanguage: (language: string) => void;
  oddsFormat: string;
  setOddsFormat: (format: string) => void;
  showFiatAmount: boolean; 
  setShowFiatAmount: (show: boolean) => void;
  onSiteNotifications: boolean;
  setOnSiteNotifications: (enabled: boolean) => void;
  receiveNewsletter: boolean;
  setReceiveNewsletter: (receive: boolean) => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  gasSettings: 'low' | 'medium' | 'high';
  setGasSettings: (setting: 'low' | 'medium' | 'high') => void;
  saveSettings: () => void;
}

const defaultSettings = {
  language: "english",
  oddsFormat: "decimal",
  showFiatAmount: true,
  onSiteNotifications: true,
  receiveNewsletter: false,
  darkMode: true,
  gasSettings: 'medium' as 'low' | 'medium' | 'high',
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  // Load settings from localStorage on initial mount
  const [language, setLanguage] = useState(defaultSettings.language);
  const [oddsFormat, setOddsFormat] = useState(defaultSettings.oddsFormat);
  const [showFiatAmount, setShowFiatAmount] = useState(defaultSettings.showFiatAmount);
  const [onSiteNotifications, setOnSiteNotifications] = useState(defaultSettings.onSiteNotifications);
  const [receiveNewsletter, setReceiveNewsletter] = useState(defaultSettings.receiveNewsletter);
  const [darkMode, setDarkMode] = useState(defaultSettings.darkMode);
  const [gasSettings, setGasSettings] = useState<'low' | 'medium' | 'high'>(defaultSettings.gasSettings);

  // Load settings from localStorage on initial render
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('suibets-settings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setLanguage(parsedSettings.language || defaultSettings.language);
        setOddsFormat(parsedSettings.oddsFormat || defaultSettings.oddsFormat);
        setShowFiatAmount(parsedSettings.showFiatAmount !== undefined ? parsedSettings.showFiatAmount : defaultSettings.showFiatAmount);
        setOnSiteNotifications(parsedSettings.onSiteNotifications !== undefined ? parsedSettings.onSiteNotifications : defaultSettings.onSiteNotifications);
        setReceiveNewsletter(parsedSettings.receiveNewsletter !== undefined ? parsedSettings.receiveNewsletter : defaultSettings.receiveNewsletter);
        setDarkMode(parsedSettings.darkMode !== undefined ? parsedSettings.darkMode : defaultSettings.darkMode);
        setGasSettings(parsedSettings.gasSettings || defaultSettings.gasSettings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }, []);

  // Function to save settings to localStorage
  const saveSettings = () => {
    try {
      const settingsToSave = {
        language,
        oddsFormat,
        showFiatAmount,
        onSiteNotifications,
        receiveNewsletter,
        darkMode,
        gasSettings
      };
      localStorage.setItem('suibets-settings', JSON.stringify(settingsToSave));
      console.log('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        language,
        setLanguage,
        oddsFormat,
        setOddsFormat,
        showFiatAmount,
        setShowFiatAmount,
        onSiteNotifications,
        setOnSiteNotifications,
        receiveNewsletter,
        setReceiveNewsletter,
        darkMode,
        setDarkMode,
        gasSettings,
        setGasSettings,
        saveSettings
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}