// Файл: src/pages/Auth.jsx
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useLanguage } from '../contexts/LanguageContext'
import { Sprout, Calendar, TrendingUp, Smartphone, CheckCircle } from 'lucide-react'

export default function Auth() {
  const { t, lang, setLang } = useLanguage()
  
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false) 
  const [errorMsg, setErrorMsg] = useState('') 

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    
    // Редирект на правильный домен после входа
    const { error } = await supabase.auth.signInWithOtp({ 
      email,
      options: {
        emailRedirectTo: 'https://greenbatch.xyz'
      }
    })

    if (error) {
      setErrorMsg(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', paddingBottom: '40px' }}>
      
      {/* --- HEADER --- */}
      <header style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', padding: '10px 0' }}>
        <div style={{ display: 'flex', gap: '5px' }}>
          <button onClick={() => setLang('ru')} style={{ background: lang === 'ru' ? '#646cff' : 'transparent', border: lang === 'ru' ? 'none' : '1px solid #444', padding: '5px 8px', fontSize: '0.75em', width: 'auto' }}>RU</button>
          <button onClick={() => setLang('en')} style={{ background: lang === 'en' ? '#646cff' : 'transparent', border: lang === 'en' ? 'none' : '1px solid #444', padding: '5px 8px', fontSize: '0.75em', width: 'auto' }}>EN</button>
        </div>
      </header>

      {/* --- HERO SECTION (LOGIN) --- */}
      <div style={{ textAlign: 'center', marginBottom: '40px', maxWidth: '500px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <div style={{ background: 'rgba(74, 222, 128, 0.1)', padding: '15px', borderRadius: '50%' }}>
            <Sprout size={48} color="#4ade80" />
          </div>
        </div>
        
        <h1 style={{ fontSize: '2em', lineHeight: '1.2', marginBottom: '15px' }}>
          {t('landing.hero_title')}
        </h1>
        <p style={{ opacity: 0.8, fontSize: '1.1em', marginBottom: '30px', lineHeight: '1.6' }}>
          {t('landing.hero_desc')}
        </p>

        {/* Форма входа - главный CTA */}
        <div className="card" style={{ border: '1px solid #4ade80', padding: '25px', boxShadow: '0 10px 30px rgba(74, 222, 128, 0.1)' }}>
          <h3 style={{ margin: '0 0 15px 0' }}>{t('auth.title')}</h3>
          {sent ? (
            <div style={{ color: '#4ade80', textAlign: 'center', padding: '10px', border: '1px dashed #4ade80', borderRadius: '8px' }}>
              {t('auth.success_message')} 
              <br/> 
              <small style={{ opacity: 0.7 }}>{t('auth.check_spam')}</small>
            </div>
          ) : (
            <form onSubmit={handleLogin}>
              {errorMsg && <div style={{ color: '#ef4444', marginBottom: '10px' }}>{errorMsg}</div>}
              <input
                type="email"
                placeholder={t('auth.email_placeholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ fontSize: '1.1em', padding: '12px' }}
              />
              <button disabled={loading} style={{ background: '#4ade80', color: '#000', fontWeight: 'bold', fontSize: '1.1em', padding: '12px' }}>
                {loading ? t('auth.sending') : t('auth.login_btn')}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* --- FEATURES --- */}
      <div style={{ width: '100%', marginBottom: '40px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#fff' }}>{t('landing.features_title')}</h2>
        
        <div style={{ display: 'grid', gap: '20px' }}>
          <div className="card" style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
            <Calendar size={32} color="#3b82f6" style={{ minWidth: '32px' }} />
            <div>
              <h3 style={{ margin: '0 0 5px 0' }}>{t('landing.feat_1_title')}</h3>
              <p style={{ margin: 0, opacity: 0.7, fontSize: '0.9em' }}>{t('landing.feat_1_desc')}</p>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
            <TrendingUp size={32} color="#facc15" style={{ minWidth: '32px' }} />
            <div>
              <h3 style={{ margin: '0 0 5px 0' }}>{t('landing.feat_2_title')}</h3>
              <p style={{ margin: 0, opacity: 0.7, fontSize: '0.9em' }}>{t('landing.feat_2_desc')}</p>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
            <Smartphone size={32} color="#a78bfa" style={{ minWidth: '32px' }} />
            <div>
              <h3 style={{ margin: '0 0 5px 0' }}>{t('landing.feat_3_title')}</h3>
              <p style={{ margin: 0, opacity: 0.7, fontSize: '0.9em' }}>{t('landing.feat_3_desc')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* --- FAQ --- */}
      <div style={{ width: '100%', marginBottom: '40px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>{t('landing.faq_title')}</h2>
        
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
            <CheckCircle size={16} color="#4ade80" /> {t('landing.faq_1_q')}
          </h4>
          <p style={{ margin: 0, opacity: 0.6, paddingLeft: '26px' }}>{t('landing.faq_1_a')}</p>
        </div>

        <div>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
            <CheckCircle size={16} color="#4ade80" /> {t('landing.faq_2_q')}
          </h4>
          <p style={{ margin: 0, opacity: 0.6, paddingLeft: '26px' }}>{t('landing.faq_2_a')}</p>
        </div>
      </div>

      {/* --- FOOTER CTA --- */}
      <div style={{ textAlign: 'center', opacity: 0.5, fontSize: '0.9em', marginTop: '20px' }}>
        <p>{t('landing.cta_footer')}</p>
        <p>© 2026 GreenBatch OS</p>
      </div>

    </div>
  )
}