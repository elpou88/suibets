import { useEffect } from "react";

/**
 * Live page that redirects to the standalone HTML
 */
export default function LiveExact() {
  useEffect(() => {
    // Redirect to the HTML-only page with no header UI
    window.location.href = "/live-direct.html";
  }, []);

  return null;
}