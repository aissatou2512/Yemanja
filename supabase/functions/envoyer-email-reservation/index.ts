import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Le navigateur envoie d'abord une requête OPTIONS pour vérifier les permissions
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { nom_client, email, telephone, date, heure, nb_personnes, nom_restaurant, email_restaurant } = await req.json();

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Réservations <onboarding@resend.dev>",
        to: [email_restaurant],
        subject: `Nouvelle réservation — ${nom_client}`,
        html: `
          <h2>Nouvelle réservation</h2>
          <p><strong>Restaurant :</strong> ${nom_restaurant}</p>
          <p><strong>Client :</strong> ${nom_client}</p>
          <p><strong>Date :</strong> ${date} à ${heure}</p>
          <p><strong>Nombre de personnes :</strong> ${nb_personnes}</p>
          <p><strong>Téléphone :</strong> ${telephone}</p>
          <p><strong>Email :</strong> ${email}</p>
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