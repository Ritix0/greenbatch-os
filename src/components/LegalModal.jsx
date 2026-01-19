// Файл: src/components/LegalModal.jsx
import { X } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'

export default function LegalModal({ type, onClose }) {
  const { t } = useLanguage()

  // Определяем заголовок и текст в зависимости от типа
  const title = type === 'privacy' ? t('legal.privacy_title') : t('legal.terms_title')
  const text = type === 'privacy' ? t('legal.privacy_text') : t('legal.terms_text')

  return (
    <div 
      style={{ 
        position: 'fixed', 
        top: 0, left: 0, right: 0, bottom: 0, 
        background: 'rgba(0,0,0,0.85)', 
        zIndex: 1000, 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        padding: '20px' 
      }}
      onClick={onClose} // Закрытие при клике на фон
    >
      <div 
        className="card" 
        style={{ 
          width: '100%', 
          maxWidth: '500px', 
          maxHeight: '80vh', 
          display: 'flex', 
          flexDirection: 'column',
          position: 'relative',
          padding: '0', // Убираем паддинг контейнера, чтобы скролл был внутри
          overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()} // Чтобы клик внутри не закрывал
      >
        {/* Шапка */}
        <div style={{ padding: '20px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ width: 'auto', background: 'transparent', padding: 0, border: 'none', color: '#888' }}>
            <X size={24} />
          </button>
        </div>

        {/* Скроллящийся текст */}
        <div style={{ padding: '20px', overflowY: 'auto', textAlign: 'left', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
          {text}
        </div>

        {/* Футер модалки */}
        <div style={{ padding: '15px 20px', borderTop: '1px solid #333' }}>
          <button onClick={onClose} style={{ background: '#333', color: '#fff' }}>{t('common.close')}</button>
        </div>

      </div>
    </div>
  )
}