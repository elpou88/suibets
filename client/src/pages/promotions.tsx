import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Promotion } from "@/types";

export default function Promotions() {
  const { data: promotions = [], isLoading } = useQuery<Promotion[]>({
    queryKey: ['/api/promotions'],
  });

  if (isLoading) {
    return <div className="p-12 text-center">Loading promotions...</div>;
  }

  // Split promotions: main banner (referral) and regular promotions
  const bannerPromotion = promotions.find(p => p.type === 'referral');
  const regularPromotions = promotions.filter(p => p.type !== 'referral');

  return (
    <div>
      {/* Main Promotion Banner */}
      {bannerPromotion && (
        <div className="w-full bg-blue-900 rounded-lg overflow-hidden mb-8 relative">
          <div className="bg-gradient-to-r from-blue-900 to-indigo-800 h-60"></div>
          <div className="absolute top-0 left-0 right-0 bottom-0 p-8 text-white">
            <div className="flex items-center">
              <span className="text-primary text-xl font-bold mr-2">SuiBets</span>
            </div>
            <h2 className="text-2xl md:text-4xl font-bold mt-4">
              {bannerPromotion.title}
            </h2>
            <div className="text-4xl md:text-7xl font-bold text-white mt-2">
              {bannerPromotion.amount?.toLocaleString()}
            </div>
            <div className="text-xl font-semibold">$SUIBETS</div>
            <p className="mt-4 max-w-xl">{bannerPromotion.description}</p>
            <Link href="/join">
              <Button size="lg" className="mt-6">
                Join Now
              </Button>
            </Link>
          </div>
        </div>
      )}

      <h2 className="text-2xl font-bold mb-6">Available promotions</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {regularPromotions.map((promotion) => (
          <Card key={promotion.id} className={`overflow-hidden ${promotion.type === 'sign-up' ? 'bg-blue-800' : 'bg-purple-900'}`}>
            <CardContent className="p-8 text-white">
              <h3 className="text-xl md:text-2xl font-bold">{promotion.title}</h3>
              <p className="text-sm mt-2 mb-6">{promotion.description}</p>
              
              <div className="space-y-2 mb-6">
                <div className="flex items-center text-sm">
                  <span>• Minimum deposit: ${promotion.minDeposit} in crypto</span>
                </div>
                <div className="flex items-center text-sm">
                  <span>• Rollover on sports: {promotion.rolloverSports}x</span>
                </div>
                <div className="flex items-center text-sm">
                  <span>• Rollover on casino: {promotion.rolloverCasino}x</span>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <Link href="/join">
                  <Button className={`${promotion.type === 'sign-up' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-purple-600 hover:bg-purple-700'}`}>
                    Join Now
                  </Button>
                </Link>
                <Button variant="outline" className="border-white text-white hover:bg-white/10">
                  More info
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <h3 className="text-xl font-bold mb-4">Promotion Terms & Conditions</h3>
        <div className="space-y-4 text-sm text-gray-600">
          <p>
            1. All promotions are subject to the general terms and conditions of SuiBets.
          </p>
          <p>
            2. Promotions are available to eligible players only who have registered with SuiBets.
          </p>
          <p>
            3. SuiBets reserves the right to alter, amend or terminate any promotion at any time without notice.
          </p>
          <p>
            4. Bonus funds must be rolled over according to the specified requirements before any withdrawal can be made.
          </p>
          <p>
            5. SuiBets reserves the right to withhold any promotional funds if it believes the promotion has been abused.
          </p>
          <Button variant="link" className="text-primary p-0 h-auto mt-2">
            Read full terms
          </Button>
        </div>
      </div>
    </div>
  );
}
