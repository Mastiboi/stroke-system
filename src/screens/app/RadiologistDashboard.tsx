import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { supabase } from "../../lib/supabase";
import { PatientRow } from "../../types/patient";
import { useAuthStore } from "../../store/useAuthStore";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";

type Props = NativeStackScreenProps<any, "RadiologistDashboard">;

export default function RadiologistDashboard({ navigation }: Props) {
  const { signOut } = useAuthStore();
  const [pendingScans, setPendingScans] = useState<PatientRow[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPending = useCallback(async () => {
    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .eq("status", "AWAITING_RADIOLOGIST")
      .order("alert_radiologist_at", { ascending: false }); // FIXED: Newest alerts at the TOP

    if (!error && data) {
      setPendingScans(data as PatientRow[]);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPending();
    setRefreshing(false);
  }, [fetchPending]);

  useFocusEffect(
    useCallback(() => {
      fetchPending();
    }, [fetchPending]),
  );

  useEffect(() => {
    const channel = supabase
      .channel("radiology_alerts")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "patients",
          filter: `status=eq.AWAITING_RADIOLOGIST`,
        },
        () => fetchPending(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPending]);

  return (
    <View className="flex-1 bg-slate-900">
      <View className="bg-orange-500 pt-16 pb-6 px-6 flex-row justify-between items-center">
        <View>
          <Text className="text-white/80 font-medium">Radiology Portal</Text>
          <Text className="text-white text-2xl font-bold">
            Pending CT Scans
          </Text>
        </View>
        <TouchableOpacity
          onPress={signOut}
          className="bg-orange-600 px-4 py-2 rounded-lg"
        >
          <Text className="text-white font-medium">Log Out</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={pendingScans}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#ffffff"
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("RadiologistReport", { patient: item })
            }
            className="bg-slate-800 p-5 mb-4 rounded-xl border-l-4 border-orange-500 shadow-sm flex-row justify-between items-center"
          >
            <View>
              <Text className="font-bold text-xl text-white">{item.uhid}</Text>
              <Text className="text-slate-400 mt-1">
                NIHHS: {item.nihhs_score} | {item.age} yrs
              </Text>
            </View>
            <View className="bg-orange-500/20 px-3 py-2 rounded-lg border border-orange-500/50">
              <Text className="text-orange-400 font-semibold">Upload ➔</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text className="text-center text-slate-500 mt-10">
            Scanner is clear.
          </Text>
        }
      />
    </View>
  );
}
