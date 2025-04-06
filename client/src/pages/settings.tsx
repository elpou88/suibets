import { useLocation } from "wouter";
import Layout from "@/components/layout/Layout";

export default function Settings() {
  return (
    <Layout>
      <div className="w-full min-h-screen flex flex-col">
        <img 
          src="/images/Settings (2).png" 
          alt="Settings" 
          className="w-full h-full object-contain"
        />
      </div>
    </Layout>
  );
}