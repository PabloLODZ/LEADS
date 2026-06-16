import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
  Search,
  Filter,
  List,
  Columns3,
  Eye,
  Copy,
  ExternalLink,
  Target,
  ArrowUpDown,
  MoreVertical,
  Plus,
  Trash2,
  Download,
  Lock,
  Clock,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import {
  formatRelativeDate,
  getStatusColor,
  getStatusLabel,
  getScoreClass,
  truncate,
} from '../../utils/formatters.js';
import LeadDetailDrawer from './LeadDetailDrawer.jsx';

export default function LeadsPage() {
  const { leads, campaigns, updateLeadStatus, deleteLead, updateLead } = useApp();
  const { user, isAdmin } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Selected lead for detail drawer
  const [selectedLead, setSelectedLead] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Filters and search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('todos');
  const [selectedCampaignFilter, setSelectedCampaignFilter] = useState('todos');
  const [sortBy, setSortBy] = useState('score-desc');
  const [viewMode, setViewMode] = useState('lista'); // 'lista' or 'kanban'

  // Handle URL query params (for initial filter/open drawer)
  useEffect(() => {
    const campaignIdParam = searchParams.get('campaignId');
    if (campaignIdParam) {
      setSelectedCampaignFilter(campaignIdParam);
    }

    const statusParam = searchParams.get('status');
    if (statusParam) {
      setSelectedStatusFilter(statusParam);
    }

    const leadIdParam = searchParams.get('id');
    if (leadIdParam && leads.length > 0) {
      const lead = leads.find((l) => l.id === leadIdParam);
      if (lead) {
        setSelectedLead(lead);
        setIsDrawerOpen(true);
      }
    }
  }, [searchParams, leads]);

  const handleOpenDrawer = (lead) => {
    setSelectedLead(lead);
    setIsDrawerOpen(true);
    setSearchParams({ ...Object.fromEntries(searchParams.entries()), id: lead.id });
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedLead(null);
    const params = new URLSearchParams(searchParams);
    params.delete('id');
    setSearchParams(params);
  };

  const handleCopyMessage = (lead) => {
    if (!lead.personalizedMessage) {
      toast.warning('Sem mensagem', 'Gere uma mensagem personalizada para este lead primeiro.');
      return;
    }
    navigator.clipboard.writeText(lead.personalizedMessage).then(() => {
      toast.success('Copiado!', 'Abordagem AI copiada com sucesso.');
    });
  };

  // Drag and drop handler for Kanban
  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId;
    try {
      await updateLeadStatus(draggableId, newStatus);
      toast.success('Lead atualizado', `Status alterado para ${getStatusLabel(newStatus)}`);
    } catch (err) {
      toast.error('Erro', 'Não foi possível mover o lead.');
    }
  };

  // getCampaignName must be defined BEFORE filteredLeads (no hoisting for const)
  const getCampaignName = (campaignId) => {
    const campaign = campaigns.find((c) => c.id === campaignId);
    return campaign ? campaign.name : '—';
  };

  // Filter and Sort Logic
  const filteredLeads = leads
    .filter((lead) => {
      const q = searchQuery.toLowerCase();
      const campaignName = getCampaignName(lead.campaignId).toLowerCase();
      const matchesSearch = !q ||
        lead.name.toLowerCase().includes(q) ||
        (lead.username && lead.username.toLowerCase().includes(q)) ||
        (lead.phone && lead.phone.toLowerCase().includes(q)) ||
        (lead.city && lead.city.toLowerCase().includes(q)) ||
        (lead.bio && lead.bio.toLowerCase().includes(q)) ||
        campaignName.includes(q);

      const matchesStatus =
        selectedStatusFilter === 'todos' || lead.status === selectedStatusFilter;

      const matchesCampaign =
        selectedCampaignFilter === 'todos' || lead.campaignId === selectedCampaignFilter;

      return matchesSearch && matchesStatus && matchesCampaign;
    })
    .sort((a, b) => {
      if (sortBy === 'score-desc') return (b.score || 0) - (a.score || 0);
      if (sortBy === 'score-asc') return (a.score || 0) - (b.score || 0);
      if (sortBy === 'recent') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'old') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'interaction') return new Date(b.updatedAt) - new Date(a.updatedAt);
      return 0;
    });

  // Status stats calculations
  const totalCount = leads.length;
  const statusStats = {
    todos: totalCount,
    novo: leads.filter((l) => l.status === 'novo').length,
    contactado: leads.filter((l) => l.status === 'contactado').length,
    respondeu: leads.filter((l) => l.status === 'respondeu').length,
    negociacao: leads.filter((l) => l.status === 'negociacao').length,
    fechado: leads.filter((l) => l.status === 'fechado').length,
    perdido: leads.filter((l) => l.status === 'perdido').length,
  };

  const statusList = [
    { value: 'todos', label: 'Todos' },
    { value: 'novo', label: 'Novo' },
    { value: 'contactado', label: 'Contactado' },
    { value: 'respondeu', label: 'Respondeu' },
    { value: 'negociacao', label: 'Negociação' },
    { value: 'fechado', label: 'Fechado' },
    { value: 'perdido', label: 'Perdido' },
  ];

  const kanbanColumns = ['novo', 'contactado', 'respondeu', 'negociacao', 'fechado'];

  return (
    <div className="page-container" style={{ padding: 'var(--space-2xl)' }}>
      {/* Top Header */}
      <div className="page-header" style={{ marginBottom: 'var(--space-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: 'var(--font-size-3xl)', fontWeight: '800', color: 'var(--text-primary)' }}>Leads</h1>
          <p className="page-subtitle" style={{ color: 'var(--text-muted)' }}>Visualize e gerencie todos os seus leads em um só lugar</p>
        </div>
        <div style={{ position: 'relative' }} className="export-btn-wrapper">
          <button 
            className="btn btn-secondary" 
            style={{ position: 'relative' }}
            onMouseEnter={(e) => {
              if (!isAdmin && (user?.planId === 'starter' || user?.planId === 'growth')) {
                const tooltip = e.currentTarget.nextElementSibling;
                if(tooltip) tooltip.style.opacity = '1';
              }
            }}
            onMouseLeave={(e) => {
              const tooltip = e.currentTarget.nextElementSibling;
              if(tooltip) tooltip.style.opacity = '0';
            }}
            onClick={() => {
              if (!isAdmin && (user?.planId === 'starter' || user?.planId === 'growth')) {
                toast.error('Recurso Premium', 'A exportação de leads para CSV é exclusiva dos planos Pro e Agency.');
                navigate('/configuracoes');
                return;
              }
              toast.success('Exportando', 'O download do CSV iniciará em instantes.');
            }}
          >
            {(!isAdmin && (user?.planId === 'starter' || user?.planId === 'growth')) ? (
              <Lock size={16} style={{ marginRight: '8px', color: 'var(--color-warning)' }} />
            ) : (
              <Download size={16} style={{ marginRight: '8px' }} />
            )}
            Exportar CSV
          </button>
          {/* Tooltip */}
          <div style={{
            opacity: 0,
            pointerEvents: 'none',
            position: 'absolute',
            bottom: '-36px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-primary)',
            borderRadius: '6px',
            fontSize: '12px',
            color: 'var(--text-primary)',
            padding: '4px 8px',
            whiteSpace: 'nowrap',
            transition: 'opacity 0.2s',
            zIndex: 10
          }}>
            Disponível no plano Growth
          </div>
        </div>
      </div>

      {leads.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-3xl)', textAlign: 'center' }}>
          <div style={{ color: 'var(--border-primary)', marginBottom: '16px' }}>
            <Target size={48} />
          </div>
          <h3 style={{ fontSize: '16px', color: 'var(--text-muted)', fontWeight: '500', marginBottom: '8px' }}>Nenhum lead ainda</h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '400px', marginBottom: '20px' }}>
            Configure e ative uma campanha para começar a garimpar leads automaticamente com nossa IA.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/campanhas')}>
            Criar primeira campanha
          </button>
        </div>
      ) : (
        <>
          {/* Status Filters - Pills */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px', marginBottom: 'var(--space-xl)', scrollbarWidth: 'none' }}>
            {statusList.map((st) => {
              const isActive = selectedStatusFilter === st.value;
              const count = statusStats[st.value] !== undefined ? statusStats[st.value] : leads.filter((l) => l.status === st.value).length;

              return (
                <button
                  key={st.value}
                  onClick={() => setSelectedStatusFilter(st.value)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: '500',
                    border: '1px solid',
                    borderColor: isActive ? 'var(--green-primary)' : 'var(--border-primary)',
                    background: isActive ? 'var(--green-dark)' : 'transparent',
                    color: isActive ? 'var(--green-primary)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {st.label}
                  <span style={{ fontSize: '11px', color: 'inherit', opacity: isActive ? 1 : 0.7 }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Filters Bar */}
          <div className="filters-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-md)', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)', padding: 'var(--space-md)', background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', flex: '1', minWidth: '280px', gap: 'var(--space-sm)' }}>
              <div style={{ position: 'relative', flex: '1' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '36px', width: '100%' }}
                  placeholder="Buscar por nome, @, telefone, cidade ou campanha..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <select
                className="form-input"
                style={{ width: '150px' }}
                value={selectedCampaignFilter}
                onChange={(e) => setSelectedCampaignFilter(e.target.value)}
              >
                <option value="todos">Campanhas</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                className="form-input"
                style={{ width: '150px' }}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="score-desc">Score ↓</option>
                <option value="score-asc">Score ↑</option>
                <option value="recent">Mais recentes</option>
                <option value="old">Mais antigos</option>
                <option value="interaction">Última interação</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
              <div className="view-toggle" style={{ display: 'flex', background: 'var(--bg-card-secondary)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)', padding: '2px' }}>
                <button
                  className={`btn btn-sm ${viewMode === 'lista' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ padding: '6px 12px' }}
                  onClick={() => setViewMode('lista')}
                >
                  <List size={16} style={{ marginRight: '4px' }} />
                  Lista
                </button>
                <button
                  className={`btn btn-sm ${viewMode === 'kanban' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ padding: '6px 12px' }}
                  onClick={() => setViewMode('kanban')}
                >
                  <Columns3 size={16} style={{ marginRight: '4px' }} />
                  Kanban
                </button>
              </div>
            </div>
          </div>

          {/* List View */}
          {viewMode === 'lista' && (
            <div className="table-container" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-lg)', overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                    <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>Nome</th>
                    <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>Origem / Campanha</th>
                    <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>Score</th>
                    <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>Status</th>
                    <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>Última Interação</th>
                    <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', textAlign: 'right' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead) => {
                    const getStatusBadgeStyle = (status) => {
                      switch (status) {
                        case 'novo': return { bg: 'var(--color-info-bg)', color: 'var(--color-info)', border: 'var(--border-primary)' };
                        case 'contactado': return { bg: 'var(--color-success-bg)', color: 'var(--color-success)', border: 'var(--border-primary)' };
                        case 'follow_up': return { bg: '#2B1E0D', color: 'var(--color-warning)', border: 'var(--border-primary)' };
                        case 'respondeu': return { bg: 'var(--green-dark)', color: 'var(--green-primary)', border: 'var(--border-primary)' };
                        case 'perdido': return { bg: '#2B0D0D', color: 'var(--color-error)', border: 'var(--border-primary)' };
                        default: return { bg: 'var(--bg-card)', color: 'var(--text-secondary)', border: 'var(--border-primary)' };
                      }
                    };
                    const badgeStyle = getStatusBadgeStyle(lead.status);

                    return (
                      <tr key={lead.id} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 150ms ease' }} className="table-row-hover">
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ flexShrink: 0, width: '32px', height: '32px', borderRadius: '8px', background: 'var(--green-dark)', color: 'var(--green-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '600' }}>
                              {lead.name.substring(0,2).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>{lead.name}</div>
                              {lead.username && <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>@{lead.username}</span>}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          {lead.campaignId ? (
                            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{getCampaignName(lead.campaignId)}</span>
                          ) : (
                            <span style={{ fontSize: '11px', background: 'var(--bg-card)', color: 'var(--text-muted)', padding: '3px 8px', borderRadius: '4px', border: '1px solid var(--border-primary)' }}>Sem campanha</span>
                          )}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ 
                            fontSize: '12px', fontWeight: '600', padding: '3px 8px', borderRadius: '4px',
                            background: lead.score >= 90 ? 'var(--green-dark)' : lead.score >= 60 ? 'var(--color-warning-bg)' : 'var(--color-error-bg)',
                            color: lead.score >= 90 ? 'var(--green-primary)' : lead.score >= 60 ? 'var(--color-warning)' : 'var(--color-error)'
                          }}>
                            {lead.score || 0} pts
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ 
                            fontSize: '11px', fontWeight: '500', padding: '3px 10px', borderRadius: '20px',
                            background: badgeStyle.bg, color: badgeStyle.color, border: `1px solid ${badgeStyle.border}`
                          }}>
                            {getStatusLabel(lead.status)}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Clock size={12} />
                            {formatRelativeDate(lead.updatedAt)}
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '12px', color: 'var(--text-muted)' }}>
                            <button className="btn btn-ghost btn-sm" style={{ padding: '4px', color: 'inherit' }} onClick={() => handleOpenDrawer(lead)} title="Ver detalhes">
                              <Eye size={16} />
                            </button>
                            <button className="btn btn-ghost btn-sm" style={{ padding: '4px', color: 'inherit' }} onClick={() => handleCopyMessage(lead)} title="Copiar abordagem">
                              <Copy size={16} />
                            </button>
                            {lead.whatsappUrl && (
                              <button className="btn btn-ghost btn-sm" style={{ padding: '4px', color: 'inherit' }} onClick={() => window.open(lead.whatsappUrl, '_blank')} title="Abrir WhatsApp">
                                <ExternalLink size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredLeads.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--text-muted)' }}>
                        {searchQuery || selectedStatusFilter !== 'todos' || selectedCampaignFilter !== 'todos'
                          ? `Nenhum lead encontrado com os filtros aplicados. Tente limpar os filtros.`
                          : 'Nenhum lead ainda.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Kanban View */}
          {viewMode === 'kanban' && (
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="kanban-container" style={{ display: 'flex', gap: 'var(--space-md)', overflowX: 'auto', paddingBottom: 'var(--space-md)' }}>
                {kanbanColumns.map((colName) => {
                  const colLeads = filteredLeads.filter((l) => l.status === colName);
                  const statusColor = getStatusColor(colName);

                  return (
                    <div key={colName} className="kanban-column" style={{ flex: '0 0 260px', background: 'var(--bg-sidebar)', border: '1px solid var(--border-primary)', borderRadius: '10px', display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 280px)', padding: '12px' }}>
                      <div className="kanban-column-header" style={{ paddingBottom: '10px', marginBottom: '10px', borderBottom: '1px solid var(--border-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: `var(--color-${statusColor === 'yellow' ? 'warning' : statusColor === 'blue' ? 'info' : statusColor === 'red' ? 'error' : statusColor})` }}></span>
                          <span style={{ fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{getStatusLabel(colName)}</span>
                        </div>
                        <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--bg-card)', border: '1px solid var(--border-primary)', color: 'var(--text-muted)', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{colLeads.length}</span>
                      </div>

                      <Droppable droppableId={colName}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className="kanban-column-body hide-scrollbar"
                            style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '150px' }}
                          >
                            {colLeads.map((lead, idx) => (
                              <Draggable key={lead.id} draggableId={lead.id} index={idx}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`kanban-card ${snapshot.isDragging ? 'dragging' : ''}`}
                                    style={{
                                      padding: '12px',
                                      background: 'var(--bg-card)',
                                      border: '1px solid var(--border-primary)',
                                      borderRadius: '8px',
                                      cursor: 'grab',
                                      transition: 'border-color 150ms ease, background 150ms ease',
                                      ...provided.draggableProps.style,
                                    }}
                                    onClick={() => handleOpenDrawer(lead)}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.borderColor = 'var(--border-hover)';
                                      e.currentTarget.style.background = 'var(--bg-hover)';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.borderColor = 'var(--border-primary)';
                                      e.currentTarget.style.background = 'var(--bg-card)';
                                    }}
                                  >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                                      <div style={{ fontWeight: '550', color: 'var(--text-primary)', fontSize: '13px' }}>{lead.name}</div>
                                    </div>
                                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 12px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                      {lead.city ? `${lead.city} • ` : ''}{lead.bio || lead.username || 'Sem detalhes'}
                                    </p>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <div style={{ width: '20px', height: '20px', borderRadius: '4px', background: 'var(--green-dark)', color: 'var(--green-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: '600' }}>
                                          {lead.name.substring(0,2).toUpperCase()}
                                        </div>
                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                          {truncate(getCampaignName(lead.campaignId), 15)}
                                        </span>
                                      </div>
                                      <span style={{ 
                                        fontSize: '11px', fontWeight: '600', padding: '2px 6px', borderRadius: '4px',
                                        background: lead.score >= 90 ? 'var(--green-dark)' : lead.score >= 60 ? 'var(--color-warning-bg)' : 'var(--color-error-bg)',
                                        color: lead.score >= 90 ? 'var(--green-primary)' : lead.score >= 60 ? 'var(--color-warning)' : 'var(--color-error)'
                                      }}>
                                        {lead.score || 0} pts
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  );
                })}
              </div>
            </DragDropContext>
          )}
        </>
      )}

      {/* Slide-out drawer for lead detail */}
      <LeadDetailDrawer
        lead={selectedLead}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
      />
    </div>
  );
}
