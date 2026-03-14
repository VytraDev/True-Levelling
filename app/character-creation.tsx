import { useEffect, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
  Modal,
  Image,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { usePlayerStore } from '../store/playerStore';
import { supabase } from '../lib/supabase';
import { CLASS_CONFIG, type PlayerClass } from '../lib/classEngine';
import { SystemAwakening } from '../components/SystemAwakening';
import { initializeSpecialQuests } from '../lib/specialQuestEngine';

type Gender = 'male' | 'female';

const FACE_OPTIONS = ['Face 1', 'Face 2', 'Face 3', 'Face 4'] as const;
const HAIR_STYLE_OPTIONS = ['Hair 1', 'Hair 2', 'Hair 3', 'Hair 4', 'Hair 5'] as const;
const HAIR_COLOR_OPTIONS = ['Black', 'Brown', 'Blonde', 'White', 'Red', 'Blue'] as const;

const HAIR_COLOR_SWATCH: Record<(typeof HAIR_COLOR_OPTIONS)[number], string> = {
  Black: '#000000',
  Brown: '#92400E',
  Blonde: '#FACC15',
  White: '#E5E5E5',
  Red: '#B91C1C',
  Blue: '#1D4ED8',
};

export default function CharacterCreationScreen() {
  const params = useLocalSearchParams<{ edit?: string }>();
  const isEditing = params.edit === 'true';

  const playerId = usePlayerStore((s) => s.id);
  const existingName = usePlayerStore((s) => s.name);

  const [name, setName] = useState(existingName ?? '');
  const [gender, setGender] = useState<Gender | null>(null);
  const [face, setFace] = useState<(typeof FACE_OPTIONS)[number]>('Face 1');
  const [hairStyle, setHairStyle] = useState<(typeof HAIR_STYLE_OPTIONS)[number]>('Hair 1');
  const [hairColor, setHairColor] = useState<(typeof HAIR_COLOR_OPTIONS)[number]>('Black');
  const [saving, setSaving] = useState(false);
  const [awakeningVisible, setAwakeningVisible] = useState(false);
  const [awakeningShown, setAwakeningShown] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [showNoU, setShowNoU] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadAppearance = async () => {
      if (!playerId) return;
      const { data, error } = await supabase
        .from('players')
        .select('name, gender, face, hair_style, hair_color')
        .eq('id', playerId)
        .maybeSingle();

      if (!isMounted || error || !data) return;

      if (data.name) setName(data.name);
      if (data.gender === 'male' || data.gender === 'female') {
        setGender(data.gender);
      }
      if (FACE_OPTIONS.includes(data.face as any)) {
        setFace(data.face as (typeof FACE_OPTIONS)[number]);
      }
      if (HAIR_STYLE_OPTIONS.includes(data.hair_style as any)) {
        setHairStyle(data.hair_style as (typeof HAIR_STYLE_OPTIONS)[number]);
      }
      if (HAIR_COLOR_OPTIONS.includes(data.hair_color as any)) {
        setHairColor(data.hair_color as (typeof HAIR_COLOR_OPTIONS)[number]);
      }
    };

    loadAppearance();
    return () => {
      isMounted = false;
    };
  }, [playerId]);

  useEffect(() => {
    let cancelled = false;
    const loadPlayer = usePlayerStore.getState().loadPlayer;

    const ensurePlayerLoaded = async () => {
      if (usePlayerStore.getState().id) {
        setPlayerReady(true);
        return;
      }

      try {
        const { data } = await supabase.auth.getSession();
        const user = data?.session?.user;
        if (!user || cancelled) return;

        let playerRow: Record<string, unknown> | null = null;
        const { data: row, error } = await supabase
          .from('players')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error || cancelled) return;
        playerRow = row as Record<string, unknown> | null;

        if (!playerRow) {
          const { data: inserted, error: insertError } = await supabase
            .from('players')
            .insert([
              {
                user_id: user.id,
                name: 'Hunter',
                level: 1,
                xp: 0,
                rank_xp: 0,
                rank: 'E',
                gold: 0,
                penalty_gauge: 0,
                last_penalty_date: null,
                punishment_triggered: false,
                unchecked_quests_count: 0,
                break_days: [],
                last_break_day_change: null,
                str: 10,
                agi: 10,
                int: 10,
                vit: 10,
                endurance: 10,
                ap: 0,
                player_class: 'unclassed',
                character_created: false,
          custom_quest_attempts_today: 0,
                custom_quest_attempts_reset_date: null,
                gender: null,
                face: 'Face 1',
                hair_style: 'Hair 1',
                hair_color: 'Black',
              },
            ])
            .select('*')
            .single();

          if (insertError || cancelled) return;
          playerRow = inserted as Record<string, unknown>;
        }

        if (!playerRow || cancelled) return;

        const todayIso = new Date().toISOString().slice(0, 10);
        const rowWithAttempts = playerRow as { custom_quest_attempts_today?: number; custom_quest_attempts_reset_date?: string | null };
        let attemptsToday = rowWithAttempts.custom_quest_attempts_today ?? 0;
        let attemptsResetDate = rowWithAttempts.custom_quest_attempts_reset_date ?? null;

        if (attemptsResetDate !== todayIso) {
          attemptsToday = 0;
          attemptsResetDate = todayIso;
          await supabase
            .from('players')
            .update({
              custom_quest_attempts_today: 0,
              custom_quest_attempts_reset_date: todayIso,
            })
            .eq('id', playerRow.id);
        }

        loadPlayer({
          id: playerRow.id as string,
          name: (playerRow.name as string) ?? 'Hunter',
          level: (playerRow.level as number) ?? 1,
          xp: (playerRow.xp as number) ?? 0,
          rankXp: (playerRow.rank_xp as number) ?? 0,
          rank: (playerRow.rank as string) ?? 'E',
          gold: (playerRow.gold as number) ?? 0,
          penaltyGauge: (playerRow.penalty_gauge as number) ?? 0,
          breakDays: (playerRow.break_days as number[] | undefined) ?? [],
          lastBreakDayChange: (playerRow.last_break_day_change as string | null) ?? null,
          lastPenaltyDate: (playerRow.last_penalty_date as string | null) ?? null,
          punishmentTriggered: (playerRow.punishment_triggered as boolean | undefined) ?? false,
          stats: {
            str: (playerRow.str as number) ?? 10,
            agi: (playerRow.agi as number) ?? 10,
            int: (playerRow.int as number) ?? 10,
            vit: (playerRow.vit as number) ?? 10,
            endurance: (playerRow.endurance as number) ?? 10,
          },
          ap: (playerRow.ap as number) ?? 0,
          playerClass: (playerRow.player_class as PlayerClass) ?? 'unclassed',
          customQuestAttemptsToday: attemptsToday,
          customQuestAttemptsResetDate: attemptsResetDate,
        });

        if (!cancelled) {
          setPlayerReady(true);
        }
      } catch (e) {
        console.log('Character creation ensurePlayerLoaded error:', e);
      }
    };

    ensurePlayerLoaded();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    console.log('Button clicked!');
    try {
      console.log('Creating character...');
      let currentPlayerId = playerId ?? usePlayerStore.getState().id;
      if (!currentPlayerId) {
        const { data } = await supabase.auth.getSession();
        const authUserId = data?.session?.user?.id;
        if (!authUserId) {
          throw new Error('Not authenticated. Please log in again.');
        }
        const { data: row } = await supabase
          .from('players')
          .select('id')
          .eq('user_id', authUserId)
          .maybeSingle();
        if (!row?.id) {
          throw new Error('Player data not loaded. Please restart the app.');
        }
        currentPlayerId = row.id as string;
      }
      const trimmedName = name.trim();
      if (!trimmedName || !gender) {
        throw new Error('Name and gender are required.');
      }

      setSaving(true);
      const updates: Record<string, any> = {
        name: trimmedName,
        gender,
        face,
        hair_style: hairStyle,
        hair_color: hairColor,
      };

      if (!isEditing) {
        updates.character_created = true;
      }

      const { error } = await supabase
        .from('players')
        .update(updates)
        .eq('id', currentPlayerId);

      if (error) {
        throw error;
      }

      usePlayerStore.getState().setName(trimmedName);

      try {
        const { data } = await supabase.auth.getSession();
        const authUserId = data?.session?.user?.id;
        if (authUserId && !isEditing) {
          await initializeSpecialQuests(authUserId, trimmedName);
        }
      } catch (initErr) {
        console.log('Special quests init error:', initErr);
      }

      if (isEditing || awakeningShown) {
        router.replace('/(tabs)');
        return;
      }

      setAwakeningShown(true);
      setAwakeningVisible(true);
    } catch (error: any) {
      console.error('Character creation failed:', error);
      const message = error?.message ?? String(error);
      Alert.alert('SYSTEM ERROR', message);
    } finally {
      setSaving(false);
    }
  };

  const canSubmit = !!name.trim() && !!gender && !saving && playerReady;
  const primaryLabel = isEditing ? 'Save Changes' : 'Begin Your Journey';

  const classKeys: (keyof typeof CLASS_CONFIG)[] = [
    'assassin',
    'fighter_speed',
    'fighter_brute',
    'tank',
    'caster',
    'mage',
  ];

  return (
    <View style={styles.outer}>
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>CREATE YOUR HUNTER</Text>
            <Text style={styles.subtitle}>
              The System requires your identification.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>IDENTITY</Text>

            <Text style={styles.fieldLabel}>Hunter Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your hunter name"
              placeholderTextColor="#737373"
              autoCapitalize="words"
            />

            <Text style={styles.fieldLabel}>Gender</Text>
            <View style={styles.genderRow}>
              <Pressable
                style={[
                  styles.genderCard,
                  gender === 'male' && styles.genderCardSelected,
                ]}
                onPress={() => setGender('male')}
              >
                <Text
                  style={[
                    styles.genderLabel,
                    gender === 'male' && styles.genderLabelSelected,
                  ]}
                >
                  MALE
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.genderCard,
                  gender === 'female' && styles.genderCardSelected,
                ]}
                onPress={() => setGender('female')}
              >
                <Text
                  style={[
                    styles.genderLabel,
                    gender === 'female' && styles.genderLabelSelected,
                  ]}
                >
                  FEMALE
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>APPEARANCE</Text>

            <Text style={styles.fieldLabel}>FACE TYPE</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            >
              {FACE_OPTIONS.map((opt) => (
                <Pressable
                  key={opt}
                  style={[
                    styles.optionCard,
                    face === opt && styles.optionCardSelected,
                  ]}
                  onPress={() => setFace(opt)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      face === opt && styles.optionTextSelected,
                    ]}
                  >
                    {opt}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={styles.fieldLabel}>HAIR STYLE</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            >
              {HAIR_STYLE_OPTIONS.map((opt) => (
                <Pressable
                  key={opt}
                  style={[
                    styles.optionCard,
                    hairStyle === opt && styles.optionCardSelected,
                  ]}
                  onPress={() => setHairStyle(opt)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      hairStyle === opt && styles.optionTextSelected,
                    ]}
                  >
                    {opt}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={styles.fieldLabel}>HAIR COLOR</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            >
              {HAIR_COLOR_OPTIONS.map((opt) => (
                <Pressable
                  key={opt}
                  style={[
                    styles.optionCardSmall,
                    hairColor === opt && styles.optionCardSelected,
                  ]}
                  onPress={() => setHairColor(opt)}
                >
                  <View
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: HAIR_COLOR_SWATCH[opt] },
                    ]}
                  />
                  <Text
                    style={[
                      styles.optionText,
                      hairColor === opt && styles.optionTextSelected,
                    ]}
                  >
                    {opt}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>CLASS PREVIEW</Text>
            <Text style={styles.classHint}>
              Your class is determined by how you allocate stats.
            </Text>
            <View style={styles.classPillsRow}>
              {classKeys.map((key) => {
                const config = CLASS_CONFIG[key];
                return (
                  <View
                    key={key}
                    style={[styles.classPill, { backgroundColor: config.color }]}
                  >
                    <Text style={styles.classPillText}>{config.label}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          <Pressable
            style={[
              styles.primaryButton,
              canSubmit ? styles.primaryButtonEnabled : styles.primaryButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={!canSubmit}
          >
            <Text
              style={[
                styles.primaryButtonText,
                !canSubmit && styles.primaryButtonTextDisabled,
              ]}
            >
              {primaryLabel}
            </Text>
          </Pressable>

          <Pressable
            style={styles.logoutButton}
            onPress={async () => {
              try {
                await supabase.auth.signOut();
              } catch (e) {
                console.log('Logout error:', e);
              }
              usePlayerStore.getState().resetToDefaults();
              router.replace('/login');
            }}
          >
            <Text style={styles.logoutButtonText}>Logout</Text>
          </Pressable>
        </ScrollView>
      </View>
      <SystemAwakening
        visible={awakeningVisible}
        onFinished={() => {
          setAwakeningVisible(false);
          router.replace('/(tabs)');
        }}
        onRefuse={() => {
          setAwakeningVisible(false);
          setShowNoU(true);
          setTimeout(() => {
            setShowNoU(false);
            router.replace('/(tabs)');
          }, 2000);
        }}
      />

      <Modal visible={showNoU} transparent animationType="fade">
        <View style={styles.noUOverlay}>
          <Image
            source={require('../assets/noU.jpg')}
            style={styles.noUImage}
            resizeMode="contain"
          />
          <Text style={styles.noUText}>No U</Text>
          <Text style={styles.noUSubtext}>Redirecting...</Text>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    marginBottom: 28,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#A855F7',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#A3A3A3',
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 11,
    color: '#737373',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 12,
    color: '#E5E5E5',
    marginBottom: 6,
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: Platform.select({ ios: 11, android: 9, default: 9 }),
    color: '#FFFFFF',
    fontSize: 14,
    backgroundColor: '#111827',
    marginBottom: 12,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  genderCard: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#27272A',
  },
  genderCardSelected: {
    backgroundColor: '#1F102B',
    borderColor: '#8B5CF6',
  },
  genderLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#A3A3A3',
  },
  genderLabelSelected: {
    color: '#E5E5FF',
  },
  horizontalList: {
    paddingVertical: 4,
    gap: 8,
  },
  optionCard: {
    minWidth: 80,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#27272A',
    marginRight: 8,
    alignItems: 'center',
  },
  optionCardSmall: {
    minWidth: 90,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#27272A',
    marginRight: 8,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  optionCardSelected: {
    borderColor: '#8B5CF6',
    backgroundColor: '#1F102B',
  },
  optionText: {
    fontSize: 12,
    color: '#E5E5E5',
  },
  optionTextSelected: {
    color: '#EDE9FE',
  },
  colorSwatch: {
    width: 18,
    height: 18,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  classHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  classPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  classPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  classPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  primaryButton: {
    marginTop: 8,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonEnabled: {
    backgroundColor: '#8B5CF6',
  },
  primaryButtonDisabled: {
    backgroundColor: '#27272A',
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  primaryButtonTextDisabled: {
    color: '#9CA3AF',
  },
  logoutButton: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 10,
  },
  logoutButtonText: {
    fontSize: 13,
    color: '#9CA3AF',
    textDecorationLine: 'underline',
  },
  noUOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  noUImage: {
    width: 260,
    height: 260,
    marginBottom: 20,
  },
  noUText: {
    fontSize: 48,
    fontWeight: '800',
    color: '#F59E0B',
    marginBottom: 16,
    textAlign: 'center',
  },
  noUSubtext: {
    fontSize: 16,
    color: '#A3A3A3',
  },
});

