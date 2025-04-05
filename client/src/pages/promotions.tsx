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
    <div className="bg-[#E9ECEF]">
      {/* Navigation */}
      <div className="bg-white py-2 text-center">
        <div className="container mx-auto flex justify-center items-center space-x-8">
          <Link href="/sports">
            <span className="text-[#2D3436] hover:text-[#2D3436] text-sm font-medium cursor-pointer">Sports</span>
          </Link>
          <Link href="/live">
            <span className="text-[#2D3436] hover:text-[#28DAC4] text-sm font-medium relative cursor-pointer">
              Live
              <span className="absolute -top-1 -right-2 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
            </span>
          </Link>
          <Link href="/promotions">
            <span className="text-[#2D3436] hover:text-[#28DAC4] text-sm font-medium border-b-2 border-[#28DAC4] cursor-pointer">Promotions</span>
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Main Promotion Banner */}
        {bannerPromotion && (
          <div className="w-full bg-gradient-to-r from-blue-900 to-blue-800 rounded-lg overflow-hidden mb-8 relative">
            <img 
              src="/images/Promotions (2).png" 
              alt="Promotions Banner" 
              className="w-full h-32 md:h-40 object-cover opacity-0"
            />
            <div className="absolute top-0 left-0 right-0 bottom-0 p-6 text-white">
              <div className="flex items-center">
                <span className="text-[#28DAC4] text-lg font-bold">SuiBets</span>
              </div>
              <h2 className="text-xl md:text-3xl font-bold mt-2">
                Earn Refferal Bonus of up to
              </h2>
              <div className="text-3xl md:text-6xl font-bold text-white mt-2">
                500000
              </div>
              <div className="text-lg font-semibold">$SUIBETS</div>
            </div>
          </div>
        )}

        <h2 className="text-xl font-medium mb-4 text-[#2D3436]">Available promotions</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* First Card */}
          <Card className="bg-white border-none shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-purple-800 to-purple-900 h-36 relative">
              <img src="/images/Promotions (2).png" alt="Risk Free Bet" className="w-full h-full object-cover opacity-0" />
              <div className="absolute inset-0 flex flex-col justify-center items-center text-white text-center p-4">
                <h3 className="text-3xl font-bold">$50</h3>
                <p className="text-xs">RISK-FREE BET</p>
                <p className="text-xs mt-1">GET RISK-FREE BET UP TO 500 SUIBETS</p>
              </div>
            </div>
            <CardContent className="p-4">
              <h3 className="text-lg font-bold text-center">DEPOSIT $200, PLAY WITH $450</h3>
              <div className="mt-4 space-y-1 text-sm text-gray-600">
                <p>• Minimum deposit: <span className="font-medium">$20 in crypto</span></p>
                <p>• Rollover on sports: <span className="font-medium">10x</span></p>
                <p>• Rollover on casino: <span className="font-medium">35x</span></p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Link href="/join">
                  <Button className="bg-[#00E7C3] hover:bg-[#00D1B0] text-black font-medium text-sm w-full">
                    Join Now
                  </Button>
                </Link>
                <Button variant="outline" className="text-gray-600 border-gray-300 hover:bg-gray-100 text-sm">
                  More info
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Second Card */}
          <Card className="bg-white border-none shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 h-36 relative">
              <img src="/images/Promotions (2).png" alt="Sign Up Bonus" className="w-full h-full object-cover opacity-0" />
              <div className="absolute inset-0 flex flex-col justify-center items-center text-white text-center p-4">
                <h3 className="text-3xl font-bold">100%</h3>
                <p className="text-xs">SIGN-UP BONUS</p>
                <p className="text-xs mt-1">FIRST DEPOSIT BONUS UP TO 1000 SUIBETS</p>
              </div>
            </div>
            <CardContent className="p-4">
              <h3 className="text-lg font-bold text-center">DEPOSIT $200, PLAY WITH $450</h3>
              <div className="mt-4 space-y-1 text-sm text-gray-600">
                <p>• Minimum deposit: <span className="font-medium">$20 in crypto</span></p>
                <p>• Rollover on sports: <span className="font-medium">10x</span></p>
                <p>• Rollover on casino: <span className="font-medium">35x</span></p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Link href="/join">
                  <Button className="bg-[#00E7C3] hover:bg-[#00D1B0] text-black font-medium text-sm w-full">
                    Join Now
                  </Button>
                </Link>
                <Button variant="outline" className="text-gray-600 border-gray-300 hover:bg-gray-100 text-sm">
                  More info
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Third Card */}
          <Card className="bg-white border-none shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-purple-800 to-purple-900 h-36 relative">
              <img src="/images/Promotions (2).png" alt="Risk Free Bet" className="w-full h-full object-cover opacity-0" />
              <div className="absolute inset-0 flex flex-col justify-center items-center text-white text-center p-4">
                <h3 className="text-3xl font-bold">$50</h3>
                <p className="text-xs">RISK-FREE BET</p>
                <p className="text-xs mt-1">GET RISK-FREE BET UP TO 500 SUIBETS</p>
              </div>
            </div>
            <CardContent className="p-4">
              <h3 className="text-lg font-bold text-center">DEPOSIT $200, PLAY WITH $450</h3>
              <div className="mt-4 space-y-1 text-sm text-gray-600">
                <p>• Minimum deposit: <span className="font-medium">$20 in crypto</span></p>
                <p>• Rollover on sports: <span className="font-medium">10x</span></p>
                <p>• Rollover on casino: <span className="font-medium">35x</span></p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Link href="/join">
                  <Button className="bg-[#00E7C3] hover:bg-[#00D1B0] text-black font-medium text-sm w-full">
                    Join Now
                  </Button>
                </Link>
                <Button variant="outline" className="text-gray-600 border-gray-300 hover:bg-gray-100 text-sm">
                  More info
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-[#E9ECEF] py-8 border-t border-gray-200">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-sm font-medium text-[#2D3436] mb-4">Information</h3>
            <ul className="space-y-2 text-xs text-gray-600">
              <li>FAQ</li>
              <li>Blog</li>
              <li>Become an Affiliate</li>
              <li>Privacy Policy</li>
              <li>Rules</li>
              <li>Betting Integrity</li>
              <li>Responsible Gambling</li>
              <li>About Us</li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-medium text-[#2D3436] mb-4">Community</h3>
            <ul className="space-y-2 text-xs text-gray-600">
              <li>Telegram</li>
              <li>Discord</li>
              <li>Twitter</li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-medium text-[#2D3436] mb-4">Contact Us</h3>
            <ul className="space-y-2 text-xs text-gray-600">
              <li>Support</li>
              <li>Cooperation</li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-medium text-[#2D3436] mb-4">Preferences</h3>
            <div className="flex items-center space-x-2">
              <img src="https://flagcdn.com/w20/gb.png" alt="English" className="w-5 h-3" />
              <span className="text-xs text-gray-600">English</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
