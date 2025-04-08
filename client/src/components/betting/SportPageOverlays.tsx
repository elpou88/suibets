import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useBetting } from '@/context/BettingContext';
import { Event, Sport } from '@/types';

interface SportPageOverlaysProps {
  sportSlug?: string;
}

/**
 * This component creates clickable overlays specifically for sport pages,
 * allowing users to click anywhere on the event listings to place bets
 * without modifying the original UI design
 */
export const SportPageOverlays: React.FC<SportPageOverlaysProps> = ({ sportSlug }) => {
  const [initialized, setInitialized] = useState(false);
  const { addBet } = useBetting();
  
  // Fetch all events for this sport
  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ['/api/events', sportSlug ? { sport: sportSlug } : undefined],
    queryFn: async () => {
      const url = sportSlug 
        ? `/api/events?sport=${sportSlug}` 
        : '/api/events';
      const response = await apiRequest('GET', url);
      return response.json();
    }
  });
  
  useEffect(() => {
    // Initialize event listeners after component mounts
    if (!initialized && events.length > 0) {
      console.log(`Loaded ${events.length} events for sport: ${sportSlug || 'all'}`);
      
      // Add click event listener to the document
      const handleDocumentClick = (e: MouseEvent) => {
        // Log exact click position for debugging
        console.log(`Click coordinates: ${e.clientX}, ${e.clientY}`);
        
        // Find the closest clickable element
        const element = document.elementFromPoint(e.clientX, e.clientY);
        if (!element) return;
        
        // Check if we're clicking on or near an event card
        const eventCard = element.closest('[data-event-id]');
        if (eventCard) {
          const eventId = parseInt(eventCard.getAttribute('data-event-id') || '0');
          const event = events.find(e => e.id === eventId);
          
          if (event) {
            // Determine which part of the card was clicked
            const rect = eventCard.getBoundingClientRect();
            const relX = e.clientX - rect.left;
            const relY = e.clientY - rect.top;
            const relXPercent = relX / rect.width * 100;
            
            // Right side might be away team odds
            if (relXPercent > 70) {
              handleBetClick(event, event.awayTeam, event.awayOdds || 3.50, 'Match Winner');
            }
            // Middle might be draw (if applicable)
            else if (relXPercent > 45 && relXPercent < 70 && event.drawOdds) {
              handleBetClick(event, 'Draw', event.drawOdds, 'Match Winner');
            } 
            // Left side might be home team odds
            else if (relXPercent < 45) {
              handleBetClick(event, event.homeTeam, event.homeOdds || 1.90, 'Match Winner');
            }
          }
        }
      };
      
      // Add data-event-id attributes to event cards so we can identify them
      setTimeout(() => {
        attachEventIds();
      }, 1000);
      
      document.addEventListener('click', handleDocumentClick);
      
      // Set initialized to prevent multiple listeners
      setInitialized(true);
      
      return () => {
        document.removeEventListener('click', handleDocumentClick);
      };
    }
  }, [events, initialized, sportSlug]);
  
  // Handle clicking on a sport event
  const handleBetClick = (
    event: Event,
    selectionName: string,
    odds: number,
    market: string
  ) => {
    // Create a unique bet ID
    const betId = `${event.id}-${market}-${selectionName}-${Date.now()}`;
    
    // Add the bet to the slip
    addBet({
      id: betId,
      eventId: event.id,
      eventName: `${event.homeTeam} vs ${event.awayTeam}`,
      selectionName,
      odds,
      stake: 10, // Default stake amount
      market,
    });
    
    // Provide visual feedback that the bet was added
    const feedbackElement = document.createElement('div');
    feedbackElement.textContent = `Added ${selectionName} @ ${odds} to Bet Slip`;
    feedbackElement.style.position = 'fixed';
    feedbackElement.style.bottom = '20px';
    feedbackElement.style.right = '20px';
    feedbackElement.style.backgroundColor = 'rgba(0, 255, 0, 0.8)';
    feedbackElement.style.color = 'white';
    feedbackElement.style.padding = '10px';
    feedbackElement.style.borderRadius = '5px';
    feedbackElement.style.zIndex = '9999';
    
    document.body.appendChild(feedbackElement);
    
    setTimeout(() => {
      document.body.removeChild(feedbackElement);
    }, 2000);
  };
  
  // Attach event IDs to event cards in the DOM for easier identification
  const attachEventIds = () => {
    // Find event cards in the DOM
    // This uses common selectors that might be present in the UI
    // Would need to be adjusted based on actual HTML structure
    
    const possibleCardSelectors = [
      '.event-card', 
      '[data-event]',
      '.card:has(.odds)',
      '.card:has([class*="event"])',
      '.card:has([class*="match"])',
      'div:has(button:has(.odds))',
      'tr:has(td:has(.odds))',
      'div:has(.team-name)',
      // More generic fallbacks
      '.overflow-hidden:has(button[variant="outline"])',
      '.p-4:has(.text-sm)',
      'article:has(a[href*="event"])',
    ];
    
    let eventsAttached = 0;
    
    // Try each selector to find event cards
    for (const selector of possibleCardSelectors) {
      try {
        const elements = document.querySelectorAll(selector);
        
        if (elements.length > 0) {
          elements.forEach((element, index) => {
            // Skip if already has event ID
            if (element.hasAttribute('data-event-id')) return;
            
            // Check if we still have events left to attach
            if (index < events.length) {
              element.setAttribute('data-event-id', events[index].id.toString());
              eventsAttached++;
            }
          });
          
          if (eventsAttached > 0) {
            console.log(`Attached ${eventsAttached} event IDs using selector: ${selector}`);
            break; // Stop if we found matching elements
          }
        }
      } catch (error) {
        console.error(`Error with selector ${selector}:`, error);
      }
    }
    
    if (eventsAttached === 0) {
      // If no events were attached, try a more aggressive approach
      // This attaches event IDs to any element that might be an event card
      const cards = document.querySelectorAll('.card, .p-4, [class*="match"], [class*="event"]');
      
      cards.forEach((element, index) => {
        // Skip if already has event ID
        if (element.hasAttribute('data-event-id')) return;
        
        // Check if we still have events left to attach
        if (index < events.length) {
          element.setAttribute('data-event-id', events[index].id.toString());
          eventsAttached++;
        }
      });
      
      console.log(`Attached ${eventsAttached} event IDs using fallback approach`);
    }
  };
  
  // Add click handlers for specific UI elements without modifying them
  useEffect(() => {
    // Find elements that look like odds buttons
    const oddsElements = document.querySelectorAll('[class*="odds"], .font-bold');
    oddsElements.forEach(element => {
      element.addEventListener('click', (e) => {
        // Find the closest event card
        const eventCard = element.closest('[data-event-id]');
        if (eventCard) {
          const eventId = parseInt(eventCard.getAttribute('data-event-id') || '0');
          const event = events.find(e => e.id === eventId);
          
          if (event) {
            // Try to determine which team this odds is for
            const text = element.textContent || '';
            if (text.includes(event.homeTeam) || element.previousElementSibling?.textContent?.includes(event.homeTeam)) {
              handleBetClick(event, event.homeTeam, event.homeOdds || 1.90, 'Match Winner');
            } else if (text.includes(event.awayTeam) || element.previousElementSibling?.textContent?.includes(event.awayTeam)) {
              handleBetClick(event, event.awayTeam, event.awayOdds || 3.50, 'Match Winner');
            } else if (text.includes('Draw') || element.previousElementSibling?.textContent?.includes('Draw')) {
              handleBetClick(event, 'Draw', event.drawOdds || 3.20, 'Match Winner');
            }
          }
        }
      });
    });
  }, [events, initialized]);
  
  // This component doesn't render anything visible
  // It just adds click handlers to make the UI interactive
  return null;
};

export default SportPageOverlays;