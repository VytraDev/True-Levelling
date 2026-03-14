import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { supabase } from '../lib/supabase';
import {
  type Ability,
  type AbilityType,
  type EquippedAbilityRow,
  equipAbility,
  getEquippedAbilities,
  getLearnedAbilities,
  unequipAbility,
} from '../lib/abilityEngine';
import { useToastStore } from '../store/toastStore';

const SKILL_SLOTS = 6;
const SPELL_SLOTS = 7;

interface AbilitiesLoadoutModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AbilitiesLoadoutModal({ visible, onClose }: AbilitiesLoadoutModalProps) {
  const [tab, setTab] = useState<AbilityType>('skill');
  const [learned, setLearned] = useState<Ability[]>([]);
  const [equippedSkills, setEquippedSkills] = useState<EquippedAbilityRow[]>([]);
  const [equippedSpells, setEquippedSpells] = useState<EquippedAbilityRow[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const equippedForTab = tab === 'skill' ? equippedSkills : equippedSpells;
  const slotCount = tab === 'skill' ? SKILL_SLOTS : SPELL_SLOTS;

  const equippedBySlot = useMemo(() => {
    const map = new Map<number, EquippedAbilityRow>();
    for (const row of equippedForTab) map.set(row.slot, row);
    return map;
  }, [equippedForTab]);

  const refresh = async (type: AbilityType) => {
    setLoading(true);
    try {
      const { data } = await supabase.auth.getSession();
      const userId = data?.session?.user?.id;
      if (!userId) return;

      const [skills, spells, learnedList] = await Promise.all([
        getEquippedAbilities(userId, 'skill'),
        getEquippedAbilities(userId, 'spell'),
        getLearnedAbilities(userId, type),
      ]);

      setEquippedSkills(skills);
      setEquippedSpells(spells);
      setLearned(learnedList);
    } catch (e) {
      console.error('Abilities load error:', e);
      useToastStore.getState().addToast('Failed to load abilities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      setSelectedSlot(null);
      refresh(tab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(() => {
    if (visible) {
      setSelectedSlot(null);
      refresh(tab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const handleEquip = async (ability: Ability) => {
    if (selectedSlot === null) {
      useToastStore.getState().addToast('Select a slot first');
      return;
    }
    setLoading(true);
    try {
      const { data } = await supabase.auth.getSession();
      const userId = data?.session?.user?.id;
      if (!userId) return;

      await equipAbility(userId, ability.id, tab, selectedSlot);
      useToastStore.getState().addToast(`✓ Equipped: ${ability.name}`);
      await refresh(tab);
    } catch (e) {
      console.error('Equip ability error:', e);
      useToastStore.getState().addToast('Failed to equip ability');
    } finally {
      setLoading(false);
    }
  };

  const handleUnequip = async (slot: number) => {
    setLoading(true);
    try {
      const { data } = await supabase.auth.getSession();
      const userId = data?.session?.user?.id;
      if (!userId) return;

      await unequipAbility(userId, slot, tab);
      useToastStore.getState().addToast('Unequipped');
      await refresh(tab);
    } catch (e) {
      console.error('Unequip ability error:', e);
      useToastStore.getState().addToast('Failed to unequip');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>ABILITIES</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Text style={styles.close}>✕</Text>
            </Pressable>
          </View>

          <View style={styles.tabsRow}>
            <Pressable
              style={[styles.tabBtn, tab === 'skill' && styles.tabBtnActive]}
              onPress={() => setTab('skill')}
            >
              <Text style={[styles.tabText, tab === 'skill' && styles.tabTextActive]}>
                Skills {equippedSkills.length}/{SKILL_SLOTS}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tabBtn, tab === 'spell' && styles.tabBtnActive]}
              onPress={() => setTab('spell')}
            >
              <Text style={[styles.tabText, tab === 'spell' && styles.tabTextActive]}>
                Spells {equippedSpells.length}/{SPELL_SLOTS}
              </Text>
            </Pressable>
          </View>

          <Text style={styles.sectionLabel}>EQUIPPED</Text>
          <View style={styles.slotsGrid}>
            {Array.from({ length: slotCount }, (_, i) => i + 1).map((slot) => {
              const row = equippedBySlot.get(slot);
              const name = row?.ability_templates?.name ?? 'Empty';
              const isSelected = selectedSlot === slot;
              const isEmpty = !row;
              return (
                <Pressable
                  key={slot}
                  onPress={() => setSelectedSlot(slot)}
                  style={[
                    styles.slotCard,
                    isSelected && styles.slotCardSelected,
                    isEmpty && styles.slotCardEmpty,
                  ]}
                  disabled={loading}
                >
                  <Text style={styles.slotLabel}>Slot {slot}</Text>
                  <Text style={styles.slotName} numberOfLines={1}>
                    {name}
                  </Text>
                  {!isEmpty ? (
                    <Pressable
                      onPress={() => handleUnequip(slot)}
                      style={styles.unequipBtn}
                      disabled={loading}
                    >
                      <Text style={styles.unequipText}>Unequip</Text>
                    </Pressable>
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.sectionLabel}>LEARNED</Text>
          <ScrollView style={styles.learnedList} showsVerticalScrollIndicator={false}>
            {learned.length === 0 ? (
              <Text style={styles.emptyText}>
                {loading ? 'Loading…' : 'No learned abilities yet.'}
              </Text>
            ) : (
              learned.map((a) => (
                <Pressable
                  key={a.id}
                  style={styles.abilityRow}
                  onPress={() => handleEquip(a)}
                  disabled={loading}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.abilityName}>{a.name}</Text>
                    {a.description ? (
                      <Text style={styles.abilityDesc} numberOfLines={2}>
                        {a.description}
                      </Text>
                    ) : null}
                    <Text style={styles.abilityMeta}>
                      Lv {a.unlock_level} · STA {a.stamina_cost} · MP {a.mana_cost}
                    </Text>
                  </View>
                  <Text style={styles.equipHint}>
                    {selectedSlot ? `Equip → ${selectedSlot}` : 'Select slot'}
                  </Text>
                </Pressable>
              ))
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#0F0F0F',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  close: {
    fontSize: 22,
    color: '#737373',
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    paddingBottom: 8,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333333',
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
  },
  tabBtnActive: {
    borderColor: '#16A34A',
    backgroundColor: '#1A2E1A',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A3A3A3',
  },
  tabTextActive: {
    color: '#34D399',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#737373',
    letterSpacing: 1.5,
    paddingHorizontal: 16,
    marginTop: 6,
    marginBottom: 8,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  slotCard: {
    width: '48%',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  slotCardSelected: {
    borderColor: '#8B5CF6',
  },
  slotCardEmpty: {
    opacity: 0.85,
  },
  slotLabel: {
    fontSize: 11,
    color: '#737373',
    marginBottom: 4,
  },
  slotName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  unequipBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#252525',
  },
  unequipText: {
    fontSize: 12,
    color: '#A3A3A3',
    fontWeight: '600',
  },
  learnedList: {
    paddingHorizontal: 16,
  },
  abilityRow: {
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    alignItems: 'center',
  },
  abilityName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  abilityDesc: {
    fontSize: 12,
    color: '#A3A3A3',
    marginBottom: 6,
  },
  abilityMeta: {
    fontSize: 11,
    color: '#737373',
  },
  equipHint: {
    fontSize: 11,
    color: '#34D399',
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 14,
    color: '#737373',
    fontStyle: 'italic',
    paddingVertical: 24,
    textAlign: 'center',
  },
});

