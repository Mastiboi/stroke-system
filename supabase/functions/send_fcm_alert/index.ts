import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { JWT } from "npm:google-auth-library@9";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const payload = await req.json();
    const { record, old_record } = payload;

    // 1. Exit if status hasn't changed
    if (!record || (old_record && record.status === old_record.status)) {
      return new Response(JSON.stringify({ message: "No status change" }), { headers: corsHeaders });
    }

    // 2. Determine target role
    let targetRole = "";
    if (record.status === "AWAITING_CLINICIAN") targetRole = "CLINICIAN";
    else if (record.status === "AWAITING_RADIOLOGIST") targetRole = "RADIOLOGIST";
    else return new Response(JSON.stringify({ message: "No alert needed" }), { headers: corsHeaders });

    // 3. Initialize Admin Client to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 4. Fetch device tokens for the target role
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("fcm_token")
      .eq("role", targetRole)
      .not("fcm_token", "is", null);

    if (profileError || !profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ message: "No tokens found" }), { headers: corsHeaders });
    }

    const tokens = profiles.map((p) => p.fcm_token).filter(Boolean);

    // 5. Authenticate with Google FCM HTTP v1 API
    const serviceAccountStr = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");
    if (!serviceAccountStr) throw new Error("Missing FIREBASE_SERVICE_ACCOUNT secret");

    const serviceAccount = JSON.parse(serviceAccountStr);
    const jwtClient = new JWT({
      email: serviceAccount.client_email,
      key: serviceAccount.private_key,
      scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
    });

    const tokensInfo = await jwtClient.getAccessToken();
    const accessToken = tokensInfo.token;
    const fcmUrl = `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`;

    // 6. Dispatch HIPAA-Compliant Notifications
    const pushPromises = tokens.map((token) =>
      fetch(fcmUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          message: {
            token: token,
            notification: {
              title: "🚨 Stroke Alert Update",
              body: "A patient requires your immediate attention. Please check the dashboard.",
            },
          },
        }),
      })
    );

    await Promise.all(pushPromises);

    return new Response(JSON.stringify({ message: `Sent ${tokens.length} alerts.` }), {
      headers: corsHeaders,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});