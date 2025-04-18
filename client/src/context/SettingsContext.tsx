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
  accentColor: string;
  setAccentColor: (color: string) => void;
  gasSettings: 'low' | 'medium' | 'high';
  setGasSettings: (setting: 'low' | 'medium' | 'high') => void;
  saveSettings: () => void;
  applyTheme: () => void;
}

const defaultSettings = {
  language: "english",
  oddsFormat: "decimal",
  showFiatAmount: true,
  onSiteNotifications: true,
  receiveNewsletter: false,
  darkMode: true,
  accentColor: "#00FFFF", // Default cyan/teal accent color
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
  const [accentColor, setAccentColor] = useState(defaultSettings.accentColor);
  const [gasSettings, setGasSettings] = useState<'low' | 'medium' | 'high'>(defaultSettings.gasSettings);

  // Apply theme to DOM based on current settings
  const applyTheme = () => {
    // Apply theme variables to document root
    const root = document.documentElement;
    root.style.setProperty('--accent-color', accentColor);
    
    // Apply dark mode settings
    if (darkMode) {
      document.body.classList.add('dark-mode');
      root.style.setProperty('--background-color', '#112225');
      root.style.setProperty('--card-background', '#1e3a3f');
      root.style.setProperty('--border-color', '#2a4a54');
      root.style.setProperty('--text-color', '#ffffff');
    } else {
      document.body.classList.remove('dark-mode');
      root.style.setProperty('--background-color', '#f5f5f5');
      root.style.setProperty('--card-background', '#ffffff');
      root.style.setProperty('--border-color', '#ddd');
      root.style.setProperty('--text-color', '#333333');
    }
    
    // Apply accent color to various site elements
    const accentElements = document.querySelectorAll('.accent-color');
    accentElements.forEach(element => {
      (element as HTMLElement).style.color = accentColor;
    });
    
    const accentBgElements = document.querySelectorAll('.accent-bg');
    accentBgElements.forEach(element => {
      (element as HTMLElement).style.backgroundColor = accentColor;
    });
    
    const accentBorderElements = document.querySelectorAll('.accent-border');
    accentBorderElements.forEach(element => {
      (element as HTMLElement).style.borderColor = accentColor;
    });
  };

  // Apply theme when settings change
  useEffect(() => {
    applyTheme();
  }, [darkMode, accentColor]);

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
        setAccentColor(parsedSettings.accentColor || defaultSettings.accentColor);
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
        accentColor,
        gasSettings
      };
      localStorage.setItem('suibets-settings', JSON.stringify(settingsToSave));
      console.log('Settings saved successfully!');
      
      // Apply theme when settings are saved
      applyTheme();
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
        accentColor,
        setAccentColor,
        gasSettings,
        setGasSettings,
        saveSettings,
        applyTheme
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