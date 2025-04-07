import { Link } from 'wouter';

export default function PromotionsPage() {
  return (
    <div className="w-full bg-gray-100 min-h-screen">
      {/* Top Navigation */}
      <div className="p-4 flex justify-center items-center bg-gray-200">
        <div className="flex space-x-10">
          <Link href="/" className="text-gray-600 hover:text-gray-900">Sports</Link>
          <Link href="/live" className="text-gray-600 hover:text-gray-900">Live</Link>
          <Link href="/promotions" className="text-cyan-500 border-b-2 border-cyan-500">Promotions</Link>
        </div>
        <div className="absolute right-4 flex space-x-4">
          <Link href="/join" className="text-gray-600 hover:text-gray-900">Join Now</Link>
          <Link href="/connect-wallet" className="bg-cyan-500 text-white px-3 py-1 rounded-md">Connect Wallet</Link>
        </div>
      </div>
      
      {/* Banner */}
      <div className="w-full max-w-5xl mx-auto p-4 mt-4">
        <div className="bg-blue-900 rounded-lg overflow-hidden relative">
          <img 
            src="/images/promotions_actual.png" 
            alt="Promotions" 
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}