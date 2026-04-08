import { Tabs } from 'expo-router'
import { View, Text, StyleSheet, Platform, useWindowDimensions } from 'react-native'

const TABS = [
  { name: 'checkin',   label: 'Check-In',  icon: '☀' },
  { name: 'matches',   label: 'Matches',   icon: '◎' },
  { name: 'tracker',   label: 'Tracker',   icon: '≡' },
  { name: 'prep',      label: 'Prep',      icon: '❏' },
  { name: 'portfolio', label: 'Portfolio', icon: '⊞' },
  { name: 'history',   label: 'History',   icon: '▦' },
  { name: 'profile',   label: 'Settings',  icon: '⚙' },
]

function TabIcon({ label, icon, focused }: { label: string; icon: string; focused: boolean }) {
  const { width } = useWindowDimensions()
  const isWide = width >= 720

  if (isWide) {
    return (
      <View style={[S.sideItem, focused && S.sideItemActive]}>
        <Text style={[S.sideIcon, focused && S.sideIconActive]}>{icon}</Text>
        <Text style={[S.sideLabel, focused && S.sideLabelActive]}>{label}</Text>
      </View>
    )
  }

  return (
    <View style={[S.pill, focused && S.pillActive]}>
      <Text style={[S.pillLabel, focused && S.pillLabelActive]}>{label}</Text>
    </View>
  )
}

export default function TabLayout() {
  const { width } = useWindowDimensions()
  const isWide = width >= 720

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: isWide ? S.sideBar : S.bottomBar,
        tabBarShowLabel: false,
        tabBarItemStyle: isWide ? S.sideBarItem : S.bottomBarItem,
      }}
    >
      {TABS.map(t => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon label={t.label} icon={t.icon} focused={focused} />
            ),
          }}
        />
      ))}
    </Tabs>
  )
}

const S = StyleSheet.create({
  // ── Sidebar ────────────────────────────────────────────────────────────────
  sideBar: {
    width: 196,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#E2E0F5',
    paddingTop: 16,
    paddingHorizontal: 10,
    paddingBottom: 16,
  },
  sideBarItem: {
    height: 44,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginBottom: 2,
    paddingLeft: 0,
    paddingRight: 0,
  },
  sideItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    width: 172,
  },
  sideItemActive: { backgroundColor: '#EEF0FF' },
  sideIcon:        { fontSize: 15, width: 18, textAlign: 'center', color: '#9E9BBD' },
  sideIconActive:  { color: '#5B4FD9' },
  sideLabel:       { fontSize: 13, fontWeight: '500', color: '#9E9BBD' },
  sideLabelActive: { color: '#5B4FD9', fontWeight: '700' },

  // ── Bottom bar ─────────────────────────────────────────────────────────────
  bottomBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E0F5',
    height: Platform.OS === 'ios' ? 82 : 64,
    paddingHorizontal: 4,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 22 : 8,
  },
  bottomBarItem: { paddingHorizontal: 0, paddingVertical: 0 },
  pill:       { paddingHorizontal: 6, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: 'transparent', minWidth: 44, alignItems: 'center' },
  pillActive: { backgroundColor: '#EEF0FF', borderColor: '#5B4FD9' },
  pillLabel:       { fontSize: 9, fontWeight: '500', color: '#9E9BBD' },
  pillLabelActive: { fontSize: 9, fontWeight: '700', color: '#5B4FD9' },
})
