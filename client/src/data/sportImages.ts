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
    imagePath: '/images/Sports 1 (2).png',
    title: 'Football'
  },
  {
    slug: 'basketball',
    imagePath: '/images/Sports 2 (2).png',
    title: 'Basketball'
  },
  {
    slug: 'baseball',
    imagePath: '/images/Sports 3 (2).png',
    title: 'Baseball'
  },
  {
    slug: 'hockey',
    imagePath: '/images/Sports 4 (2).png',
    title: 'Hockey'
  },
  {
    slug: 'tennis',
    imagePath: '/images/image_1743932705622.png',
    title: 'Tennis'
  },
  {
    slug: 'boxing',
    imagePath: '/images/image_1743932891440.png',
    title: 'Boxing'
  },
  {
    slug: 'ufc',
    imagePath: '/images/image_1743932923834.png',
    title: 'UFC'
  },
  {
    slug: 'golf',
    imagePath: '/images/image_1743933050735.png',
    title: 'Golf'
  },
  {
    slug: 'esports',
    imagePath: '/images/image_1743933103859.png',
    title: 'Esports'
  },
  {
    slug: 'cricket',
    imagePath: '/images/image_1743933557700.png',
    title: 'Cricket'
  },
  {
    slug: 'racing',
    imagePath: '/images/image_1743947434959.png',
    title: 'Racing'
  }
];

export default sportImages;