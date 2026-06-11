'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm`,
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Poppins', sans-serif; }

        .fp-root {
          min-height: 100vh;
          background: #f0f4ff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 32px 20px;
          font-family: 'Poppins', sans-serif;
          position: relative;
        }

        .fp-root::before {
          content: '';
          position: fixed;
          inset: 0;
          background:
            radial-gradient(ellipse 80% 60% at 20% 0%, rgba(59,130,246,0.10) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 80% 100%, rgba(30,64,175,0.08) 0%, transparent 60%);
          pointer-events: none;
          z-index: 0;
        }

        .fp-card {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 460px;
          background: #ffffff;
          border-radius: 24px;
          padding: 44px 40px 36px;
          box-shadow: 0 8px 48px rgba(30,58,138,0.11), 0 1px 3px rgba(30,58,138,0.06);
          opacity: ${mounted ? 1 : 0};
          transform: translateY(${mounted ? 0 : '16px'});
          transition: opacity 0.5s ease, transform 0.5s ease;
        }

        /* Logo */
        .fp-logo {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 32px;
        }
        .fp-logo img {
          height: 64px;
          width: auto;
          object-fit: contain;
          margin-bottom: 8px;
        }
        .fp-logo-name {
          font-size: 18px;
          font-weight: 800;
          color: #1e3a8a;
          letter-spacing: -0.01em;
          line-height: 1;
        }
        .fp-logo-sub {
          font-size: 11px;
          font-weight: 400;
          color: #94a3b8;
          letter-spacing: 0.04em;
          margin-top: 3px;
        }

        /* Divider */
        .fp-logo-divider {
          width: 40px;
          height: 2px;
          background: linear-gradient(90deg, #3b82f6, #1d4ed8);
          border-radius: 2px;
          margin: 12px auto 0;
        }

        /* Title */
        .fp-title-section {
          text-align: center;
          margin-bottom: 28px;
        }
        .fp-title {
          font-size: 24px;
          font-weight: 800;
          color: #0a1628;
          letter-spacing: -0.02em;
          margin-bottom: 8px;
        }
        .fp-subtitle {
          font-size: 13.5px;
          color: #64748b;
          line-height: 1.7;
          max-width: 340px;
          margin: 0 auto;
        }

        /* Field */
        .field-group { margin-bottom: 16px; }
        .field-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 7px;
        }
        .input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .input-icon {
          position: absolute;
          left: 14px;
          color: #94a3b8;
          display: flex;
          align-items: center;
          pointer-events: none;
          transition: color 0.2s;
          z-index: 1;
        }
        .input-field {
          width: 100%;
          padding: 13px 14px 13px 44px;
          border: 1.5px solid #cbd5e1;
          border-radius: 12px;
          font-size: 14.5px;
          font-family: 'Poppins', sans-serif;
          font-weight: 500;
          color: #0f172a;
          background: #ffffff;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          -webkit-text-fill-color: #0f172a;
        }
        .input-field::placeholder { color: #94a3b8; font-weight: 400; -webkit-text-fill-color: #94a3b8; }
        .input-field:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3.5px rgba(59,130,246,0.12);
        }
        .input-field:-webkit-autofill,
        .input-field:-webkit-autofill:focus {
          -webkit-text-fill-color: #0f172a;
          -webkit-box-shadow: 0 0 0px 1000px #ffffff inset;
          transition: background-color 5000s ease-in-out 0s;
        }
        .input-wrap:focus-within .input-icon { color: #3b82f6; }

        /* Info card */
        .info-card {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 12px;
          padding: 12px 14px;
          margin-bottom: 20px;
        }
        .info-icon { color: #3b82f6; flex-shrink: 0; margin-top: 1px; }
        .info-text { font-size: 12.5px; color: #1e40af; line-height: 1.6; }

        /* Error */
        .error-box {
          background: #fff1f2;
          border: 1px solid #fecdd3;
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 13px;
          color: #be123c;
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* Submit button */
        .btn-submit {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: #ffffff;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          font-family: 'Poppins', sans-serif;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 16px rgba(37,99,235,0.30);
          transition: transform 0.15s, box-shadow 0.15s, background 0.2s;
          letter-spacing: 0.01em;
          margin-bottom: 16px;
        }
        .btn-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 22px rgba(37,99,235,0.40);
          background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
        }
        .btn-submit:active:not(:disabled) { transform: translateY(0); }
        .btn-submit:disabled { opacity: 0.65; cursor: not-allowed; }

        /* Back link */
        .btn-back {
          width: 100%;
          padding: 12px;
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          font-size: 13.5px;
          font-family: 'Poppins', sans-serif;
          font-weight: 400;
          color: #475569;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: border-color 0.2s, background 0.2s;
          text-decoration: none;
        }
        .btn-back:hover {
          border-color: #3b82f6;
          background: #f0f7ff;
          color: #1d4ed8;
        }
        .btn-back .accent { color: #3b82f6; font-weight: 600; }

        /* Success state */
        .success-card {
          text-align: center;
          padding: 8px 0 4px;
        }
        .success-icon-wrap {
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, #d1fae5, #a7f3d0);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          box-shadow: 0 4px 16px rgba(34,197,94,0.20);
        }
        .success-title {
          font-size: 20px;
          font-weight: 800;
          color: #0a1628;
          margin-bottom: 10px;
          letter-spacing: -0.01em;
        }
        .success-desc {
          font-size: 13.5px;
          color: #64748b;
          line-height: 1.75;
          margin-bottom: 28px;
        }
        .success-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #15803d;
          font-size: 12px;
          font-weight: 500;
          padding: 6px 14px;
          border-radius: 999px;
          margin-bottom: 28px;
        }

        /* Spinner */
        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner {
          width: 18px; height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        /* Footer */
        .fp-footer {
          position: relative;
          z-index: 1;
          text-align: center;
          font-size: 11.5px;
          color: #94a3b8;
          margin-top: 24px;
        }

        @media (max-width: 480px) {
          .fp-card { padding: 32px 24px 28px; border-radius: 20px; }
          .fp-title { font-size: 22px; }
          .fp-logo img { height: 52px; }
        }
      `}</style>

      <div className="fp-root">
        <div className="fp-card">

          {/* Logo */}
          <div className="fp-logo">
            <img src="/logo.png" alt="SIMBA" />
            <div className="fp-logo-name">SIMBA</div>
            <div className="fp-logo-sub">Sistem Monitoring Barang</div>
            <div className="fp-logo-divider" />
          </div>

          {!success ? (
            <>
              {/* Title */}
              <div className="fp-title-section">
                <h1 className="fp-title">Lupa Password?</h1>
                <p className="fp-subtitle">
                  Masukkan email akun Anda dan kami akan mengirimkan link untuk reset password.
                </p>
              </div>

              <form onSubmit={handleSubmit} noValidate>
                {/* Email field */}
                <div className="field-group">
                  <label className="field-label">Email</label>
                  <div className="input-wrap">
                    <span className="input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="4" width="20" height="16" rx="3" /><path d="M2 7l10 7 10-7" />
                      </svg>
                    </span>
                    <input
                      type="email"
                      required
                      placeholder="Masukkan email Anda"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="input-field"
                      autoComplete="email"
                    />
                  </div>
                </div>

                {/* Info card */}
                <div className="info-card">
                  <span className="info-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </span>
                  <span className="info-text">
                    Pastikan email yang dimasukkan sudah terdaftar di akun SIMBA Anda.
                  </span>
                </div>

                {/* Error */}
                {error && (
                  <div className="error-box">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? (
                    <div className="spinner" />
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                      Kirim Link Reset
                    </>
                  )}
                </button>
              </form>

              {/* Back to login */}
              <Link href="/login" className="btn-back">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                <span>Kembali ke <span className="accent">Login</span></span>
              </Link>
            </>
          ) : (
            /* Success state */
            <div className="success-card">
              <div className="success-icon-wrap">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 className="success-title">Email Terkirim!</h2>
              <p className="success-desc">
                Link reset password telah dikirim ke email Anda.<br />
                Silakan cek inbox atau folder spam.
              </p>
              <div className="success-badge">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="3" /><path d="M2 7l10 7 10-7" />
                </svg>
                {email}
              </div>
              <Link href="/login" className="btn-back">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                <span>Kembali ke <span className="accent">Login</span></span>
              </Link>
            </div>
          )}
        </div>

        <div className="fp-footer">
          © 2026 SIMBA - Sistem Monitoring Barang. Semua hak dilindungi.
        </div>
      </div>
    </>
  )
}