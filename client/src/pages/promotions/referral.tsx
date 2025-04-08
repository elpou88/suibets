import Layout from "@/components/layout/Layout";
import BackButton from "@/components/ui/BackButton";

export default function ReferralPage() {
  return (
    <Layout>
      <div className="w-full min-h-screen relative">
        <img 
          src="/images/Promotions (2).png" 
          alt="Referral Bonus"
          className="w-full h-full object-contain"
        />
        
        {/* Using the reusable BackButton component */}
        <BackButton to="/promotions" label="Back to Promotions" />
        
        {/* Promotion type indicator */}
        <div className="absolute top-4 right-4 bg-black/50 text-white px-4 py-2 rounded-lg">
          Promotion: Referral Bonus
        </div>
      </div>
    </Layout>
  );
}