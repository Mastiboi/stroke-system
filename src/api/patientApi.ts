import { supabase } from "../lib/supabase";
import { EMOPatientForm, PatientRow } from "../types/patient";

export const createPatientAlert = async (
  patientData: EMOPatientForm,
): Promise<{ data: PatientRow | null; error: Error | null }> => {
  try {
    const { data, error } = await supabase
      .from("patients")
      .insert({
        ...patientData,
        status: "AWAITING_CLINICIAN",
        alert_clinician_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return { data: data as PatientRow, error: null };
  } catch (err: any) {
    console.error("Error inserting patient:", err.message);
    return { data: null, error: err };
  }
};
