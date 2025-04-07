import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface Outcome {
  id: string;
  name: string;
  odds: number;
  status: string;
}

interface Market {
  id: string;
  name: string;
  type: string;
  status: string;
  outcomes: Outcome[];
}

interface Event {
  id: string;
  name: string;
  sportId: string;
  homeTeam: string;
  awayTeam: string;
  startTime: number;
  status: string;
  markets: Market[];
  score?: string;
}

export default function WurlusOddsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Fetch events on page load
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const response = await apiRequest('GET', '/api/wurlus/events');
        const data = await response.json();
        
        if (data.success && data.events) {
          setEvents(data.events);
        } else {
          throw new Error(data.message || 'Failed to fetch events');
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred while fetching events');
        toast({
          title: 'Error',
          description: 'Failed to load Wurlus protocol events',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvents();
    
    // Refresh data every 60 seconds
    const intervalId = setInterval(fetchEvents, 60000);
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [toast]);
  
  // Get unique sports from events
  const sports = Array.from(new Set(events.map(event => event.sportId)));
  
  // Filter events by selected sport
  const filteredEvents = selectedSport 
    ? events.filter(event => event.sportId === selectedSport)
    : events;
  
  // Group events by status
  const liveEvents = filteredEvents.filter(event => event.status === 'live');
  const upcomingEvents = filteredEvents.filter(event => event.status === 'upcoming');
  
  // Format date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };
  
  // Place a bet (this would connect to the actual betting function in a real implementation)
  const placeBet = (event: Event, market: Market, outcome: Outcome) => {
    toast({
      title: 'Bet Placed',
      description: `You placed a bet on ${outcome.name} for ${event.name} at odds ${outcome.odds}`,
    });
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Wurlus Protocol Live Odds</h1>
      
      {loading && (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#00FFFF]"></div>
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {!loading && !error && (
        <>
          {/* Sport filters */}
          <div className="mb-6 flex flex-wrap gap-2">
            <button
              className={`px-4 py-2 rounded ${!selectedSport ? 'bg-[#00FFFF] text-black' : 'bg-[#112225] text-white'}`}
              onClick={() => setSelectedSport(null)}
            >
              All Sports
            </button>
            {sports.map(sport => (
              <button
                key={sport}
                className={`px-4 py-2 rounded ${selectedSport === sport ? 'bg-[#00FFFF] text-black' : 'bg-[#112225] text-white'}`}
                onClick={() => setSelectedSport(sport)}
              >
                {sport.charAt(0).toUpperCase() + sport.slice(1)}
              </button>
            ))}
          </div>
          
          {/* Live events */}
          {liveEvents.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4 flex items-center">
                Live Events
                <span className="ml-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {liveEvents.map(event => (
                  <div key={event.id} className="bg-[#09181B] border border-[#112225] rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[#00FFFF] font-bold">
                        {event.sportId.charAt(0).toUpperCase() + event.sportId.slice(1)}
                      </span>
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">LIVE</span>
                    </div>
                    <h3 className="text-lg font-bold mb-1">{event.name}</h3>
                    <div className="text-gray-400 text-sm mb-2">Started: {formatDate(event.startTime)}</div>
                    
                    {event.score && (
                      <div className="bg-[#112225] text-white text-center py-2 rounded mb-4 font-bold">
                        Score: {event.score}
                      </div>
                    )}
                    
                    {event.markets.map(market => (
                      <div key={market.id} className="mb-4">
                        <h4 className="font-bold mb-2">{market.name}</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {market.outcomes.map(outcome => (
                            <button
                              key={outcome.id}
                              className="bg-[#112225] hover:bg-[#1C363C] text-white p-2 rounded flex justify-between"
                              onClick={() => placeBet(event, market, outcome)}
                              disabled={outcome.status !== 'active'}
                            >
                              <span>{outcome.name}</span>
                              <span className="text-[#00FFFF] font-bold">{outcome.odds}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Upcoming events */}
          {upcomingEvents.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Upcoming Events</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingEvents.map(event => (
                  <div key={event.id} className="bg-[#09181B] border border-[#112225] rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[#00FFFF] font-bold">
                        {event.sportId.charAt(0).toUpperCase() + event.sportId.slice(1)}
                      </span>
                      <span className="bg-[#112225] text-white text-xs px-2 py-1 rounded">UPCOMING</span>
                    </div>
                    <h3 className="text-lg font-bold mb-1">{event.name}</h3>
                    <div className="text-gray-400 text-sm mb-4">Starts: {formatDate(event.startTime)}</div>
                    
                    {event.markets.map(market => (
                      <div key={market.id} className="mb-4">
                        <h4 className="font-bold mb-2">{market.name}</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {market.outcomes.map(outcome => (
                            <button
                              key={outcome.id}
                              className="bg-[#112225] hover:bg-[#1C363C] text-white p-2 rounded flex justify-between"
                              onClick={() => placeBet(event, market, outcome)}
                            >
                              <span>{outcome.name}</span>
                              <span className="text-[#00FFFF] font-bold">{outcome.odds}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {filteredEvents.length === 0 && (
            <div className="text-center py-10">
              <h2 className="text-xl">No events found</h2>
              <p className="text-gray-400 mt-2">
                {selectedSport 
                  ? `No ${selectedSport} events available at the moment.` 
                  : 'No events available at the moment.'}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}