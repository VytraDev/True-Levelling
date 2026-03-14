/**
 * ARISE — Single source of truth for all quest data.
 * Edit quests here; generation uses this config.
 * statReq values include +10 base (e.g. 25 = 15 invested, 35 = 25 invested).
 */

import type { PlayerClass } from './classEngine';

type DailyQuestEntry = {
  name: string;
  description: string;
  baseDifficulty: 'easy' | 'easy+' | 'medium' | 'medium+' | 'hard' | 'hard+' | 'sjw';
  baseXP: number;
  baseGold: number;
  statReq: Partial<Record<'str' | 'agi' | 'int' | 'vit' | 'endurance', number>>;
};

/** Daily quest pool keyed by the 5 main stat categories (7-tier: easy → sjw). */
export const DAILY_QUEST_POOL: Record<string, DailyQuestEntry[]> = {
  strength: [
    // Push-ups - reps
    { name: '5 Push-ups', baseDifficulty: 'easy', baseXP: 100, baseGold: 50, statReq: { str: 10 }, description: 'Five controlled reps. The System watches your form.' },
    { name: '15 Push-ups', baseDifficulty: 'easy+', baseXP: 200, baseGold: 100, statReq: { str: 20 }, description: 'Fifteen reps. A small set for a growing hunter.' },
    { name: '30 Push-ups', baseDifficulty: 'medium', baseXP: 450, baseGold: 225, statReq: { str: 35 }, description: "Pain is just weakness leaving the body." },
    { name: '40 Push-ups', baseDifficulty: 'medium+', baseXP: 600, baseGold: 300, statReq: { str: 45 }, description: "Your muscles burn. Good. Keep going." },
    { name: '60 Push-ups', baseDifficulty: 'hard', baseXP: 800, baseGold: 400, statReq: { str: 60 }, description: "Fifty. No stopping. No excuses." },
    { name: '75 Push-ups', baseDifficulty: 'hard+', baseXP: 1000, baseGold: 500, statReq: { str: 75 }, description: "Most hunters never reach this. You are not most hunters." },
    { name: '100 Push-ups', baseDifficulty: 'sjw', baseXP: 2000, baseGold: 1000, statReq: { str: 100 }, description: "Sung Jin Woo does this before breakfast. Can you?" },
    // Sit-ups - reps
    { name: '10 Sit-ups', baseDifficulty: 'easy', baseXP: 100, baseGold: 50, statReq: { str: 10 }, description: 'Ten sit-ups. Core strength begins here.' },
    { name: '15 Sit-ups', baseDifficulty: 'easy+', baseXP: 200, baseGold: 100, statReq: { str: 20 }, description: 'Fifteen. Your core tightens. The System approves.' },
    { name: '30 Sit-ups', baseDifficulty: 'medium', baseXP: 450, baseGold: 225, statReq: { str: 35 }, description: 'Thirty reps. Your body is changing.' },
    { name: '40 Sit-ups', baseDifficulty: 'medium+', baseXP: 600, baseGold: 300, statReq: { str: 45 }, description: 'Forty. The burn is the point.' },
    { name: '60 Sit-ups', baseDifficulty: 'hard', baseXP: 800, baseGold: 400, statReq: { str: 60 }, description: 'Sixty sit-ups. Your core is iron.' },
    { name: '75 Sit-ups', baseDifficulty: 'hard+', baseXP: 1000, baseGold: 500, statReq: { str: 75 }, description: "Seventy-five. Almost a hundred. Don't stop now." },
    { name: '100 Sit-ups', baseDifficulty: 'sjw', baseXP: 2000, baseGold: 1000, statReq: { str: 100 }, description: "A hundred reps. The System bows to no one. Neither do you." },
    // Incline Push-ups - reps
    { name: '10 Incline Push-ups', baseDifficulty: 'easy', baseXP: 100, baseGold: 50, statReq: { str: 10 }, description: 'Ten incline push-ups. Angle changes everything. Begin.' },
    { name: '20 Incline Push-ups', baseDifficulty: 'easy+', baseXP: 200, baseGold: 100, statReq: { str: 20 }, description: 'Twenty reps. Upper chest activated.' },
    { name: '35 Incline Push-ups', baseDifficulty: 'medium', baseXP: 450, baseGold: 225, statReq: { str: 35 }, description: 'Thirty-five. Your shoulders burn. Good.' },
    { name: '45 Incline Push-ups', baseDifficulty: 'medium+', baseXP: 600, baseGold: 300, statReq: { str: 45 }, description: 'Forty-five reps. Power through.' },
    { name: '65 Incline Push-ups', baseDifficulty: 'hard', baseXP: 800, baseGold: 400, statReq: { str: 60 }, description: "Sixty-five. Most hunters quit here. You don't." },
    { name: '80 Incline Push-ups', baseDifficulty: 'hard+', baseXP: 1000, baseGold: 500, statReq: { str: 75 }, description: 'Eighty incline push-ups. Your upper body is a weapon.' },
    { name: '100 Incline Push-ups', baseDifficulty: 'sjw', baseXP: 2000, baseGold: 1000, statReq: { str: 100 }, description: "A hundred incline push-ups. The dungeon gates tremble." },
    // Crunches - reps
    { name: '10 Crunches', baseDifficulty: 'easy', baseXP: 100, baseGold: 50, statReq: { str: 10 }, description: 'Ten crunches. Your core awakens.' },
    { name: '20 Crunches', baseDifficulty: 'easy+', baseXP: 200, baseGold: 100, statReq: { str: 20 }, description: 'Twenty crunches. The System acknowledges your effort.' },
    { name: '30 Crunches', baseDifficulty: 'medium', baseXP: 450, baseGold: 225, statReq: { str: 35 }, description: 'Thirty crunches. Your core is your foundation.' },
    { name: '40 Crunches', baseDifficulty: 'medium+', baseXP: 600, baseGold: 300, statReq: { str: 45 }, description: 'Forty reps. Stay tight.' },
    { name: '50 Crunches', baseDifficulty: 'hard', baseXP: 800, baseGold: 400, statReq: { str: 60 }, description: 'Fifty crunches. Your abs are steel.' },
    { name: '75 Crunches', baseDifficulty: 'hard+', baseXP: 1000, baseGold: 500, statReq: { str: 75 }, description: "Seventy-five crunches. You don't stop." },
    { name: '100 Crunches', baseDifficulty: 'sjw', baseXP: 2000, baseGold: 1000, statReq: { str: 100 }, description: "A hundred crunches. Your core is legendary." },
    // Squats - reps
    { name: '10 Squats', baseDifficulty: 'easy', baseXP: 100, baseGold: 50, statReq: { str: 10 }, description: "Legs are the foundation of every hunter." },
    { name: '20 Squats', baseDifficulty: 'easy+', baseXP: 200, baseGold: 100, statReq: { str: 20 }, description: "Twenty. Feel the burn build." },
    { name: '30 Squats', baseDifficulty: 'medium', baseXP: 450, baseGold: 225, statReq: { str: 35 }, description: "Thirty. Depth and control." },
    { name: '45 Squats', baseDifficulty: 'medium+', baseXP: 600, baseGold: 300, statReq: { str: 45 }, description: "Forty-five. Your legs are iron pillars." },
    { name: '60 Squats', baseDifficulty: 'hard', baseXP: 800, baseGold: 400, statReq: { str: 60 }, description: "Sixty. Most hunters have stopped. Not you." },
    { name: '75 Squats', baseDifficulty: 'hard+', baseXP: 1000, baseGold: 500, statReq: { str: 75 }, description: "Seventy-five. Your legs carry you through dungeons." },
    { name: '100 Squats', baseDifficulty: 'sjw', baseXP: 2000, baseGold: 1000, statReq: { str: 100 }, description: "A hundred squats. The System grants its highest respect." },
    // Glute Bridges - reps
    { name: '15 Glute Bridges', baseDifficulty: 'easy', baseXP: 100, baseGold: 50, statReq: { str: 10 }, description: "Ground yourself. Build from below." },
    { name: '25 Glute Bridges', baseDifficulty: 'easy+', baseXP: 200, baseGold: 100, statReq: { str: 20 }, description: "Twenty-five. Posterior chain engaged." },
    { name: '30 Glute Bridges', baseDifficulty: 'medium', baseXP: 450, baseGold: 225, statReq: { str: 35 }, description: "Thirty. Hold at the top. Squeeze." },
    { name: '55 Glute Bridges', baseDifficulty: 'medium+', baseXP: 600, baseGold: 300, statReq: { str: 45 }, description: "Fifty-five. Your hips are a powerhouse." },
    { name: '70 Glute Bridges', baseDifficulty: 'hard', baseXP: 800, baseGold: 400, statReq: { str: 60 }, description: "Seventy. Controlled. Powerful." },
    { name: '75 Glute Bridges', baseDifficulty: 'hard+', baseXP: 1000, baseGold: 500, statReq: { str: 75 }, description: "Seventy-five. Your posterior chain is unbreakable." },
    { name: '100 Glute Bridges', baseDifficulty: 'sjw', baseXP: 2000, baseGold: 1000, statReq: { str: 100 }, description: "A hundred. The System did not think you would make it here." },
    // Wall sit - time
    { name: 'Wall sit 20s', baseDifficulty: 'easy', baseXP: 100, baseGold: 50, statReq: { str: 10 }, description: "Twenty seconds. The wall does not move. Neither do you." },
    { name: 'Wall sit 40s', baseDifficulty: 'easy+', baseXP: 200, baseGold: 100, statReq: { str: 20 }, description: "Forty seconds. Legs shaking. Hold." },
    { name: 'Wall sit 1min', baseDifficulty: 'medium', baseXP: 450, baseGold: 225, statReq: { str: 35 }, description: "One minute. Time slows under pressure. Endure." },
    { name: 'Wall sit 1m30s', baseDifficulty: 'medium+', baseXP: 600, baseGold: 300, statReq: { str: 45 }, description: "Ninety seconds. Your quads are on fire." },
    { name: 'Wall sit 2min', baseDifficulty: 'hard', baseXP: 800, baseGold: 400, statReq: { str: 60 }, description: "Two minutes. You are not allowed to stop." },
    { name: 'Wall sit 2min30s', baseDifficulty: 'hard+', baseXP: 1000, baseGold: 500, statReq: { str: 75 }, description: "Two minutes thirty seconds. The System is impressed. Don't let it show." },
    { name: 'Wall sit 3min30s', baseDifficulty: 'sjw', baseXP: 2000, baseGold: 1000, statReq: { str: 100 }, description: "Three minutes thirty seconds. Sung Jin Woo held this in a D-rank dungeon as a warm up." },
  ],
  dexterity: [
    // Short-distance runs — descriptions match distance/time in name; times kept realistic
    { name: 'Cover 100m in 1min', baseDifficulty: 'easy', baseXP: 100, baseGold: 50, statReq: { agi: 10 }, description: '100 metres in 60 seconds. A gentle start. The System waits.' },
    { name: 'Cover 200m in 1min30s', baseDifficulty: 'easy+', baseXP: 200, baseGold: 100, statReq: { agi: 20 }, description: '200 metres in 1:30. Pick up the pace without burning out.' },
    { name: 'Cover 200m in 1min', baseDifficulty: 'medium', baseXP: 450, baseGold: 225, statReq: { agi: 35 }, description: '200 metres in 60 seconds. Your legs remember the way.' },
    { name: 'Cover 300m in 2mins', baseDifficulty: 'medium+', baseXP: 600, baseGold: 300, statReq: { agi: 45 }, description: '300 metres in 2 minutes. Controlled speed over distance.' },
    { name: 'Cover 300m in 1min30s', baseDifficulty: 'hard', baseXP: 800, baseGold: 400, statReq: { agi: 60 }, description: '300 metres in 1:30. Most hunters slow down here. You do not.' },
    { name: 'Cover 400m in 2mins', baseDifficulty: 'hard+', baseXP: 1000, baseGold: 500, statReq: { agi: 75 }, description: '400 metres in 2 minutes. The dungeon exit feels closer with every stride.' },
    { name: 'Cover 500m in 2mins', baseDifficulty: 'sjw', baseXP: 2000, baseGold: 1000, statReq: { agi: 100 }, description: '500 metres in 2 minutes. Sung Jin Woo would call this a warm-up.' },
    // High Knees — n reps
    { name: '20 High Knees', baseDifficulty: 'easy', baseXP: 100, baseGold: 50, statReq: { agi: 10 }, description: "20 reps. Drive your knees up. Fast." },
    { name: '30 High Knees', baseDifficulty: 'easy+', baseXP: 200, baseGold: 100, statReq: { agi: 20 }, description: "30 reps. Your heart rate climbs." },
    { name: '50 High Knees', baseDifficulty: 'medium', baseXP: 450, baseGold: 225, statReq: { agi: 35 }, description: "50 reps. Breathe. Drive. Don't stop." },
    { name: '60 High Knees', baseDifficulty: 'medium+', baseXP: 600, baseGold: 300, statReq: { agi: 45 }, description: "60 reps. Your speed is your weapon." },
    { name: '80 High Knees', baseDifficulty: 'hard', baseXP: 800, baseGold: 400, statReq: { agi: 60 }, description: "80 reps. Pure explosive speed." },
    { name: '90 High Knees', baseDifficulty: 'hard+', baseXP: 1000, baseGold: 500, statReq: { agi: 75 }, description: "90 reps. You move like a shadow." },
    { name: '100 High Knees', baseDifficulty: 'sjw', baseXP: 2000, baseGold: 1000, statReq: { agi: 100 }, description: "100 reps. The System has never seen footwork like this." },
    // Jumping Jacks — n reps
    { name: '20 Jumping Jacks', baseDifficulty: 'easy', baseXP: 100, baseGold: 50, statReq: { agi: 10 }, description: "20 reps. Warm up. The System waits." },
    { name: '30 Jumping Jacks', baseDifficulty: 'easy+', baseXP: 200, baseGold: 100, statReq: { agi: 20 }, description: "30 reps. Arms and legs in sync." },
    { name: '50 Jumping Jacks', baseDifficulty: 'medium', baseXP: 450, baseGold: 225, statReq: { agi: 35 }, description: "50 reps. Your body is a machine." },
    { name: '60 Jumping Jacks', baseDifficulty: 'medium+', baseXP: 600, baseGold: 300, statReq: { agi: 45 }, description: "60 reps. Don't slow down." },
    { name: '80 Jumping Jacks', baseDifficulty: 'hard', baseXP: 800, baseGold: 400, statReq: { agi: 60 }, description: "80 reps. Your coordination is sharp." },
    { name: '90 Jumping Jacks', baseDifficulty: 'hard+', baseXP: 1000, baseGold: 500, statReq: { agi: 75 }, description: "90 reps. Your endurance rivals an S-rank hunter." },
    { name: '100 Jumping Jacks', baseDifficulty: 'sjw', baseXP: 2000, baseGold: 1000, statReq: { agi: 100 }, description: "100 reps. The System grants you its highest blessing." },
    // Lunges — n each leg (2n total)
    { name: '10 Lunges each leg', baseDifficulty: 'easy', baseXP: 100, baseGold: 50, statReq: { agi: 10 }, description: '10 per leg, 20 total. Balance and drive.' },
    { name: '15 Lunges each leg', baseDifficulty: 'easy+', baseXP: 200, baseGold: 100, statReq: { agi: 20 }, description: '15 per leg, 30 total. Feel the stretch.' },
    { name: '25 Lunges each leg', baseDifficulty: 'medium', baseXP: 450, baseGold: 225, statReq: { agi: 35 }, description: '25 per leg, 50 total. Your legs carry you through any terrain.' },
    { name: '30 Lunges each leg', baseDifficulty: 'medium+', baseXP: 600, baseGold: 300, statReq: { agi: 45 }, description: '30 per leg, 60 total. Keep the form tight.' },
    { name: '40 Lunges each leg', baseDifficulty: 'hard', baseXP: 800, baseGold: 400, statReq: { agi: 60 }, description: '40 per leg, 80 total. No stopping.' },
    { name: '50 Lunges each leg', baseDifficulty: 'hard+', baseXP: 1000, baseGold: 500, statReq: { agi: 75 }, description: '50 per leg, 100 total. Your legs are legendary.' },
    { name: '70 Lunges each leg', baseDifficulty: 'sjw', baseXP: 2000, baseGold: 1000, statReq: { agi: 100 }, description: '70 per leg, 140 total. The dungeon floor cracks beneath you.' },
    // Burpees — n reps
    { name: '5 Burpees', baseDifficulty: 'easy', baseXP: 100, baseGold: 50, statReq: { agi: 10 }, description: '5 burpees. The full body wakes up.' },
    { name: '10 Burpees', baseDifficulty: 'easy+', baseXP: 200, baseGold: 100, statReq: { agi: 20 }, description: '10 burpees. Down and up. Explosive.' },
    { name: '20 Burpees', baseDifficulty: 'medium', baseXP: 450, baseGold: 225, statReq: { agi: 35 }, description: '20 burpees. Most hunters tap out here.' },
    { name: '25 Burpees', baseDifficulty: 'medium+', baseXP: 600, baseGold: 300, statReq: { agi: 45 }, description: '25 burpees. Your whole body protests. Ignore it.' },
    { name: '35 Burpees', baseDifficulty: 'hard', baseXP: 800, baseGold: 400, statReq: { agi: 60 }, description: '35 burpees. You are not human anymore. Good.' },
    { name: '40 Burpees', baseDifficulty: 'hard+', baseXP: 1000, baseGold: 500, statReq: { agi: 75 }, description: '40 burpees. The penalty dungeon is easier than this.' },
    { name: '50 Burpees', baseDifficulty: 'sjw', baseXP: 2000, baseGold: 1000, statReq: { agi: 100 }, description: '50 burpees. Sung Jin Woo nods. That is all you get.' },
    // Side stepping — n reps over time
    { name: 'Side steps 20 in 1min', baseDifficulty: 'easy', baseXP: 100, baseGold: 50, statReq: { agi: 10 }, description: '20 side steps in 1 minute. Lateral movement keeps you alive.' },
    { name: 'Side steps 30 in 1min30s', baseDifficulty: 'easy+', baseXP: 200, baseGold: 100, statReq: { agi: 20 }, description: '30 side steps in 90 seconds. Stay light on your feet.' },
    { name: 'Side steps 30 in 1min', baseDifficulty: 'medium', baseXP: 450, baseGold: 225, statReq: { agi: 35 }, description: '30 side steps in 60 seconds. Your footwork is tightening.' },
    { name: 'Side steps 40 in 1min', baseDifficulty: 'medium+', baseXP: 600, baseGold: 300, statReq: { agi: 45 }, description: '40 side steps in 60 seconds. Side to side, never stopping.' },
    { name: 'Side steps 50 in 1min30s', baseDifficulty: 'hard', baseXP: 800, baseGold: 400, statReq: { agi: 60 }, description: '50 side steps in 90 seconds. Your lateral speed is unmatched.' },
    { name: 'Side steps 60 in 1min30s', baseDifficulty: 'hard+', baseXP: 1000, baseGold: 500, statReq: { agi: 75 }, description: '60 side steps in 90 seconds. You move like water.' },
    { name: 'Side steps 80 in 2mins', baseDifficulty: 'sjw', baseXP: 2000, baseGold: 1000, statReq: { agi: 100 }, description: '80 side steps in 2 minutes. The System cannot track you.' },
  ],
  vigour: [
    // Shadow boxing (freestyle)
    { name: 'Shadow boxing 2min', baseDifficulty: 'easy', baseXP: 100, baseGold: 50, statReq: { endurance: 10 }, description: "Two minutes. Strike the air. Strike yourself into shape." },
    { name: 'Shadow boxing 5min', baseDifficulty: 'easy+', baseXP: 200, baseGold: 100, statReq: { endurance: 20 }, description: "Five minutes. Jab. Cross. Move." },
    { name: 'Shadow boxing 10min', baseDifficulty: 'medium', baseXP: 450, baseGold: 225, statReq: { endurance: 35 }, description: "Ten minutes. Your form improves. The System notices." },
    { name: 'Shadow boxing 15min', baseDifficulty: 'medium+', baseXP: 600, baseGold: 300, statReq: { endurance: 45 }, description: "Fifteen minutes. You fight like a hunter." },
    { name: 'Shadow boxing 20min', baseDifficulty: 'hard', baseXP: 800, baseGold: 400, statReq: { endurance: 60 }, description: "Twenty minutes of relentless striking." },
    { name: 'Shadow boxing 30min', baseDifficulty: 'hard+', baseXP: 1000, baseGold: 500, statReq: { endurance: 75 }, description: "Thirty minutes. You have the endurance of an A-rank hunter." },
    { name: 'Shadow boxing 1hr', baseDifficulty: 'sjw', baseXP: 2000, baseGold: 1000, statReq: { endurance: 100 }, description: "An hour of shadow boxing. Monsters fear what they cannot see." },
    // Jog in place
    { name: 'Jog in place 3min', baseDifficulty: 'easy', baseXP: 100, baseGold: 50, statReq: { endurance: 10 }, description: "Three minutes. No excuses, no equipment needed." },
    { name: 'Jog in place 5min', baseDifficulty: 'easy+', baseXP: 200, baseGold: 100, statReq: { endurance: 20 }, description: "Five minutes. Your heart rate rises. Good." },
    { name: 'Jog in place 10min', baseDifficulty: 'medium', baseXP: 450, baseGold: 225, statReq: { endurance: 35 }, description: "Ten minutes. Steady pace. Don't stop." },
    { name: 'Jog in place 15min', baseDifficulty: 'medium+', baseXP: 600, baseGold: 300, statReq: { endurance: 45 }, description: "Fifteen minutes. Your stamina is building." },
    { name: 'Jog in place 20min', baseDifficulty: 'hard', baseXP: 800, baseGold: 400, statReq: { endurance: 60 }, description: "Twenty minutes. Your endurance sets you apart." },
    { name: 'Jog in place 30min', baseDifficulty: 'hard+', baseXP: 1000, baseGold: 500, statReq: { endurance: 75 }, description: "Thirty minutes. Without stopping. The System respects this." },
    { name: 'Jog in place 1hr', baseDifficulty: 'sjw', baseXP: 2000, baseGold: 1000, statReq: { endurance: 100 }, description: "An hour. In place. Sung Jin Woo calls this a rest day." },
    // Plank
    { name: 'Plank 20s', baseDifficulty: 'easy', baseXP: 100, baseGold: 50, statReq: { endurance: 10 }, description: "Twenty seconds. Hold. Breathe. Don't shake." },
    { name: 'Plank 45s', baseDifficulty: 'easy+', baseXP: 200, baseGold: 100, statReq: { endurance: 20 }, description: "Forty-five seconds. Core tight. Eyes forward." },
    { name: 'Plank 1min', baseDifficulty: 'medium', baseXP: 450, baseGold: 225, statReq: { endurance: 35 }, description: "One full minute. The wall does not care about your feelings." },
    { name: 'Plank 2min', baseDifficulty: 'medium+', baseXP: 600, baseGold: 300, statReq: { endurance: 45 }, description: "Two minutes. Time is your enemy. Defeat it." },
    { name: 'Plank 3min', baseDifficulty: 'hard', baseXP: 800, baseGold: 400, statReq: { endurance: 60 }, description: "Three minutes. Your core is a fortress." },
    { name: 'Plank 5min', baseDifficulty: 'hard+', baseXP: 1000, baseGold: 500, statReq: { endurance: 75 }, description: "Five minutes. You have broken lesser hunters with this alone." },
    { name: 'Plank 10min', baseDifficulty: 'sjw', baseXP: 2000, baseGold: 1000, statReq: { endurance: 100 }, description: "Ten minutes. The System itself cannot hold a plank this long." },
    // Mountain Climbers
    { name: '10 Mountain Climbers', baseDifficulty: 'easy', baseXP: 100, baseGold: 50, statReq: { endurance: 10 }, description: "Ten. Drive your knees. Climb." },
    { name: '20 Mountain Climbers', baseDifficulty: 'easy+', baseXP: 200, baseGold: 100, statReq: { endurance: 20 }, description: "Twenty. The mountain does not wait for you." },
    { name: '30 Mountain Climbers', baseDifficulty: 'medium', baseXP: 450, baseGold: 225, statReq: { endurance: 35 }, description: "Thirty. Sweat. Breathe. Push." },
    { name: '50 Mountain Climbers', baseDifficulty: 'medium+', baseXP: 600, baseGold: 300, statReq: { endurance: 45 }, description: "Fifty. The summit is within reach." },
    { name: '75 Mountain Climbers', baseDifficulty: 'hard', baseXP: 800, baseGold: 400, statReq: { endurance: 60 }, description: "Seventy-five. You are the mountain now." },
    { name: '100 Mountain Climbers', baseDifficulty: 'hard+', baseXP: 1000, baseGold: 500, statReq: { endurance: 75 }, description: "A hundred. No peak is too high for you." },
    { name: '150 Mountain Climbers', baseDifficulty: 'sjw', baseXP: 2000, baseGold: 1000, statReq: { endurance: 100 }, description: "A hundred and fifty mountain climbers. The S-rank gate opens." },
    // Jumping Jacks
    { name: 'Jumping jacks 2min', baseDifficulty: 'easy', baseXP: 100, baseGold: 50, statReq: { endurance: 10 }, description: "Two minutes of continuous movement." },
    { name: 'Jumping jacks 4min', baseDifficulty: 'easy+', baseXP: 200, baseGold: 100, statReq: { endurance: 20 }, description: "Four minutes. No pausing." },
    { name: 'Jumping jacks 6min', baseDifficulty: 'medium', baseXP: 450, baseGold: 225, statReq: { endurance: 35 }, description: "Six minutes straight. Your endurance is tested." },
    { name: 'Jumping jacks 8min', baseDifficulty: 'medium+', baseXP: 600, baseGold: 300, statReq: { endurance: 45 }, description: "Eight minutes. The burn is real." },
    { name: 'Jumping jacks 10min', baseDifficulty: 'hard', baseXP: 800, baseGold: 400, statReq: { endurance: 60 }, description: "Ten straight minutes. You are built different." },
    { name: 'Jumping jacks 15min', baseDifficulty: 'hard+', baseXP: 1000, baseGold: 500, statReq: { endurance: 75 }, description: "Fifteen minutes. No breaks. The System is stunned." },
    { name: 'Jumping jacks 20min', baseDifficulty: 'sjw', baseXP: 2000, baseGold: 1000, statReq: { endurance: 100 }, description: "Twenty unbroken minutes. You have ascended." },
    // High Knees
    { name: 'High knees 2min', baseDifficulty: 'easy', baseXP: 100, baseGold: 50, statReq: { endurance: 10 }, description: "Two minutes. Drive those knees." },
    { name: 'High knees 4min', baseDifficulty: 'easy+', baseXP: 200, baseGold: 100, statReq: { endurance: 20 }, description: "Four minutes. Pace yourself. Then go harder." },
    { name: 'High knees 6min', baseDifficulty: 'medium', baseXP: 450, baseGold: 225, statReq: { endurance: 35 }, description: "Six minutes. Your legs burn. Good." },
    { name: 'High knees 8min', baseDifficulty: 'medium+', baseXP: 600, baseGold: 300, statReq: { endurance: 45 }, description: "Eight minutes. No slowing down." },
    { name: 'High knees 10min', baseDifficulty: 'hard', baseXP: 800, baseGold: 400, statReq: { endurance: 60 }, description: "Ten minutes. Your cardio is elite." },
    { name: 'High knees 15min', baseDifficulty: 'hard+', baseXP: 1000, baseGold: 500, statReq: { endurance: 75 }, description: "Fifteen minutes. Dungeons have shorter gauntlets than this." },
    { name: 'High knees 20min', baseDifficulty: 'sjw', baseXP: 2000, baseGold: 1000, statReq: { endurance: 100 }, description: "Twenty minutes. The System has run out of words." },
  ],
  intelligence: [
    // Learn facts
    { name: 'Learn 1 new fact', baseDifficulty: 'easy', baseXP: 100, baseGold: 50, statReq: { int: 10 }, description: "One fact. Write it down. Knowledge is power." },
    { name: 'Learn 3 new facts', baseDifficulty: 'easy+', baseXP: 200, baseGold: 100, statReq: { int: 20 }, description: "Three facts. The System rewards the curious." },
    { name: 'Learn 5 new facts', baseDifficulty: 'medium', baseXP: 450, baseGold: 225, statReq: { int: 35 }, description: "Five facts. Your mind expands with each one." },
    { name: 'Learn 8 new facts', baseDifficulty: 'medium+', baseXP: 600, baseGold: 300, statReq: { int: 45 }, description: "Eight. Write them, remember them, own them." },
    { name: 'Learn 10 new facts', baseDifficulty: 'hard', baseXP: 800, baseGold: 400, statReq: { int: 60 }, description: "Ten new facts. Your mind is a dungeon others cannot map." },
    { name: 'Learn 15 new facts', baseDifficulty: 'hard+', baseXP: 1000, baseGold: 500, statReq: { int: 75 }, description: "Fifteen. Your knowledge accumulates like XP." },
    { name: 'Learn 20 new facts', baseDifficulty: 'sjw', baseXP: 2000, baseGold: 1000, statReq: { int: 100 }, description: "Twenty facts. You absorb knowledge like Sung Jin Woo absorbs dungeon drops." },
    // Deep study
    { name: 'Deep study 20min', baseDifficulty: 'easy', baseXP: 100, baseGold: 50, statReq: { int: 10 }, description: "Twenty minutes. No distractions. Just you and the knowledge." },
    { name: 'Deep study 40min', baseDifficulty: 'easy+', baseXP: 200, baseGold: 100, statReq: { int: 20 }, description: "Forty minutes. The System rewards focus." },
    { name: 'Deep study 1hr', baseDifficulty: 'medium', baseXP: 450, baseGold: 225, statReq: { int: 35 }, description: "One hour of pure focus. Your INT is growing." },
    { name: 'Deep study 1.5hr', baseDifficulty: 'medium+', baseXP: 600, baseGold: 300, statReq: { int: 45 }, description: "An hour and a half. Your concentration is a weapon." },
    { name: 'Deep study 2hr', baseDifficulty: 'hard', baseXP: 800, baseGold: 400, statReq: { int: 60 }, description: "Two hours. Deep in the zone. Nothing can break you." },
    { name: 'Deep study 3hr', baseDifficulty: 'hard+', baseXP: 1000, baseGold: 500, statReq: { int: 75 }, description: "Three hours. Your mind operates on a different plane." },
    { name: 'Deep study 4hr', baseDifficulty: 'sjw', baseXP: 2000, baseGold: 1000, statReq: { int: 100 }, description: "Four hours of unbroken study. The System grants you Mage-tier intellect." },
    // Solve Daily Puzzles
    { name: 'Solve 1 daily puzzle', baseDifficulty: 'easy', baseXP: 100, baseGold: 50, statReq: { int: 10 }, description: "One puzzle. Wordle, Sudoku, chess — pick your weapon." },
    { name: 'Solve 2 daily puzzles', baseDifficulty: 'easy+', baseXP: 200, baseGold: 100, statReq: { int: 20 }, description: "Two puzzles. Your mind sharpens with every solution." },
    { name: 'Solve 3 daily puzzles', baseDifficulty: 'medium', baseXP: 450, baseGold: 225, statReq: { int: 35 }, description: "Three. Logic, pattern, solution. Repeat." },
    { name: 'Solve 4 daily puzzles', baseDifficulty: 'medium+', baseXP: 600, baseGold: 300, statReq: { int: 45 }, description: "Four puzzles. Your INT rivals a Caster's." },
    { name: 'Solve 5 daily puzzles', baseDifficulty: 'hard', baseXP: 800, baseGold: 400, statReq: { int: 60 }, description: "Five. You see patterns where others see chaos." },
    { name: 'Solve 6 daily puzzles', baseDifficulty: 'hard+', baseXP: 1000, baseGold: 500, statReq: { int: 75 }, description: "Six puzzles in one day. Your mind is a dungeon in itself." },
    { name: 'Solve 7 daily puzzles', baseDifficulty: 'sjw', baseXP: 2000, baseGold: 1000, statReq: { int: 100 }, description: "Seven. Every puzzle is child's play to a Grand Mage." },
    // Writing/Diary
    { name: 'Write 5 sentences', baseDifficulty: 'easy', baseXP: 100, baseGold: 50, statReq: { int: 10 }, description: "Five sentences. Record today. The System remembers everything." },
    { name: 'Write 10 sentences', baseDifficulty: 'easy+', baseXP: 200, baseGold: 100, statReq: { int: 20 }, description: "Ten sentences. Your thoughts become clarity." },
    { name: 'Write 1 full page', baseDifficulty: 'medium', baseXP: 450, baseGold: 225, statReq: { int: 35 }, description: "One page. Reflect. Process. Grow." },
    { name: 'Write 2 full pages', baseDifficulty: 'medium+', baseXP: 600, baseGold: 300, statReq: { int: 45 }, description: "Two pages. Your mind runs deeper than most." },
    { name: 'Write 3 full pages', baseDifficulty: 'hard', baseXP: 800, baseGold: 400, statReq: { int: 60 }, description: "Three pages. You think on a level most hunters cannot reach." },
    { name: 'Write 5 full pages', baseDifficulty: 'hard+', baseXP: 1000, baseGold: 500, statReq: { int: 75 }, description: "Five pages of thought. Your mind is S-rank." },
    { name: 'Write 10 full pages', baseDifficulty: 'sjw', baseXP: 2000, baseGold: 1000, statReq: { int: 100 }, description: "Ten pages. You have written enough to fill a dungeon archive." },
    // Being productive objectively
    { name: 'Create something for 15min', baseDifficulty: 'easy', baseXP: 100, baseGold: 50, statReq: { int: 10 }, description: "Fifteen minutes. Draw, design, build, write. Create." },
    { name: 'Create something for 30min', baseDifficulty: 'easy+', baseXP: 200, baseGold: 100, statReq: { int: 20 }, description: "Thirty minutes. Your creation takes shape." },
    { name: 'Create something for 1hr', baseDifficulty: 'medium', baseXP: 450, baseGold: 225, statReq: { int: 35 }, description: "One hour. You are building something real." },
    { name: 'Create something for 1.5hr', baseDifficulty: 'medium+', baseXP: 600, baseGold: 300, statReq: { int: 45 }, description: "An hour and a half of pure creation." },
    { name: 'Create something for 2hr', baseDifficulty: 'hard', baseXP: 800, baseGold: 400, statReq: { int: 60 }, description: "Two hours. The System is watching your work." },
    { name: 'Create something for 3hr', baseDifficulty: 'hard+', baseXP: 1000, baseGold: 500, statReq: { int: 75 }, description: "Three hours of creation. You are beyond a craftsman." },
    { name: 'Complete a full project', baseDifficulty: 'sjw', baseXP: 2000, baseGold: 1000, statReq: { int: 100 }, description: "Start and finish something entirely today. Sung Jin Woo built an army. What will you build?" },
    // uhm.. conversations?
    { name: 'Reply to 3 messages meaningfully', baseDifficulty: 'easy', baseXP: 100, baseGold: 50, statReq: { int: 10 }, description: "Three thoughtful replies. Connection is a skill." },
    { name: 'Write a proper email', baseDifficulty: 'easy+', baseXP: 200, baseGold: 100, statReq: { int: 20 }, description: "Write an email that matters. Clear, concise, effective." },
    { name: 'Have a 15min meaningful conversation', baseDifficulty: 'medium', baseXP: 450, baseGold: 225, statReq: { int: 35 }, description: "Fifteen minutes of real conversation. Listen as much as you speak." },
    { name: 'Have a 30min conversation', baseDifficulty: 'medium+', baseXP: 600, baseGold: 300, statReq: { int: 45 }, description: "Thirty minutes. Your communication is a weapon of its own." },
    { name: 'Teach someone something today', baseDifficulty: 'hard', baseXP: 800, baseGold: 400, statReq: { int: 60 }, description: "To teach is to master. Share what you know." },
    { name: 'Give a full presentation or explanation', baseDifficulty: 'hard+', baseXP: 1000, baseGold: 500, statReq: { int: 75 }, description: "Present your knowledge clearly and confidently." },
    { name: 'Mentor or lead a discussion today', baseDifficulty: 'sjw', baseXP: 2000, baseGold: 1000, statReq: { int: 100 }, description: "Sung Jin Woo commands armies. You command a conversation." },
  ],
  health: [
    // Stretch/Yoga
    { name: 'Stretch for 5min', baseDifficulty: 'easy', baseXP: 100, baseGold: 50, statReq: { vit: 10 }, description: "Five minutes. Your body thanks you." },
    { name: 'Stretch for 10min', baseDifficulty: 'easy+', baseXP: 200, baseGold: 100, statReq: { vit: 20 }, description: "Ten minutes. Flexibility is a form of strength." },
    { name: 'Yoga for 20min', baseDifficulty: 'medium', baseXP: 450, baseGold: 225, statReq: { vit: 35 }, description: "Twenty minutes. Flow, breathe, recover." },
    { name: 'Yoga for 30min', baseDifficulty: 'medium+', baseXP: 600, baseGold: 300, statReq: { vit: 45 }, description: "Thirty minutes. Your body moves like water." },
    { name: 'Yoga for 45min', baseDifficulty: 'hard', baseXP: 800, baseGold: 400, statReq: { vit: 60 }, description: "Forty-five minutes. Mind and body in perfect sync." },
    { name: 'Yoga for 1hr', baseDifficulty: 'hard+', baseXP: 1000, baseGold: 500, statReq: { vit: 75 }, description: "One hour of yoga. Your recovery is legendary." },
    { name: 'Yoga for 1.5hr', baseDifficulty: 'sjw', baseXP: 2000, baseGold: 1000, statReq: { vit: 100 }, description: "Ninety minutes. Even the System needs to stretch." },
    // Sleeping
    { name: 'Sleep 6 hours', baseDifficulty: 'easy', baseXP: 100, baseGold: 50, statReq: { vit: 10 }, description: "Six hours. The minimum. The System accepts this, barely." },
    { name: 'Sleep 6.5 hours', baseDifficulty: 'easy+', baseXP: 200, baseGold: 100, statReq: { vit: 20 }, description: "Six and a half. Better. Your body recovers while you sleep." },
    { name: 'Sleep 7 hours', baseDifficulty: 'medium', baseXP: 450, baseGold: 225, statReq: { vit: 35 }, description: "Seven hours. A proper hunter's rest." },
    { name: 'Sleep 7.5 hours', baseDifficulty: 'medium+', baseXP: 600, baseGold: 300, statReq: { vit: 45 }, description: "Seven and a half. Your HP regenerates fully." },
    { name: 'Sleep 8 hours', baseDifficulty: 'hard', baseXP: 800, baseGold: 400, statReq: { vit: 60 }, description: "Eight hours. The gold standard. Rare in this world." },
    { name: 'Sleep 8.5 hours', baseDifficulty: 'hard+', baseXP: 1000, baseGold: 500, statReq: { vit: 75 }, description: "Eight and a half. Your VIT grows while you dream." },
    { name: 'Sleep 9 hours', baseDifficulty: 'sjw', baseXP: 2000, baseGold: 1000, statReq: { vit: 100 }, description: "Nine hours. The System grants full VIT regeneration. Rise, Hunter." },
    // Hygiene
    { name: 'Morning hygiene routine', baseDifficulty: 'easy', baseXP: 100, baseGold: 50, statReq: { vit: 10 }, description: "Shower and brush teeth. The baseline. Honor yourself." },
    { name: 'Morning and night hygiene routine', baseDifficulty: 'easy+', baseXP: 200, baseGold: 100, statReq: { vit: 20 }, description: "Twice a day. The System respects consistency." },
    { name: 'Full hygiene + floss', baseDifficulty: 'medium', baseXP: 450, baseGold: 225, statReq: { vit: 35 }, description: "Add flossing. Your future self will thank you." },
    { name: 'Full hygiene + floss + skincare', baseDifficulty: 'medium+', baseXP: 600, baseGold: 300, statReq: { vit: 45 }, description: "Complete routine. A hunter who looks after themselves lasts longer." },
    { name: 'Complete hygiene routine twice + cold shower', baseDifficulty: 'hard', baseXP: 800, baseGold: 400, statReq: { vit: 60 }, description: "Cold shower included. Your discipline is unmatched." },
    { name: 'Perfect hygiene day', baseDifficulty: 'hard+', baseXP: 1000, baseGold: 500, statReq: { vit: 75 }, description: "Every routine, every step, every product. Perfection." },
    { name: 'Perfect hygiene day + grooming', baseDifficulty: 'sjw', baseXP: 2000, baseGold: 1000, statReq: { vit: 100 }, description: "The complete hunter. Sung Jin Woo was always well-dressed for a reason." },
    // Meals
    { name: 'Eat 1 proper meal', baseDifficulty: 'easy', baseXP: 100, baseGold: 50, statReq: { vit: 10 }, description: "One meal. Real food. Your body needs fuel." },
    { name: 'Eat 2 proper meals', baseDifficulty: 'easy+', baseXP: 200, baseGold: 100, statReq: { vit: 20 }, description: "Two meals. Consistent fueling. The System notices." },
    { name: 'Eat 3 proper meals', baseDifficulty: 'medium', baseXP: 450, baseGold: 225, statReq: { vit: 35 }, description: "Three full meals. Breakfast, lunch, dinner. No skipping." },
    { name: 'Eat 3 meals with no junk food', baseDifficulty: 'medium+', baseXP: 600, baseGold: 300, statReq: { vit: 45 }, description: "Three meals, zero junk. Discipline in every bite." },
    { name: 'Eat 3 clean meals + no sugar', baseDifficulty: 'hard', baseXP: 800, baseGold: 400, statReq: { vit: 60 }, description: "Clean eating all day. Your body is a temple." },
    { name: 'Meal prep for tomorrow', baseDifficulty: 'hard+', baseXP: 1000, baseGold: 500, statReq: { vit: 75 }, description: "You plan ahead. A hunter who prepares, survives." },
    { name: 'Full clean eating day — no junk, no sugar, no alcohol', baseDifficulty: 'sjw', baseXP: 2000, baseGold: 1000, statReq: { vit: 100 }, description: "A perfect nutrition day. Sung Jin Woo ate like this to maintain S-rank." },
    // Water intake
    { name: 'Drink 500ml water', baseDifficulty: 'easy', baseXP: 100, baseGold: 50, statReq: { vit: 10 }, description: "Five hundred milliliters. Start somewhere." },
    { name: 'Drink 750ml water', baseDifficulty: 'easy+', baseXP: 200, baseGold: 100, statReq: { vit: 20 }, description: "Three quarters of a liter. Your cells are grateful." },
    { name: 'Drink 1L water', baseDifficulty: 'medium', baseXP: 450, baseGold: 225, statReq: { vit: 35 }, description: "A full liter. The System's recommended daily minimum." },
    { name: 'Drink 1.5L water', baseDifficulty: 'medium+', baseXP: 600, baseGold: 300, statReq: { vit: 45 }, description: "One and a half liters. Your HP recovery rate increases." },
    { name: 'Drink 2L water', baseDifficulty: 'hard', baseXP: 800, baseGold: 400, statReq: { vit: 60 }, description: "Two liters. A well-hydrated hunter is a dangerous hunter." },
    { name: 'Drink 2.5L water', baseDifficulty: 'hard+', baseXP: 1000, baseGold: 500, statReq: { vit: 75 }, description: "Two and a half liters. Your VIT stat is visibly increasing." },
    { name: 'Drink 3L water', baseDifficulty: 'sjw', baseXP: 2000, baseGold: 1000, statReq: { vit: 100 }, description: "Three liters. You are a walking hydration deity." },
    // Sunlight
    { name: 'Get sunlight for 5min', baseDifficulty: 'easy', baseXP: 100, baseGold: 50, statReq: { vit: 10 }, description: "Five minutes of sunlight. Even hunters need Vitamin D." },
    { name: 'Get sunlight for 10min', baseDifficulty: 'easy+', baseXP: 200, baseGold: 100, statReq: { vit: 20 }, description: "Ten minutes outside. The world beyond your screen exists." },
    { name: 'Get sunlight for 15min', baseDifficulty: 'medium', baseXP: 450, baseGold: 225, statReq: { vit: 35 }, description: "Fifteen minutes of natural light. Your mood lifts. Your stats too." },
    { name: 'Get sunlight for 20min', baseDifficulty: 'medium+', baseXP: 600, baseGold: 300, statReq: { vit: 45 }, description: "Twenty minutes. The System approves of the outdoors." },
    { name: 'Get sunlight for 30min', baseDifficulty: 'hard', baseXP: 800, baseGold: 400, statReq: { vit: 60 }, description: "Thirty minutes of sun. You are not a dungeon creature." },
    { name: 'Get sunlight for 45min', baseDifficulty: 'hard+', baseXP: 1000, baseGold: 500, statReq: { vit: 75 }, description: "Forty-five minutes. The world outside strengthens you." },
    { name: 'Get sunlight for 1hr', baseDifficulty: 'sjw', baseXP: 2000, baseGold: 1000, statReq: { vit: 100 }, description: "One hour of sunlight. Even the Shadow Monarch needed to see the sun sometimes." },
    // Meditate/No distractions
    { name: 'Meditate for 5min', baseDifficulty: 'easy', baseXP: 100, baseGold: 50, statReq: { vit: 10 }, description: "Five minutes. Breathe. Clear the noise." },
    { name: 'Meditate for 10min', baseDifficulty: 'easy+', baseXP: 200, baseGold: 100, statReq: { vit: 20 }, description: "Ten minutes of silence. The System speaks to those who listen." },
    { name: 'Meditate for 15min', baseDifficulty: 'medium', baseXP: 450, baseGold: 225, statReq: { vit: 35 }, description: "Fifteen minutes. Your mind becomes a still lake." },
    { name: 'Meditate for 20min', baseDifficulty: 'medium+', baseXP: 600, baseGold: 300, statReq: { vit: 45 }, description: "Twenty minutes. Focus sharpens. Noise disappears." },
    { name: 'Meditate for 30min', baseDifficulty: 'hard', baseXP: 800, baseGold: 400, statReq: { vit: 60 }, description: "Thirty minutes of pure stillness. Rare in this world." },
    { name: 'Meditate for 45min', baseDifficulty: 'hard+', baseXP: 1000, baseGold: 500, statReq: { vit: 75 }, description: "Forty-five minutes. Your mind operates beyond the physical." },
    { name: 'Meditate for 1hr', baseDifficulty: 'sjw', baseXP: 2000, baseGold: 1000, statReq: { vit: 100 }, description: "One hour of meditation. The System bows to your mental fortitude." },
  ],
};

