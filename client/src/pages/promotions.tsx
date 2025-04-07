import { useEffect } from 'react';

export default function PromotionsPage() {
  // Redirect to the static HTML page
  useEffect(() => {
    window.location.href = '/promotions-direct.html';
  }, []);

  return null;
}