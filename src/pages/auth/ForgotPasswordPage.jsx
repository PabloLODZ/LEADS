import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Radar, CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext.jsx';
import { validateEmail } from '../../utils/validators.js';

export default function ForgotPasswordPage() {
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [touched, setTouched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleBlur = () => {
    setTouched(true);
    setError(validateEmail(email));
  };

  const handleChange = (value) => {
    setEmail(value);
    if (touched) {
      setError(validateEmail(value));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const emailError = validateEmail(email);
    setError(emailError);
    setTouched(true);

    if (emailError) return;

    setIsLoading(true);

    // Simulate API call
    await new Promise((r) => setTimeout(r, 1200));

    setIsLoading(false);
    setIsSent(true);
    toast.success('Link de recuperação enviado!');
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

        {isSent ? (
          /* Success State */
          <div className="auth-success">
            <div className="auth-success-icon">
              <CheckCircle size={32} />
            </div>
            <h1 className="auth-title">Link enviado!</h1>
            <p className="auth-subtitle">
              Link enviado para seu email <strong>{email}</strong>. Verifique sua caixa de entrada e spam.
            </p>
            <Link to="/login" className="btn btn-primary btn-block btn-lg mt-lg">
              Voltar para o login
            </Link>
          </div>
        ) : (
          <>
            {/* Header */}
            <h1 className="auth-title">Recuperar senha</h1>
            <p className="auth-subtitle">
              Enviaremos um link seguro para você criar uma nova senha.
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label className="form-label" htmlFor="forgot-email">Email</label>
                <input
                  id="forgot-email"
                  type="email"
                  className={`form-input${error && touched ? ' error' : ''}`}
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => handleChange(e.target.value)}
                  onBlur={handleBlur}
                  disabled={isLoading}
                  autoComplete="email"
                />
                {error && touched && (
                  <p className="form-error">{error}</p>
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
                    Enviando...
                  </>
                ) : (
                  'Enviar link de recuperação'
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="auth-footer">
              Lembrou a senha?{' '}
              <Link to="/login">Voltar para o login</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
