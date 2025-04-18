/**
 * Sports Market Adapter
 * 
 * This module provides adapters for different sports to handle their specific market types
 * and ensure proper display and betting functionality across all supported sports.
 */

import { Market, Outcome } from '@/types';

// Sport IDs based on API
export enum SportIds {
  SOCCER = 1,
  BASKETBALL = 2,
  TENNIS = 3,
  BASEBALL = 4,
  HOCKEY = 5,
  RUGBY = 6,
  GOLF = 7,
  VOLLEYBALL = 8,
  CRICKET = 9,
  MMA_UFC = 10,
  BOXING = 11,
  FORMULA_1 = 12,
  CYCLING = 13,
  AMERICAN_FOOTBALL = 14,
  AFL = 15,
  SNOOKER = 16,
  DARTS = 17
}

// Market types by sport
export enum MarketTypes {
  // Common markets
  MATCH_RESULT = 'Match Result',
  MATCH_WINNER = 'Match Winner',
  OVER_UNDER = 'Over/Under',
  HANDICAP = 'Handicap',
  CORRECT_SCORE = 'Correct Score',
  
  // Soccer specific
  BOTH_TEAMS_TO_SCORE = 'Both Teams to Score',
  DOUBLE_CHANCE = 'Double Chance',
  FIRST_HALF_RESULT = 'First Half Result',
  FIRST_TEAM_TO_SCORE = 'First Team to Score',
  
  // Basketball specific
  TOTAL_POINTS = 'Total Points',
  PLAYER_POINTS = 'Player Points',
  RACE_TO_POINTS = 'Race to Points',
  QUARTER_WINNER = 'Quarter Winner',
  
  // Tennis specific
  SET_WINNER = 'Set Winner',
  TOTAL_GAMES = 'Total Games',
  PLAYER_GAMES = 'Player Games',
  
  // Cricket specific
  TOP_BATSMAN = 'Top Batsman',
  TOP_BOWLER = 'Top Bowler',
  METHOD_OF_DISMISSAL = 'Method of Dismissal',
  TOTAL_MATCH_SIXES = 'Total Match Sixes',
  
  // Combat sports (UFC/Boxing)
  METHOD_OF_VICTORY = 'Method of Victory',
  ROUND_BETTING = 'Round Betting',
  FIGHT_DURATION = 'Fight Duration',
  
  // Motor sports
  RACE_WINNER = 'Race Winner',
  PODIUM_FINISH = 'Podium Finish',
  FASTEST_LAP = 'Fastest Lap',
  
  // Golf
  TOURNAMENT_WINNER = 'Tournament Winner',
  TOP_5_FINISH = 'Top 5 Finish',
  TOP_10_FINISH = 'Top 10 Finish',
  HEAD_TO_HEAD = 'Head to Head'
}

// Helper functions to standardize outcome names
export const standardizeOutcomeName = (outcomeName: string, sportId: number): string => {
  // Convert numeric outcome names (1, X, 2) to more descriptive names
  if (outcomeName === '1') {
    return 'Home';
  } else if (outcomeName === 'X') {
    return 'Draw';
  } else if (outcomeName === '2') {
    return 'Away';
  }
  
  return outcomeName;
};

// Get default markets for a sport if none are available from the API
export const getDefaultMarkets = (sportId: number, homeTeam: string, awayTeam: string): Market[] => {
  const defaultOutcomes: Outcome[] = [
    { id: 'home', name: homeTeam, odds: 2.00, status: 'active', probability: 0.5 },
    { id: 'away', name: awayTeam, odds: 2.00, status: 'active', probability: 0.5 }
  ];
  
  // Add draw outcome for sports that can have draws
  if ([
    SportIds.SOCCER, 
    SportIds.HOCKEY, 
    SportIds.RUGBY,
    SportIds.CRICKET
  ].includes(sportId)) {
    defaultOutcomes.splice(1, 0, {
      id: 'draw',
      name: 'Draw',
      odds: 3.00,
      status: 'active',
      probability: 0.33
    });
  }
  
  let marketType = MarketTypes.MATCH_WINNER;
  
  // Soccer uses Match Result instead of Match Winner
  if (sportId === SportIds.SOCCER) {
    marketType = MarketTypes.MATCH_RESULT;
  }
  // Tennis uses Set Winner for first set
  else if (sportId === SportIds.TENNIS) {
    marketType = MarketTypes.SET_WINNER;
  }
  // Golf uses Tournament Winner
  else if (sportId === SportIds.GOLF) {
    marketType = MarketTypes.TOURNAMENT_WINNER;
  }
  // F1 uses Race Winner
  else if (sportId === SportIds.FORMULA_1) {
    marketType = MarketTypes.RACE_WINNER;
  }
  
  return [
    {
      id: 1,
      name: marketType,
      type: 'standard',
      status: 'open',
      outcomes: defaultOutcomes
    }
  ];
};

