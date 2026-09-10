export interface DemoBook {
  id: number;
  title: string;
  author: string;
  chapter: number;
  hue: number;
}

const TITLES = [
  '夜行观测所',
  'The Quiet Orbit',
  '琥珀色の手紙',
  'Paper Lanterns',
  '第七码头的猫',
  'Slow Comet',
  '雾中信号',
  'The Long Commute',
  '琉璃色列车',
  'Northern Lights',
  '雨与齿轮',
  'Field Notes',
];

const AUTHORS = [
  'A. Liu',
  'M. Sato',
  'K. Nakamura',
  'R. Okafor',
  'L. Marchetti',
  'S. Haddad',
  'Y. Chen',
  'T. Bergman',
];

/** Deterministic sample data so the demo looks identical on every run. */
export function createBooks(count: number): DemoBook[] {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    title: TITLES[index % TITLES.length]!,
    author: AUTHORS[index % AUTHORS.length]!,
    chapter: (index * 7) % 240,
    hue: (index * 37) % 360,
  }));
}

export function createRows(count: number): string[] {
  return Array.from({ length: count }, (_, index) => `Row ${index + 1}`);
}
