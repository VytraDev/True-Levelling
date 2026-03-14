import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  RefreshControl,
} from 'react-native';
import { usePlayerStore } from '../../store/playerStore';
import { CLASS_CONFIG } from '../../lib/classEngine';
import { StatusBars } from '../../components/StatusBars';
import { SpecialQuestsModal } from '../../components/SpecialQuestsModal';
import { AbilitiesLoadoutModal } from '../../components/AbilitiesLoadoutModal';
import { InventoryModal } from '../../components/InventoryModal';
import { GearModal } from '../../components/GearModal';
import { supabase } from '../../lib/supabase';
import { getEquippedAbilities } from '../../lib/abilityEngine';
import { getInventory } from '../../lib/inventoryEngine';
import { getEquippedGear } from '../../lib/equipmentEngine';

const isWeb = Platform.OS === 'web';

export default function ArmoryScreen() {
  const level = usePlayerStore((s) => s.level);
  const playerClass = usePlayerStore((s) => s.playerClass);
  const accentColor = usePlayerStore((s) => s.accentColor);
  const combatStats = usePlayerStore((s) => s.combatStats);
  const currentHP = usePlayerStore((s) => s.currentHP);
  const currentMP = usePlayerStore((s) => s.currentMP);
  const currentStamina = usePlayerStore((s) => s.currentStamina);

  const [showSpecialQuestsModal, setShowSpecialQuestsModal] = useState(false);
  const [showAbilitiesModal, setShowAbilitiesModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showGearModal, setShowGearModal] = useState(false);

  const [equippedSkillsCount, setEquippedSkillsCount] = useState(0);
  const [equippedSpellsCount, setEquippedSpellsCount] = useState(0);
  const [inventoryCount, setInventoryCount] = useState(0);
  const [equippedGearCount, setEquippedGearCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const className = CLASS_CONFIG[playerClass]?.label ?? 'Unclassed';

  const refreshCounts = async () => {
    const { data } = await supabase.auth.getSession();
    const userId = data?.session?.user?.id;
    if (!userId) return;

    try {
      const [skills, spells, inv, gear] = await Promise.all([
        getEquippedAbilities(userId, 'skill'),
        getEquippedAbilities(userId, 'spell'),
        getInventory(userId),
        getEquippedGear(userId),
      ]);

      setEquippedSkillsCount(skills.length);
      setEquippedSpellsCount(spells.length);
      setInventoryCount(inv.reduce((sum, r) => sum + r.quantity, 0));
      setEquippedGearCount(gear.length);
    } catch (e) {
      // Ignore; counts are non-critical
      console.log('Armory counts refresh error:', e);
    }
  };

  useEffect(() => {
    refreshCounts();
  }, []);

  useEffect(() => {
    if (!showAbilitiesModal && !showInventoryModal && !showGearModal && !showSpecialQuestsModal) {
      refreshCounts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAbilitiesModal, showInventoryModal, showGearModal, showSpecialQuestsModal]);

  return (
    <View style={[styles.outer, isWeb && styles.outerWeb]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await refreshCounts();
              setRefreshing(false);
            }}
            tintColor={accentColor}
          />
        }
      >
        <View style={[styles.header, { borderBottomColor: accentColor }]}>
          <Text style={[styles.className, { color: accentColor }]}>{className}</Text>
          <Text style={styles.levelText}>Level {level}</Text>
        </View>

        <View style={styles.statusSection}>
          <StatusBars
            maxHP={combatStats.hp}
            maxMP={combatStats.mp}
            maxSTA={combatStats.sta}
            currentHP={currentHP}
            currentMP={currentMP}
            currentStamina={currentStamina}
            accentColor={accentColor}
          />
        </View>

        <Pressable
          style={[styles.sectionButton, { borderColor: accentColor }]}
          onPress={() => setShowSpecialQuestsModal(true)}
        >
          <Text style={[styles.buttonLabel, { color: accentColor }]}>SPECIAL QUESTS</Text>
          <Text style={[styles.buttonArrow, { color: accentColor }]}>›</Text>
        </Pressable>

        <Pressable
          style={[styles.sectionButton, { borderColor: accentColor }]}
          onPress={() => setShowAbilitiesModal(true)}
        >
          <View>
            <Text style={[styles.buttonLabel, { color: accentColor }]}>SKILLS</Text>
            <Text style={styles.buttonSubtext}>
              Equipped: {equippedSkillsCount}/6 | Spells: {equippedSpellsCount}/7
            </Text>
          </View>
          <Text style={[styles.buttonArrow, { color: accentColor }]}>›</Text>
        </Pressable>

        <Pressable
          style={[styles.sectionButton, { borderColor: accentColor }]}
          onPress={() => setShowInventoryModal(true)}
        >
          <Text style={[styles.buttonLabel, { color: accentColor }]}>
            INVENTORY {inventoryCount > 0 ? `· ${inventoryCount}` : ''}
          </Text>
          <Text style={[styles.buttonArrow, { color: accentColor }]}>›</Text>
        </Pressable>

        <Pressable
          style={[styles.sectionButton, { borderColor: accentColor }]}
          onPress={() => setShowGearModal(true)}
        >
          <Text style={[styles.buttonLabel, { color: accentColor }]}>
            GEAR {equippedGearCount > 0 ? `· ${equippedGearCount}/6` : ''}
          </Text>
          <Text style={[styles.buttonArrow, { color: accentColor }]}>›</Text>
        </Pressable>
      </ScrollView>

      <SpecialQuestsModal
        visible={showSpecialQuestsModal}
        onClose={() => setShowSpecialQuestsModal(false)}
      />

      <AbilitiesLoadoutModal
        visible={showAbilitiesModal}
        onClose={() => setShowAbilitiesModal(false)}
      />

      <InventoryModal
        visible={showInventoryModal}
        onClose={() => setShowInventoryModal(false)}
      />

      <GearModal
        visible={showGearModal}
        onClose={() => setShowGearModal(false)}
      />
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
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  className: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
  },
  levelText: {
    fontSize: 14,
    color: '#737373',
    marginTop: 4,
  },
  statusSection: {
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  sectionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  buttonSubtext: {
    fontSize: 12,
    color: '#737373',
    marginTop: 4,
  },
  buttonArrow: {
    fontSize: 20,
  },
});
