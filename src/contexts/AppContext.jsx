import { createContext, useContext, useState, useCallback } from 'react';
import {
  MOCK_LEADS, MOCK_CAMPAIGNS, MOCK_SEARCHES, MOCK_FEEDBACKS,
  MOCK_PAYMENTS, MOCK_CREDIT_TRANSACTIONS, MOCK_INTERACTIONS,
  MOCK_USERS, MOCK_ADMIN_LOGS
} from '../data/mockData.js';
import { PLANS } from '../data/plans.js';
import { consumeCredits, addCredits, getTotalCredits } from '../utils/creditEngine.js';
import { generatePersonalizedLeadMessage } from '../utils/messageGenerator.js';
import { useAuth } from './AuthContext.jsx';
import { useToast } from './ToastContext.jsx';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const { user, updateUser, isAdmin } = useAuth();
  const toast = useToast();

  const [leads, setLeads] = useState([...MOCK_LEADS]);
  const [campaigns, setCampaigns] = useState([...MOCK_CAMPAIGNS]);
  const [searches, setSearches] = useState([...MOCK_SEARCHES]);
  const [feedbacks, setFeedbacks] = useState([...MOCK_FEEDBACKS]);
  const [payments, setPayments] = useState([...MOCK_PAYMENTS]);
  const [creditTransactions, setCreditTransactions] = useState([...MOCK_CREDIT_TRANSACTIONS]);
  const [interactions, setInteractions] = useState([...MOCK_INTERACTIONS]);
  const [adminLogs, setAdminLogs] = useState([...MOCK_ADMIN_LOGS]);
  const [allUsers, setAllUsers] = useState([...MOCK_USERS]);

  // ---- CAMPAIGNS ----
  const createCampaign = useCallback((campaignData) => {
    const newCampaign = {
      id: 'cmp_' + Date.now(),
      userId: user?.id,
      ...campaignData,
      generatedLeads: 0,
      contactedLeads: 0,
      respondedLeads: 0,
      closedLeads: 0,
      status: 'ativa',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setCampaigns(prev => [newCampaign, ...prev]);
    return newCampaign;
  }, [user]);

  const updateCampaign = useCallback((id, updates) => {
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c));
  }, []);

  const deleteCampaign = useCallback((id) => {
    setCampaigns(prev => prev.filter(c => c.id !== id));
  }, []);

  // ---- LEADS ----
  const generateLeadsForCampaign = useCallback((campaign, count) => {
    // Check credits
    if (!isAdmin) {
      const result = consumeCredits(user, count);
      if (!result.success) {
        toast.error('Créditos insuficientes', `Você precisa de ${count} créditos. Disponível: ${getTotalCredits(user.creditWallet)}`);
        return null;
      }
      // Update wallet
      updateUser({ creditWallet: result.wallet });
      if (result.transaction) {
        setCreditTransactions(prev => [result.transaction, ...prev]);
      }
    }

    // Generate mock leads
    const segments = ['Clínica odontológica', 'Barbearia', 'Academia', 'Clínica de estética', 'Restaurante', 'Pet shop'];
    const cities = [campaign.location || 'São Paulo, SP'];
    const names = [
      'Studio Premium', 'Excellence Center', 'Top Quality', 'Master Class',
      'Gold Standard', 'Prime Select', 'Elite Service', 'Royal Touch',
      'Diamond Point', 'Star Line', 'Nova Era', 'Ponto Alto',
    ];

    const newLeads = [];
    for (let i = 0; i < count; i++) {
      const name = names[Math.floor(Math.random() * names.length)] + ' ' + (i + 1);
      const city = cities[0].split(',')[0]?.trim() || 'São Paulo';
      const state = cities[0].split(',')[1]?.trim() || 'SP';
      const segment = campaign.segment || segments[Math.floor(Math.random() * segments.length)];
      const score = Math.floor(Math.random() * 40) + 55;

      const lead = {
        id: 'lead_' + Date.now() + '_' + i,
        userId: user?.id,
        campaignId: campaign.id,
        searchId: null,
        name,
        username: '@' + name.toLowerCase().replace(/\s+/g, ''),
        bio: `${segment} em ${city} — serviços especializados e atendimento de qualidade`,
        phone: `(${Math.floor(Math.random() * 90) + 10}) 9${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`,
        whatsappUrl: Math.random() > 0.2 ? `https://wa.me/55${Math.floor(Math.random() * 9000000000) + 1000000000}` : '',
        instagramUrl: `https://instagram.com/${name.toLowerCase().replace(/\s+/g, '')}`,
        website: Math.random() > 0.4 ? `https://${name.toLowerCase().replace(/\s+/g, '')}.com.br` : '',
        city,
        state,
        source: Math.random() > 0.5 ? 'instagram' : 'google_maps',
        score,
        status: 'novo',
        segment,
        notes: '',
        lastInteractionAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Generate personalized message
      const msgs = generatePersonalizedLeadMessage({
        lead,
        campaign,
        userOffer: campaign.offer,
        tone: campaign.tone || 'consultivo',
        channel: campaign.channel || 'whatsapp',
        personalizationLevel: campaign.personalizationLevel || 'normal',
      });

      lead.personalizedMessage = msgs.recommendedMessage;
      lead.messageDirect = msgs.directVersion;
      lead.messageConsultative = msgs.consultativeVersion;
      lead.messageLight = msgs.lightVersion;
      lead.personalizationReason = msgs.personalizationReason;
      lead.icebreaker = msgs.icebreaker;
      lead.customCta = msgs.customCTA;
      lead.detectedPainPoints = msgs.detectedPainPoints;
      lead.detectedOpportunities = msgs.detectedOpportunities;
      lead.firstMessage = msgs.recommendedMessage;
      lead.lastMessage = '';

      newLeads.push(lead);
    }

    setLeads(prev => [...newLeads, ...prev]);
    updateCampaign(campaign.id, { generatedLeads: (campaign.generatedLeads || 0) + count });

    if (isAdmin) {
      toast.success('Leads gerados', `${count} leads gerados. Acesso administrador: sem consumo de créditos.`);
    } else {
      toast.success('Leads gerados', `${count} leads gerados. ${count} crédito(s) consumido(s).`);
    }

    return newLeads;
  }, [user, isAdmin, updateUser, updateCampaign, toast]);

  const updateLead = useCallback((id, updates) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updates, updatedAt: new Date().toISOString() } : l));
  }, []);

  const deleteLead = useCallback((id) => {
    setLeads(prev => prev.filter(l => l.id !== id));
  }, []);

  const updateLeadStatus = useCallback((id, status) => {
    updateLead(id, { status, lastInteractionAt: new Date().toISOString() });

    // Update campaign counters
    const lead = leads.find(l => l.id === id);
    if (lead) {
      const campaign = campaigns.find(c => c.id === lead.campaignId);
      if (campaign) {
        const campaignLeads = leads.map(l => l.id === id ? { ...l, status } : l).filter(l => l.campaignId === campaign.id);
        updateCampaign(campaign.id, {
          contactedLeads: campaignLeads.filter(l => ['contactado', 'follow_up', 'respondeu', 'fechado', 'perdido'].includes(l.status)).length,
          respondedLeads: campaignLeads.filter(l => ['respondeu', 'fechado'].includes(l.status)).length,
          closedLeads: campaignLeads.filter(l => l.status === 'fechado').length,
        });
      }
    }
  }, [leads, campaigns, updateLead, updateCampaign]);

  // ---- INTERACTIONS ----
  const addInteraction = useCallback((leadId, type, message, direction = 'out') => {
    const interaction = {
      id: 'int_' + Date.now(),
      userId: user?.id,
      leadId,
      type,
      message,
      direction,
      createdAt: new Date().toISOString(),
    };
    setInteractions(prev => [interaction, ...prev]);
    return interaction;
  }, [user]);

  // ---- FEEDBACKS ----
  const submitFeedback = useCallback((type, message) => {
    const feedback = {
      id: 'fb_' + Date.now(),
      userId: user?.id,
      type,
      message,
      status: 'novo',
      createdAt: new Date().toISOString(),
    };
    setFeedbacks(prev => [feedback, ...prev]);
    return feedback;
  }, [user]);

  // ---- CREDITS ----
  const purchaseCredits = useCallback((amount, packName, price) => {
    const result = addCredits(user.creditWallet, amount, 'extra_purchase');
    updateUser({ creditWallet: result.wallet });

    const payment = {
      id: 'pay_' + Date.now(),
      userId: user?.id,
      planId: null,
      amount: price,
      status: 'aprovado',
      provider: 'stripe',
      providerPaymentId: 'pi_mock_' + Date.now(),
      productType: 'extra_credits',
      creditsPurchased: amount,
      createdAt: new Date().toISOString(),
    };
    setPayments(prev => [payment, ...prev]);
    setCreditTransactions(prev => [{ ...result.transaction, userId: user?.id, paymentId: payment.id }, ...prev]);

    toast.success('Créditos adicionados', `${amount} créditos do pacote ${packName} adicionados com sucesso!`);
  }, [user, updateUser, toast]);

  // ---- ADMIN ----
  const adminUpdateUser = useCallback((userId, updates) => {
    setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
    // If it's the current user, update auth too
    if (userId === user?.id) {
      updateUser(updates);
    }
  }, [user, updateUser]);

  const adminAddCredits = useCallback((userId, amount) => {
    setAllUsers(prev => prev.map(u => {
      if (u.id !== userId) return u;
      const newWallet = { ...u.creditWallet, purchasedCredits: u.creditWallet.purchasedCredits + amount };
      return { ...u, creditWallet: newWallet };
    }));

    const txn = {
      id: 'txn_' + Date.now(),
      userId,
      type: 'manual_admin_add',
      amount,
      balanceBefore: 0,
      balanceAfter: 0,
      reason: `Ajuste manual pelo admin (+${amount})`,
      createdByAdminId: user?.id,
      createdAt: new Date().toISOString(),
    };
    setCreditTransactions(prev => [txn, ...prev]);
  }, [user]);

  // Get data for current user
  const userLeads = leads.filter(l => isAdmin ? true : l.userId === user?.id);
  const userCampaigns = campaigns.filter(c => isAdmin ? true : c.userId === user?.id);
  const userSearches = searches.filter(s => isAdmin ? true : s.userId === user?.id);

  return (
    <AppContext.Provider value={{
      // Data
      leads: userLeads,
      allLeads: leads,
      campaigns: userCampaigns,
      allCampaigns: campaigns,
      searches: userSearches,
      feedbacks,
      payments,
      creditTransactions,
      interactions,
      adminLogs,
      allUsers,
      plans: PLANS,

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

      // Credits
      purchaseCredits,

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
