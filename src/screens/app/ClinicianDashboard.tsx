import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { supabase } from "../../lib/supabase";
import { PatientRow } from "../../types/patient";
import { useAuthStore } from "../../store/useAuthStore";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

// Note: Ensure ClinicianEvaluation is added to your AppStack params
type Props = NativeStackScreenProps<any, "ClinicianDashboard">;

export default function ClinicianDashboard({ navigation }: Props) {
  const { signOut } = useAuthStore();
  const [pendingPatients, setPendingPatients] = useState<PatientRow[]>([]);

  useEffect(() => {
    const fetchPending = async () => {
      const { data } = await supabase
        .from("patients")
        .select("*")
        .eq("status", "AWAITING_CLINICIAN")
        .order("alert_clinician_at", { ascending: true });
      if (data) setPendingPatients(data as PatientRow[]);
    };

    fetchPending();

    const channel = supabase
      .channel("clinician_alerts")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "patients",
          filter: `status=eq.AWAITING_CLINICIAN`,
        },
        (payload) => {
          // Re-fetch to ensure exact ordering and state sync, or manually merge payload
          fetchPending();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <View className="flex-1 bg-slate-50">
      <View className="bg-red-600 pt-16 pb-6 px-6 flex-row justify-between items-center shadow-sm">
        <View>
          <Text className="text-white/80 font-medium">Clinician Portal</Text>
          <Text className="text-white text-2xl font-bold">
            Pending Evaluations
          </Text>
        </View>
        <TouchableOpacity
          onPress={signOut}
          className="bg-red-700 px-4 py-2 rounded-lg"
        >
          <Text className="text-white font-medium">Log Out</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={pendingPatients}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("ClinicianEvaluation", { patient: item })
            }
            className="bg-white p-5 mb-4 rounded-xl border-l-4 border-red-500 shadow-sm flex-row justify-between items-center"
          >
            <View>
              <Text className="text-red-600 font-bold text-xs mb-1">
                CODE STROKE ACTIVE
              </Text>
              <Text className="font-bold text-xl text-slate-900">
                {item.uhid}
              </Text>
              <Text className="text-slate-600 mt-1">
                {item.age} yrs • {item.gender}
              </Text>
            </View>
            <View className="bg-red-50 px-3 py-2 rounded-lg">
              <Text className="text-red-700 font-semibold">Evaluate ➔</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View className="items-center justify-center mt-20">
            <Text className="text-slate-400 text-lg">
              No pending stroke evaluations.
            </Text>
          </View>
        }
      />
    </View>
  );
}
