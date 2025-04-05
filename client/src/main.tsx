import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

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
