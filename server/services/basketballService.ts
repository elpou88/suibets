import { type Event } from "@shared/schema";

/**
 * Generate synthetic basketball events for demo purposes
 */
export function generateBasketballEvents(): Event[] {
  const teams = [
    'LA Lakers', 'Boston Celtics', 'Miami Heat', 'Golden State Warriors', 
    'Chicago Bulls', 'Brooklyn Nets', 'Dallas Mavericks', 'Phoenix Suns'
  ];
  
  const events: any[] = [];
  
  for (let i = 0; i < 5; i++) {
    const homeTeamIndex = i * 2 % teams.length;
    const awayTeamIndex = (i * 2 + 1) % teams.length;
    
    const homeTeam = teams[homeTeamIndex];
    const awayTeam = teams[awayTeamIndex];
    
    const homeScore = Math.floor(Math.random() * 110) + 20;
    const awayScore = Math.floor(Math.random() * 100) + 20;
    
    events.push({
      id: `basketball-${i+1}-${Date.now()}`,
      sportId: 2,
      leagueName: 'NBA',
      homeTeam: homeTeam,
      awayTeam: awayTeam,
      startTime: new Date().toISOString(),
      status: 'live',
      score: `${homeScore} - ${awayScore}`,
      isLive: true,
      markets: [
        {
          id: `market-basketball-${i+1}-match-winner`,
          name: 'Match Result',
          status: 'open',
          marketType: '12',
          outcomes: [
            { 
              id: `outcome-basketball-${i+1}-home`, 
              name: homeTeam, 
              odds: 1.85 + Math.random() * 0.5, 
              status: 'active', 
              probability: 0.55 
            },
            { 
              id: `outcome-basketball-${i+1}-away`, 
              name: awayTeam, 
              odds: 1.95 + Math.random() * 0.5, 
              status: 'active', 
              probability: 0.45 
            }
          ]
        },
        {
          id: `market-basketball-${i+1}-total`,
          name: 'Total Points',
          status: 'open',
          marketType: 'total',
          outcomes: [
            { 
              id: `outcome-basketball-${i+1}-over`, 
              name: 'Over 195.5', 
              odds: 1.95, 
              status: 'active', 
              probability: 0.49 
            },
            { 
              id: `outcome-basketball-${i+1}-under`, 
              name: 'Under 195.5', 
              odds: 1.85, 
              status: 'active', 
              probability: 0.51 
            }
          ]
        }
      ]
    });
  }
  
  return events;
}

/**
 * Generate synthetic tennis events for demo purposes
 */
export function generateTennisEvents(): Event[] {
  const players = [
    'Rafael Nadal', 'Novak Djokovic', 'Roger Federer', 'Andy Murray',
    'Carlos Alcaraz', 'Daniil Medvedev', 'Stefanos Tsitsipas', 'Alexander Zverev'
  ];
  
  const events: any[] = [];
  
  for (let i = 0; i < 4; i++) {
    const player1Index = i * 2 % players.length;
    const player2Index = (i * 2 + 1) % players.length;
    
    const player1 = players[player1Index];
    const player2 = players[player2Index];
    
    const score1 = Math.floor(Math.random() * 3) + 1;
    const score2 = Math.floor(Math.random() * 3);
    
    events.push({
      id: `tennis-${i+1}-${Date.now()}`,
      sportId: 3,
      leagueName: 'ATP Tour',
      homeTeam: player1,
      awayTeam: player2,
      startTime: new Date().toISOString(),
      status: 'live',
      score: `${score1} - ${score2}`,
      isLive: true,
      markets: [
        {
          id: `market-tennis-${i+1}-match-winner`,
          name: 'Match Winner',
          status: 'open',
          marketType: '12',
          outcomes: [
            { 
              id: `outcome-tennis-${i+1}-home`, 
              name: player1, 
              odds: 1.7 + Math.random() * 0.4, 
              status: 'active', 
              probability: 0.55 
            },
            { 
              id: `outcome-tennis-${i+1}-away`, 
              name: player2, 
              odds: 1.9 + Math.random() * 0.5, 
              status: 'active', 
              probability: 0.45 
            }
          ]
        },
        {
          id: `market-tennis-${i+1}-total`,
          name: 'Total Games',
          status: 'open',
          marketType: 'total',
          outcomes: [
            { 
              id: `outcome-tennis-${i+1}-over`, 
              name: 'Over 22.5', 
              odds: 1.95, 
              status: 'active', 
              probability: 0.49 
            },
            { 
              id: `outcome-tennis-${i+1}-under`, 
              name: 'Under 22.5', 
              odds: 1.85, 
              status: 'active', 
              probability: 0.51 
            }
          ]
        }
      ]
    });
  }
  
  return events;
}

