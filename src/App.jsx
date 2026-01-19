// Файл: src/App.jsx
import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase' // Обрати внимание на новый путь
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Проверяем активную сессию при старте
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // 2. Слушаем изменения (вход/выход)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Показываем загрузку, пока спрашиваем Supabase "кто это?"
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '50px', opacity: 0.5 }}>
        Загрузка системы...
      </div>
    )
  }

  // Роутинг: если нет сессии -> Авторизация, есть -> Дашборд
  return (
    <>
      {!session ? <Auth /> : <Dashboard session={session} />}
    </>
  )
}