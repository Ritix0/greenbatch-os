// Файл: src/pages/Dashboard.jsx
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useLanguage } from '../contexts/LanguageContext'
import CropsManager from '../components/CropsManager' 
import BatchesManager from '../components/BatchesManager'
import OrdersManager from '../components/OrdersManager'
import LegalModal from '../components/LegalModal'
import { AlertTriangle } from 'lucide-react' // <--- Добавь импорт иконки

export default function Dashboard({ session }) {
  const { t, lang, setLang } = useLanguage()

  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [prefillData, setPrefillData] = useState(null)
  const [legalView, setLegalView] = useState(null)
  
  // Состояние для модалки удаления аккаунта
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const triggerUpdate = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  const handleQuickPlant = (data) => {
    setPrefillData(data)
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
      
      // (Опционально: перезагрузка страницы, чтобы выкинуло на логин)
      window.location.reload()

    } catch (error) {
      console.error('Error deleting account:', error)
      alert('Error deleting data. Please contact support.')
      setIsDeleting(false)
    }
  }

  return (
    <div style={{ paddingBottom: '30px' }}>
      {/* ... (HEADER ОСТАЕТСЯ БЕЗ ИЗМЕНЕНИЙ) ... */}
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '15px 0',
        marginBottom: '20px',
        borderBottom: '1px solid #333' 
      }}>
        <div style={{ fontWeight: 'bold', fontSize: '1.2em' }}>GreenBatch OS</div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          
          <div style={{ display: 'flex', gap: '5px' }}>
            <button onClick={() => setLang('ru')} style={{ background: lang === 'ru' ? '#646cff' : 'transparent', border: lang === 'ru' ? 'none' : '1px solid #444', padding: '5px 8px', fontSize: '0.75em', width: 'auto' }}>RU</button>
            <button onClick={() => setLang('en')} style={{ background: lang === 'en' ? '#646cff' : 'transparent', border: lang === 'en' ? 'none' : '1px solid #444', padding: '5px 8px', fontSize: '0.75em', width: 'auto' }}>EN</button>
          </div>

          <div style={{ height: '20px', width: '1px', background: '#444' }}></div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '0.8em', opacity: 0.6 }}>{session.user.email}</span>
            <button onClick={() => supabase.auth.signOut()} style={{ width: 'auto', padding: '0', fontSize: '0.8em', background: 'transparent', color: '#ef4444', marginTop: '2px', textAlign: 'right', border: 'none' }}>{t('dashboard.logout')}</button>
          </div>
        </div>
      </header>

       {/* ... (ВСЕ КОМПОНЕНТЫ МЕНЕДЖЕРОВ ОСТАЮТСЯ КАК БЫЛИ) ... */}
       <BatchesManager 
         session={session} 
         onUpdate={triggerUpdate} 
         refreshTrigger={refreshTrigger}
         prefillData={prefillData}
         onPrefillConsumed={() => setPrefillData(null)}
       />
       
       <hr style={{ borderColor: '#333', margin: '30px 0', opacity: 0.5 }} />

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

       {/* --- ОБНОВЛЕННЫЙ ФУТЕР --- */}
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

       {/* МОДАЛКА УДАЛЕНИЯ АККАУНТА (НОВАЯ) */}
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