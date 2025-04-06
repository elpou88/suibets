import { useLocation } from "wouter";
import Layout from "@/components/layout/Layout";

export default function BetHistory() {
  return (
    <Layout>
      <div className="w-full min-h-screen flex flex-col">
        <img 
          src="/images/Bet History (2).png" 
          alt="Bet History" 
          className="w-full h-full object-contain"
        />
      </div>
    </Layout>
  );
}