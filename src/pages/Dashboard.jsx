// Файл: src/pages/Dashboard.jsx
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useLanguage } from '../contexts/LanguageContext'
import CropsManager from '../components/CropsManager' 
import BatchesManager from '../components/BatchesManager'
import OrdersManager from '../components/OrdersManager'
import LegalModal from '../components/LegalModal'
import { AlertTriangle } from 'lucide-react'

export default function Dashboard({ session }) {
  const { t, lang, setLang } = useLanguage()

  // ГЛАВНЫЙ ПУЛЬС: Когда это число меняется, все компоненты обновляют данные
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // ДАННЫЕ ДЛЯ БЫСТРОЙ ПОСАДКИ (Телепорт из Заказов в Партии)
  const [prefillData, setPrefillData] = useState(null)
  
  // Состояние для открытия юридических документов (null, 'privacy', 'terms')
  const [legalView, setLegalView] = useState(null)

  // Состояние для модалки удаления аккаунта
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Функция, которую мы передадим детям: "Вызови меня, когда что-то изменишь"
  const triggerUpdate = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  // Функция, которую вызывает OrdersManager при нажатии "⚡ Посадить"
  const handleQuickPlant = (data) => {
    setPrefillData(data) // Сохраняем данные (ID культуры, кол-во)
    window.scrollTo({ top: 0, behavior: 'smooth' }) // Прокручиваем наверх к форме
  }

  // --- ЛОГИКА УДАЛЕНИЯ АККАУНТА ---
  const handleFullAccountDelete = async () => {
    setIsDeleting(true)
    try {
      const userId = session.user.id

      // 1. Удаляем партии
      await supabase.from('batches').delete().eq('user_id', userId)
      
      // 2. Удаляем заказы
      await supabase.from('standing_orders').delete().eq('user_id', userId)
      
      // 3. Удаляем культуры (нужно удалять после партий и заказов из-за связей)
      await supabase.from('crops').delete().eq('user_id', userId)

      // 4. Удаляем статус PRO (если есть)
      await supabase.from('user_status').delete().eq('user_id', userId)

      // 5. Выходим из системы
      await supabase.auth.signOut()
      
      // Перезагрузка страницы
      window.location.reload()

    } catch (error) {
      console.error('Error deleting account:', error)
      alert('Error deleting data. Please contact support.')
      setIsDeleting(false)
    }
  }

  return (
    <div style={{ paddingBottom: '30px' }}>
      
      {/* --- ОБНОВЛЕННАЯ ШАПКА (С классами для мобильной версии) --- */}
      <header className="app-header">
        <div className="header-brand">GreenBatch OS</div>
        
        <div className="header-right">
          
          {/* Переключатель языка */}
          <div className="lang-buttons">
            <button 
              onClick={() => setLang('ru')} 
              className={`lang-btn ${lang === 'ru' ? 'active' : ''}`}
            >
              RU
            </button>
            <button 
              onClick={() => setLang('en')} 
              className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
            >
              EN
            </button>
          </div>

          <div className="header-divider"></div>

          <div className="user-profile">
            {/* Почта скроется на телефоне благодаря CSS классу user-email */}
            <span className="user-email">{session.user.email}</span>
            <button 
              onClick={() => supabase.auth.signOut()}
              className="logout-btn"
            >
              {t('dashboard.logout')}
            </button>
          </div>
        </div>
      </header>

       {/* Активные Партии (Принимают prefillData) */}
       <BatchesManager 
         session={session} 
         onUpdate={triggerUpdate} 
         refreshTrigger={refreshTrigger}
         prefillData={prefillData}
         onPrefillConsumed={() => setPrefillData(null)}
       />
       
       <hr style={{ borderColor: '#333', margin: '30px 0', opacity: 0.5 }} />

       {/* Постоянные Заказы (Принимают onPlant) */}
       <OrdersManager 
         session={session} 
         onUpdate={triggerUpdate} 
         refreshTrigger={refreshTrigger}
         onPlant={handleQuickPlant}
       />

       <hr style={{ borderColor: '#333', margin: '30px 0', opacity: 0.5 }} />
       
       <CropsManager 
         session={session} 
         onUpdate={triggerUpdate} 
         refreshTrigger={refreshTrigger}
       />

       {/* --- ФУТЕР --- */}
       <footer style={{ marginTop: '50px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
          
          {/* Ссылки на документы */}
          <div style={{ display: 'flex', gap: '20px', opacity: 0.5, fontSize: '0.8em' }}>
            <button 
              onClick={() => setLegalView('privacy')}
              style={{ background: 'transparent', border: 'none', color: '#888', width: 'auto', padding: 0, textDecoration: 'underline', cursor: 'pointer' }}
            >
              {t('legal.privacy_link')}
            </button>
            <button 
              onClick={() => setLegalView('terms')}
              style={{ background: 'transparent', border: 'none', color: '#888', width: 'auto', padding: 0, textDecoration: 'underline', cursor: 'pointer' }}
            >
              {t('legal.terms_link')}
            </button>
          </div>

          {/* Кнопка удаления аккаунта */}
          <button 
            onClick={() => setShowDeleteModal(true)}
            style={{ 
              background: 'transparent', 
              border: '1px solid #333', 
              color: '#ef4444', 
              fontSize: '0.75em', 
              padding: '5px 10px', 
              width: 'auto',
              marginTop: '10px',
              opacity: 0.7
            }}
          >
            {t('profile.delete_btn')}
          </button>

       </footer>

       {/* МОДАЛКА ЮРИДИЧЕСКИХ ДОКУМЕНТОВ */}
       {legalView && (
         <LegalModal type={legalView} onClose={() => setLegalView(null)} />
       )}

       {/* МОДАЛКА УДАЛЕНИЯ АККАУНТА */}
       {showDeleteModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '350px', border: '1px solid #ef4444', textAlign: 'center' }}>
            <AlertTriangle size={48} color="#ef4444" style={{ marginBottom: '15px' }} />
            <h3 style={{ marginTop: 0 }}>{t('profile.delete_title')}</h3>
            <p style={{ color: '#ccc', marginBottom: '20px' }}>{t('profile.delete_desc')}</p>
            
            <button 
              onClick={handleFullAccountDelete} 
              disabled={isDeleting}
              style={{ background: '#ef4444', color: '#fff', marginBottom: '10px', opacity: isDeleting ? 0.5 : 1 }}
            >
              {isDeleting ? t('profile.deleting') : t('profile.delete_confirm_btn')}
            </button>
            
            <button 
              onClick={() => setShowDeleteModal(false)} 
              disabled={isDeleting}
              style={{ background: 'transparent', border: '1px solid #333', color: '#888' }}
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
       )}

    </div>
  )
}