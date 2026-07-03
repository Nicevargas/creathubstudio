import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'

// @ts-ignore
const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
if (!stripeKey) {
  throw new Error('Variável de ambiente STRIPE_SECRET_KEY não configurada');
}
const stripe = new Stripe(stripeKey, {
  apiVersion: '2022-11-15',
  httpClient: Stripe.createFetchHttpClient(),
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Recebe os dados do frontend incluindo a quantidade de créditos
    const { priceId, userId, imageCredits, videoCredits, returnUrl } = await req.json()

    if (!priceId || !userId) {
      throw new Error('Missing priceId or userId');
    }

    // Cria a sessão de checkout no Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId, 
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${returnUrl}/#/credits?success=true`,
      cancel_url: `${returnUrl}/#/credits?canceled=true`,
      metadata: {
        user_id: userId,
        // Passa os créditos para o webhook saber o quanto adicionar
        image_credits: imageCredits,
        video_credits: videoCredits
      },
    })

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error("Stripe Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})