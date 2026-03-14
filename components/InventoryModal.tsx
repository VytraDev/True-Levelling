import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { supabase } from '../lib/supabase';
import { getInventory, removeItemFromInventory, type InventoryRow } from '../lib/inventoryEngine';
import { usePlayerStore } from '../store/playerStore';
import { useToastStore } from '../store/toastStore';

interface InventoryModalProps {
  visible: boolean;
  onClose: () => void;
}

export function InventoryModal({ visible, onClose }: InventoryModalProps) {
  const accentColor = usePlayerStore((s) => s.accentColor);
  const combatStats = usePlayerStore((s) => s.combatStats);
  const currentHP = usePlayerStore((s) => s.currentHP);
  const currentMP = usePlayerStore((s) => s.currentMP);
  const currentStamina = usePlayerStore((s) => s.currentStamina);
  const restoreHP = usePlayerStore((s) => s.restoreHP);
  const restoreMP = usePlayerStore((s) => s.restoreMP);
  const restoreStamina = usePlayerStore((s) => s.restoreStamina);

  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [loading, setLoading] = useState(false);

  const totalItems = useMemo(
    () => rows.reduce((sum, r) => sum + (r.quantity ?? 0), 0),
    [rows]
  );

  const refresh = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.auth.getSession();
      const userId = data?.session?.user?.id;
      if (!userId) return;
      const inv = await getInventory(userId);
      setRows(inv);
    } catch (e) {
      console.error('Inventory load error:', e);
      useToastStore.getState().addToast('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleUse = async (row: InventoryRow) => {
    const item = row.item_templates;
    if (!item) return;
    if (row.quantity <= 0) return;
    if (item.usable_in_battle === false && item.item_type === 'dungeon_key') {
      useToastStore.getState().addToast('Dungeon keys can’t be used here (yet)');
      return;
    }

    const { data } = await supabase.auth.getSession();
    const userId = data?.session?.user?.id;
    if (!userId) return;

    try {
      await removeItemFromInventory(userId, row.item_id, 1);

      const value = item.value ?? 0;
      if (item.item_type === 'potion_hp') {
        restoreHP(value);
        useToastStore.getState().addToast(`+${value} HP`);
      } else if (item.item_type === 'potion_mp') {
        restoreMP(value);
        useToastStore.getState().addToast(`+${value} MP`);
      } else if (item.item_type === 'potion_sta') {
        restoreStamina(value);
        useToastStore.getState().addToast(`+${value} STA`);
      } else {
        useToastStore.getState().addToast('Used item');
      }

      await refresh();
    } catch (e) {
      console.error('Use item error:', e);
      useToastStore.getState().addToast('Failed to use item');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
          <View style={[styles.header, { borderBottomColor: accentColor }]}>
            <Text style={[styles.title, { color: accentColor }]}>
              INVENTORY · {totalItems}
            </Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Text style={[styles.close, { color: accentColor }]}>✕</Text>
            </Pressable>
          </View>

          <Text style={styles.subtle}>
            HP {currentHP}/{combatStats.hp} · MP {currentMP}/{combatStats.mp} · STA {currentStamina}/{combatStats.sta}
          </Text>

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {rows.length === 0 ? (
              <Text style={styles.emptyText}>{loading ? 'Loading…' : 'No items yet.'}</Text>
            ) : (
              rows.map((r) => (
                <View key={r.id} style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{r.item_templates?.name ?? 'Item'}</Text>
                    {r.item_templates?.description ? (
                      <Text style={styles.desc} numberOfLines={2}>
                        {r.item_templates.description}
                      </Text>
                    ) : null}
                    <Text style={styles.meta}>x{r.quantity}</Text>
                  </View>
                  <Pressable
                    style={[styles.useBtn, { borderColor: accentColor }]}
                    onPress={() => handleUse(r)}
                    disabled={loading || r.item_templates?.usable_in_battle === false}
                  >
                    <Text style={[styles.useBtnText, { color: accentColor }]}>
                      {r.item_templates?.usable_in_battle === false ? 'N/A' : 'USE'}
                    </Text>
                  </Pressable>
                </View>
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
  subtle: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
    fontSize: 12,
    color: '#737373',
  },
  list: {
    paddingHorizontal: 16,
    marginTop: 10,
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
  desc: {
    fontSize: 12,
    color: '#A3A3A3',
    marginBottom: 6,
  },
  meta: {
    fontSize: 12,
    color: '#737373',
    fontWeight: '700',
  },
  useBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: '#1A1A1A',
  },
  useBtnText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

