import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View, ActivityIndicator } from "react-native";
import { supabase } from "../lib/supabase";
import { useAuthStore, UserProfile } from "../store/useAuthStore";

import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import ClinicianTreatmentScreen from "../screens/app/ClinicianTreatmentScreen";
import EMODashboard from "../screens/app/EMODashboard";
import ClinicianDashboard from "../screens/app/ClinicianDashboard";
import ClinicianEvaluationScreen from "../screens/app/ClinicianEvaluationScreen";
import RadiologistDashboard from "../screens/app/RadiologistDashboard";
import RadiologistReportScreen from "../screens/app/RadiologistReportScreen";

export type AuthStackParamList = { Login: undefined; Register: undefined };
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator();

export default function RootNavigator() {
  const { session, profile, isLoading, setSession, setProfile, setLoading } =
    useAuthStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else {
        setProfile(null);
        setLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (!error && data) setProfile(data as UserProfile);
    setLoading(false);
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!session || !profile ? (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="Login" component={LoginScreen} />
          <AuthStack.Screen name="Register" component={RegisterScreen} />
        </AuthStack.Navigator>
      ) : (
        <AppStack.Navigator screenOptions={{ headerShown: false }}>
          {profile.role === "EMO" && (
            <AppStack.Screen name="EMODashboard" component={EMODashboard} />
          )}
          {profile.role === "CLINICIAN" && (
            <>
              <AppStack.Screen
                name="ClinicianDashboard"
                component={ClinicianDashboard}
              />
              <AppStack.Screen
                name="ClinicianEvaluation"
                component={ClinicianEvaluationScreen}
              />
              <AppStack.Screen
                name="ClinicianTreatment"
                component={ClinicianTreatmentScreen}
              />
            </>
          )}
          {profile.role === "RADIOLOGIST" && (
            <>
              <AppStack.Screen
                name="RadiologistDashboard"
                component={RadiologistDashboard}
              />
              <AppStack.Screen
                name="RadiologistReport"
                component={RadiologistReportScreen}
              />
            </>
          )}
        </AppStack.Navigator>
      )}
    </NavigationContainer>
  );
}
