import { useQuery } from "@tanstack/react-query";
import { Event, Sport } from "@/types";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { ChevronDown, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

export function LiveEventsSection() {
  const { data: liveEvents = [], isLoading } = useQuery<Event[]>({
    queryKey: ['/api/events', { isLive: true }]
  });

  if (isLoading) {
    return <div className="p-12 text-center">Loading live events...</div>;
  }

  if (liveEvents.length === 0) {
    return (
      <Card className="mb-4">
        <CardHeader className="bg-gray-100 p-3 flex flex-row items-center justify-between">
          <div className="flex items-center">
            <ChevronDown className="h-4 w-4 mr-2 text-gray-500" />
            <div className="flex items-center">
              <span className="flex items-center">
                <span className="w-2 h-2 bg-red-500 rounded-full inline-block mr-2 live-pulse"></span>
                LIVE
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 text-center text-gray-500">
          No live events available at the moment.
        </CardContent>
      </Card>
    );
  }

  // Group events by league
  const groupedEvents = liveEvents.reduce((acc, event) => {
    const key = event.leagueSlug;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(event);
    return acc;
  }, {} as Record<string, Event[]>);

  return (
    <Card className="mb-4">
      <CardHeader className="bg-gray-100 p-3 flex flex-row items-center justify-between">
        <div className="flex items-center">
          <ChevronDown className="h-4 w-4 mr-2 text-gray-500" />
          <div className="flex items-center">
            <span className="flex items-center">
              <span className="w-2 h-2 bg-red-500 rounded-full inline-block mr-2 live-pulse"></span>
              LIVE
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3">
        {Object.entries(groupedEvents).map(([leagueSlug, events]) => (
          <div key={leagueSlug} className="mb-4">
            <div className="flex items-center justify-between bg-gray-50 p-2 cursor-pointer rounded">
              <div className="flex items-center">
                <ChevronDown className="h-4 w-4 mr-2 text-gray-500" />
                <div className="flex items-center">
                  <Activity className="h-4 w-4 mr-2" />
                  <span>{events[0].leagueName}</span>
                </div>
              </div>
            </div>
            
            <div className="p-2">
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-gray-500">
                    <th className="text-left font-normal"></th>
                    <th className="text-right font-normal w-16">H/A</th>
                    <th className="text-right font-normal w-20">Handicap</th>
                    <th className="text-right font-normal w-20">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <Link key={event.id} href={`/match/${event.id}`}>
                      <div className="cursor-pointer hover:bg-gray-50">
                        <table className="w-full">
                          <tbody>
                            <tr>
                              <td className="py-2">
                                <div className="flex items-center">
                                  <span className="text-white bg-primary text-xs px-2 py-0.5 rounded mr-2">LIVE</span>
                                  <span className="text-sm font-medium">{event.homeTeam}</span>
                                </div>
                              </td>
                              <td className="text-right text-sm">{event.homeOdds?.toFixed(2)}</td>
                              <td className="text-right text-sm">-3.5 1.47</td>
                              <td className="text-right text-sm">O22.5 2.20</td>
                            </tr>
                            <tr className="border-b border-gray-100">
                              <td className="py-2">
                                <div className="flex items-center">
                                  <span className={cn(
                                    "text-white text-xs px-2 py-0.5 rounded mr-2",
                                    event.score ? "bg-gray-800" : "bg-primary"
                                  )}>
                                    {event.score || "0-0"}
                                  </span>
                                  <span className="text-sm font-medium">{event.awayTeam}</span>
                                </div>
                              </td>
                              <td className="text-right text-sm">{event.awayOdds?.toFixed(2)}</td>
                              <td className="text-right text-sm">+3.5 2.25</td>
                              <td className="text-right text-sm">U22.5 1.61</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </Link>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
