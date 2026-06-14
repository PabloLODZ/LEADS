import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Radar, Mail, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { validateEmail, validatePassword } from '../../utils/validators.js';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const toast = useToast();

  const [form, setForm] = useState({ email: '', password: '' });
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
    if (field === 'email') error = validateEmail(form.email);
    if (field === 'password') error = validatePassword(form.password);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const validate = () => {
    const newErrors = {
      email: validateEmail(form.email),
      password: validatePassword(form.password),
    };
    setErrors(newErrors);
    setTouched({ email: true, password: true });
    return !newErrors.email && !newErrors.password;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await login(form.email, form.password);
      toast.success('Login realizado com sucesso!');
      navigate('/hoje');
    } catch (err) {
      toast.error(err.message || 'Erro ao fazer login');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <span className="logo-text">LODZ</span>
        </div>

        {/* Header */}
        <h1 className="auth-title">Entrar na conta</h1>
        <p className="auth-subtitle">Acesse seu painel de prospecção</p>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Email</label>
            <input
              id="login-email"
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
            <label className="form-label" htmlFor="login-password">Senha</label>
            <input
              id="login-password"
              type="password"
              className={`form-input${errors.password && touched.password ? ' error' : ''}`}
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => handleChange('password', e.target.value)}
              onBlur={() => handleBlur('password')}
              disabled={isLoading}
              autoComplete="current-password"
            />
            {errors.password && touched.password && (
              <p className="form-error">{errors.password}</p>
            )}
          </div>

          <div className="flex justify-between items-center mb-lg">
            <Link to="/recuperar-senha" className="text-sm">
              Esqueci minha senha
            </Link>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="spinner" style={{ width: 20, height: 20, border: 'none', animation: 'spin 0.8s linear infinite' }} />
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </button>
        </form>

        {/* Footer */}
        {/* Footer removed */}
      </div>
    </div>
  );
}
