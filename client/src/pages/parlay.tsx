import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useBetting } from '@/context/BettingContext';
import { 
  Layers, 
  Plus, 
  Trash2, 
  Calculator,
  TrendingUp,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface ParlayLeg {
  id: string;
  eventName: string;
  selection: string;
  odds: number;
}

export default function ParlayPage() {
  const { toast } = useToast();
  const { selectedBets, removeBet, clearBets } = useBetting();
  const [stake, setStake] = useState('10');

  const parlayLegs: ParlayLeg[] = selectedBets.map((bet: any) => ({
    id: bet.id,
    eventName: bet.eventName || 'Unknown Event',
    selection: bet.selectionName || 'Unknown Selection',
    odds: bet.odds || 1.5
  }));

  const totalOdds = parlayLegs.reduce((acc, leg) => acc * leg.odds, 1);
  const potentialPayout = parseFloat(stake || '0') * totalOdds;

  const handleRemoveLeg = (id: string) => {
    removeBet(id);
    toast({
      title: 'Leg Removed',
      description: 'Selection removed from parlay',
    });
  };

  const handlePlaceParlay = () => {
    if (parlayLegs.length < 2) {
      toast({
        title: 'Not Enough Selections',
        description: 'A parlay requires at least 2 selections',
        variant: 'destructive',
      });
      return;
    }
    
    toast({
      title: 'Parlay Placed!',
      description: `${parlayLegs.length}-leg parlay placed for ${stake} SUI`,
    });
    clearBets();
    setStake('10');
  };

  return (
    <Layout title="Parlay Builder">
      <div className="min-h-screen bg-[#0b1618] p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Layers className="h-8 w-8 text-cyan-400" />
            <div>
              <h1 className="text-3xl font-bold text-white">Parlay Builder</h1>
              <p className="text-gray-400">Combine multiple selections for bigger payouts</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card className="bg-[#112225] border-cyan-900/30">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    <span>Your Selections</span>
                    <Badge className="bg-cyan-500/20 text-cyan-400">
                      {parlayLegs.length} Legs
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {parlayLegs.length === 0 ? (
                    <div className="text-center py-12">
                      <Layers className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-400">No selections yet</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Add bets from the sports pages to build your parlay
                      </p>
                      <Button 
                        className="mt-4 bg-cyan-600 hover:bg-cyan-700"
                        onClick={() => window.location.href = '/'}
                        data-testid="button-browse-sports"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Browse Sports
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {parlayLegs.map((leg, index) => (
                        <div 
                          key={leg.id}
                          className="flex items-center justify-between p-4 bg-[#0b1618] rounded-lg border border-cyan-900/20"
                          data-testid={`parlay-leg-${index}`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <p className="text-white font-medium">{leg.eventName}</p>
                              <p className="text-sm text-cyan-400">{leg.selection}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge className="bg-green-500/20 text-green-400">
                              {leg.odds.toFixed(2)}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveLeg(leg.id)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              data-testid={`button-remove-leg-${index}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-[#112225] border-cyan-900/30 mt-6">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-400" />
                    Parlay Rules
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-gray-400 text-sm space-y-2">
                  <p>• Minimum 2 selections required for a parlay</p>
                  <p>• Maximum 10 selections per parlay</p>
                  <p>• All selections must win for the parlay to pay out</p>
                  <p>• Odds are multiplied together for final payout</p>
                  <p>• Live events can be included in parlays</p>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="bg-[#112225] border-cyan-900/30 sticky top-6">
                <CardHeader>
                  <CardTitle className="text-cyan-400 flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Bet Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-gray-400">
                    <span>Selections:</span>
                    <span className="text-white">{parlayLegs.length}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Combined Odds:</span>
                    <span className="text-green-400 font-bold">{totalOdds.toFixed(2)}</span>
                  </div>
                  
                  <div className="border-t border-cyan-900/30 pt-4">
                    <label className="text-sm text-gray-400 mb-2 block">Stake (SUI)</label>
                    <Input
                      type="number"
                      value={stake}
                      onChange={(e) => setStake(e.target.value)}
                      className="bg-[#0b1618] border-cyan-900/30 text-white text-lg"
                      data-testid="input-parlay-stake"
                    />
                  </div>

                  <div className="bg-[#0b1618] p-4 rounded-lg">
                    <div className="flex justify-between text-gray-400 mb-2">
                      <span>Potential Payout:</span>
                    </div>
                    <p className="text-3xl font-bold text-cyan-400">
                      {potentialPayout.toFixed(2)} SUI
                    </p>
                  </div>

                  <Button
                    onClick={handlePlaceParlay}
                    disabled={parlayLegs.length < 2}
                    className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-6 text-lg"
                    data-testid="button-place-parlay"
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Place Parlay
                  </Button>

                  {parlayLegs.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={clearBets}
                      className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
                      data-testid="button-clear-parlay"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear All
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
