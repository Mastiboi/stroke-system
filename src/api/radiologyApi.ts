import { supabase } from "../lib/supabase";
import * as Crypto from "expo-crypto";

export const uploadCTScan = async (
  uri: string,
  patientId: string,
): Promise<string | null> => {
  try {
    // 1. Convert React Native file URI to Blob
    const response = await fetch(uri);
    const blob = await response.blob();

    // 2. Generate secure, unique file path (patient_id/uuid.ext)
    const fileExt = uri.split(".").pop() || "jpg";
    const fileName = `${Crypto.randomUUID()}.${fileExt}`;
    const filePath = `${patientId}/${fileName}`;

    // 3. Upload to secure private bucket
    const { error } = await supabase.storage
      .from("ct_scans")
      .upload(filePath, blob, {
        contentType: `image/${fileExt === "jpg" ? "jpeg" : fileExt}`,
        upsert: false,
      });

    if (error) throw error;

    // Return the internal path, NOT a public URL
    return filePath;
  } catch (err: any) {
    console.error("Upload failed:", err.message);
    return null;
  }
};

export const submitRadiologyReport = async (
  patientId: string,
  reportText: string,
  filePaths: string[],
): Promise<{ error: Error | null }> => {
  try {
    const { error } = await supabase
      .from("patients")
      .update({
        ct_report_text: reportText,
        scan_image_urls: filePaths,
        status: "TREATMENT_IN_PROGRESS",
        scans_uploaded_at: new Date().toISOString(),
      })
      .eq("id", patientId);

    if (error) throw error;
    return { error: null };
  } catch (err: any) {
    return { error: err };
  }
};
