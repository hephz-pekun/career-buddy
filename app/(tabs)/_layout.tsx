import { Tabs } from 'expo-router'
import { View, Text, StyleSheet } from 'react-native'

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <View style={[styles.tabItem, focused && styles.tabItemFocused]}>
      <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>{label}</Text>
    </View>
  )
}

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarStyle: styles.tabBar, tabBarShowLabel: false }}>
      <Tabs.Screen name="checkin"   options={{ tabBarIcon: ({ focused }) => <TabIcon label="check-in"  focused={focused} /> }} />
      <Tabs.Screen name="matches"   options={{ tabBarIcon: ({ focused }) => <TabIcon label="matches"   focused={focused} /> }} />
      <Tabs.Screen name="tracker"   options={{ tabBarIcon: ({ focused }) => <TabIcon label="tracker"   focused={focused} /> }} />
      <Tabs.Screen name="prep"      options={{ tabBarIcon: ({ focused }) => <TabIcon label="prep"      focused={focused} /> }} />
      <Tabs.Screen name="portfolio" options={{ tabBarIcon: ({ focused }) => <TabIcon label="portfolio" focused={focused} /> }} />
      <Tabs.Screen name="history"   options={{ tabBarIcon: ({ focused }) => <TabIcon label="history"   focused={focused} /> }} />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  tabBar:          { backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F1F5F9', height: 64, paddingBottom: 6 },
  tabItem:         { alignItems: 'center', paddingVertical: 4, paddingHorizontal: 6, borderRadius: 8, minWidth: 48 },
  tabItemFocused:  { backgroundColor: '#EEF2FF' },
  tabLabel:        { fontSize: 10, color: '#94A3B8', fontWeight: '500' },
  tabLabelFocused: { color: '#6366F1', fontWeight: '700' },
})
