import { useLocation } from "wouter";
import { useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { useQuery } from "@tanstack/react-query";
import { Info, ChevronDown } from "lucide-react";

// Define the promotion type based on the schema
interface Promotion {
  id: number;
  title: string;
  description: string;
  imageUrl: string | null;
  type: string;
  amount: number | null;
  code: string | null;
  minDeposit: number | null;
  rolloverSports: number | null;
  rolloverCasino: number | null;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean | null;
  wurlusPromotionId: string | null;
  smartContractAddress: string | null;
}

export default function Promotions() {
  // Show the exact image as provided in the mockup
  return (
    <Layout>
      <div className="w-full min-h-screen">
        {/* We're going to display the exact image from the mockup */}
        <img 
          src="/attached_assets/Promotions (2).png" 
          alt="Promotions" 
          className="w-full object-contain"
        />
      </div>
    </Layout>
  );
}