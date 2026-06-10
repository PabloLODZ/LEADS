import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Radar, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { validateEmail, validatePassword, validateName } from '../../utils/validators.js';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, isLoading } = useAuth();
  const toast = useToast();

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (touched[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    let error = null;
    if (field === 'name') error = validateName(form.name);
    if (field === 'email') error = validateEmail(form.email);
    if (field === 'password') error = validatePassword(form.password);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const validate = () => {
    const newErrors = {
      name: validateName(form.name),
      email: validateEmail(form.email),
      password: validatePassword(form.password),
      terms: !acceptedTerms ? 'Você deve aceitar os termos' : null,
    };
    setErrors(newErrors);
    setTouched({ name: true, email: true, password: true, terms: true });
    return !newErrors.name && !newErrors.email && !newErrors.password && !newErrors.terms;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await register(form.name, form.email, form.password);
      toast.success('Conta criada com sucesso!');
      navigate('/hoje');
    } catch (err) {
      toast.error(err.message || 'Erro ao criar conta');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="logo-icon">
            <Radar />
          </div>
          <span className="logo-text">LODZ</span>
        </div>

        {/* Header */}
        <h1 className="auth-title">Criar conta</h1>
        <p className="auth-subtitle">Comece a gerar leads qualificados</p>

        {/* Offer badge */}
        <div className="auth-offer">
          🚀 7 dias por R$ 9,90 · acesso completo
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="register-name">Nome</label>
            <input
              id="register-name"
              type="text"
              className={`form-input${errors.name && touched.name ? ' error' : ''}`}
              placeholder="Seu nome completo"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              onBlur={() => handleBlur('name')}
              disabled={isLoading}
              autoComplete="name"
            />
            {errors.name && touched.name && (
              <p className="form-error">{errors.name}</p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="register-email">Email</label>
            <input
              id="register-email"
              type="email"
              className={`form-input${errors.email && touched.email ? ' error' : ''}`}
              placeholder="seu@email.com"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              onBlur={() => handleBlur('email')}
              disabled={isLoading}
              autoComplete="email"
            />
            {errors.email && touched.email && (
              <p className="form-error">{errors.email}</p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="register-password">Senha</label>
            <input
              id="register-password"
              type="password"
              className={`form-input${errors.password && touched.password ? ' error' : ''}`}
              placeholder="Mínimo 6 caracteres"
              value={form.password}
              onChange={(e) => handleChange('password', e.target.value)}
              onBlur={() => handleBlur('password')}
              disabled={isLoading}
              autoComplete="new-password"
            />
            {errors.password && touched.password && (
              <p className="form-error">{errors.password}</p>
            )}
          </div>

          <div className="form-group">
            <label className="form-checkbox">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => {
                  setAcceptedTerms(e.target.checked);
                  if (touched.terms) {
                    setErrors(prev => ({ ...prev, terms: e.target.checked ? null : 'Você deve aceitar os termos' }));
                  }
                }}
                disabled={isLoading}
              />
              <span>
                Aceito os{' '}
                <a href="/termos" target="_blank" rel="noopener noreferrer">
                  Termos de Uso
                </a>{' '}
                e{' '}
                <a href="/privacidade" target="_blank" rel="noopener noreferrer">
                  Política de Privacidade
                </a>
              </span>
            </label>
            {errors.terms && touched.terms && (
              <p className="form-error">{errors.terms}</p>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="spinner" style={{ width: 20, height: 20, border: 'none', animation: 'spin 0.8s linear infinite' }} />
                Criando conta...
              </>
            ) : (
              'Criar conta'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="auth-footer">
          Já tem conta?{' '}
          <Link to="/login">Entrar</Link>
        </div>
      </div>
    </div>
  );
}