/** Stat thresholds for quest unlock notifications (value = stat total including base 10). 7-tier. */
export const STAT_THRESHOLDS: Record<
  string,
  { value: number; message: string; quests: string[] }[]
> = {
  str: [
    {
      value: 20,
      message: 'Physical quests upgraded — harder variations now available',
      quests: ['15 Push-ups', '15 Sit-ups', '20 Incline Push-ups', '20 Crunches', '20 Squats', '25 Glute Bridges', 'Wall sit 40s'],
    },
    {
      value: 35,
      message: 'Medium Physical quests unlocked',
      quests: ['30 Push-ups', '30 Sit-ups', '35 Incline Push-ups', '30 Crunches', '30 Squats', '30 Glute Bridges', 'Wall sit 1min'],
    },
    {
      value: 45,
      message: 'Medium+ Physical quests unlocked',
      quests: ['40 Push-ups', '40 Sit-ups', '45 Incline Push-ups', '40 Crunches', '45 Squats', '55 Glute Bridges', 'Wall sit 1m30s'],
    },
    {
      value: 60,
      message: 'Hard Physical quests unlocked',
      quests: ['60 Push-ups', '60 Sit-ups', '65 Incline Push-ups', '50 Crunches', '60 Squats', '70 Glute Bridges', 'Wall sit 2min'],
    },
    {
      value: 75,
      message: 'Hard+ Physical quests unlocked',
      quests: ['75 Push-ups', '75 Sit-ups', '80 Incline Push-ups', '75 Crunches', '75 Squats', '75 Glute Bridges', 'Wall sit 2min30s'],
    },
    {
      value: 100,
      message: 'SUNG JIN WOO tier unlocked. The System acknowledges your power.',
      quests: ['100 Push-ups', '100 Sit-ups', '100 Incline Push-ups', '100 Crunches', '100 Squats', '100 Glute Bridges', 'Wall sit 3min30s'],
    },
  ],
  agi: [
    {
      value: 20,
      message: 'Dexterity quests upgraded',
      quests: ['Cover 200m in 1min30s', '30 High Knees', '30 Jumping Jacks', '20 Lunges each leg', '10 Burpees', 'Side steps 30 in 1min30s'],
    },
    {
      value: 35,
      message: 'Medium Dexterity quests unlocked',
      quests: ['Cover 200m in 1min', '50 High Knees', '50 Jumping Jacks', '25 Lunges each leg', '20 Burpees', 'Side steps 30 in 1min'],
    },
    {
      value: 45,
      message: 'Medium+ Dexterity quests unlocked',
      quests: ['Cover 300m in 2mins', '60 High Knees', '60 Jumping Jacks', '30 Lunges each leg', '25 Burpees', 'Side steps 40 in 1min'],
    },
    {
      value: 60,
      message: 'Hard Dexterity quests unlocked',
      quests: ['Cover 300m in 1min30s', '80 High Knees', '80 Jumping Jacks', '40 Lunges each leg', '35 Burpees', 'Side steps 50 in 1min30s'],
    },
    {
      value: 75,
      message: 'Hard+ Dexterity quests unlocked',
      quests: ['Cover 400m in 2mins', '90 High Knees', '90 Jumping Jacks', '50 Lunges each leg', '40 Burpees', 'Side steps 60 in 1min30s'],
    },
    {
      value: 100,
      message: 'SUNG JIN WOO tier unlocked. Speed beyond human limits.',
      quests: ['Cover 500m in 2mins', '100 High Knees', '100 Jumping Jacks', '70 Lunges each leg', '50 Burpees', 'Side steps 80 in 2mins'],
    },
  ],
  endurance: [
    { value: 20, message: 'Vigour quests upgraded', quests: ['Shadow boxing 5min', 'Jog in place 5min', 'Plank 45s', '20 Mountain Climbers', 'Jumping jacks 4min', 'High knees 4min'] },
    { value: 35, message: 'Medium Vigour quests unlocked', quests: ['Shadow boxing 10min', 'Jog in place 10min', 'Plank 1min', '30 Mountain Climbers', 'Jumping jacks 6min', 'High knees 6min'] },
    { value: 45, message: 'Medium+ Vigour quests unlocked', quests: ['Shadow boxing 15min', 'Jog in place 15min', 'Plank 2min', '50 Mountain Climbers', 'Jumping jacks 8min', 'High knees 8min'] },
    { value: 60, message: 'Hard Vigour quests unlocked', quests: ['Shadow boxing 20min', 'Jog in place 20min', 'Plank 3min', '75 Mountain Climbers', 'Jumping jacks 10min', 'High knees 10min'] },
    { value: 75, message: 'Hard+ Vigour quests unlocked', quests: ['Shadow boxing 30min', 'Jog in place 30min', 'Plank 5min', '100 Mountain Climbers', 'Jumping jacks 15min', 'High knees 15min'] },
    { value: 100, message: 'SUNG JIN WOO tier unlocked. Your endurance has no ceiling.', quests: ['Shadow boxing 1hr', 'Jog in place 1hr', 'Plank 10min', '150 Mountain Climbers', 'Jumping jacks 20min', 'High knees 20min'] },
  ],
  int: [
    { value: 20, message: 'Mental quests upgraded', quests: ['Learn 3 new facts', 'Deep study 40min', 'Solve 2 daily puzzles', 'Write 10 sentences', 'Create something for 30min', 'Write a proper email'] },
    { value: 35, message: 'Medium Mental quests unlocked', quests: ['Learn 5 new facts', 'Deep study 1hr', 'Solve 3 daily puzzles', 'Write 1 full page', 'Create something for 1hr', 'Have a 15min meaningful conversation'] },
    { value: 45, message: 'Medium+ Mental quests unlocked', quests: ['Learn 8 new facts', 'Deep study 1.5hr', 'Solve 4 daily puzzles', 'Write 2 full pages', 'Create something for 1.5hr', 'Have a 30min conversation'] },
    { value: 60, message: 'Hard Mental quests unlocked', quests: ['Learn 10 new facts', 'Deep study 2hr', 'Solve 5 daily puzzles', 'Write 3 full pages', 'Create something for 2hr', 'Teach someone something today'] },
    { value: 75, message: 'Hard+ Mental quests unlocked', quests: ['Learn 15 new facts', 'Deep study 3hr', 'Solve 6 daily puzzles', 'Write 5 full pages', 'Create something for 3hr', 'Give a full presentation or explanation'] },
    { value: 100, message: 'SUNG JIN WOO tier unlocked. Your intellect reshapes reality.', quests: ['Learn 20 new facts', 'Deep study 4hr', 'Solve 7 daily puzzles', 'Write 10 full pages', 'Complete a full project', 'Mentor or lead a discussion today'] },
  ],
  vit: [
    { value: 20, message: 'Health quests upgraded', quests: ['Stretch for 10min', 'Sleep 6.5 hours', 'Morning and night hygiene routine', 'Eat 2 proper meals', 'Drink 750ml water', 'Get sunlight for 10min', 'Meditate for 10min'] },
    { value: 35, message: 'Medium Health quests unlocked', quests: ['Yoga for 20min', 'Sleep 7 hours', 'Full hygiene + floss', 'Eat 3 proper meals', 'Drink 1L water', 'Get sunlight for 15min', 'Meditate for 15min'] },
    { value: 45, message: 'Medium+ Health quests unlocked', quests: ['Yoga for 30min', 'Sleep 7.5 hours', 'Full hygiene + floss + skincare', 'Eat 3 meals with no junk food', 'Drink 1.5L water', 'Get sunlight for 20min', 'Meditate for 20min'] },
    { value: 60, message: 'Hard Health quests unlocked', quests: ['Yoga for 45min', 'Sleep 8 hours', 'Complete hygiene routine twice + cold shower', 'Eat 3 clean meals + no sugar', 'Drink 2L water', 'Get sunlight for 30min', 'Meditate for 30min'] },
    { value: 75, message: 'Hard+ Health quests unlocked', quests: ['Yoga for 1hr', 'Sleep 8.5 hours', 'Perfect hygiene day', 'Meal prep for tomorrow', 'Drink 2.5L water', 'Get sunlight for 45min', 'Meditate for 45min'] },
    { value: 100, message: 'SUNG JIN WOO tier unlocked. Your body is a perfectly maintained weapon.', quests: ['Yoga for 1.5hr', 'Sleep 9 hours', 'Perfect hygiene day + grooming', 'Full clean eating day', 'Drink 3L water', 'Get sunlight for 1hr', 'Meditate for 1hr'] },
  ],
};

