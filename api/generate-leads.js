import { createClient } from '@supabase/supabase-js';

function createSupabaseAdmin() {
  return createClient(
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

function extractCity(formattedAddress) {
  if (!formattedAddress) return null;
  const parts = formattedAddress.split(',').map(p => p.trim());
  if (parts.length >= 3) {
    return parts[parts.length - 3];
  }
  if (parts.length >= 2) {
    return parts[parts.length - 2];
  }
  return null;
}

function extractState(formattedAddress) {
  if (!formattedAddress) return null;
  const parts = formattedAddress.split(',').map(p => p.trim());
  if (parts.length >= 2) {
    const lastPart = parts[parts.length - 1];
    const stateMatch = lastPart.replace(/\d{5}-?\d{3}/, '').trim();
    if (stateMatch) {
      const stateParts = stateMatch.split(' - ');
      return stateParts.length > 1 ? stateParts[0].trim() : stateMatch.split(' ')[0].trim();
    }
  }
  return null;
}

function calculateScore(place) {
  const rating = place.rating || 3;
  const reviewsCount = place.userRatingCount || 0;
  const hasWebsite = place.websiteUri ? 15 : 0;
  const hasPhone = place.nationalPhoneNumber ? 15 : 0;

  let score = Math.round(
    rating * 12 +
    Math.min(reviewsCount / 10, 30) +
    hasWebsite +
    hasPhone
  );

  return Math.max(20, Math.min(100, score));
}

function buildWhatsappUrl(phone) {
  if (!phone) return null;
  const cleaned = phone.replace(/\D/g, '');
  if (!cleaned) return null;
  return `https://wa.me/55${cleaned}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Use POST.' });
  }

  try {
    const { campaignId, segment, location, count, userId } = req.body;

    if (!campaignId || !segment || !location || !count || !userId) {
      return res.status(400).json({
        error: 'Parâmetros obrigatórios ausentes. Envie campaignId, segment, location, count e userId.',
      });
    }

    if (typeof count !== 'number' || count < 1) {
      return res.status(400).json({ error: 'O parâmetro count deve ser um número maior que zero.' });
    }

    const supabase = createSupabaseAdmin();

    // 1. Verificar se o usuário existe e tem créditos suficientes
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, base_credits, purchased_credits')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('Erro ao buscar perfil:', profileError);
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const totalCredits = (profile.base_credits || 0) + (profile.purchased_credits || 0);

    if (totalCredits < count) {
      return res.status(403).json({
        error: `Créditos insuficientes. Você possui ${totalCredits} crédito(s), mas precisa de ${count}.`,
      });
    }

    // 2. Chamar a API do Google Places (Text Search)
    const maxResultCount = Math.min(count, 20);
    const textQuery = `${segment} em ${location}`;

    const placesResponse = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask': [
          'places.displayName',
          'places.formattedAddress',
          'places.nationalPhoneNumber',
          'places.internationalPhoneNumber',
          'places.websiteUri',
          'places.googleMapsUri',
          'places.rating',
          'places.userRatingCount',
          'places.id',
          'places.primaryTypeDisplayName',
        ].join(','),
      },
      body: JSON.stringify({
        textQuery,
        languageCode: 'pt-BR',
        maxResultCount,
      }),
    });

    if (!placesResponse.ok) {
      const errorBody = await placesResponse.text();
      console.error('Erro na API do Google Places:', placesResponse.status, errorBody);
      return res.status(502).json({
        error: 'Erro ao buscar dados do Google Places. Tente novamente mais tarde.',
      });
    }

    const placesData = await placesResponse.json();
    const places = placesData.places || [];

    if (places.length === 0) {
      return res.status(200).json({
        leads: [],
        message: 'Nenhum resultado encontrado para a busca. Tente outro segmento ou localização.',
      });
    }

    // 3. Montar os objetos de lead
    const leadsToInsert = places.map((place) => {
      const phone = place.nationalPhoneNumber || place.internationalPhoneNumber || null;
      
      return {
        user_id: userId,
        campaign_id: campaignId,
        name: place.displayName?.text || 'Sem nome',
        phone,
        website: place.websiteUri || null,
        google_place_id: place.id || null,
        google_rating: place.rating || null,
        google_reviews_count: place.userRatingCount || null,
        city: extractCity(place.formattedAddress),
        state: extractState(place.formattedAddress),
        source: 'google_maps',
        segment,
        status: 'novo',
        score: calculateScore(place),
        whatsapp_url: buildWhatsappUrl(phone),
        bio: `${segment} — ${place.formattedAddress || ''}`,
      };
    });

    // 4. Inserir leads na tabela
    const { data: createdLeads, error: insertError } = await supabase
      .from('leads')
      .insert(leadsToInsert)
      .select();

    if (insertError) {
      console.error('Erro ao inserir leads:', insertError);
      return res.status(500).json({ error: 'Erro ao salvar os leads. Tente novamente.' });
    }

    const leadsGenerated = createdLeads.length;

    // 5. Atualizar o contador de leads gerados na campanha
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('generated_leads')
      .eq('id', campaignId)
      .single();

    if (campaign) {
      await supabase
        .from('campaigns')
        .update({ generated_leads: (campaign.generated_leads || 0) + leadsGenerated })
        .eq('id', campaignId);
    }

    // 6. Deduzir créditos: primeiro de base_credits, depois de purchased_credits
    let remaining = leadsGenerated;
    let newBaseCredits = profile.base_credits || 0;
    let newPurchasedCredits = profile.purchased_credits || 0;

    if (newBaseCredits >= remaining) {
      newBaseCredits -= remaining;
      remaining = 0;
    } else {
      remaining -= newBaseCredits;
      newBaseCredits = 0;
      newPurchasedCredits -= remaining;
      remaining = 0;
    }

    const { error: updateCreditsError } = await supabase
      .from('profiles')
      .update({
        base_credits: Math.max(0, newBaseCredits),
        purchased_credits: Math.max(0, newPurchasedCredits),
      })
      .eq('id', userId);

    if (updateCreditsError) {
      console.error('Erro ao atualizar créditos:', updateCreditsError);
    }

    // 7. Criar registro de transação de créditos
    const balanceBefore = totalCredits;
    const balanceAfter = Math.max(0, newBaseCredits) + Math.max(0, newPurchasedCredits);

    const { data: transactionData, error: transactionError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: userId,
        type: 'lead_generation',
        amount: -leadsGenerated,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        reason: `Geração de ${leadsGenerated} lead(s) — ${segment} em ${location}`,
      })
      .select()
      .single();

    if (transactionError) {
      console.error('Erro ao criar transação de créditos:', transactionError);
    }

    // 8. Retornar os leads criados com dados de crédito para sync do frontend
    return res.status(200).json({
      leads: createdLeads,
      message: `${leadsGenerated} lead(s) gerado(s) com sucesso.`,
      creditsUsed: leadsGenerated,
      creditsRemaining: balanceAfter,
      credits: {
        base_credits: Math.max(0, newBaseCredits),
        purchased_credits: Math.max(0, newPurchasedCredits),
      },
      transaction: transactionData || null,
    });
  } catch (err) {
    console.error('Erro inesperado em generate-leads:', err);
    return res.status(500).json({ error: 'Erro interno do servidor. Tente novamente mais tarde.' });
  }
}
