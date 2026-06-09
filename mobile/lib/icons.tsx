import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from './theme';

/**
 * Professional icon system using styled shapes + Unicode symbols.
 * Replaces all emoji usage for a clean, branded look.
 */

type IconName =
  | 'home' | 'students' | 'attendance' | 'fees' | 'settings'
  | 'trophy' | 'search' | 'message' | 'complaint' | 'classroom'
  | 'teacher' | 'ai' | 'people' | 'add' | 'star' | 'back'
  | 'points' | 'calendar' | 'bell' | 'check' | 'close' | 'absent'
  | 'late' | 'leave' | 'send' | 'observe' | 'reassign';

const ICON_MAP: Record<IconName, { symbol: string; color: string; bg: string }> = {
  home:       { symbol: '⌂', color: Colors.primary, bg: Colors.primaryPale },
  students:   { symbol: '❖', color: '#5B6ABF',       bg: '#EEEDF9' },
  attendance: { symbol: '✓', color: '#2E8B6B',       bg: '#E4F5EF' },
  fees:       { symbol: 'Rs.', color: '#C67B2A',      bg: '#FEF3E2' },
  settings:   { symbol: '⟐', color: '#6B6B7B',       bg: '#F0F0F3' },
  trophy:     { symbol: '★', color: '#D4A017',       bg: '#FEF6E4' },
  search:     { symbol: '⊙', color: Colors.text2,    bg: Colors.border },
  message:    { symbol: '✉', color: '#4A8CC4',       bg: '#EBF3FB' },
  complaint:  { symbol: '✎', color: '#C25A3C',       bg: '#FDF0EE' },
  classroom:  { symbol: '⊞', color: '#7C5CBF',       bg: '#F1EEF9' },
  teacher:    { symbol: '◈', color: '#2E7D6B',       bg: '#E8F5F1' },
  ai:         { symbol: '◎', color: '#5B6ABF',       bg: '#EEEDF9' },
  people:     { symbol: '👥', color: '#4A8CC4',      bg: '#EBF3FB' },
  add:        { symbol: '+', color: '#fff',           bg: Colors.primary },
  star:       { symbol: '★', color: '#D4A017',       bg: '#FEF6E4' },
  back:       { symbol: '←', color: '#fff',           bg: 'transparent' },
  points:     { symbol: '◆', color: Colors.gold,     bg: Colors.goldPale },
  calendar:   { symbol: '▦', color: Colors.sky,      bg: Colors.skyPale },
  bell:       { symbol: '◉', color: Colors.coral,    bg: Colors.coralPale },
  check:      { symbol: '✓', color: '#4CAF50',       bg: '#E8F5E9' },
  close:      { symbol: '✕', color: Colors.coral,    bg: Colors.coralPale },
  absent:     { symbol: '✕', color: Colors.coral,    bg: Colors.coralPale },
  late:       { symbol: '◔', color: Colors.gold,     bg: Colors.goldPale },
  leave:      { symbol: '▤', color: Colors.lavender, bg: Colors.lavenderPale },
  send:       { symbol: '➤', color: '#fff',           bg: Colors.primary },
  observe:    { symbol: '✎', color: Colors.primary,  bg: Colors.primaryPale },
  reassign:   { symbol: '⇄', color: Colors.sky,      bg: Colors.skyPale },
};

interface IconProps {
  name: IconName;
  size?: number;
  /** Override default color scheme */
  color?: string;
  bg?: string;
  /** If true, render only the symbol without the circle background */
  bare?: boolean;
}

export function Icon({ name, size = 36, color, bg, bare }: IconProps) {
  const config = ICON_MAP[name] || ICON_MAP.home;
  const iconColor = color || config.color;
  const iconBg = bg || config.bg;

  if (name === 'people') {
    const iconSize = size * 0.52;
    if (bare) {
      return <Ionicons name="people" size={iconSize} color={iconColor} />;
    }
    return (
      <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: iconBg }]}>
        <Ionicons name="people" size={iconSize} color={iconColor} style={{ marginTop: -1 }} />
      </View>
    );
  }

  // Adjust font size for longer symbols like 'Rs.'
  const fontSize = name === 'fees' ? size * 0.36 : size * 0.48;

  if (bare) {
    return <Text style={{ fontSize, color: iconColor, fontWeight: '700' }}>{config.symbol}</Text>;
  }

  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: iconBg }]}>
      <Text style={[styles.symbol, { fontSize, color: iconColor, marginTop: name === 'fees' ? 1 : 0 }]}>{config.symbol}</Text>
    </View>
  );
}

/** Tab bar icon — minimal circle with symbol */
export function TabIcon({ name, focused, label }: { name: IconName; focused: boolean; label: string }) {
  const config = ICON_MAP[name] || ICON_MAP.home;
  return (
    <View style={styles.tabItem}>
      <View style={[
        styles.tabCircle,
        focused && { backgroundColor: Colors.primaryPale }
      ]}>
        {name === 'people' ? (
          <Ionicons 
            name={focused ? "people" : "people-outline"} 
            size={18} 
            color={focused ? Colors.primary : Colors.text3} 
          />
        ) : (
          <Text style={[
            styles.tabSymbol,
            { color: focused ? Colors.primary : Colors.text3 },
            focused && { fontWeight: '800' }
          ]}>
            {config.symbol}
          </Text>
        )}
      </View>
      <Text style={[
        styles.tabLabel,
        { color: focused ? Colors.primary : Colors.text3 },
        focused && { fontWeight: '700' }
      ]}>
        {label}
      </Text>
      {focused && <View style={styles.activeDot} />}
    </View>
  );
}

/** Action button — icon circle + label underneath */
export function ActionIcon({ name, label, onPress }: { name: IconName; label: string; onPress: () => void }) {
  const config = ICON_MAP[name] || ICON_MAP.home;
  const { TouchableOpacity } = require('react-native');
  return (
    <TouchableOpacity style={styles.actionBtn} onPress={onPress} activeOpacity={0.7}>
      <Icon name={name} size={42} />
      <Text style={[styles.actionLabel, { color: config.color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

/** Quick link card — used in More screen */
export function LinkIcon({ name, label, onPress }: { name: IconName; label: string; onPress: () => void }) {
  const { TouchableOpacity } = require('react-native');
  return (
    <TouchableOpacity style={styles.linkCard} onPress={onPress} activeOpacity={0.7}>
      <Icon name={name} size={38} />
      <Text style={styles.linkLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbol: {
    fontWeight: '700',
    textAlign: 'center',
  },
  // Tab bar
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 56,
  },
  tabCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabSymbol: {
    fontSize: 18,
    fontWeight: '600',
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: '500',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
    marginTop: 3,
  },
  // Action button
  actionBtn: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    minWidth: 76,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
  },
  // Link card
  linkCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    minWidth: 72,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  linkLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#5C5849',
    marginTop: 4,
  },
});
