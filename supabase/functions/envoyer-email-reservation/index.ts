import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const allowedOrigins = ["http://127.0.0.1:5500", "https://yemanja.vercel.app"];

function getCorsHeaders(origin: string | null) {
  const isAllowed = origin && allowedOrigins.includes(origin);
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : allowedOrigins[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

function escapeHtml(text: string): string {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { nom_client, email, telephone, date, heure, nb_personnes, message, nom_restaurant, email_restaurant } = await req.json();

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Réservations <onboarding@resend.dev>",
        to: [email_restaurant],
        subject: `Nouvelle réservation — ${escapeHtml(nom_client)}`,
        html: `
          <h2>Nouvelle réservation</h2>
          <p><strong>Restaurant :</strong> ${escapeHtml(nom_restaurant)}</p>
          <p><strong>Client :</strong> ${escapeHtml(nom_client)}</p>
          <p><strong>Date :</strong> ${escapeHtml(date)} à ${escapeHtml(heure)}</p>
          <p><strong>Nombre de personnes :</strong> ${escapeHtml(String(nb_personnes))}</p>
          <p><strong>Téléphone :</strong> ${escapeHtml(telephone)}</p>
          <p><strong>Email :</strong> ${escapeHtml(email)}</p>
          <p><strong>Message :</strong> ${message ? escapeHtml(message) : "—"}</p>
        `,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      return new Response(JSON.stringify({ error: errorText }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});