import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import { PLANS } from '../data/plans.js';
import { consumeCredits, addCredits, getTotalCredits } from '../utils/creditEngine.js';
import { generatePersonalizedLeadMessage } from '../utils/messageGenerator.js';
import { getStatusLabel } from '../utils/formatters.js';
import { useAuth } from './AuthContext.jsx';
import { useToast } from './ToastContext.jsx';

const AppContext = createContext(null);

// Helper: map DB row (snake_case) to app object (camelCase) for leads
function mapLeadFromDB(row) {
  return {
    id: row.id,
    userId: row.user_id,
    campaignId: row.campaign_id,
    name: row.name,
    username: row.username || '',
    phone: row.phone || '',
    whatsappUrl: row.whatsapp_url || '',
    instagramUrl: row.instagram_url || '',
    website: row.website || '',
    city: row.city || '',
    state: row.state || '',
    source: row.source || 'google_maps',
    score: row.score || 50,
    status: row.status || 'novo',
    segment: row.segment || '',
    bio: row.bio || '',
    notes: row.notes || '',
    lossReason: row.loss_reason || '',
    googlePlaceId: row.google_place_id,
    googleRating: row.google_rating,
    googleReviewsCount: row.google_reviews_count,
    personalizedMessage: row.personalized_message || '',
    messageDirect: row.message_direct || '',
    messageConsultative: row.message_consultative || '',
    messageLight: row.message_light || '',
    personalizationReason: row.personalization_reason || '',
    icebreaker: row.icebreaker || '',
    customCta: row.custom_cta || '',
    detectedPainPoints: row.detected_pain_points || [],
    detectedOpportunities: row.detected_opportunities || [],
    firstMessage: row.first_message || '',
    lastMessage: row.last_message || '',
    lastInteractionAt: row.last_interaction_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Helper: map DB row for campaigns
function mapCampaignFromDB(row) {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    offer: row.offer || '',
    segment: row.segment || '',
    location: row.location || '',
    keywords: row.keywords || [],
    tone: row.tone || 'consultivo',
    channel: row.channel || 'whatsapp',
    personalizationLevel: row.personalization_level || 'normal',
    generatedLeads: row.generated_leads || 0,
    contactedLeads: row.contacted_leads || 0,
    respondedLeads: row.responded_leads || 0,
    closedLeads: row.closed_leads || 0,
    status: row.status || 'ativa',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Helper: map camelCase campaign to snake_case for DB
function mapCampaignToDB(data) {
  const mapped = {};
  const keyMap = {
    name: 'name', offer: 'offer', segment: 'segment', location: 'location',
    keywords: 'keywords', tone: 'tone', channel: 'channel',
    personalizationLevel: 'personalization_level',
    generatedLeads: 'generated_leads', contactedLeads: 'contacted_leads',
    respondedLeads: 'responded_leads', closedLeads: 'closed_leads',
    status: 'status',
  };
  for (const [key, val] of Object.entries(data)) {
    if (keyMap[key]) mapped[keyMap[key]] = val;
    else if (key.includes('_')) mapped[key] = val; // Already snake_case
  }
  return mapped;
}

// Helper: map camelCase lead updates to snake_case for DB
function mapLeadToDB(data) {
  const mapped = {};
  const keyMap = {
    name: 'name', username: 'username', phone: 'phone',
    whatsappUrl: 'whatsapp_url', instagramUrl: 'instagram_url',
    website: 'website', city: 'city', state: 'state',
    source: 'source', score: 'score', status: 'status',
    segment: 'segment', bio: 'bio', notes: 'notes',
    lossReason: 'loss_reason',
    personalizedMessage: 'personalized_message',
    messageDirect: 'message_direct', messageConsultative: 'message_consultative',
    messageLight: 'message_light', personalizationReason: 'personalization_reason',
    icebreaker: 'icebreaker', customCta: 'custom_cta',
    detectedPainPoints: 'detected_pain_points',
    detectedOpportunities: 'detected_opportunities',
    firstMessage: 'first_message', lastMessage: 'last_message',
    lastInteractionAt: 'last_interaction_at',
  };
  for (const [key, val] of Object.entries(data)) {
    if (keyMap[key]) mapped[keyMap[key]] = val;
    else if (key.includes('_')) mapped[key] = val;
  }
  return mapped;
}

export function AppProvider({ children }) {
  const { user, updateUser, isAdmin } = useAuth();
  const toast = useToast();
  const initialFetchDone = useRef(false);

  const [leads, setLeads] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [payments, setPayments] = useState([]);
  const [creditTransactions, setCreditTransactions] = useState([]);
  const [interactions, setInteractions] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // ---- FETCH ALL DATA ON LOGIN ----
  useEffect(() => {
    if (!user?.id) {
      // Reset state on logout
      setLeads([]);
      setCampaigns([]);
      setFeedbacks([]);
      setPayments([]);
      setCreditTransactions([]);
      setInteractions([]);
      setAllUsers([]);
      setIsDataLoading(false);
      initialFetchDone.current = false;
      return;
    }

    if (initialFetchDone.current) return;
    initialFetchDone.current = true;

    async function fetchAll() {
      setIsDataLoading(true);
      try {
        const [
          campaignsRes,
          leadsRes,
          interactionsRes,
          feedbacksRes,
          paymentsRes,
          creditTxnRes,
        ] = await Promise.all([
          supabase.from('campaigns').select('*').order('created_at', { ascending: false }),
          supabase.from('leads').select('*').order('created_at', { ascending: false }),
          supabase.from('interactions').select('*').order('created_at', { ascending: false }),
          supabase.from('feedbacks').select('*').order('created_at', { ascending: false }),
          supabase.from('payments').select('*').order('created_at', { ascending: false }),
          supabase.from('credit_transactions').select('*').order('created_at', { ascending: false }),
        ]);

        if (campaignsRes.data) setCampaigns(campaignsRes.data.map(mapCampaignFromDB));
        if (leadsRes.data) setLeads(leadsRes.data.map(mapLeadFromDB));
        if (interactionsRes.data) setInteractions(interactionsRes.data.map(row => ({
          id: row.id, userId: row.user_id, leadId: row.lead_id,
          type: row.type, message: row.message, direction: row.direction,
          createdAt: row.created_at,
        })));
        if (feedbacksRes.data) setFeedbacks(feedbacksRes.data.map(row => ({
          id: row.id, userId: row.user_id, type: row.type,
          message: row.message, status: row.status, createdAt: row.created_at,
        })));
        if (paymentsRes.data) setPayments(paymentsRes.data.map(row => ({
          id: row.id, userId: row.user_id, planId: row.plan_id,
          amount: row.amount, status: row.status, provider: row.provider,
          providerPaymentId: row.stripe_payment_id, productType: row.product_type,
          creditsPurchased: row.credits_purchased, createdAt: row.created_at,
        })));
        if (creditTxnRes.data) setCreditTransactions(creditTxnRes.data.map(row => ({
          id: row.id, userId: row.user_id, type: row.type,
          amount: row.amount, balanceBefore: row.balance_before,
          balanceAfter: row.balance_after, reason: row.reason,
          paymentId: row.payment_id, createdAt: row.created_at,
        })));

        // Admin: fetch all users
        if (isAdmin) {
          const { data: usersData } = await supabase.from('profiles').select('*');
          if (usersData) {
            setAllUsers(usersData.map(p => ({
              id: p.id, name: p.name, email: '', // Email from auth, not in profiles
              avatarUrl: p.avatar_url, role: p.role, planId: p.plan_id,
              subscriptionStatus: p.subscription_status,
              stripeCustomerId: p.stripe_customer_id,
              whatsappPhone: p.whatsapp_phone || '',
              onboardingCompleted: p.onboarding_completed,
              creditWallet: { baseCredits: p.base_credits, purchasedCredits: p.purchased_credits },
              createdAt: p.created_at, updatedAt: p.updated_at,
            })));
          }
        }
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
      } finally {
        setIsDataLoading(false);
      }
    }

    fetchAll();
  }, [user?.id, isAdmin]);

  // ---- CAMPAIGNS ----
  const createCampaign = useCallback(async (campaignData) => {
    const dbData = {
      ...mapCampaignToDB(campaignData),
      user_id: user?.id,
      generated_leads: 0,
      contacted_leads: 0,
      responded_leads: 0,
      closed_leads: 0,
      status: 'ativa',
    };

    const { data, error } = await supabase
      .from('campaigns')
      .insert(dbData)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar campanha:', error);
      toast.error('Erro', 'Não foi possível criar a campanha.');
      return null;
    }

    const mapped = mapCampaignFromDB(data);
    setCampaigns(prev => [mapped, ...prev]);
    return mapped;
  }, [user, toast]);

  const updateCampaign = useCallback(async (id, updates) => {
    const dbUpdates = {
      ...mapCampaignToDB(updates),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('campaigns')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      console.error('Erro ao atualizar campanha:', error);
      return;
    }

    setCampaigns(prev => prev.map(c =>
      c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
    ));
  }, []);

  const deleteCampaign = useCallback(async (id) => {
    const { error } = await supabase.from('campaigns').delete().eq('id', id);
    if (error) {
      console.error('Erro ao deletar campanha:', error);
      return;
    }
    setCampaigns(prev => prev.filter(c => c.id !== id));
  }, []);

  // ---- LEADS ----
  const generateLeadsForCampaign = useCallback(async (campaign, count) => {
    // Check credits locally first
    if (!isAdmin) {
      const available = getTotalCredits(user?.creditWallet);
      if (available < count) {
        toast.error('Créditos insuficientes', `Você precisa de ${count} créditos. Disponível: ${available}`);
        return null;
      }
    }

    try {
      // Call the serverless API function
      const response = await fetch('/api/generate-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: campaign.id,
          segment: campaign.segment,
          location: campaign.location,
          count,
          userId: user?.id,
          // Pass campaign data for message generation on the server
          offer: campaign.offer,
          tone: campaign.tone || 'consultivo',
          channel: campaign.channel || 'whatsapp',
          personalizationLevel: campaign.personalizationLevel || 'normal',
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Erro ao gerar leads');
      }

      const result = await response.json();
      const newLeads = (result.leads || []).map(mapLeadFromDB);

      // Update local state
      setLeads(prev => [...newLeads, ...prev]);
      setCampaigns(prev => prev.map(c =>
        c.id === campaign.id
          ? { ...c, generatedLeads: (c.generatedLeads || 0) + newLeads.length }
          : c
      ));

      // Refresh user credits from profile
      if (result.credits) {
        updateUser({
          creditWallet: {
            baseCredits: result.credits.base_credits,
            purchasedCredits: result.credits.purchased_credits,
          }
        });
      }

      if (result.transaction) {
        setCreditTransactions(prev => [{
          id: result.transaction.id,
          userId: result.transaction.user_id,
          type: result.transaction.type,
          amount: result.transaction.amount,
          balanceBefore: result.transaction.balance_before,
          balanceAfter: result.transaction.balance_after,
          reason: result.transaction.reason,
          createdAt: result.transaction.created_at,
        }, ...prev]);
      }

      toast.success(
        'Leads gerados!',
        `${newLeads.length} lead(s) real(is) encontrado(s)${isAdmin ? ' (admin: sem custo)' : `. ${newLeads.length} crédito(s) consumido(s).`}`
      );

      return newLeads;
    } catch (err) {
      console.error('Erro ao gerar leads:', err);
      toast.error('Erro ao gerar leads', err.message || 'Tente novamente mais tarde.');
      return null;
    }
  }, [user, isAdmin, updateUser, toast]);

  const updateLead = useCallback(async (id, updates) => {
    const dbUpdates = {
      ...mapLeadToDB(updates),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('leads')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      console.error('Erro ao atualizar lead:', error);
      return;
    }

    setLeads(prev => prev.map(l =>
      l.id === id ? { ...l, ...updates, updatedAt: new Date().toISOString() } : l
    ));
  }, []);

  const deleteLead = useCallback(async (id) => {
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (error) {
      console.error('Erro ao deletar lead:', error);
      return;
    }
    setLeads(prev => prev.filter(l => l.id !== id));
  }, []);

  const updateLeadStatus = useCallback(async (id, status, lossReason = '') => {
    const lead = leads.find(l => l.id === id);
    const previousStatus = lead?.status || 'novo';

    const updates = { status, lastInteractionAt: new Date().toISOString() };
    if (lossReason) updates.lossReason = lossReason;

    await updateLead(id, updates);

    // Auto-register status change event in interactions
    if (lead) {
      const msg = `Status alterado: ${getStatusLabel(previousStatus)} → ${getStatusLabel(status)}${lossReason ? ` (Motivo: ${lossReason})` : ''}`;
      const dbData = {
        user_id: user?.id,
        lead_id: id,
        type: 'status_change',
        event_type: 'status_changed',
        message: msg,
        direction: 'system',
        metadata: { previousStatus, newStatus: status, lossReason: lossReason || null },
      };
      const { data: iData } = await supabase.from('interactions').insert(dbData).select().single();
      if (iData) {
        setInteractions(prev => [{
          id: iData.id, userId: iData.user_id, leadId: iData.lead_id,
          type: iData.type, eventType: iData.event_type,
          message: iData.message, direction: iData.direction,
          metadata: iData.metadata, createdAt: iData.created_at,
        }, ...prev]);
      }
    }

    // Update campaign counters
    if (lead) {
      const campaign = campaigns.find(c => c.id === lead.campaignId);
      if (campaign) {
        const campaignLeads = leads
          .map(l => l.id === id ? { ...l, status } : l)
          .filter(l => l.campaignId === campaign.id);

        const counters = {
          contactedLeads: campaignLeads.filter(l =>
            ['contactado', 'follow_up', 'respondeu', 'qualificado', 'negociacao', 'fechado', 'perdido'].includes(l.status)
          ).length,
          respondedLeads: campaignLeads.filter(l =>
            ['respondeu', 'qualificado', 'negociacao', 'fechado'].includes(l.status)
          ).length,
          closedLeads: campaignLeads.filter(l => l.status === 'fechado').length,
        };

        await updateCampaign(campaign.id, counters);
      }
    }
  }, [leads, campaigns, user, updateLead, updateCampaign]);

  // ---- INTERACTIONS ----
  const addInteraction = useCallback(async (leadId, type, message, direction = 'out', eventType = 'manual', metadata = {}) => {
    const dbData = {
      user_id: user?.id,
      lead_id: leadId,
      type,
      event_type: eventType,
      message,
      direction,
      metadata,
    };

    const { data, error } = await supabase
      .from('interactions')
      .insert(dbData)
      .select()
      .single();

    if (error) {
      console.error('Erro ao adicionar interação:', error);
      return null;
    }

    const interaction = {
      id: data.id,
      userId: data.user_id,
      leadId: data.lead_id,
      type: data.type,
      eventType: data.event_type,
      message: data.message,
      direction: data.direction,
      metadata: data.metadata || {},
      createdAt: data.created_at,
    };

    setInteractions(prev => [interaction, ...prev]);
    return interaction;
  }, [user]);

  // ---- FEEDBACKS ----
  const submitFeedback = useCallback(async (type, message) => {
    const dbData = {
      user_id: user?.id,
      type,
      message,
      status: 'novo',
    };

    const { data, error } = await supabase
      .from('feedbacks')
      .insert(dbData)
      .select()
      .single();

    if (error) {
      console.error('Erro ao enviar feedback:', error);
      return null;
    }

    const feedback = {
      id: data.id,
      userId: data.user_id,
      type: data.type,
      message: data.message,
      status: data.status,
      createdAt: data.created_at,
    };

    setFeedbacks(prev => [feedback, ...prev]);
    return feedback;
  }, [user]);

  // ---- CREDITS (via Stripe) ----
  const purchaseCredits = useCallback(async (amount, packId, price) => {
    try {
      // Call the create-checkout API to get a Stripe Checkout URL
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'credits',
          packId,
          userId: user?.id,
          userEmail: user?.email,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Erro ao criar checkout');
      }

      const { checkoutUrl } = await response.json();

      // Redirect to Stripe Checkout
      window.location.href = checkoutUrl;
    } catch (err) {
      console.error('Erro ao iniciar compra:', err);
      toast.error('Erro', 'Não foi possível iniciar o pagamento. Tente novamente.');
    }
  }, [user, toast]);

  // ---- UPGRADE PLAN (via Stripe) ----
  const upgradePlan = useCallback(async (planId) => {
    try {
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'subscription',
          planId,
          userId: user?.id,
          userEmail: user?.email,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Erro ao criar checkout');
      }

      const { checkoutUrl } = await response.json();
      window.location.href = checkoutUrl;
    } catch (err) {
      console.error('Erro ao iniciar upgrade:', err);
      toast.error('Erro', 'Não foi possível iniciar o upgrade. Tente novamente.');
    }
  }, [user, toast]);

  // ---- ADMIN ----
  const adminUpdateUser = useCallback(async (userId, updates) => {
    const dbUpdates = {};
    if (updates.role) dbUpdates.role = updates.role;
    if (updates.planId) dbUpdates.plan_id = updates.planId;
    if (updates.subscriptionStatus) dbUpdates.subscription_status = updates.subscriptionStatus;
    if (updates.onboardingCompleted !== undefined) dbUpdates.onboarding_completed = updates.onboardingCompleted;
    dbUpdates.updated_at = new Date().toISOString();

    // Use service role via API or direct update (admin RLS policy needed)
    const { error } = await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', userId);

    if (error) {
      console.error('Erro admin ao atualizar usuário:', error);
      return;
    }

    setAllUsers(prev => prev.map(u =>
      u.id === userId ? { ...u, ...updates } : u
    ));

    if (userId === user?.id) {
      updateUser(updates);
    }
  }, [user, updateUser]);

  const adminAddCredits = useCallback(async (userId, amount) => {
    // Fetch current credits
    const { data: profile } = await supabase
      .from('profiles')
      .select('purchased_credits, base_credits')
      .eq('id', userId)
      .single();

    if (!profile) return;

    const newPurchased = (profile.purchased_credits || 0) + amount;
    const balanceBefore = (profile.base_credits || 0) + (profile.purchased_credits || 0);
    const balanceAfter = (profile.base_credits || 0) + newPurchased;

    // Update credits
    await supabase
      .from('profiles')
      .update({ purchased_credits: newPurchased, updated_at: new Date().toISOString() })
      .eq('id', userId);

    // Create transaction
    const { data: txn } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: userId,
        type: 'manual_admin_add',
        amount,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        reason: `Ajuste manual pelo admin (+${amount})`,
        created_by_admin_id: user?.id,
      })
      .select()
      .single();

    if (txn) {
      setCreditTransactions(prev => [{
        id: txn.id, userId: txn.user_id, type: txn.type,
        amount: txn.amount, balanceBefore: txn.balance_before,
        balanceAfter: txn.balance_after, reason: txn.reason,
        createdAt: txn.created_at,
      }, ...prev]);
    }

    // Update local state
    setAllUsers(prev => prev.map(u => {
      if (u.id !== userId) return u;
      return {
        ...u,
        creditWallet: {
          ...u.creditWallet,
          purchasedCredits: newPurchased,
        },
      };
    }));
  }, [user]);

  // Filter data for current user (RLS handles this on the server, but we keep it for safety)
  const userLeads = leads;
  const userCampaigns = campaigns;
  const searches = []; // Searches are now implicit in campaigns

  return (
    <AppContext.Provider value={{
      // Data
      leads: userLeads,
      allLeads: leads,
      campaigns: userCampaigns,
      allCampaigns: campaigns,
      searches,
      feedbacks,
      payments,
      creditTransactions,
      interactions,
      adminLogs: [],
      allUsers,
      plans: PLANS,
      isDataLoading,

      // Campaign actions
      createCampaign,
      updateCampaign,
      deleteCampaign,

      // Lead actions
      generateLeadsForCampaign,
      updateLead,
      deleteLead,
      updateLeadStatus,

      // Interaction actions
      addInteraction,

      // Feedback
      submitFeedback,

      // Credits & Payments
      purchaseCredits,
      upgradePlan,

      // Admin
      adminUpdateUser,
      adminAddCredits,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
