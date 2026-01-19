// Файл: src/contexts/LanguageContext.jsx
import { createContext, useContext, useState } from 'react'
import { ru } from '../locales/ru'
import { en } from '../locales/en'

const LanguageContext = createContext()

export const LanguageProvider = ({ children }) => {
  // 1. Считываем язык из памяти или ставим 'ru'
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('app_lang') || 'ru'
  })

  const dictionaries = { ru, en }

  // 2. Функция перевода t('auth.title')
  const t = (path) => {
    const keys = path.split('.')
    let current = dictionaries[lang]
    
    for (let key of keys) {
      if (current[key] === undefined) {
        // Если перевод не найден, возвращаем путь
        return path
      }
      current = current[key]
    }
    return current
  }

  // 3. Смена языка с сохранением
  const changeLanguage = (newLang) => {
    setLang(newLang)
    localStorage.setItem('app_lang', newLang)
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang: changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

// Хук для использования в компонентах
// eslint-disable-next-line react-refresh/only-export-components
export const useLanguage = () => useContext(LanguageContext)