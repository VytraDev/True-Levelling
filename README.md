# True Levelling

A Solo Leveling-inspired habit RPG for Android (and web). Complete real-world tasks to level up your character, unlock classes, fight in dungeons, and avoid the System's punishment for slacking off.

**Live (PWA):** [true-levelling.vercel.app](https://true-levelling.vercel.app)

> Built with Expo (React Native), TypeScript, Supabase, and Gemini API. Sole developer and product owner.

---

## What It Is

Most habit apps reward you with streaks and badges. True Levelling treats your real-world habits as quests in an RPG. Miss your daily quests and a penalty gauge fills up. Let it max out and you face a boss encounter you cannot escape. The stakes are fictional, but the habits are real.

The feature that separates this from other gamified habit apps: a **custom quest generator** powered by the Gemini API. You describe a task in plain language, the AI evaluates its difficulty, assigns stat rewards, and writes the quest description. No manual categorisation required.

---

## Stack

| Layer | Technology |
|---|---|
| Mobile framework | Expo (React Native) + TypeScript |
| State management | Zustand |
| Backend / Auth / DB | Supabase |
| AI quest evaluation | Gemini API (direct REST) |
| Deployment (PWA) | Vercel |
| Build (APK) | EAS CLI |

---

## Features

### Character System
- **5 stats:** STR (Physical), AGI (Dexterity), INT (Mental), END (Vigour), VIT (Health)
- **Attribute Points (AP):** fixed at `Level × 5` — no drift, no exploits
- **Stat reset:** costs 10 levels, lets you respec into a different class build
- **7 ranks:** E through S, with promotion and demotion logic tied to lifetime XP
- **6 classes:** each with unique stat coefficients and skill access
- **Character creation:** gender, face, and hair selection on first launch

### Quest System
- **245 hand-calibrated quests** across 5 stat categories
- **7 difficulty tiers:** Easy → Easy+ → Medium → Medium+ → Hard → Hard+ → Sung Jin Woo
- Daily quests are generated based on your class and current difficulty tier
- **Break days:** 2 per week, reschedulable once weekly
- **Overdue quests** persist with a red badge and apply one penalty bar per daily reset instead of disappearing
- **Custom quest generator:** describe any real-world task, Gemini API assigns difficulty, stat rewards, and flavour text. 5 attempts per day; failed AI evaluations decrement the counter
- **Tiered quest expiration:** Easy completed quests expire after 1 day, Medium after 3, Hard after 5

### Penalty System
- **10-bar penalty gauge** — red bars for accumulated penalties, orange blinking bars for live risk
- Fill all 10 bars and the **Penalty Zone Boss** triggers: a 5-wave centipede encounter you cannot tab out of
- Daily reset countdown shows exactly when the danger window opens

### Combat System *(v1.1.0 — in active development)*

**Implemented:**
- Turn-based engine inspired by Honkai Star Rail's Action Value / speed system
- **3 attack types:** Basic Attack, Skill (consumes Stamina), Spell (consumes MP)
- **Energy system:** timestamp-based background regen, dungeon entry gating, mid-battle exit refunds
- **Death penalty:** −5 levels and all gold lost on defeat; rank is preserved via lifetime XP
- **6 dungeons across 3 tiers** with 30 enemy variants and weighted spawn tables
- **Combat stat formula:**
  ```
  final_stat = (
    (base_stat + (level - 1) × level_scaling)
    × (1 + (attribute + gear_bonus) × ATTRIBUTE_SCALING_MULTIPLIER)
  ) × class_coefficient
  ```
  Gear bonus pools with the attribute value before scaling, so gear benefits from class coefficients multiplicatively.

**In progress:**
- **Status effects engine** (buffs, debuffs, DoT)
- **6 skill slots + 7 spell slots** — abilities are data-driven and earned through quests, not purchased

### Other
- Email/password authentication via Supabase Auth with email verification
- **System Awakening** intro sequence on first launch
- **Patch notes modal** (V.1.0.1) — auto-shows on first launch after an update, accessible from settings afterward
- All tunable constants (quest pools, rank thresholds, combat coefficients, class requirements) live in dedicated config files

---

## Setup

### Prerequisites
- Node.js (LTS)
- Expo CLI: `npm install -g expo-cli`
- A Supabase project
- A Gemini API key ([aistudio.google.com](https://aistudio.google.com))

### Installation

```bash
git clone https://github.com/VytraDev/True-Levelling.git
cd True-Levelling
npm install
```

### Environment Variables

Create a `.env` file in the root:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
```

### Run

```bash
npx expo start
```

Press `a` for Android emulator, or scan the QR code with Expo Go on your phone.

### Build APK

```bash
eas build -p android --profile preview
```

---

## Architecture Notes

- All Supabase calls use `snake_case` keys, mapped to `camelCase` in the Zustand store
- Auth state is managed via the `INITIAL_SESSION` event in the root layout — this prevents the web refresh redirect bug
- XP changes are centralised in an `applyXpDelta` helper; nothing modifies XP directly
- The custom quest generator sends a plain-language task description to Gemini and parses the structured JSON response for difficulty, category, rewards, and description
- `__DEV__` global (Expo's built-in flag) is used to gate debug utilities — `true` in development, `false` in production builds

---

## Roadmap

**v1.1.0 (in development)**
- Status effects engine (buffs, debuffs, DoT)
- 6 skill slots + 7 spell slots (data-driven, quest-earned abilities)
- Full combat UI overhaul
- Special quest progression syncing
- Penalty Zone Boss polish

**Planned**
- Gear and gacha system (quest, dungeon, and daily streak rewards)
- Weekly Boss Raids (Sundays)
- Streak tracking with XP multiplier
- Skill unlock via INT stat threshold
- S-Rank quests
- Social features and guilds

---

## Built With

This project was built using a Cursor + Claude collaboration workflow: Claude handled architecture decisions and code review; Cursor handled implementation. All product decisions were made by the developer.

---

## Version History

| Version | Notes |
|---|---|
| v1.0.0 | Initial release |
| v1.0.1 | Bug fixes: overdue quest logic, KeyboardAvoidingView on Android physical devices, daily quest tier filtering, email duplicate validation. Added patch notes modal |
| v1.1.0 | Combat system — in development |
