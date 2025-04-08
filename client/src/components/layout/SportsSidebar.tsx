import { useQuery } from "@tanstack/react-query";
import { Sport } from "@/types";
import { useEffect } from "react";

// This is a direct replacement approach: instead of using the sidebar overlay, 
// we'll make the Sidebar links themselves navigate correctly
export default function SportsSidebar() {
  // Query for sports data from API
  const { data: apiSports = [] } = useQuery<Sport[]>({
    queryKey: ['/api/sports']
  });

  useEffect(() => {
    // Function to set up click handlers for the sport items in the main sidebar
    const fixSidebarNavigation = () => {
      // Get all sport links from the main sidebar
      const sportsLinks = document.querySelectorAll('.bg-\\[\\#09151A\\] a[href^="/sport/"]');
      
      // Fix each sport link to ensure it navigates to the correct sport page
      sportsLinks.forEach((link, index) => {
        if (index < apiSports.length) {
          // Get the corresponding sport slug from our API data
          const sport = apiSports[index];
          
          // Update the href attribute to the correct sport slug
          link.setAttribute('href', `/sport/${sport.slug}`);
          
          // Log the mapping
          console.log(`Sport link ${index + 1} mapped to: ${sport.name} (${sport.slug})`);
        }
      });
    };
    
    // Only run this once we have the sports data and the DOM is loaded
    if (apiSports.length > 0) {
      // Run with a slight delay to ensure the sidebar DOM is fully rendered
      setTimeout(fixSidebarNavigation, 100);
    }
  }, [apiSports]); // Re-run when apiSports changes

  // This component no longer renders anything visible
  return null;
}