import { useParams } from "wouter";
import Layout from "@/components/layout/Layout";
import BackButton from "@/components/ui/BackButton";

export default function LiveEventPage() {
  const { id } = useParams<{ id: string }>();
  
  return (
    <Layout>
      <div className="w-full min-h-screen relative">
        <img 
          src="/images/Live 3 (2).png" 
          alt={`Live Event ${id}`}
          className="w-full h-full object-contain"
        />
        
        {/* No back button as per user request */}
        
        {/* Event ID indicator */}
        <div className="absolute top-4 right-4 bg-black/50 text-white px-4 py-2 rounded-lg">
          Live Event ID: {id}
        </div>
      </div>
    </Layout>
  );
}