import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Clear any stale wallet data on app load - user must explicitly connect
localStorage.removeItem('wallet_address');
localStorage.removeItem('wallet_type');

// Aggressively suppress MetaMask and other non-Sui wallet errors
// This is a Sui dApp - MetaMask/Ethereum extensions throw confusing errors
const suppressedErrorPatterns = [
  'MetaMask', 'metamask', 'ethereum', 'inpage.js', 'contentscript', 
  'Failed to connect to MetaMask', 'window.ethereum',
  'provider.request', 'eth_', 'Ethereum', 'web3',
  'chrome-extension', 'moz-extension', 'ms-browser-extension',
  'EIP-1193', 'injected provider', 'wallet_', 'ethProvider',
  'Cannot read properties of undefined', 'reading \'request\'',
  'NetworkError', 'net::ERR', 'extension error'
];

// Block window.ethereum to prevent MetaMask from injecting
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'ethereum', {
    get: () => undefined,
    set: () => {},
    configurable: false
  });
}

const isExtensionRelatedError = (str: string | undefined): boolean => {
  if (!str) return false;
  return suppressedErrorPatterns.some(pattern => 
    str.toLowerCase().includes(pattern.toLowerCase())
  );
};

// Override console.error early to suppress extension errors in console
const originalConsoleError = console.error;
console.error = (...args) => {
  const errorStr = args.map(a => String(a)).join(' ');
  if (isExtensionRelatedError(errorStr)) {
    return; // Silently suppress
  }
  originalConsoleError.apply(console, args);
};

window.addEventListener('error', (event) => {
  const isExtensionError = 
    isExtensionRelatedError(event.message) ||
    isExtensionRelatedError(event.error?.message) ||
    isExtensionRelatedError(event.error?.stack) ||
    isExtensionRelatedError(event.filename);
  
  if (isExtensionError) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    return false;
  }
}, true);

window.addEventListener('unhandledrejection', (event) => {
  const isExtensionError = 
    isExtensionRelatedError(event.reason?.message) ||
    isExtensionRelatedError(event.reason?.stack) ||
    isExtensionRelatedError(String(event.reason));
  
  if (isExtensionError) {
    event.preventDefault();
    event.stopPropagation();
  }
}, true);

// Add a debug script to the document body
const debugScript = document.createElement('script');
debugScript.textContent = `
// Real-time debugging helpers
console.debug = function() {
  window._debug_logs = window._debug_logs || [];
  window._debug_logs.push(["debug", Date.now(), arguments]);
  // eslint-disable-next-line no-console
  return console.log.apply(console, arguments);
};
console.log("Debug script loaded");
`;
document.body.appendChild(debugScript);

// Clean up any wallet settings - we now use only real wallets
if (localStorage.getItem('use_demo_wallet') !== null) {
  localStorage.removeItem('use_demo_wallet');
  console.log('Removed demo wallet setting - only real wallets are now supported');
}

// Clean up any old wallet settings
if (localStorage.getItem('use_real_wallets') !== null) {
  localStorage.removeItem('use_real_wallets');
  console.log('Removed deprecated wallet setting');
}

// Add console logs for debugging
console.log("Starting React application");
try {
  const rootElement = document.getElementById("root");
  console.log("Root element found:", rootElement);
  if (rootElement) {
    createRoot(rootElement).render(<App />);
    console.log("React app rendered successfully");
  } else {
    console.error("Root element not found in the DOM");
  }
} catch (error) {
  console.error("Error rendering React app:", error);
}
