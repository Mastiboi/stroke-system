import { z } from "zod";

export const clinicianEvaluationSchema = z.object({
  symptom_onset_time: z.date({
    required_error: "Symptom onset time is critical.",
  }),
  nihhs_score: z.coerce
    .number()
    .int()
    .min(0)
    .max(42, "NIH Stroke Scale must be between 0 and 42."),
  bp: z
    .string()
    .regex(/^\d{2,3}\/\d{2,3}$/, "BP must be in format SYS/DIA (e.g., 120/80)"),
  spo2: z.coerce
    .number()
    .int()
    .min(0, "Invalid SPO2")
    .max(100, "SPO2 cannot exceed 100%"),
  pulse: z.coerce
    .number()
    .int()
    .min(0, "Invalid Pulse")
    .max(300, "Invalid Pulse"),
  comorbidities: z.string().optional(),
});

export type ClinicianEvaluationForm = z.infer<typeof clinicianEvaluationSchema>;
