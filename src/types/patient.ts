import { z } from "zod";

// Strict validation for the EMO entry point
export const emoPatientSchema = z.object({
  name: z.string().min(2, "Patient name is required"),
  gender: z.enum(["Male", "Female", "Other"], {
    required_error: "Gender is required",
  }),
  age: z.coerce
    .number()
    .int()
    .min(0, "Age must be positive")
    .max(120, "Invalid age"),
  uhid: z.string().min(4, "UHID is required for tracking"),
  contact: z.string().min(10, "Valid contact number required"),
});

export type EMOPatientForm = z.infer<typeof emoPatientSchema>;

// Represents the read-model of the patient row
export interface PatientRow {
  id: string;
  name: string;
  gender: string;
  age: number;
  uhid: string;
  contact: string;
  status:
    | "AWAITING_CLINICIAN"
    | "AWAITING_RADIOLOGIST"
    | "TREATMENT_IN_PROGRESS"
    | "COMPLETED";
  created_at: string;
  updated_at: string;
  alert_clinician_at: string | null;
}
