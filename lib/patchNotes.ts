export const CURRENT_APP_VERSION = '1.0.1'; // Bump this on each release

export interface PatchNote {
  version: string;
  date: string; // e.g., "March 13, 2026"
  title: string;
  sections: Array<{
    category: 'Bug Fixes' | 'Features' | 'Improvements';
    items: string[];
  }>;
}

export const PATCH_NOTES: PatchNote[] = [
  {
    version: '1.0.1',
    date: 'March 14, 2026',
    title: 'I\'m a one man developer, cut me some slack.',
    sections: [
      {
        category: 'Features',
        items: [
          'It now SHOULD automatically re-logins you',
          'Keyboard now shifts the UI. There. Stop spamming.',
          'Habits checking now resets daily on local time midnight, and there\'s a counter for it now.',
          'Refresh page function. Your Welcome',
          'Missed daily + custom quests now show up in popup box.',
          'LMAO the emoji for the show password ahh (UI design come later ok,)',
        ],
      },
      {
        category: 'Bug Fixes',
        items: [
          'Daily quests are now actually random and gets it from the correct pool. Now you don\'t have to do shadow boxing 2mins and run 100m every fucking day :D',
          'Quest description now shows. Yes. There were supposed to be quest descriptions. (press the body of the quest, you can see the deadline and delete option for custom quests, and system description for daily quests)',
          'Custom quest creation limit now updates properly for failed attempts and resets daily on local time midnight',
          'Completed custom quests now correctly disappears and shows how long — Easy = 1 day, Medium = 3 days, Hard = 5 days',
        ],
      },
      {
        category: 'Improvements',
        items: [
          'Fixed many more bugs and added more features that you guys probably never encountered before. Man, how do people code and fix all this manually?',
          'p.s Sometimes the app may or may not just fucking explode or something (just reopen the app)',
        ],
      },
    ],
  },
];

export function getLatestPatchNotes(): PatchNote {
  return PATCH_NOTES[0]; // Most recent first
}
