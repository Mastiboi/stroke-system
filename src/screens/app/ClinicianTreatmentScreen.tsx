import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { PatientRow } from "../../types/patient";
import { getSignedImageUrls, completeTreatment } from "../../api/clinicianApi";

type Props = NativeStackScreenProps<any, "ClinicianTreatment">;

export default function ClinicianTreatmentScreen({ route, navigation }: Props) {
  const { patient } = route.params as { patient: PatientRow };
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [loadingImages, setLoadingImages] = useState(true);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    const fetchImages = async () => {
      const urls = await getSignedImageUrls(patient.scan_image_urls || null);
      setImageUrls(urls);
      setLoadingImages(false);
    };
    fetchImages();
  }, [patient.scan_image_urls]);

  const handleComplete = async () => {
    setIsCompleting(true);
    const { error } = await completeTreatment(patient.id);

    if (error) {
      Alert.alert("Error", error.message);
      setIsCompleting(false);
    } else {
      Alert.alert("Treatment Complete", "Patient code stroke finalized.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    }
  };

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View className="bg-blue-600 pt-16 pb-6 px-6 shadow-sm">
          <Text className="text-blue-200 uppercase text-xs font-bold tracking-wider mb-1">
            Final Review
          </Text>
          <Text className="text-white text-3xl font-bold">{patient.uhid}</Text>
          <Text className="text-blue-100 mt-1">
            {patient.name} • {patient.age} yrs • {patient.gender}
          </Text>
        </View>

        <View className="px-6 mt-6 space-y-6">
          {/* Clinical Data Summary */}
          <View className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <Text className="text-slate-800 font-bold text-lg mb-3">
              Clinical Vitals
            </Text>
            <View className="flex-row flex-wrap gap-y-4">
              <View className="w-1/2">
                <Text className="text-slate-500 text-xs">NIHHS Score</Text>
                <Text className="font-semibold text-lg text-slate-900">
                  {patient.nihhs_score}
                </Text>
              </View>
              <View className="w-1/2">
                <Text className="text-slate-500 text-xs">Blood Pressure</Text>
                <Text className="font-semibold text-lg text-slate-900">
                  {patient.bp}
                </Text>
              </View>
              <View className="w-1/2">
                <Text className="text-slate-500 text-xs">SpO2</Text>
                <Text className="font-semibold text-lg text-slate-900">
                  {patient.spo2}%
                </Text>
              </View>
              <View className="w-1/2">
                <Text className="text-slate-500 text-xs">Pulse</Text>
                <Text className="font-semibold text-lg text-slate-900">
                  {patient.pulse} bpm
                </Text>
              </View>
            </View>
            {patient.comorbidities && (
              <View className="mt-4 pt-4 border-t border-slate-100">
                <Text className="text-slate-500 text-xs">Comorbidities</Text>
                <Text className="text-slate-800 mt-1">
                  {patient.comorbidities}
                </Text>
              </View>
            )}
          </View>

          {/* Radiology Report */}
          <View className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <Text className="text-slate-800 font-bold text-lg mb-2">
              Radiology Report
            </Text>
            <Text className="text-slate-700 leading-relaxed">
              {patient.ct_report_text}
            </Text>
          </View>

          {/* Secure Image Viewer */}
          <View>
            <Text className="text-slate-800 font-bold text-lg mb-3">
              CT Scans
            </Text>
            {loadingImages ? (
              <ActivityIndicator
                size="small"
                color="#2563eb"
                className="self-start"
              />
            ) : imageUrls.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="flex-row overflow-visible"
              >
                {imageUrls.map((url, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => setFullScreenImage(url)}
                    className="mr-3"
                  >
                    <Image
                      source={{ uri: url }}
                      className="w-32 h-32 rounded-xl bg-slate-200"
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <Text className="text-slate-500 italic">No images attached.</Text>
            )}
          </View>

          {/* Finalize Button */}
          <TouchableOpacity
            className={`w-full p-4 rounded-xl items-center flex-row justify-center mt-4 ${isCompleting ? "bg-emerald-400" : "bg-emerald-600"}`}
            onPress={handleComplete}
            disabled={isCompleting}
          >
            {isCompleting && (
              <ActivityIndicator color="#ffffff" className="mr-2" />
            )}
            <Text className="text-white font-bold text-lg">
              {isCompleting ? "Finalizing..." : "Mark Treatment as Complete"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Full Screen Image Modal */}
      <Modal
        visible={!!fullScreenImage}
        transparent={true}
        animationType="fade"
      >
        <View className="flex-1 bg-black/95 justify-center items-center">
          <TouchableOpacity
            className="absolute top-12 right-6 z-10 bg-slate-800/50 p-3 rounded-full"
            onPress={() => setFullScreenImage(null)}
          >
            <Text className="text-white font-bold">Close X</Text>
          </TouchableOpacity>
          {fullScreenImage && (
            <Image
              source={{ uri: fullScreenImage }}
              className="w-full h-3/4"
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </View>
  );
}
