import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { supabase } from '../lib/supabase';
import {
  type EquipmentSlot,
  calculateGearBonuses,
  equipGear,
  getEquippedGear,
  getGearInventory,
  type EquippedGearRow,
  type GearInventoryRow,
  unequipGear,
} from '../lib/equipmentEngine';
import { useToastStore } from '../store/toastStore';
import { usePlayerStore } from '../store/playerStore';

const SLOTS: EquipmentSlot[] = ['helmet', 'chest', 'legs', 'boots', 'weapon', 'accessory'];

interface GearModalProps {
  visible: boolean;
  onClose: () => void;
}

export function GearModal({ visible, onClose }: GearModalProps) {
  const accentColor = usePlayerStore((s) => s.accentColor);
  const [equipped, setEquipped] = useState<EquippedGearRow[]>([]);
  const [inventory, setInventory] = useState<GearInventoryRow[]>([]);
  const [loading, setLoading] = useState(false);

  const equippedBySlot = useMemo(() => {
    const m = new Map<EquipmentSlot, EquippedGearRow>();
    for (const row of equipped) m.set(row.slot, row);
    return m;
  }, [equipped]);

  const bonuses = useMemo(() => calculateGearBonuses(equipped), [equipped]);

  const refresh = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.auth.getSession();
      const userId = data?.session?.user?.id;
      if (!userId) return;

      const [eq, inv] = await Promise.all([getEquippedGear(userId), getGearInventory(userId)]);
      setEquipped(eq);
      setInventory(inv);
    } catch (e) {
      console.error('Gear load error:', e);
      useToastStore.getState().addToast('Failed to load gear');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleEquip = async (item: GearInventoryRow) => {
    const t = item.equipment_templates;
    if (!t) return;

    const { data } = await supabase.auth.getSession();
    const userId = data?.session?.user?.id;
    if (!userId) return;

    setLoading(true);
    try {
      await equipGear(userId, item.equipment_id, t.slot);
      useToastStore.getState().addToast(`✓ Equipped: ${t.name}`);
      await refresh();
    } catch (e) {
      console.error('Equip gear error:', e);
      useToastStore.getState().addToast('Failed to equip gear');
    } finally {
      setLoading(false);
    }
  };

  const handleUnequip = async (slot: EquipmentSlot) => {
    const { data } = await supabase.auth.getSession();
    const userId = data?.session?.user?.id;
    if (!userId) return;

    setLoading(true);
    try {
      await unequipGear(userId, slot);
      useToastStore.getState().addToast('Unequipped');
      await refresh();
    } catch (e) {
      console.error('Unequip gear error:', e);
      useToastStore.getState().addToast('Failed to unequip');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
          <View style={[styles.header, { borderBottomColor: accentColor }]}>
            <Text style={[styles.title, { color: accentColor }]}>GEAR</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Text style={[styles.close, { color: accentColor }]}>✕</Text>
            </Pressable>
          </View>

          <Text style={styles.bonusLine}>
            Bonuses: STR +{bonuses.str} · AGI +{bonuses.agi} · INT +{bonuses.int} · VIT +{bonuses.vit} · END +{bonuses.end}
          </Text>

          <Text style={styles.sectionLabel}>EQUIPPED</Text>
          <View style={styles.equippedGrid}>
            {SLOTS.map((slot) => {
              const row = equippedBySlot.get(slot);
              const name = row?.equipment_templates?.name ?? 'Empty';
              return (
                <View key={slot} style={styles.slotCard}>
                  <Text style={styles.slotLabel}>{slot.toUpperCase()}</Text>
                  <Text style={styles.slotName} numberOfLines={1}>
                    {name}
                  </Text>
                  {row ? (
                    <Pressable
                      style={[styles.smallBtn, { borderColor: accentColor }]}
                      onPress={() => handleUnequip(slot)}
                      disabled={loading}
                    >
                      <Text style={[styles.smallBtnText, { color: accentColor }]}>Unequip</Text>
                    </Pressable>
                  ) : null}
                </View>
              );
            })}
          </View>

          <Text style={styles.sectionLabel}>INVENTORY</Text>
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {inventory.length === 0 ? (
              <Text style={styles.emptyText}>{loading ? 'Loading…' : 'No gear yet.'}</Text>
            ) : (
              inventory.map((it) => (
                <Pressable
                  key={it.id}
                  style={styles.row}
                  onPress={() => handleEquip(it)}
                  disabled={loading}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{it.equipment_templates?.name ?? 'Gear'}</Text>
                    <Text style={styles.meta}>
                      {it.equipment_templates?.slot ?? 'slot'} · Lvl {it.equipment_templates?.level_requirement ?? 1}
                    </Text>
                  </View>
                  <Text style={[styles.equipHint, { color: accentColor }]}>Equip ›</Text>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
  close: {
    fontSize: 22,
  },
  bonusLine: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
    fontSize: 12,
    color: '#A3A3A3',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#737373',
    letterSpacing: 1.5,
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 8,
  },
  equippedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 16,
  },
  slotCard: {
    width: '48%',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    marginBottom: 10,
  },
  slotLabel: {
    fontSize: 11,
    color: '#737373',
    marginBottom: 4,
    fontWeight: '700',
  },
  slotName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  smallBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: '#1A1A1A',
  },
  smallBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  list: {
    paddingHorizontal: 16,
  },
  emptyText: {
    paddingVertical: 24,
    textAlign: 'center',
    color: '#737373',
    fontStyle: 'italic',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  meta: {
    fontSize: 12,
    color: '#737373',
    fontWeight: '600',
  },
  equipHint: {
    fontSize: 12,
    fontWeight: '800',
  },
});

