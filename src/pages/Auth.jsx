// Файл: src/pages/Auth.jsx
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useLanguage } from '../contexts/LanguageContext'

export default function Auth() {
  const { t, lang, setLang } = useLanguage()
  
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false) // Храним только статус: отправлено или нет
  const [errorMsg, setErrorMsg] = useState('') // Храним текст ошибки (он приходит от сервера)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    
    const { error } = await supabase.auth.signInWithOtp({ email })

    if (error) {
      setErrorMsg(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', flexDirection: 'column' }}>
      
      {/* Переключатель языка */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button 
          onClick={() => setLang('ru')} 
          style={{ background: lang === 'ru' ? '#646cff' : '#333', width: 'auto', padding: '5px 10px' }}
        >
          RU
        </button>
        <button 
          onClick={() => setLang('en')} 
          style={{ background: lang === 'en' ? '#646cff' : '#333', width: 'auto', padding: '5px 10px' }}
        >
          EN
        </button>
      </div>

      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>{t('auth.title')}</h1>
        <p style={{ textAlign: 'center', opacity: 0.7, marginBottom: '2rem' }}>
          {t('auth.subtitle')}
        </p>
        
        {sent ? (
          <div style={{ color: '#4ade80', textAlign: 'center', padding: '20px', border: '1px dashed #4ade80', borderRadius: '8px' }}>
            {/* Теперь этот текст тоже будет меняться при переключении языка */}
            {t('auth.success_message')} 
            <br/> 
            <small>{t('auth.check_spam')}</small>
          </div>
        ) : (
          <form onSubmit={handleLogin}>
            {errorMsg && (
              <div style={{ color: '#ef4444', marginBottom: '10px', fontSize: '0.9em' }}>
                {errorMsg}
              </div>
            )}
            
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9em' }}>
              {t('auth.email_label')}
            </label>
            <input
              type="email"
              placeholder={t('auth.email_placeholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button disabled={loading}>
              {loading ? t('auth.sending') : t('auth.login_btn')}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}