/** Category display config for labels and pill colors. */
export const CATEGORY_CONFIG: Record<
  keyof typeof DAILY_QUEST_POOL | 'class' | 'custom',
  { label: string; color: string | null; stat: string | null }
> = {
  strength: { label: 'PHYSICAL', color: '#DC2626', stat: 'str' },
  dexterity: { label: 'DEXTERITY', color: '#F97316', stat: 'agi' },
  intelligence: { label: 'MENTAL', color: '#7C3AED', stat: 'int' },
  vigour: { label: 'VIGOUR', color: '#2563EB', stat: 'endurance' },
  health: { label: 'HEALTH', color: '#16A34A', stat: 'vit' },
  class: { label: 'CLASS', color: null, stat: null },
  custom: { label: 'CUSTOM', color: '#F59E0B', stat: null },
};

type ClassSpecialEntry = {
  name: string;
  description: string;
  xp_reward: number;
  gold_reward: number;
};

/** Class special quests — multiple per class; one randomly selected per day. Fixed rewards, no scaling. */
export const CLASS_SPECIAL_QUEST_POOL: Record<PlayerClass, ClassSpecialEntry[]> = {
  unclassed: [],
  assassin: [
    { name: 'Shadow Protocol', description: 'Complete a task before 7AM without telling anyone. Operate in the dark.', xp_reward: 150, gold_reward: 75 },
    { name: 'Ghost Run', description: 'Go for a run without your phone. No music, no tracking. You are unseen.', xp_reward: 150, gold_reward: 75 },
    { name: 'Silent Hour', description: 'Complete one full hour of work in total silence. Discipline of the shadow.', xp_reward: 150, gold_reward: 75 },
  ],
  fighter_speed: [
    { name: 'The All-Rounder', description: 'Complete one physical, mental, and maintenance quest all before noon. Versatility is strength.', xp_reward: 150, gold_reward: 75 },
    { name: 'Speed Blitz', description: 'Complete all daily quests within a 3 hour window. Speed is the weapon.', xp_reward: 150, gold_reward: 75 },
    { name: 'Rapid Fire', description: 'Do 3 different physical activities today, no repeats. Variety sharpens the blade.', xp_reward: 150, gold_reward: 75 },
  ],
  fighter_brute: [
    { name: 'Iron Oath', description: 'Even on your break day, complete at least one physical task. The strong never fully rest.', xp_reward: 150, gold_reward: 75 },
    { name: 'The Grind', description: 'Do your hardest physical quest twice today. Double the pain, double the gain.', xp_reward: 150, gold_reward: 75 },
    { name: 'No Days Off', description: 'Complete every physical quest today with no rest between sets. No mercy.', xp_reward: 150, gold_reward: 75 },
  ],
  tank: [
    { name: 'Immovable Object', description: 'Hold a wall sit for 2 minutes or complete 3 sets of slow controlled reps. Unbreakable.', xp_reward: 150, gold_reward: 75 },
    { name: 'Last Stand', description: 'Do your hardest endurance task even if you feel like stopping. The wall does not yield.', xp_reward: 150, gold_reward: 75 },
    { name: 'Shield Wall', description: 'Help someone else complete their goal today. A tank protects the party.', xp_reward: 150, gold_reward: 75 },
  ],
  caster: [
    { name: 'Overclock', description: 'Complete your mental quest AND spend 15 mins helping someone else with a problem. Share the power.', xp_reward: 150, gold_reward: 75 },
    { name: 'Mana Surge', description: 'Study or learn for 2 uninterrupted hours today. Fill the reservoir.', xp_reward: 150, gold_reward: 75 },
    { name: 'Chain Cast', description: 'Complete 3 mental tasks back to back with no breaks. Sustain the focus.', xp_reward: 150, gold_reward: 75 },
  ],
  mage: [
    { name: 'Arcane Study', description: 'Spend 45 uninterrupted minutes learning something completely new today. Forbidden knowledge calls.', xp_reward: 150, gold_reward: 75 },
    { name: 'Forbidden Knowledge', description: 'Read or study something outside your comfort zone for 1 hour. Expand the limits.', xp_reward: 150, gold_reward: 75 },
    { name: 'Grand Ritual', description: 'Complete all mental and maintenance quests today without skipping any. The full ritual.', xp_reward: 150, gold_reward: 75 },
  ],
};

export type QuestConfigLookup = {
  description: string;
  baseDifficulty: string;
  statReq?: Partial<Record<'str' | 'agi' | 'int' | 'vit' | 'endurance', number>>;
};

/** Find quest by name in DAILY_QUEST_POOL or CLASS_SPECIAL_QUEST_POOL for render-time description/difficulty/statReq. */
export function findQuestConfigByName(name: string): QuestConfigLookup | null {
  for (const pool of Object.values(DAILY_QUEST_POOL)) {
    const found = pool.find((q) => q.name === name);
    if (found) return { description: found.description, baseDifficulty: found.baseDifficulty, statReq: found.statReq };
  }
  for (const pool of Object.values(CLASS_SPECIAL_QUEST_POOL)) {
    const found = pool.find((q) => q.name === name);
    if (found) return { description: found.description, baseDifficulty: 'medium' };
  }
  return null;
}
