import React, { useEffect } from 'react';
import { useBetting } from '@/context/BettingContext';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Event } from '@/types';

/**
 * This component adds universal click handling to the entire application
 * to enable betting from any page without modifying the UI design.
 */
export const UniversalClickHandler: React.FC = () => {
  const { addBet } = useBetting();
  
  // Fetch all events to have them available for betting
  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ['/api/events'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/events');
      return response.json();
    }
  });
  
  useEffect(() => {
    // Add the click event listener to the document
    const handleDocumentClick = (e: MouseEvent) => {
      // Get the clicked element
      const element = e.target as HTMLElement;
      
      // Log click coordinates for debugging
      console.log(`Click coordinates: ${e.clientX}, ${e.clientY}`);
      
      // Check if this is an odds-like element (contains decimal number formatting)
      const isOddsElement = element.textContent && /\d+\.\d+/.test(element.textContent || '');
      
      // Check if we clicked near an element with odds - more aggressive detection
      const oddsNearby = !isOddsElement && document.elementsFromPoint(e.clientX, e.clientY).some(el => {
        return el.textContent && /\d+\.\d+/.test(el.textContent);
      });
      
      // Check if clicked on a team name
      const possibleTeamName = element.textContent?.trim();
      const matchingEvent = events.find(event => 
        possibleTeamName && (
          event.homeTeam.includes(possibleTeamName) || 
          event.awayTeam.includes(possibleTeamName)
        )
      );
      
      // Check if we clicked on a card or area containing event information
      const eventContainer = element.closest('[class*="card"], [class*="event"], [class*="match"]');
      const containsEventInfo = eventContainer && events.some(event => {
        return (
          eventContainer.textContent?.includes(event.homeTeam) && 
          eventContainer.textContent?.includes(event.awayTeam)
        );
      });
      
      if (isOddsElement) {
        // This might be an odds button or display
        const odds = parseFloat(element.textContent.match(/\d+\.\d+/)?.[0] || '0');
        
        if (odds > 1.0) {
          // Try to determine which team/selection this odds is for
          let selectionName = 'Selection';
          let marketName = 'Match Winner';
          
          // Check parent elements for team information
          let currentEl: HTMLElement | null = element;
          for (let i = 0; i < 5 && currentEl; i++) {
            const text = currentEl.textContent || '';
            
            // Check for event context
            events.forEach(event => {
              if (text.includes(event.homeTeam)) {
                selectionName = event.homeTeam;
                handleBetClick(event.id, `${event.homeTeam} vs ${event.awayTeam}`, selectionName, odds, marketName);
                return;
              } else if (text.includes(event.awayTeam)) {
                selectionName = event.awayTeam;
                handleBetClick(event.id, `${event.homeTeam} vs ${event.awayTeam}`, selectionName, odds, marketName);
                return;
              } else if (text.toLowerCase().includes('draw')) {
                selectionName = 'Draw';
                handleBetClick(event.id, `${event.homeTeam} vs ${event.awayTeam}`, selectionName, odds, marketName);
                return;
              }
            });
            
            currentEl = currentEl.parentElement;
          }
          
          if (selectionName === 'Selection') {
            // If we couldn't determine the selection, use a fallback
            handleBetClick(
              9999, // Generic event ID
              'Unknown Event',
              `Selection @ ${odds}`, 
              odds,
              'Unknown Market'
            );
          }
        }
      } else if (matchingEvent) {
        // Clicked on a team name, create a bet for that team
        const isHomeTeam = matchingEvent.homeTeam.includes(possibleTeamName || '');
        
        handleBetClick(
          matchingEvent.id,
          `${matchingEvent.homeTeam} vs ${matchingEvent.awayTeam}`,
          isHomeTeam ? matchingEvent.homeTeam : matchingEvent.awayTeam,
          isHomeTeam ? (matchingEvent.homeOdds || 1.9) : (matchingEvent.awayOdds || 3.5),
          'Match Winner'
        );
      }
      
      // Check for specific UI patterns that might indicate betting elements
      const buttonClasses = element.className || '';
      const isButtonElement = element.tagName === 'BUTTON' || 
                              buttonClasses.includes('button') || 
                              buttonClasses.includes('btn');
      
      if (isButtonElement) {
        // This is a button, check if it might be an odds button
        let selectionName = '';
        let odds = 0;
        let marketName = 'Match Winner';
        let eventId = 0;
        let eventName = '';
        
        // Check for common patterns in buttons
        // 1. Check if the button contains odds
        const oddsMatch = element.textContent?.match(/\d+\.\d+/);
        if (oddsMatch) {
          odds = parseFloat(oddsMatch[0]);
        }
        
        // 2. Try to find the event context
        const cardElement = element.closest('[class*="card"], [class*="event"], [class*="match"]');
        if (cardElement) {
          const cardText = cardElement.textContent || '';
          
          // Check for any matching events
          events.forEach(event => {
            if (cardText.includes(event.homeTeam) && cardText.includes(event.awayTeam)) {
              eventId = event.id;
              eventName = `${event.homeTeam} vs ${event.awayTeam}`;
              
              // Try to determine which selection this button is for
              if (element.textContent?.includes(event.homeTeam)) {
                selectionName = event.homeTeam;
                odds = event.homeOdds || 1.9;
              } else if (element.textContent?.includes(event.awayTeam)) {
                selectionName = event.awayTeam;
                odds = event.awayOdds || 3.5;
              } else if (element.textContent?.toLowerCase().includes('draw')) {
                selectionName = 'Draw';
                odds = event.drawOdds || 3.2;
              }
            }
          });
        }
        
        // 3. If we found a selection and odds, create a bet
        if (selectionName && odds > 1.0) {
          handleBetClick(eventId, eventName, selectionName, odds, marketName);
        }
      }
    };
    
    document.addEventListener('click', handleDocumentClick);
    
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [events]);
  
  // Handle clicking on a betting option
  const handleBetClick = (
    eventId: number,
    eventName: string,
    selectionName: string,
    odds: number,
    market: string
  ) => {
    // Create unique bet ID
    const betId = `${eventId}-${market}-${selectionName}-${Date.now()}`;
    
    // Add the bet to the betting slip
    addBet({
      id: betId,
      eventId,
      eventName,
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
  
  // This component doesn't render anything visible
  return null;
};

export default UniversalClickHandler;