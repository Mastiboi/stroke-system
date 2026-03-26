import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Picker } from "@react-native-picker/picker";
import { emoPatientSchema, EMOPatientForm } from "../../types/patient";
import { createPatientAlert } from "../../api/patientApi";
import RecentPatientsList from "../../components/RecentPatientsList";
import { useAuthStore } from "../../store/useAuthStore";

export default function EMODashboard() {
  const { signOut, profile } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EMOPatientForm>({
    resolver: zodResolver(emoPatientSchema) as any,
    defaultValues: { gender: "Male" },
  });

  const onSubmit = async (data: EMOPatientForm) => {
    setIsSubmitting(true);
    const { error } = await createPatientAlert(data);

    if (error) {
      Alert.alert("Submission Failed", error.message);
    } else {
      Alert.alert(
        "Code Stroke Activated",
        `Clinicians have been notified for UHID: ${data.uhid}`,
      );
      reset(); // Clear form on success
    }
    setIsSubmitting(false);
  };

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* Header */}
      <View className="bg-blue-600 pt-16 pb-6 px-6 flex-row justify-between items-center rounded-b-3xl shadow-sm">
        <View>
          <Text className="text-white/80 font-medium">EMO Portal</Text>
          <Text className="text-white text-2xl font-bold">
            New Patient Intake
          </Text>
        </View>
        <TouchableOpacity
          onPress={signOut}
          className="bg-blue-700 px-4 py-2 rounded-lg"
        >
          <Text className="text-white font-medium">Log Out</Text>
        </TouchableOpacity>
      </View>

      {/* Triage Form */}
      <View className="px-6 mt-6 space-y-4">
        <View>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className={`w-full p-4 bg-white text-slate-900 border rounded-xl ${errors.name ? "border-red-500" : "border-slate-200"}`}
                placeholder="Patient Name"
                placeholderTextColor="#94a3b8"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value || ""}
              />
            )}
          />
          {errors.name && (
            <Text className="text-red-500 text-xs mt-1 ml-1">
              {errors.name.message}
            </Text>
          )}
        </View>

        <View className="flex-row space-x-4">
          <View className="flex-1">
            <Controller
              control={control}
              name="age"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className={`w-full p-4 bg-white text-slate-900 border rounded-xl ${errors.age ? "border-red-500" : "border-slate-200"}`}
                  placeholder="Age"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value?.toString() || ""}
                />
              )}
            />
            {errors.age && (
              <Text className="text-red-500 text-xs mt-1 ml-1">
                {errors.age.message}
              </Text>
            )}
          </View>

          <View className="flex-1 bg-white border border-slate-200 rounded-xl overflow-hidden justify-center">
            <Controller
              control={control}
              name="gender"
              render={({ field: { onChange, value } }) => (
                <Picker
                  selectedValue={value}
                  onValueChange={onChange}
                  style={{ color: "#0f172a" }} // Force text color
                >
                  <Picker.Item label="Male" value="Male" />
                  <Picker.Item label="Female" value="Female" />
                  <Picker.Item label="Other" value="Other" />
                </Picker>
              )}
            />
          </View>
        </View>

        <View>
          <Controller
            control={control}
            name="uhid"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className={`w-full p-4 bg-white text-slate-900 border rounded-xl ${errors.uhid ? "border-red-500" : "border-slate-200"}`}
                placeholder="Hospital UHID"
                placeholderTextColor="#94a3b8"
                autoCapitalize="characters"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value || ""}
              />
            )}
          />
          {errors.uhid && (
            <Text className="text-red-500 text-xs mt-1 ml-1">
              {errors.uhid.message}
            </Text>
          )}
        </View>

        <View>
          <Controller
            control={control}
            name="contact"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className={`w-full p-4 bg-white text-slate-900 border rounded-xl ${errors.contact ? "border-red-500" : "border-slate-200"}`}
                placeholder="Emergency Contact Number"
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value || ""}
              />
            )}
          />
          {errors.contact && (
            <Text className="text-red-500 text-xs mt-1 ml-1">
              {errors.contact.message}
            </Text>
          )}
        </View>

        <TouchableOpacity
          className={`w-full p-4 rounded-xl items-center mt-2 flex-row justify-center ${isSubmitting ? "bg-red-400" : "bg-red-600"}`}
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
        >
          {isSubmitting && (
            <ActivityIndicator color="#ffffff" className="mr-2" />
          )}
          <Text className="text-white font-bold text-lg">
            {isSubmitting ? "Processing..." : "Submit & Alert Clinicians"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Real-time Feed */}
      <RecentPatientsList />
    </ScrollView>
  );
}
