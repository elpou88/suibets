import { useParams } from "wouter";
import { MatchDetails } from "@/components/match/MatchDetails";

export default function Match() {
  const params = useParams<{ id: string }>();
  const eventId = parseInt(params.id, 10);
  
  if (isNaN(eventId)) {
    return <div>Invalid match ID</div>;
  }
  
  return <MatchDetails eventId={eventId} />;
}