// Get all available market types for a specific sport
export const getAvailableMarketTypesForSport = (sportId: number): string[] => {
  switch (sportId) {
    case SportIds.SOCCER:
      return [
        MarketTypes.MATCH_RESULT,
        MarketTypes.OVER_UNDER,
        MarketTypes.BOTH_TEAMS_TO_SCORE,
        MarketTypes.DOUBLE_CHANCE,
        MarketTypes.CORRECT_SCORE,
        MarketTypes.FIRST_HALF_RESULT,
        MarketTypes.FIRST_TEAM_TO_SCORE
      ];
      
    case SportIds.BASKETBALL:
      return [
        MarketTypes.MATCH_WINNER,
        MarketTypes.HANDICAP,
        MarketTypes.TOTAL_POINTS,
        MarketTypes.PLAYER_POINTS,
        MarketTypes.RACE_TO_POINTS,
        MarketTypes.QUARTER_WINNER
      ];
      
    case SportIds.TENNIS:
      return [
        MarketTypes.MATCH_WINNER,
        MarketTypes.SET_WINNER,
        MarketTypes.TOTAL_GAMES,
        MarketTypes.PLAYER_GAMES
      ];
      
    case SportIds.BASEBALL:
      return [
        MarketTypes.MATCH_WINNER,
        MarketTypes.OVER_UNDER,
        MarketTypes.HANDICAP
      ];
      
    case SportIds.HOCKEY:
      return [
        MarketTypes.MATCH_RESULT,
        MarketTypes.OVER_UNDER,
        MarketTypes.HANDICAP
      ];
      
    case SportIds.CRICKET:
      return [
        MarketTypes.MATCH_WINNER,
        MarketTypes.TOP_BATSMAN,
        MarketTypes.TOP_BOWLER,
        MarketTypes.METHOD_OF_DISMISSAL,
        MarketTypes.TOTAL_MATCH_SIXES
      ];
      
    case SportIds.MMA_UFC:
    case SportIds.BOXING:
      return [
        MarketTypes.MATCH_WINNER,
        MarketTypes.METHOD_OF_VICTORY,
        MarketTypes.ROUND_BETTING,
        MarketTypes.FIGHT_DURATION
      ];
      
    case SportIds.FORMULA_1:
      return [
        MarketTypes.RACE_WINNER,
        MarketTypes.PODIUM_FINISH,
        MarketTypes.FASTEST_LAP
      ];
      
    case SportIds.GOLF:
      return [
        MarketTypes.TOURNAMENT_WINNER,
        MarketTypes.TOP_5_FINISH,
        MarketTypes.TOP_10_FINISH,
        MarketTypes.HEAD_TO_HEAD
      ];
      
    // For all other sports, use general markets
    default:
      return [
        MarketTypes.MATCH_WINNER,
        MarketTypes.OVER_UNDER,
        MarketTypes.HANDICAP
      ];
  }
};

// Get specific market display settings for a sport
export const getMarketDisplaySettings = (sportId: number, marketType: string) => {
  const defaultSettings = {
    displayTitle: marketType,
    outcomes: 'standard', // 'standard', 'yes-no', 'over-under'
    allowParlay: true
  };
  
  // Customize display settings for specific market types
  switch (marketType) {
    case MarketTypes.BOTH_TEAMS_TO_SCORE:
      return {
        ...defaultSettings,
        displayTitle: 'Both Teams to Score',
        outcomes: 'yes-no'
      };
      
    case MarketTypes.OVER_UNDER:
      return {
        ...defaultSettings,
        displayTitle: 'Total Goals/Points',
        outcomes: 'over-under'
      };
      
    default:
      return defaultSettings;
  }
};

// Parse and enhance markets data from API for all sports
export const enhanceMarketsForSport = (markets: Market[], sportId: number): Market[] => {
  if (!markets || markets.length === 0) {
    return [];
  }
  
  return markets.map(market => {
    // For soccer, standardize the market names
    if (sportId === SportIds.SOCCER) {
      if (market.name.includes('1x2') || market.name.toLowerCase().includes('match result')) {
        market.name = MarketTypes.MATCH_RESULT;
      } else if (market.name.toLowerCase().includes('both teams to score')) {
        market.name = MarketTypes.BOTH_TEAMS_TO_SCORE;
      }
    }
    
    // Standardize outcome names across all sports
    if (market.outcomes) {
      market.outcomes = market.outcomes.map(outcome => ({
        ...outcome,
        name: standardizeOutcomeName(outcome.name, sportId)
      }));
    }
    
    return market;
  });
};

export default {
  SportIds,
  MarketTypes,
  getDefaultMarkets,
  getAvailableMarketTypesForSport,
  getMarketDisplaySettings,
  enhanceMarketsForSport,
  standardizeOutcomeName
};