/**
 * Generate a simple generic sports event
 */
export function generateSportEvents(sportId: number, sportName: string): Event[] {
  const teams = [
    `${sportName} Team 1`, `${sportName} Team 2`, 
    `${sportName} Team 3`, `${sportName} Team 4`,
    `${sportName} Team 5`, `${sportName} Team 6`,
    `${sportName} Team 7`, `${sportName} Team 8`
  ];
  
  const events: any[] = [];
  
  for (let i = 0; i < 5; i++) {
    const homeTeamIndex = i * 2 % teams.length;
    const awayTeamIndex = (i * 2 + 1) % teams.length;
    
    const homeTeam = teams[homeTeamIndex];
    const awayTeam = teams[awayTeamIndex];
    
    const score1 = Math.floor(Math.random() * 3);
    const score2 = Math.floor(Math.random() * 3);
    
    events.push({
      id: `${sportName.toLowerCase()}-${i+1}-${Date.now()}`,
      sportId: sportId,
      leagueName: `${sportName} League`,
      homeTeam: homeTeam,
      awayTeam: awayTeam,
      startTime: new Date().toISOString(),
      status: 'live',
      score: `${score1} - ${score2}`,
      isLive: true,
      markets: [
        {
          id: `market-${sportName.toLowerCase()}-${i+1}-match-winner`,
          name: 'Match Result',
          status: 'open',
          marketType: '1X2',
          outcomes: [
            { 
              id: `outcome-${sportName.toLowerCase()}-${i+1}-home`, 
              name: homeTeam, 
              odds: 1.85 + Math.random() * 0.5, 
              status: 'active', 
              probability: 0.45 
            },
            { 
              id: `outcome-${sportName.toLowerCase()}-${i+1}-draw`, 
              name: 'Draw', 
              odds: 3.2 + Math.random() * 0.7, 
              status: 'active', 
              probability: 0.29 
            },
            { 
              id: `outcome-${sportName.toLowerCase()}-${i+1}-away`, 
              name: awayTeam, 
              odds: 2.05 + Math.random() * 0.6, 
              status: 'active', 
              probability: 0.32 
            }
          ]
        },
        {
          id: `market-${sportName.toLowerCase()}-${i+1}-total`,
          name: 'Total Goals',
          status: 'open',
          marketType: 'total',
          outcomes: [
            { 
              id: `outcome-${sportName.toLowerCase()}-${i+1}-over`, 
              name: 'Over 2.5', 
              odds: 1.95, 
              status: 'active', 
              probability: 0.49 
            },
            { 
              id: `outcome-${sportName.toLowerCase()}-${i+1}-under`, 
              name: 'Under 2.5', 
              odds: 1.85, 
              status: 'active', 
              probability: 0.51 
            }
          ]
        }
      ]
    });
  }
  
  return events;
}

/**
 * Get the sport name based on sport ID
 */
export function getSportName(sportId: number): string {
  const sportNames: Record<number, string> = {
    1: 'Football',
    2: 'Basketball',
    3: 'Tennis',
    4: 'Baseball',
    5: 'Hockey',
    6: 'Handball',
    7: 'Volleyball',
    8: 'Rugby',
    9: 'Cricket',
    10: 'Golf',
    11: 'Boxing',
    12: 'MMA',
    13: 'Motorsport',
    14: 'Cycling',
    15: 'American Football',
    16: 'Snooker',
    17: 'Darts',
    18: 'Table Tennis',
    19: 'Badminton',
    20: 'Esports',
  };
  
  return sportNames[sportId] || `Sport ${sportId}`;
}