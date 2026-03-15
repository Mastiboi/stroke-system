import { supabase } from "../lib/supabase";
import * as Crypto from "expo-crypto";

export const uploadCTScan = async (
  uri: string,
  patientId: string,
): Promise<string | null> => {
  try {
    const fileExt = uri.split(".").pop() || "jpg";
    const fileName = `${Crypto.randomUUID()}.${fileExt}`;
    const filePath = `${patientId}/${fileName}`;

    // 1. Construct React Native FormData to natively stream the file
    const formData = new FormData();
    formData.append("file", {
      uri: uri,
      name: fileName,
      type: `image/${fileExt === "jpg" ? "jpeg" : fileExt}`,
    } as any); // Cast to 'any' to satisfy TypeScript for RN's custom FormData structure

    // 2. Upload the form data directly to Supabase
    const { error } = await supabase.storage
      .from("ct_scans")
      .upload(filePath, formData);

    if (error) throw error;

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
