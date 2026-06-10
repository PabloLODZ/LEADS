import { useState } from 'react';
import { X, Send } from 'lucide-react';
import { useApp } from '../../contexts/AppContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';

export default function FeedbackModal({ isOpen, onClose }) {
  const { submitFeedback } = useApp();
  const toast = useToast();
  const [type, setType] = useState('Sugestão');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  if (!isOpen) return null;

  const types = ['Sugestão', 'Problema', 'Elogio', 'Outro'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.warning('Aviso', 'Por favor, escreva uma mensagem antes de enviar.');
      return;
    }

    setSending(true);
    try {
      await submitFeedback({ type, message });
      toast.success('Obrigado!', 'Seu feedback foi enviado com sucesso.');
      setMessage('');
      setType('Sugestão');
      onClose();
    } catch (err) {
      toast.error('Erro', 'Houve um erro ao enviar seu feedback.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Enviar Feedback</h3>
            <p className="modal-subtitle">Sua opinião melhora o LODZ</p>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label className="form-label">Tipo de feedback</label>
            <div className="pill-group">
              {types.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`pill ${type === t ? 'active' : ''}`}
                  onClick={() => setType(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="feedback-message">Sua mensagem</label>
            <textarea
              id="feedback-message"
              className="form-input"
              rows={5}
              placeholder="Conta pra gente o que achou, o que pode melhorar, ou o que deu ruim..."
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 2000))}
              required
            ></textarea>
            <div className="form-helper" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
              {message.length}/2000 caracteres
            </div>
          </div>

          <div className="modal-footer" style={{ padding: '0', marginTop: 'var(--space-xl)' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={sending}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={sending || !message.trim()}>
              <Send size={16} style={{ marginRight: '8px' }} />
              {sending ? 'Enviando...' : 'Enviar feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
