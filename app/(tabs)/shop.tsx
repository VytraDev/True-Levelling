import React, { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View, RefreshControl } from 'react-native';
import { usePlayerStore } from '../../store/playerStore';
import { useToastStore } from '../../store/toastStore';
import { supabase } from '../../lib/supabase';
import { type Ability, getAbilityTemplates, learnAbility } from '../../lib/abilityEngine';
import { addItemToInventory, getItemTemplates, type ItemTemplate } from '../../lib/inventoryEngine';
import { addGearToInventory, getEquipmentTemplates, type EquipmentTemplate } from '../../lib/equipmentEngine';

export default function ShopScreen() {
  const level = usePlayerStore((s) => s.level);
  const playerClass = usePlayerStore((s) => s.playerClass);
  const accentColor = usePlayerStore((s) => s.accentColor);

  const [abilities, setAbilities] = useState<Ability[]>([]);
  const [items, setItems] = useState<ItemTemplate[]>([]);
  const [gear, setGear] = useState<EquipmentTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const isWeb = Platform.OS === 'web';

  const refresh = async () => {
    setLoading(true);
    try {
      const [a, it, eq] = await Promise.all([
        getAbilityTemplates(),
        getItemTemplates(),
        getEquipmentTemplates(),
      ]);
      setAbilities(a);
      setItems(it);
      setGear(eq);
    } catch (e) {
      console.error('Shop load error:', e);
      useToastStore.getState().addToast('Failed to load shop');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const getUserId = async () => {
    const { data } = await supabase.auth.getSession();
    return data?.session?.user?.id ?? null;
  };

  const handleLearnAbility = async (ability: Ability) => {
    const userId = await getUserId();
    if (!userId) return;
    try {
      await learnAbility(userId, ability.id);
      useToastStore.getState().addToast(`✓ Learned: ${ability.name}`);
    } catch (e) {
      console.error('Learn ability error:', e);
      useToastStore.getState().addToast('Failed to learn ability');
    }
  };

  const handleBuyItem = async (item: ItemTemplate) => {
    const userId = await getUserId();
    if (!userId) return;
    try {
      await addItemToInventory(userId, item.id, 1);
      useToastStore.getState().addToast(`✓ Added: ${item.name}`);
    } catch (e) {
      console.error('Add item error:', e);
      useToastStore.getState().addToast('Failed to add item');
    }
  };

  const handleBuyGear = async (item: EquipmentTemplate) => {
    const userId = await getUserId();
    if (!userId) return;
    try {
      await addGearToInventory(userId, item.id);
      useToastStore.getState().addToast(`✓ Acquired: ${item.name}`);
    } catch (e) {
      console.error('Add gear error:', e);
      useToastStore.getState().addToast('Failed to acquire gear');
    }
  };

  const canUseAbility = (a: Ability) => {
    const classOk = !a.class_id || a.class_id === playerClass;
    const levelOk = (a.unlock_level ?? 1) <= level;
    return classOk && levelOk;
  };

  return (
    <View style={[styles.outer, isWeb && styles.outerWeb]}>
      <View style={[styles.container, isWeb && styles.containerWeb]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                await refresh();
                setRefreshing(false);
              }}
              tintColor={accentColor}
            />
          }
        >
          <Text style={[styles.pageTitle, { color: accentColor }]}>SHOP</Text>
          <Text style={styles.subtitle}>
            {loading ? 'Loading…' : 'Use this to test learning abilities and acquiring items/gear.'}
          </Text>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>ABILITIES</Text>
            {abilities
              .filter(canUseAbility)
              .slice(0, 30)
              .map((a) => (
                <View key={a.id} style={styles.card}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{a.name}</Text>
                    {a.description ? (
                      <Text style={styles.cardBody}>{a.description}</Text>
                    ) : null}
                    <Text style={styles.cardMeta}>
                      {a.ability_type.toUpperCase()} · Lv {a.unlock_level} · STA {a.stamina_cost} · MP {a.mana_cost}
                    </Text>
                  </View>
                  <Pressable
                    style={[styles.actionBtn, { borderColor: accentColor }]}
                    onPress={() => handleLearnAbility(a)}
                    disabled={loading}
                  >
                    <Text style={[styles.actionBtnText, { color: accentColor }]}>LEARN</Text>
                  </Pressable>
                </View>
              ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>CONSUMABLES</Text>
            {items.slice(0, 30).map((it) => (
              <View key={it.id} style={styles.card}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{it.name}</Text>
                  {it.description ? <Text style={styles.cardBody}>{it.description}</Text> : null}
                  <Text style={styles.cardMeta}>
                    {it.item_type} · value {it.value ?? 0} · stack {it.max_stack ?? 99}
                  </Text>
                </View>
                <Pressable
                  style={[styles.actionBtn, { borderColor: accentColor }]}
                  onPress={() => handleBuyItem(it)}
                  disabled={loading}
                >
                  <Text style={[styles.actionBtnText, { color: accentColor }]}>ADD</Text>
                </Pressable>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>EQUIPMENT</Text>
            {gear
              .filter((g) => (g.level_requirement ?? 1) <= level)
              .slice(0, 30)
              .map((g) => (
                <View key={g.id} style={styles.card}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{g.name}</Text>
                    {g.description ? <Text style={styles.cardBody}>{g.description}</Text> : null}
                    <Text style={styles.cardMeta}>
                      {g.slot} · Lv {g.level_requirement ?? 1} · STR +{g.bonus_str ?? 0} · AGI +{g.bonus_agi ?? 0} · INT +{g.bonus_int ?? 0} · VIT +{g.bonus_vit ?? 0} · END +{g.bonus_end ?? 0}
                    </Text>
                  </View>
                  <Pressable
                    style={[styles.actionBtn, { borderColor: accentColor }]}
                    onPress={() => handleBuyGear(g)}
                    disabled={loading}
                  >
                    <Text style={[styles.actionBtnText, { color: accentColor }]}>GET</Text>
                  </Pressable>
                </View>
              ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  outerWeb: {
    backgroundColor: '#000000',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 390,
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  containerWeb: {
    alignSelf: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  pageTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 12,
    color: '#737373',
    marginBottom: 18,
    lineHeight: 18,
  },
  section: {
    marginBottom: 22,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#737373',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  card: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cardBody: {
    fontSize: 12,
    color: '#A3A3A3',
    marginBottom: 6,
  },
  cardMeta: {
    fontSize: 11,
    color: '#737373',
  },
  actionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: '#1A1A1A',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
