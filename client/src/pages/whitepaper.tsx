import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Shield, 
  Coins, 
  Users, 
  Zap, 
  Lock,
  TrendingUp,
  Globe,
  ChevronRight
} from 'lucide-react';

export default function WhitepaperPage() {
  const sections = [
    {
      id: 'introduction',
      title: 'Introduction',
      icon: <FileText className="h-5 w-5" />,
      content: 'SuiBets is a decentralized sports betting platform built on the Sui blockchain. Our platform leverages the speed, security, and low transaction costs of the Sui network to provide a seamless betting experience with complete transparency and fairness.'
    },
    {
      id: 'tokenomics',
      title: 'SBETS Tokenomics',
      icon: <Coins className="h-5 w-5" />,
      content: 'The SBETS token is the native utility token of the SuiBets platform. Total supply: 1,000,000,000 SBETS. Distribution: 40% Community rewards, 25% Development, 20% Liquidity, 10% Team (vested), 5% Marketing.'
    },
    {
      id: 'security',
      title: 'Security & Transparency',
      icon: <Shield className="h-5 w-5" />,
      content: 'All bets are recorded on the Sui blockchain, ensuring complete transparency and immutability. Smart contracts are audited by leading security firms. Walrus protocol provides decentralized storage for all betting data.'
    },
    {
      id: 'betting',
      title: 'Betting Mechanics',
      icon: <TrendingUp className="h-5 w-5" />,
      content: 'SuiBets offers real-time odds on 30+ sports with multiple market types including Match Winner, Handicap, Over/Under, and more. Live betting is supported with instant settlement upon match completion.'
    },
    {
      id: 'governance',
      title: 'Governance',
      icon: <Users className="h-5 w-5" />,
      content: 'SBETS token holders can participate in platform governance through voting on proposals. Stakers earn a share of platform fees and have enhanced voting power proportional to their stake duration.'
    },
    {
      id: 'technology',
      title: 'Technology Stack',
      icon: <Zap className="h-5 w-5" />,
      content: 'Built on Sui blockchain for high throughput and low latency. Move smart contracts ensure secure and efficient execution. Integration with Walrus protocol for decentralized data storage. Real-time odds from premium sports data providers.'
    }
  ];

  return (
    <Layout title="Whitepaper">
      <div className="min-h-screen bg-[#0b1618] p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <FileText className="h-10 w-10 text-cyan-400" />
            <div>
              <h1 className="text-3xl font-bold text-white">SuiBets Whitepaper</h1>
              <p className="text-gray-400">Version 1.0 - December 2025</p>
            </div>
          </div>

          <Card className="bg-[#112225] border-cyan-900/30 mb-8">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <Globe className="h-8 w-8 text-cyan-400" />
                <div>
                  <h2 className="text-xl font-bold text-white">Decentralized Sports Betting</h2>
                  <p className="text-gray-400">Powered by Sui Blockchain</p>
                </div>
              </div>
              <p className="text-gray-300 leading-relaxed">
                SuiBets revolutionizes sports betting by combining the excitement of real-time wagering 
                with the security and transparency of blockchain technology. Our platform eliminates 
                traditional intermediaries, offering users 0% platform fees and instant payouts through 
                smart contract automation.
              </p>
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="text-center p-4 bg-[#0b1618] rounded-lg">
                  <p className="text-2xl font-bold text-cyan-400">0%</p>
                  <p className="text-xs text-gray-400">Platform Fees</p>
                </div>
                <div className="text-center p-4 bg-[#0b1618] rounded-lg">
                  <p className="text-2xl font-bold text-cyan-400">30+</p>
                  <p className="text-xs text-gray-400">Sports</p>
                </div>
                <div className="text-center p-4 bg-[#0b1618] rounded-lg">
                  <p className="text-2xl font-bold text-cyan-400">Instant</p>
                  <p className="text-xs text-gray-400">Payouts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {sections.map((section, index) => (
              <Card 
                key={section.id}
                className="bg-[#112225] border-cyan-900/30 hover:border-cyan-500/30 transition-colors"
                data-testid={`whitepaper-section-${section.id}`}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-cyan-400 flex items-center gap-3">
                    <div className="p-2 rounded-full bg-[#0b1618]">
                      {section.icon}
                    </div>
                    <span>{index + 1}. {section.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 leading-relaxed pl-12">{section.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-[#112225] border-cyan-500/30 mt-8">
            <CardContent className="p-6 text-center">
              <Lock className="h-8 w-8 text-cyan-400 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Smart Contract Addresses</h3>
              <div className="space-y-2 text-sm">
                <p className="text-gray-400">
                  SBETS Token: <code className="text-cyan-400 bg-[#0b1618] px-2 py-1 rounded">0x6a4d9c...1a7285</code>
                </p>
                <p className="text-gray-400">
                  Betting Contract: <code className="text-cyan-400 bg-[#0b1618] px-2 py-1 rounded">0x8b5e2f...3c9876</code>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
