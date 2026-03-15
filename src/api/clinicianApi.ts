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
