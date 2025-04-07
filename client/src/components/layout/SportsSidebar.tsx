import { useLocation } from "wouter";

type SportItemProps = {
  name: string;
  slug: string;
  top: number; // position from top in %
}

// Component for each sport item in the sidebar
const SportItem = ({ name, slug, top }: SportItemProps) => {
  const [, setLocation] = useLocation();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the click from bubbling up to parent elements
    setLocation(`/sport/${slug}`);
  };

  return (
    <div 
      className="absolute left-0 px-4 py-1 w-full text-transparent cursor-pointer"
      style={{ top: `${top}%` }}
      onClick={handleClick}
    >
      {name}
    </div>
  );
};

export default function SportsSidebar() {
  // Define all sports with their positions
  const sports = [
    { name: "Football", slug: "football", top: 2 },
    { name: "Basketball", slug: "basketball", top: 6 },
    { name: "Tennis", slug: "tennis", top: 10 },
    { name: "Baseball", slug: "baseball", top: 14 },
    { name: "Boxing", slug: "boxing", top: 18 },
    { name: "Hockey", slug: "hockey", top: 22 },
    { name: "Esports", slug: "esports", top: 26 },
    { name: "MMA/UFC", slug: "mma-ufc", top: 30 },
    { name: "Volleyball", slug: "volleyball", top: 34 },
    { name: "Table Tennis", slug: "table-tennis", top: 38 },
    { name: "Rugby League", slug: "rugby-league", top: 42 },
    { name: "Rugby Union", slug: "rugby-union", top: 46 },
    { name: "Cricket", slug: "cricket", top: 50 },
    { name: "Horse Racing", slug: "horse-racing", top: 54 },
    { name: "Greyhounds", slug: "greyhounds", top: 58 },
    { name: "AFL", slug: "afl", top: 62 }
  ];

  return (
    <div className="absolute left-0 top-[100px] bottom-0 w-[15%] z-10 pointer-events-auto">
      {/* Transparent overlay to make the entire sidebar area interactive */}
      <div className="absolute inset-0 bg-transparent"></div>
      
      {sports.map((sport) => (
        <SportItem 
          key={sport.slug}
          name={sport.name}
          slug={sport.slug}
          top={sport.top}
        />
      ))}
    </div>
  );
}