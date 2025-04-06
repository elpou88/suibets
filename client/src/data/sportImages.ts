/**
 * Sport image mapping
 * Maps sport slugs to their respective image paths
 */

interface SportImage {
  slug: string;
  imagePath: string;
  title: string;
}

const sportImages: SportImage[] = [
  {
    slug: 'football',
    imagePath: '/images/Football_Original.png',
    title: 'Football'
  },
  {
    slug: 'basketball',
    imagePath: '/images/Basketball_Original.png',
    title: 'Basketball'
  },
  {
    slug: 'baseball',
    imagePath: '/images/Baseball_Original.png',
    title: 'Baseball'
  },
  {
    slug: 'hockey',
    imagePath: '/images/Hockey_Original.png',
    title: 'Hockey'
  },
  {
    slug: 'tennis',
    imagePath: '/images/Tennis_Original.png',
    title: 'Tennis'
  },
  {
    slug: 'boxing',
    imagePath: '/images/Boxing_Original.png',
    title: 'Boxing'
  },
  {
    slug: 'ufc',
    imagePath: '/images/UFC_Original.png',
    title: 'UFC'
  },
  {
    slug: 'golf',
    imagePath: '/images/Golf_Original.png',
    title: 'Golf'
  },
  {
    slug: 'esports',
    imagePath: '/images/Sports_Home_No_Highlight.png',
    title: 'Esports'
  },
  {
    slug: 'cricket',
    imagePath: '/images/Cricket_Original.png',
    title: 'Cricket'
  },
  {
    slug: 'racing',
    imagePath: '/images/Racing_Original.png',
    title: 'Racing'
  }
];

export default sportImages;