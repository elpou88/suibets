import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";

// Define LiveEvent type for type safety
interface LiveEvent {
  id: number;
  homeTeam: string;
  awayTeam: string;
  score: string;
  time: string;
  sport: string;
}

export default function LivePage() {
  const [, setLocation] = useLocation();
  
  // Mock live events data
  const mockLiveEvents: LiveEvent[] = [
    { id: 1, homeTeam: "Real Madrid", awayTeam: "Barcelona", score: "2-1", time: "65:20", sport: "Soccer" },
    { id: 2, homeTeam: "Lakers", awayTeam: "Nets", score: "89-92", time: "Q3 4:15", sport: "Basketball" },
    { id: 3, homeTeam: "Chiefs", awayTeam: "Bills", score: "21-17", time: "3Q 8:45", sport: "American Football" },
    { id: 4, homeTeam: "Yankees", awayTeam: "Red Sox", score: "3-2", time: "7th", sport: "Baseball" },
  ];
  
  // Fetch live events data
  const { data: liveEvents = mockLiveEvents, isLoading } = useQuery<LiveEvent[]>({
    queryKey: ['/api/events', { status: 'live' }],
    // If no data is returned or an error occurs, fallback to mock data
  });
  
  return (
    <div className="w-full min-h-screen relative">
      <img 
        src="/images/Live (2).png" 
        alt="Live Events"
        className="w-full h-full object-contain"
      />
      
      {/* Back button */}
      <button 
        onClick={() => setLocation("/")}
        className="absolute top-4 left-4 bg-black/50 text-white px-4 py-2 rounded-lg"
      >
        Back to Home
      </button>
      
      {/* Live events overlay */}
      <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 w-11/12 max-w-3xl">
        <h2 className="text-2xl font-bold text-white mb-4 text-center">Live Events</h2>
        
        {isLoading ? (
          <div className="bg-black/70 p-4 rounded-lg">
            <p className="text-white text-center">Loading live events...</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {liveEvents.map((event: LiveEvent) => (
              <div 
                key={event.id}
                onClick={() => setLocation(`/live/${event.id}`)}
                className="bg-black/70 p-4 rounded-lg cursor-pointer hover:bg-black/90 transition"
              >
                <div className="flex justify-between items-center">
                  <div className="text-white">
                    <div className="text-sm text-gray-400">{event.sport}</div>
                    <div className="font-semibold">{event.homeTeam} vs {event.awayTeam}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-bold">{event.score}</div>
                    <div className="text-green-500 text-sm">{event.time}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}