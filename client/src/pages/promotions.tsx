import { useLocation } from "wouter";
import Layout from "@/components/layout/Layout";

export default function Promotions() {
  return (
    <Layout>
      <div className="w-full min-h-screen flex flex-col">
        <img 
          src="/images/Promotions (2).png" 
          alt="Promotions" 
          className="w-full h-full object-contain"
        />
      </div>
    </Layout>
  );
}