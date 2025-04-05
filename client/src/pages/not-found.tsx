import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { RiAlertLine } from "react-icons/ri";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#032F36]">
      <Card className="w-full max-w-md mx-4 border-[#28DAC4] bg-[#072E33] text-white">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center mb-6 text-center">
            <RiAlertLine className="h-16 w-16 text-[#28DAC4] mb-4" />
            <h1 className="text-3xl font-bold text-white">404 - Page Not Found</h1>
            <p className="mt-4 text-[#9BBDC6]">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>
          
          <div className="flex justify-center mt-6">
            <Link href="/">
              <Button className="bg-[#28DAC4] hover:bg-[#1AB3A0] text-[#032F36] font-medium">
                Return to Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
