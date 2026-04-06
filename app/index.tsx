import { Redirect } from 'expo-router'
import { useAppStore } from '../src/store'

export default function Index() {
  const onboardingComplete = useAppStore((s) => s.onboardingComplete)
  return <Redirect href={onboardingComplete ? '/(tabs)/checkin' : '/(onboarding)/step-1'} />
}
