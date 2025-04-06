import { useLocation } from "wouter";
import Layout from "@/components/layout/Layout";

export default function Home() {
  return (
    <Layout>
      <div className="w-full min-h-screen flex flex-col">
        <img 
          src="/images/Sports 1 (2).png" 
          alt="Sports Home" 
          className="w-full h-full object-contain"
        />
      </div>
    </Layout>
  );
}