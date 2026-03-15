import React, { useEffect, useState } from "react";
import { View, Text, FlatList } from "react-native";
import { supabase } from "../lib/supabase";
import { PatientRow } from "../types/patient";

export default function RecentPatientsList() {
  const [patients, setPatients] = useState<PatientRow[]>([]);

  useEffect(() => {
    // 1. Fetch initial data
    const fetchPatients = async () => {
      const { data } = await supabase
        .from("patients")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (data) setPatients(data as PatientRow[]);
    };

    fetchPatients();

    // 2. Subscribe to real-time inserts
    const channel = supabase
      .channel("public:patients")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "patients" },
        (payload) => {
          const newPatient = payload.new as PatientRow;
          setPatients((current) => [newPatient, ...current].slice(0, 10));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "AWAITING_CLINICIAN":
        return "bg-red-100 text-red-800 border-red-200";
      case "AWAITING_RADIOLOGIST":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "TREATMENT_IN_PROGRESS":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "COMPLETED":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  return (
    <View className="flex-1 mt-8">
      <Text className="text-xl font-bold text-slate-800 mb-4 px-4">
        Active Stroke Codes
      </Text>
      <FlatList
        data={patients}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <View className="bg-white p-4 mx-4 mb-3 rounded-xl border border-slate-100 shadow-sm">
            <View className="flex-row justify-between items-start mb-2">
              <Text className="font-bold text-lg text-slate-900">
                UHID: {item.uhid}
              </Text>
              <Text className="text-sm text-slate-500">
                {new Date(item.created_at).toLocaleTimeString()}
              </Text>
            </View>
            <Text className="text-slate-600 mb-3">
              {item.age} yrs • {item.gender}
            </Text>
            <View className="self-start">
              <Text
                className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(item.status)}`}
              >
                {item.status.replace(/_/g, " ")}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text className="text-center text-slate-500 mt-4">
            No active patients.
          </Text>
        }
      />
    </View>
  );
}
