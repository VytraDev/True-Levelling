import { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View, RefreshControl } from 'react-native';

const isWeb = Platform.OS === 'web';

export default function CombatScreen() {
  const [refreshing, setRefreshing] = useState(false);
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
                setTimeout(() => setRefreshing(false), 800);
              }}
              tintColor="#8B5CF6"
            />
          }
        >
          <View style={styles.header}>
            <Text style={styles.title}>⚔️ COMBAT</Text>
            <Text style={styles.subtitle}>
              Battle system coming soon. Prepare your stats and gear.
            </Text>
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
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginTop: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#737373',
    textAlign: 'center',
  },
});
