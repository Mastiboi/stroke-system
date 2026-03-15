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

type Props = NativeStackScreenProps<any, "ClinicianDashboard">;
type TabType = "NEW" | "READY";

export default function ClinicianDashboard({ navigation }: Props) {
  const { signOut } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>("NEW");
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // 1. Stable fetch function using useCallback
  const fetchPatients = useCallback(async () => {
    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .in("status", ["AWAITING_CLINICIAN", "TREATMENT_IN_PROGRESS"])
      .order("created_at", { ascending: false }); // FIXED: Newest alerts at the TOP

    if (!error && data) {
      setPatients(data as PatientRow[]);
    }
  }, []);

  // 2. Pull-to-Refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPatients();
    setRefreshing(false);
  }, [fetchPatients]);

  // 3. Auto-refresh when navigating back to this tab
  useFocusEffect(
    useCallback(() => {
      fetchPatients();
    }, [fetchPatients]),
  );

  // 4. Real-time background sync
  useEffect(() => {
    const channel = supabase
      .channel("clinician_dashboard_sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "patients" },
        () => {
          fetchPatients();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPatients]);

  const filteredPatients = patients.filter((p) =>
    activeTab === "NEW"
      ? p.status === "AWAITING_CLINICIAN"
      : p.status === "TREATMENT_IN_PROGRESS",
  );

  return (
    <View className="flex-1 bg-slate-50">
      <View className="bg-red-600 pt-16 pb-6 px-6 shadow-sm">
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-white/80 font-medium">Clinician Portal</Text>
            <Text className="text-white text-2xl font-bold">Stroke Queue</Text>
          </View>
          <TouchableOpacity
            onPress={signOut}
            className="bg-red-700 px-4 py-2 rounded-lg"
          >
            <Text className="text-white font-medium">Log Out</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row bg-red-800/50 p-1 rounded-xl">
          <TouchableOpacity
            onPress={() => setActiveTab("NEW")}
            className={`flex-1 py-2 rounded-lg items-center ${activeTab === "NEW" ? "bg-white" : "bg-transparent"}`}
          >
            <Text
              className={`font-bold ${activeTab === "NEW" ? "text-red-600" : "text-white/70"}`}
            >
              New Alerts (
              {patients.filter((p) => p.status === "AWAITING_CLINICIAN").length}
              )
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab("READY")}
            className={`flex-1 py-2 rounded-lg items-center ${activeTab === "READY" ? "bg-white" : "bg-transparent"}`}
          >
            <Text
              className={`font-bold ${activeTab === "READY" ? "text-red-600" : "text-white/70"}`}
            >
              Scans Ready (
              {
                patients.filter((p) => p.status === "TREATMENT_IN_PROGRESS")
                  .length
              }
              )
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filteredPatients}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() =>
              activeTab === "NEW"
                ? navigation.navigate("ClinicianEvaluation", { patient: item })
                : navigation.navigate("ClinicianTreatment", { patient: item })
            }
            className={`bg-white p-5 mb-4 rounded-xl border-l-4 shadow-sm flex-row justify-between items-center ${activeTab === "NEW" ? "border-red-500" : "border-blue-500"}`}
          >
            <View>
              <Text
                className={`${activeTab === "NEW" ? "text-red-600" : "text-blue-600"} font-bold text-xs mb-1`}
              >
                {activeTab === "NEW"
                  ? "AWAITING EVALUATION"
                  : "RADIOLOGY REPORT READY"}
              </Text>
              <Text className="font-bold text-xl text-slate-900">
                {item.uhid}
              </Text>
              <Text className="text-slate-600 mt-1">
                {item.age} yrs • {item.gender}
              </Text>
            </View>
            <View
              className={`${activeTab === "NEW" ? "bg-red-50" : "bg-blue-50"} px-3 py-2 rounded-lg`}
            >
              <Text
                className={`${activeTab === "NEW" ? "text-red-700" : "text-blue-700"} font-semibold`}
              >
                {activeTab === "NEW" ? "Evaluate ➔" : "Review ➔"}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View className="items-center justify-center mt-20">
            <Text className="text-slate-400 text-lg">Queue is clear.</Text>
          </View>
        }
      />
    </View>
  );
}
