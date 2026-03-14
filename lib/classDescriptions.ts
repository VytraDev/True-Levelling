export interface ClassChar {
  name: string;
  positive: Array<{ icon: string; text: string }>;
  negative: Array<{ icon: string; text: string }>;
}

export interface ClassInfo {
  id: string;
  name: string;
  description: string;
  howToBecome: string;
  characteristics: ClassChar;
}

export const CLASS_DESCRIPTIONS: Record<string, ClassInfo> = {
  assassin: {
    id: 'assassin',
    name: 'Assassin',
    description:
      'A very agile hunter with high attack and endurance. Light on feet but fragile—a glass cannon.',
    howToBecome: 'AGI 25+, STR 20+, END 15+',
    characteristics: {
      name: 'Assassin',
      positive: [
        { icon: '🔼', text: 'High Attack' },
        { icon: '🔼', text: 'High Speed' },
        { icon: '🔼', text: 'High Agility' },
      ],
      negative: [
        { icon: '🔽', text: 'Low Defense' },
        { icon: '🔽', text: 'Very Fragile' },
      ],
    },
  },
  fighter_speed: {
    id: 'fighter_speed',
    name: 'Fighter (Speed)',
    description:
      'A balanced warrior of strength, speed, and endurance. Versatile and reliable in any situation.',
    howToBecome: 'Balanced: STR 20+, AGI 20+, END 20+',
    characteristics: {
      name: 'Fighter (Speed)',
      positive: [
        { icon: '🔼', text: 'Balanced Stats' },
        { icon: '🔼', text: 'Versatile' },
      ],
      negative: [{ icon: '🔽', text: 'No Specialization' }],
    },
  },
  fighter_brute: {
    id: 'fighter_brute',
    name: 'Fighter (Brute)',
    description:
      'A powerful brawler with raw strength and durability. Slow but devastating—tank the hits.',
    howToBecome: 'STR 30+, END 15+, VIT 15+',
    characteristics: {
      name: 'Fighter (Brute)',
      positive: [
        { icon: '🔼', text: 'High Strength' },
        { icon: '🔼', text: 'High Endurance' },
      ],
      negative: [
        { icon: '🔽', text: 'Low Speed' },
        { icon: '🔽', text: 'Slow' },
      ],
    },
  },
  tank: {
    id: 'tank',
    name: 'Tank',
    description:
      'An iron fortress of defense and stamina. Draw aggro and protect your team.',
    howToBecome: 'VIT 25+, END 25+',
    characteristics: {
      name: 'Tank',
      positive: [
        { icon: '🔼', text: 'High Defense' },
        { icon: '🔼', text: 'High Stamina' },
      ],
      negative: [
        { icon: '🔽', text: 'Lower Attack' },
        { icon: '🔽', text: 'Slow' },
      ],
    },
  },
  caster: {
    id: 'caster',
    name: 'Caster',
    description:
      'A cunning mage blending intelligence and agility. Control the battlefield from a distance.',
    howToBecome: 'INT 25+, AGI 25+',
    characteristics: {
      name: 'Caster',
      positive: [
        { icon: '🔼', text: 'High Intelligence' },
        { icon: '🔼', text: 'High Agility' },
      ],
      negative: [{ icon: '🔽', text: 'Fragile' }],
    },
  },
  mage: {
    id: 'mage',
    name: 'Mage',
    description:
      'A master of arcane power with overwhelming intelligence. Raw magical force unleashed.',
    howToBecome: 'INT 30+, STR 20+',
    characteristics: {
      name: 'Mage',
      positive: [
        { icon: '🔼', text: 'Very High Intelligence' },
        { icon: '🔼', text: 'Raw Power' },
      ],
      negative: [
        { icon: '🔽', text: 'Low Stamina' },
        { icon: '🔽', text: 'Fragile' },
      ],
    },
  },
  unclassed: {
    id: 'unclassed',
    name: 'Unclassed',
    description:
      'You have not yet chosen a path. Allocate AP to your stats and discover your destiny.',
    howToBecome: 'Reach Level 6 and meet the stat requirements of any class above.',
    characteristics: {
      name: 'Unclassed',
      positive: [{ icon: '🔼', text: 'Flexible' }],
      negative: [{ icon: '🔽', text: 'No class bonuses' }],
    },
  },
};
