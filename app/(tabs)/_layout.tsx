import { useEffect, useState, useRef } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Animated, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { usePlayerStore } from '../../store/playerStore';
import { supabase } from '../../lib/supabase';
import type { PlayerClass } from '../../lib/classEngine';
import { SettingsModal } from '../../components/SettingsModal';
import { ToastNotification } from '../../components/ToastNotification';

const tabIcon = (emoji: string) =>
  function TabIcon({ color, focused }: { color: string; focused: boolean }) {
    const indicatorAnim = useRef(new Animated.Value(focused ? 1 : 0)).current;

    useEffect(() => {
      Animated.timing(indicatorAnim, {
        toValue: focused ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }, [focused, indicatorAnim]);

    return (
      <View style={styles.tabIconWrapper}>
        <Animated.View
          style={[
            styles.tabIndicator,
            {
              opacity: indicatorAnim,
            },
          ]}
        />
        <Text style={[styles.tabIconEmoji, { color }]}>{emoji}</Text>
      </View>
    );
  };

export default function TabLayout() {
  const router = useRouter();
  const loadPlayer = usePlayerStore((s) => s.loadPlayer);
  const [settingsVisible, setSettingsVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const syncPlayer = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      const user = session?.user;
      if (!user || cancelled) return;

      const userId = user.id;
      const { data: row, error } = await supabase
        .from('players')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error || cancelled) return;

      let playerRow = row;

      if (!playerRow) {
        const { data: inserted, error: insertError } = await supabase
          .from('players')
          .insert([
            {
              user_id: userId,
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

        playerRow = inserted;
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
        id: playerRow.id,
        name: playerRow.name,
        level: playerRow.level,
        xp: playerRow.xp,
        rankXp: playerRow.rank_xp,
        rank: playerRow.rank,
        gold: playerRow.gold,
        penaltyGauge: playerRow.penalty_gauge,
        breakDays: (playerRow as { break_days?: number[] }).break_days ?? [],
        lastBreakDayChange: (playerRow as { last_break_day_change?: string | null }).last_break_day_change ?? null,
        lastPenaltyDate: (playerRow as { last_penalty_date?: string | null }).last_penalty_date ?? null,
        punishmentTriggered: (playerRow as { punishment_triggered?: boolean | null }).punishment_triggered ?? false,
        stats: {
          str: playerRow.str,
          agi: playerRow.agi,
          int: playerRow.int,
          vit: playerRow.vit,
          endurance: playerRow.endurance,
        },
        ap: playerRow.ap,
        playerClass: (playerRow.player_class as PlayerClass) ?? 'unclassed',
        customQuestAttemptsToday: attemptsToday,
        customQuestAttemptsResetDate: attemptsResetDate,
      });

      console.log('Player loaded: ' + playerRow.name);

      if (!(playerRow as { character_created?: boolean }).character_created) {
        router.replace('/character-creation');
      }
    };

    syncPlayer();

    return () => {
      cancelled = true;
    };
  }, [loadPlayer, router]);

  return (
    <View style={styles.wrapper}>
      <Tabs
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: '#0F0F0F' },
          headerTintColor: '#888888',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => setSettingsVisible(true)}
              style={{ paddingRight: 16 }}
            >
              <Text style={{ color: '#888888', fontSize: 24 }}>⚙️</Text>
            </TouchableOpacity>
          ),
          tabBarStyle: [
            styles.tabBarBase,
            Platform.OS === 'web' && styles.tabBarWeb,
          ],
          tabBarActiveTintColor: '#8B5CF6',
          tabBarInactiveTintColor: '#555555',
          tabBarShowLabel: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Quest',
            tabBarIcon: tabIcon('⚔️'),
          }}
        />
        <Tabs.Screen
          name="armory"
          options={{
            title: 'Armory',
            tabBarIcon: tabIcon('🏆'),
          }}
        />
        <Tabs.Screen
          name="shop"
          options={{
            title: 'Shop',
            tabBarIcon: tabIcon('🪙'),
          }}
        />
        <Tabs.Screen
          name="combat"
          options={{
            title: 'Combat',
            tabBarIcon: tabIcon('🗡️'),
          }}
        />
        <Tabs.Screen
          name="character"
          options={{
            title: 'Character',
            tabBarIcon: tabIcon('👤'),
          }}
        />
      </Tabs>
    <SettingsModal
      visible={settingsVisible}
      onClose={() => setSettingsVisible(false)}
    />
    <ToastNotification />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  tabBarBase: {
    backgroundColor: '#1A1A1A',
    borderTopWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabBarWeb: {
    maxWidth: 390,
    width: '100%',
    alignSelf: 'center',
  },
  tabIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIndicator: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E5E5',
    marginBottom: 4,
    alignSelf: 'stretch',
  },
  tabIconEmoji: {
    fontSize: 26,
  },
});
