import { useLocation } from "wouter";
import HomeLayout from "@/components/layout/HomeLayout";

export default function Home() {
  return (
    <HomeLayout>
      <div className="w-full min-h-screen flex flex-col">
        <img 
          src="/images/Sports_1_NoHighlight.png" 
          alt="Sports Home" 
          className="w-full h-full object-contain"
        />
      </div>
    </HomeLayout>
  );
}