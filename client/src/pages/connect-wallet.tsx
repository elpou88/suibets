import { useLocation } from "wouter";
import Layout from "@/components/layout/Layout";

export default function ConnectWallet() {
  return (
    <Layout>
      <div className="w-full min-h-screen flex flex-col">
        <img 
          src="/images/Connect Wallet (2).png" 
          alt="Connect Wallet" 
          className="w-full h-full object-contain"
        />
      </div>
    </Layout>
  );
}