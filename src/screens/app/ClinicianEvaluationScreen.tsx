import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { PatientRow } from "../../types/patient";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import DateTimePicker, {
  DateTimePickerAndroid,
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import {
  clinicianEvaluationSchema,
  ClinicianEvaluationForm,
} from "../../types/clinician";
import { submitClinicalEvaluation } from "../../api/clinicianApi";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

type Props = NativeStackScreenProps<any, "ClinicianEvaluation">;

export default function ClinicianEvaluationScreen({
  route,
  navigation,
}: Props) {
  const { patient } = route.params as { patient: PatientRow };
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ClinicianEvaluationForm>({
    resolver: zodResolver(clinicianEvaluationSchema) as any,
    defaultValues: { symptom_onset_time: new Date() },
  });

  const onsetTime = watch("symptom_onset_time");

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setValue("symptom_onset_time", selectedDate);
    } else if (Platform.OS === "ios") {
      setShowDatePicker(false);
    }
  };

  const showAndroidPicker = () => {
    DateTimePickerAndroid.open({
      value: onsetTime,
      mode: "date",
      onChange: (event, selectedDate) => {
        if (event.type === "set" && selectedDate) {
          DateTimePickerAndroid.open({
            value: selectedDate,
            mode: "time",
            is24Hour: true,
            onChange: onDateChange,
          });
        }
      },
    });
  };

  const onSubmit = async (data: ClinicianEvaluationForm) => {
    setIsSubmitting(true);
    const { error } = await submitClinicalEvaluation(patient.id, data);
    if (error) {
      Alert.alert("Update Failed", error.message);
      setIsSubmitting(false);
    } else {
      Alert.alert("Evaluation Saved", "Patient forwarded to Radiology.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <View className="bg-slate-900 pt-16 pb-6 px-6">
        <Text className="text-slate-400 uppercase text-xs font-bold mb-1">
          EMO Handoff Data
        </Text>
        <Text className="text-white text-2xl font-bold">{patient.name}</Text>
        <Text className="text-slate-300 mt-1">
          UHID: {patient.uhid} | {patient.age} yrs
        </Text>
      </View>

      <View className="px-6 mt-6 space-y-4">
        <View>
          <Text className="text-slate-700 font-medium mb-1">
            Symptom Onset Time
          </Text>
          <TouchableOpacity
            onPress={() =>
              Platform.OS === "android"
                ? showAndroidPicker()
                : setShowDatePicker(true)
            }
            className="w-full p-4 bg-white border border-slate-200 rounded-xl"
          >
            <Text className="text-slate-900">{onsetTime.toLocaleString()}</Text>
          </TouchableOpacity>
          {Platform.OS === "ios" && showDatePicker && (
            <DateTimePicker
              value={onsetTime}
              mode="datetime"
              display="default"
              onChange={onDateChange}
            />
          )}
          {errors.symptom_onset_time && (
            <Text className="text-red-500 text-xs mt-1">
              {errors.symptom_onset_time.message}
            </Text>
          )}
        </View>

        <View>
          <Controller
            control={control}
            name="nihhs_score"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className={`w-full p-4 bg-white border rounded-xl ${errors.nihhs_score ? "border-red-500" : "border-slate-200"}`}
                placeholder="NIH Stroke Scale (0-42)"
                keyboardType="numeric"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value?.toString()}
              />
            )}
          />
          {errors.nihhs_score && (
            <Text className="text-red-500 text-xs mt-1">
              {errors.nihhs_score.message}
            </Text>
          )}
        </View>

        <View className="flex-row space-x-4">
          <View className="flex-1">
            <Controller
              control={control}
              name="bp"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className={`w-full p-4 bg-white border rounded-xl ${errors.bp ? "border-red-500" : "border-slate-200"}`}
                  placeholder="BP (e.g. 120/80)"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.bp && (
              <Text className="text-red-500 text-xs mt-1">
                {errors.bp.message}
              </Text>
            )}
          </View>
          <View className="flex-1">
            <Controller
              control={control}
              name="spo2"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className={`w-full p-4 bg-white border rounded-xl ${errors.spo2 ? "border-red-500" : "border-slate-200"}`}
                  placeholder="SpO2 %"
                  keyboardType="numeric"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value?.toString()}
                />
              )}
            />
            {errors.spo2 && (
              <Text className="text-red-500 text-xs mt-1">
                {errors.spo2.message}
              </Text>
            )}
          </View>
        </View>

        <View>
          <Controller
            control={control}
            name="pulse"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className={`w-full p-4 bg-white border rounded-xl ${errors.pulse ? "border-red-500" : "border-slate-200"}`}
                placeholder="Pulse (bpm)"
                keyboardType="numeric"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value?.toString()}
              />
            )}
          />
          {errors.pulse && (
            <Text className="text-red-500 text-xs mt-1">
              {errors.pulse.message}
            </Text>
          )}
        </View>

        <View>
          <Controller
            control={control}
            name="comorbidities"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className="w-full p-4 bg-white border border-slate-200 rounded-xl"
                placeholder="Comorbidities (Optional)"
                multiline
                numberOfLines={3}
                style={{ textAlignVertical: "top" }}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
        </View>

        <TouchableOpacity
          className={`w-full p-4 rounded-xl items-center mt-4 flex-row justify-center ${isSubmitting ? "bg-orange-400" : "bg-orange-500"}`}
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
        >
          {isSubmitting && (
            <ActivityIndicator color="#ffffff" className="mr-2" />
          )}
          <Text className="text-white font-bold text-lg">
            {isSubmitting ? "Processing..." : "Submit & Alert Radiologist"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
