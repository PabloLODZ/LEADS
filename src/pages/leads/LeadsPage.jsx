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
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext.jsx';
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
    follow_up: leads.filter((l) => l.status === 'follow_up').length,
    respondeu: leads.filter((l) => l.status === 'respondeu').length,
    qualificado: leads.filter((l) => l.status === 'qualificado').length,
    negociacao: leads.filter((l) => l.status === 'negociacao').length,
    fechado: leads.filter((l) => l.status === 'fechado').length,
    perdido: leads.filter((l) => l.status === 'perdido').length,
  };

  const statusList = [
    { value: 'todos', label: 'Todos' },
    { value: 'novo', label: 'Novo' },
    { value: 'contactado', label: 'Contactado' },
    { value: 'follow_up', label: 'Follow-up' },
    { value: 'respondeu', label: 'Respondeu' },
    { value: 'qualificado', label: 'Qualificado' },
    { value: 'negociacao', label: 'Negociação' },
    { value: 'fechado', label: 'Fechado' },
    { value: 'perdido', label: 'Perdido' },
  ];

  const kanbanColumns = ['novo', 'contactado', 'follow_up', 'respondeu', 'qualificado', 'negociacao', 'fechado'];

  return (
    <div className="page-container" style={{ padding: 'var(--space-2xl)' }}>
      {/* Top Header */}
      <div className="page-header" style={{ marginBottom: 'var(--space-xl)' }}>
        <h1 className="page-title" style={{ fontSize: 'var(--font-size-3xl)', fontWeight: '800', color: 'var(--text-primary)' }}>Leads</h1>
        <p className="page-subtitle" style={{ color: 'var(--text-muted)' }}>Visualize e gerencie todos os seus leads em um só lugar</p>
      </div>

      {leads.length === 0 ? (
        <div className="empty-state card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-3xl)', textAlign: 'center' }}>
          <div className="empty-state-icon" style={{ background: 'var(--green-glow)', color: 'var(--green-primary)', padding: 'var(--space-lg)', borderRadius: '50%', marginBottom: 'var(--space-lg)' }}>
            <Target size={32} />
          </div>
          <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '700', marginBottom: 'var(--space-xs)' }}>Nenhum lead ainda</h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '400px', marginBottom: 'var(--space-xl)' }}>
            Configure e ative uma campanha para começar a garimpar leads automaticamente com nossa IA.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/campanhas')}>
            Criar primeira campanha
          </button>
        </div>
      ) : (
        <>
          {/* Status Stat Cards Row */}
          <div className="stats-grid" style={{ marginBottom: 'var(--space-xl)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-base)' }}>
            {statusList.map((st) => {
              const isActive = selectedStatusFilter === st.value;
              const color = st.value === 'todos' ? 'green' : getStatusColor(st.value);

              return (
                <div
                  key={st.value}
                  className={`stat-card ${isActive ? 'active' : ''}`}
                  style={{ padding: 'var(--space-md)', border: isActive ? '1px solid var(--green-primary)' : '1px solid var(--border-primary)', cursor: 'pointer' }}
                  onClick={() => setSelectedStatusFilter(st.value)}
                >
                  <div className={`stat-card-value`} style={{ fontSize: 'var(--font-size-xl)' }}>
                    {statusStats[st.value] !== undefined ? statusStats[st.value] : leads.filter((l) => l.status === st.value).length}
                  </div>
                  <div className="stat-card-label" style={{ fontSize: 'var(--font-size-xs)' }}>
                    {st.label}
                  </div>
                </div>
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
                    <th style={{ padding: 'var(--space-md)' }}>Nome</th>
                    <th style={{ padding: 'var(--space-md)' }}>Origem / Campanha</th>
                    <th style={{ padding: 'var(--space-md)' }}>Score</th>
                    <th style={{ padding: 'var(--space-md)' }}>Status</th>
                    <th style={{ padding: 'var(--space-md)' }}>Última Interação</th>
                    <th style={{ padding: 'var(--space-md)', textAlign: 'right' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead) => {
                    const statusColor = getStatusColor(lead.status);
                    const scoreClass = getScoreClass(lead.score);

                    return (
                      <tr key={lead.id} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.2s' }} className="table-row-hover">
                        <td style={{ padding: 'var(--space-md)' }}>
                          <div>
                            <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{lead.name}</div>
                            {lead.username && <span className="text-green" style={{ fontSize: 'var(--font-size-xs)' }}>@{lead.username}</span>}
                          </div>
                        </td>
                        <td style={{ padding: 'var(--space-md)' }}>
                          <span style={{ fontSize: 'var(--font-size-sm)' }}>
                            {getCampaignName(lead.campaignId)}
                          </span>
                        </td>
                        <td style={{ padding: 'var(--space-md)' }}>
                          <span className={`score ${scoreClass}`}>
                            {lead.score} pts
                          </span>
                        </td>
                        <td style={{ padding: 'var(--space-md)' }}>
                          <span className={`badge badge-${statusColor}`}>{getStatusLabel(lead.status)}</span>
                        </td>
                        <td style={{ padding: 'var(--space-md)', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                          {formatRelativeDate(lead.updatedAt)}
                        </td>
                        <td style={{ padding: 'var(--space-md)', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 'var(--space-xs)' }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => handleOpenDrawer(lead)} title="Ver detalhes">
                              <Eye size={14} />
                            </button>
                            <button className="btn btn-ghost btn-sm" onClick={() => handleCopyMessage(lead)} title="Copiar abordagem">
                              <Copy size={14} />
                            </button>
                            {lead.whatsappUrl && (
                              <button className="btn btn-ghost btn-sm" onClick={() => window.open(lead.whatsappUrl, '_blank')} title="Abrir WhatsApp">
                                <ExternalLink size={14} />
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
                    <div key={colName} className="kanban-column" style={{ flex: '0 0 300px', background: 'var(--bg-sidebar)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 280px)' }}>
                      <div className="kanban-column-header" style={{ padding: 'var(--space-md)', borderBottom: '1px solid var(--border-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: `var(--color-${statusColor === 'yellow' ? 'warning' : statusColor === 'blue' ? 'info' : statusColor === 'red' ? 'error' : statusColor})` }}></span>
                          <span style={{ fontWeight: '600', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', color: 'var(--text-primary)' }}>{getStatusLabel(colName)}</span>
                        </div>
                        <span className="badge badge-gray" style={{ background: 'var(--bg-card-secondary)' }}>{colLeads.length}</span>
                      </div>

                      <Droppable droppableId={colName}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className="kanban-column-body"
                            style={{ flex: 1, padding: 'var(--space-sm)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', minHeight: '150px' }}
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
                                      padding: 'var(--space-md)',
                                      background: 'var(--bg-card)',
                                      border: '1px solid var(--border-primary)',
                                      borderRadius: 'var(--radius-md)',
                                      cursor: 'grab',
                                      ...provided.draggableProps.style,
                                    }}
                                    onClick={() => handleOpenDrawer(lead)}
                                  >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                      <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)' }}>{lead.name}</div>
                                      <span className={`score ${getScoreClass(lead.score)}`} style={{ fontSize: 'var(--font-size-xs)' }}>{lead.score}</span>
                                    </div>
                                    {lead.username && <div className="text-green" style={{ fontSize: 'var(--font-size-xs)', marginTop: '2px' }}>@{lead.username}</div>}
                                    {lead.bio && <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', margin: '8px 0', lineBreak: 'anywhere' }}>{truncate(lead.bio, 60)}</p>}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-sm)' }}>
                                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', background: 'var(--bg-card-secondary)', padding: '2px 6px', borderRadius: '4px' }}>
                                        {truncate(getCampaignName(lead.campaignId), 20)}
                                      </span>
                                      {lead.personalizedMessage && (
                                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--green-primary)' }} title="Mensagem AI disponível"></span>
                                      )}
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
