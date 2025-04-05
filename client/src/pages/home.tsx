import { useLocation } from "wouter";
import { PromotionBanner } from "@/components/home/PromotionBanner";
import { PromotionCards } from "@/components/home/PromotionCards";
import { EventsContainer } from "@/components/home/EventsContainer";
import { LiveEventsSection } from "@/components/home/LiveEventsSection";

export default function Home() {
  const [location] = useLocation();
  const isLiveView = location.includes("?live=true");
  
  return (
    <div>
      <PromotionBanner />
      
      <PromotionCards />
      
      {isLiveView ? (
        <LiveEventsSection />
      ) : (
        <>
          <LiveEventsSection />
          <EventsContainer />
        </>
      )}
    </div>
  );
}
