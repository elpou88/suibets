import { useQuery } from '@tanstack/react-query';

export interface SportEvent {
  id: string | number;
  sportId: number;
  homeTeam: string;
  awayTeam: string;
  leagueName?: string;
  league?: string;
  startTime: string;
  isLive: boolean;
  score?: string;
  homeScore?: number;
  awayScore?: number;
  minute?: string;
  status?: string;
  stats?: any;
  homeOdds?: number;
  drawOdds?: number;
  awayOdds?: number;
}

export function useLiveEvents(sportId?: string | number | null) {
  const normalizedSportId = sportId ? String(sportId) : 'all';
  
  const url = normalizedSportId === 'all' 
    ? '/api/events?isLive=true' 
    : `/api/events?isLive=true&sportId=${normalizedSportId}`;

  return useQuery<SportEvent[]>({
    queryKey: ['events', 'live', normalizedSportId],
    queryFn: async () => {
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch live events');
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    refetchInterval: 10000,
    staleTime: 9000,
    gcTime: 60000,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  });
}

export function useUpcomingEvents(sportId?: string | number | null) {
  const normalizedSportId = sportId ? String(sportId) : 'all';
  
  const url = normalizedSportId === 'all' 
    ? '/api/events?isLive=false' 
    : `/api/events?isLive=false&sportId=${normalizedSportId}`;

  return useQuery<SportEvent[]>({
    queryKey: ['events', 'upcoming', normalizedSportId],
    queryFn: async () => {
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch upcoming events');
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    refetchInterval: 30000,
    staleTime: 25000,
    gcTime: 120000,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  });
}
