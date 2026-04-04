import { Tabs } from 'expo-router'
import { View, Text, StyleSheet } from 'react-native'
import { Colors, Typography, Spacing, Radius } from '@/constants'

function TabIcon({
  emoji,
  label,
  focused,
}: {
  emoji: string
  label: string
  focused: boolean
}) {
  return (
    <View style={[styles.tabItem, focused && styles.tabItemFocused]}>
      <Text style={styles.tabEmoji}>{emoji}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>{label}</Text>
    </View>
  )
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="checkin"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🌤️" label="check-in" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🎯" label="matches" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="tracker"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📋" label="tracker" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="prep"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="💬" label="prep" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📊" label="history" focused={focused} />
          ),
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
    height: 72,
    paddingBottom: Spacing.sm,
  },
  tabItem: {
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
    minWidth: 56,
  },
  tabItemFocused: {
    backgroundColor: Colors.primaryLight,
  },
  tabEmoji: { fontSize: 20 },
  tabLabel: {
    fontSize: 10,
    marginTop: 2,
    color: Colors.gray400,
    fontWeight: Typography.medium,
  },
  tabLabelFocused: { color: Colors.primary },
})
