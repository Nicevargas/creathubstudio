// Siga o tutorial do Supabase para Webhooks: https://supabase.com/docs/guides/functions/examples/stripe-webhooks
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

declare const Deno: any;

// @ts-ignore
const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
if (!stripeKey) {
  throw new Error('Variável de ambiente STRIPE_SECRET_KEY não configurada');
}
const stripe = new Stripe(stripeKey, {
  apiVersion: '2022-11-15',
  httpClient: Stripe.createFetchHttpClient(),
})

// Assinatura do segredo do Webhook (pegue no Dashboard do Stripe > Developers > Webhooks)
// Ex: whsec_...
const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')

  let event;
  try {
    const body = await req.text()
    // Se tiver o segredo configurado, verifica a assinatura
    if (endpointSecret && signature) {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret)
    } else {
      // Modo inseguro apenas para testes rápidos se não configurar o segredo
      event = JSON.parse(body); 
    }
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  // Configuração do Supabase Admin (Service Role Key)
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

  // Trata o evento de sessão completada
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    const userId = session.metadata?.user_id;
    const imageCreditsToAdd = parseInt(session.metadata?.image_credits || '0');
    const videoCreditsToAdd = parseInt(session.metadata?.video_credits || '0');

    if (userId) {
      console.log(`Adicionando créditos para usuário ${userId}: ${imageCreditsToAdd} img, ${videoCreditsToAdd} vid`);
      
      // Chama a função RPC segura do banco (você deve criar essa função no SQL Editor)
      const { error } = await supabase.rpc('increment_credits', {
        user_id: userId,
        img_amount: imageCreditsToAdd,
        vid_amount: videoCreditsToAdd
      });

      if (error) {
        console.error('Erro ao atualizar créditos no Supabase:', error);
        return new Response('Erro ao atualizar banco', { status: 500 });
      }
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})