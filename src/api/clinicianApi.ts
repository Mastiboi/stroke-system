import { supabase } from "../lib/supabase";
import { ClinicianEvaluationForm } from "../types/clinician";

export const submitClinicalEvaluation = async (
  patientId: string,
  data: ClinicianEvaluationForm,
): Promise<{ error: Error | null }> => {
  try {
    const { error } = await supabase
      .from("patients")
      .update({
        symptom_onset_time: data.symptom_onset_time.toISOString(),
        nihhs_score: data.nihhs_score,
        bp: data.bp,
        spo2: data.spo2,
        pulse: data.pulse,
        comorbidities: data.comorbidities || null,
        status: "AWAITING_RADIOLOGIST",
        alert_radiologist_at: new Date().toISOString(),
      })
      .eq("id", patientId);

    if (error) throw error;

    return { error: null };
  } catch (err: any) {
    console.error("Failed to submit evaluation:", err.message);
    return { error: err };
  }
};

export const getSignedImageUrls = async (
  paths: string[] | null,
): Promise<string[]> => {
  if (!paths || paths.length === 0) return [];
  try {
    // Generate URLs that expire in 60 seconds for strict security
    const { data, error } = await supabase.storage
      .from("ct_scans")
      .createSignedUrls(paths, 60);

    if (error) throw error;
    // Filter out any failed generations and return the secure URLs
    return (
      data
        ?.map((item) => item.signedUrl)
        .filter((url): url is string => !!url) || []
    );
  } catch (err: any) {
    console.error("Failed to generate signed URLs:", err.message);
    return [];
  }
};

export const completeTreatment = async (
  patientId: string,
): Promise<{ error: Error | null }> => {
  try {
    const { error } = await supabase
      .from("patients")
      .update({
        status: "COMPLETED",
        treatment_completed_at: new Date().toISOString(),
      })
      .eq("id", patientId);

    if (error) throw error;
    return { error: null };
  } catch (err: any) {
    return { error: err };
  }
};
