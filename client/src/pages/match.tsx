import { useLocation } from "wouter";
import Layout from "@/components/layout/Layout";

export default function Match() {
  return (
    <Layout>
      <div className="w-full min-h-screen flex flex-col">
        <img 
          src="/images/Sports 2 (2).png" 
          alt="Match Details" 
          className="w-full h-full object-contain"
        />
      </div>
    </Layout>
  );
}