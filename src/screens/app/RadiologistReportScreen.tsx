import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { PatientRow } from "../../types/patient";
import * as ImagePicker from "expo-image-picker";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { uploadCTScan, submitRadiologyReport } from "../../api/radiologyApi";

type Props = NativeStackScreenProps<any, "RadiologistReport">;

export default function RadiologistReportScreen({ route, navigation }: Props) {
  const { patient } = route.params as { patient: PatientRow };
  const [reportText, setReportText] = useState("");
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      // FIXED: Using array instead of MediaTypeOptions
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const uris = result.assets.map((asset) => asset.uri);
      setSelectedImages((prev) => [...prev, ...uris]);
    }
  };

  const onSubmit = async () => {
    if (!reportText.trim())
      return Alert.alert("Validation Error", "CT Report text is required.");

    setIsSubmitting(true);

    // 1. Upload all selected images concurrently
    const uploadPromises = selectedImages.map((uri) =>
      uploadCTScan(uri, patient.id),
    );
    const uploadedPaths = await Promise.all(uploadPromises);

    // Filter out any failed uploads (nulls)
    const validPaths = uploadedPaths.filter(
      (path): path is string => path !== null,
    );

    if (validPaths.length !== selectedImages.length) {
      Alert.alert(
        "Warning",
        "Some images failed to upload. Proceeding with successful ones.",
      );
    }

    // 2. Submit database update
    const { error } = await submitRadiologyReport(
      patient.id,
      reportText,
      validPaths,
    );

    if (error) {
      Alert.alert("Database Error", error.message);
      setIsSubmitting(false);
    } else {
      Alert.alert(
        "Success",
        "Report uploaded. Clinicians notified for treatment.",
        [{ text: "OK", onPress: () => navigation.goBack() }],
      );
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-slate-900"
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* Patient Context */}
      <View className="bg-slate-800 pt-16 pb-6 px-6 border-b border-slate-700">
        <Text className="text-orange-400 uppercase text-xs font-bold mb-1">
          Clinical Context
        </Text>
        <Text className="text-white text-2xl font-bold">{patient.uhid}</Text>
        <Text className="text-slate-300 mt-1">
          NIHHS Score: {patient.nihhs_score} | BP: {patient.bp}
        </Text>
        <Text className="text-slate-400 text-sm mt-2">
          Onset:{" "}
          {patient.symptom_onset_time
            ? new Date(patient.symptom_onset_time).toLocaleString()
            : "Not recorded"}
        </Text>
      </View>

      <View className="px-6 mt-6 space-y-6">
        {/* Report Text Area */}
        <View>
          <Text className="text-slate-300 font-medium mb-2">
            Radiology Report Details
          </Text>
          <TextInput
            className="w-full p-4 bg-slate-800 border border-slate-700 rounded-xl text-white"
            placeholder="Enter findings (e.g. Hyperdense MCA sign, ASPECT score...)"
            placeholderTextColor="#64748b"
            multiline
            numberOfLines={6}
            style={{ textAlignVertical: "top" }}
            onChangeText={setReportText}
            value={reportText}
          />
        </View>

        {/* Image Picker */}
        <View>
          <Text className="text-slate-300 font-medium mb-2">
            CT Scan Attachments
          </Text>
          <View className="flex-row flex-wrap gap-2 mb-2">
            {selectedImages.map((uri, index) => (
              <Image
                key={index}
                source={{ uri }}
                className="w-20 h-20 rounded-lg bg-slate-800"
              />
            ))}
            <TouchableOpacity
              onPress={pickImage}
              className="w-20 h-20 bg-slate-800 border-2 border-dashed border-slate-600 rounded-lg items-center justify-center"
            >
              <Text className="text-slate-400 text-2xl">+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          className={`w-full p-4 rounded-xl items-center flex-row justify-center mt-4 ${isSubmitting ? "bg-orange-400" : "bg-orange-500"}`}
          onPress={onSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting && (
            <ActivityIndicator color="#ffffff" className="mr-2" />
          )}
          <Text className="text-white font-bold text-lg">
            {isSubmitting
              ? "Uploading Data..."
              : "Upload Scans & Alert Clinicians"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
