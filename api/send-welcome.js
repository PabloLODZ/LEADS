import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const data = await resend.emails.send({
      from: 'LODZ Leads <onboarding@resend.dev>', // Usar um email verificado no Resend no ambiente de produção
      to: [email],
      subject: 'Bem-vindo ao LODZ Leads! 🚀',
      html: `
        <div style="font-family: sans-serif; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #00C853;">LODZ Leads</h1>
          </div>
          
          <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 16px;">
            Olá${name ? ' ' + name : ''}, bem-vindo a bordo! 👋
          </h2>
          
          <p style="font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
            Estamos muito felizes em ter você conosco. Com o LODZ Leads, você vai automatizar suas abordagens e transformar leads frios em clientes quentes!
          </p>
          
          <div style="background-color: #f3f4f6; border-left: 4px solid #00C853; padding: 16px; margin-bottom: 24px;">
            <h3 style="font-size: 16px; font-weight: 600; margin-top: 0; margin-bottom: 8px;">Primeiros Passos:</h3>
            <ol style="margin: 0; padding-left: 20px; line-height: 1.6;">
              <li>Crie sua primeira campanha</li>
              <li>Ative o Sócio IA</li>
              <li>Acompanhe os resultados no funil</li>
            </ol>
          </div>
          
          <p style="font-size: 16px; line-height: 1.5; margin-bottom: 32px;">
            Acesse o sistema e configure sua primeira campanha para ver a mágica acontecer.
          </p>
          
          <div style="text-align: center;">
            <a href="https://lodz-leads.vercel.app/campanhas" style="background-color: #00C853; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">
              Acessar minha conta
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
          
          <p style="font-size: 14px; color: #6b7280; text-align: center;">
            Equipe LODZ &copy; ${new Date().getFullYear()}<br/>
            Se precisar de ajuda, responda a este e-mail.
          </p>
        </div>
      `
    });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return res.status(500).json({ error: error.message });
  }
}
