// Файл: src/components/CropsManager.jsx
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useLanguage } from '../contexts/LanguageContext'
import { Trash2, Plus, Sprout, Moon, Sun, Scale, Package, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react'

export default function CropsManager({ session, onUpdate, refreshTrigger }) {
  const { t } = useLanguage()
  const [crops, setCrops] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  
  // Состояние сворачивания
  const [expanded, setExpanded] = useState(true)
  
  const [refillCrop, setRefillCrop] = useState(null) 
  const [refillAmount, setRefillAmount] = useState('')
  
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  
  // Храним ID карточки, где произошла ошибка удаления
  const [errorId, setErrorId] = useState(null)

  const [newCrop, setNewCrop] = useState({
    name: '',
    days_blackout: 3,
    days_light: 7,
    default_seed_weight_g: 0,
    current_stock_g: 0 
  })

  const fetchCrops = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from('crops').select('*').order('name')
      if (error) throw error
      setCrops(data || [])
    } catch (error) {
      console.error('Error fetching crops:', error.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCrops()
  }, [fetchCrops, refreshTrigger])

  const handleAddCrop = async (e) => {
    e.preventDefault()
    try {
      const { error } = await supabase.from('crops').insert([{
          user_id: session.user.id,
          name: newCrop.name,
          days_blackout: parseInt(newCrop.days_blackout),
          days_light: parseInt(newCrop.days_light),
          default_seed_weight_g: parseFloat(newCrop.default_seed_weight_g),
          current_stock_g: parseFloat(newCrop.current_stock_g || 0)
      }])

      if (error) throw error
      setShowForm(false)
      setNewCrop({ name: '', days_blackout: 3, days_light: 7, default_seed_weight_g: 0, current_stock_g: 0 })
      
      onUpdate() 
      
    } catch (error) { alert(error.message) }
  }

  const handleRefill = async () => {
    if (!refillCrop || !refillAmount) return
    try {
        const newStock = (refillCrop.current_stock_g || 0) + parseFloat(refillAmount)
        const { error } = await supabase.from('crops').update({ current_stock_g: newStock }).eq('id', refillCrop.id)
        if (error) throw error
        setRefillCrop(null)
        setRefillAmount('')
        
        onUpdate() 
        
    } catch (error) { alert(error.message) }
  }

  const handleDeleteClick = (id) => {
    // Сбрасываем старые ошибки при новом клике
    setErrorId(null)
    
    if (deleteConfirmId === id) {
      deleteCrop(id)
    } else {
      setDeleteConfirmId(id)
      setTimeout(() => setDeleteConfirmId(null), 3000)
    }
  }

  const deleteCrop = async (id) => {
    const { error } = await supabase.from('crops').delete().eq('id', id)
    
    if (error) {
        // Код 23503 — это нарушение foreign key (есть связи)
        if (error.code === '23503') {
            setErrorId(id) // Показываем ошибку на конкретной карточке
            setDeleteConfirmId(null) // Убираем режим удаления
        } else {
            alert(error.message) // Другие ошибки показываем как раньше
        }
    } else { 
        setDeleteConfirmId(null)
        onUpdate() 
    } 
  }

  return (
    <div>
      {/* ЗАГОЛОВОК + ТОГГЛ */}
      <div 
        onClick={() => setExpanded(!expanded)}
        style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '15px',
            cursor: 'pointer',
            userSelect: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {expanded ? <ChevronDown size={24} /> : <ChevronRight size={24} />}
            <h2 style={{ margin: 0 }}>{t('crops.title')}</h2>
        </div>

        {expanded && !showForm && (
          <button 
            onClick={(e) => { e.stopPropagation(); setShowForm(true) }} // Stop propagation чтобы не свернуть
            style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '5px', background: '#4ade80', color: '#000', border: 'none', fontWeight: '600' }}
          >
            <Plus size={18} /> {t('common.add')}
          </button>
        )}
      </div>

      {/* СКРЫВАЕМЫЙ КОНТЕНТ */}
      {expanded && (
        <>
            {showForm && (
                <div className="card" style={{ border: '1px solid #4ade80', marginBottom: '20px' }}>
                <form onSubmit={handleAddCrop}>
                    <label>{t('crops.name_placeholder')}</label>
                    <input type="text" value={newCrop.name} onChange={e => setNewCrop({...newCrop, name: e.target.value})} required autoFocus />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                        <label style={{fontSize: '0.85em', display: 'flex', alignItems: 'center', gap: '4px'}}><Moon size={14}/> {t('crops.days_blackout')}</label>
                        <input type="number" value={newCrop.days_blackout} onChange={e => setNewCrop({...newCrop, days_blackout: e.target.value})} />
                    </div>
                    <div>
                        <label style={{fontSize: '0.85em', display: 'flex', alignItems: 'center', gap: '4px'}}><Sun size={14}/> {t('crops.days_light')}</label>
                        <input type="number" value={newCrop.days_light} onChange={e => setNewCrop({...newCrop, days_light: e.target.value})} />
                    </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                            <label style={{fontSize: '0.85em', display: 'flex', alignItems: 'center', gap: '4px'}}><Scale size={14}/> {t('crops.seeds_weight')}</label>
                            <input type="number" value={newCrop.default_seed_weight_g} onChange={e => setNewCrop({...newCrop, default_seed_weight_g: e.target.value})} />
                        </div>
                        <div>
                            <label style={{fontSize: '0.85em', display: 'flex', alignItems: 'center', gap: '4px'}}><Package size={14}/> {t('crops.stock_label')}</label>
                            <input type="number" value={newCrop.current_stock_g} onChange={e => setNewCrop({...newCrop, current_stock_g: e.target.value})} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button type="submit" style={{ background: '#4ade80', color: 'black' }}>{t('common.save')}</button>
                    <button type="button" onClick={() => setShowForm(false)} style={{ background: '#333' }}>{t('common.cancel')}</button>
                    </div>
                </form>
                </div>
            )}

            {/* МОДАЛКА ПОПОЛНЕНИЯ */}
            {refillCrop && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
                    <div className="card" style={{ width: '100%', maxWidth: '300px', border: '1px solid #3b82f6' }}>
                        <h3>{t('crops.refill_title')}</h3>
                        <p>{refillCrop.name}</p>
                        <input 
                            type="number" 
                            placeholder={t('crops.refill_placeholder')} 
                            value={refillAmount} 
                            onChange={e => setRefillAmount(e.target.value)} 
                            autoFocus 
                        />
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                            <button onClick={handleRefill} style={{ background: '#3b82f6', width: '100%' }}>{t('common.save')}</button>
                            <button onClick={() => setRefillCrop(null)} style={{ background: '#333', width: '100%' }}>{t('common.cancel')}</button>
                        </div>
                    </div>
                </div>
            )}

            {loading ? <p>{t('common.loading')}</p> : crops.length === 0 ? <p style={{ textAlign: 'center', opacity: 0.5 }}>{t('crops.empty')}</p> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {crops.map(crop => {
                    const isDeleting = deleteConfirmId === crop.id
                    const isLowStock = crop.current_stock_g < (crop.default_seed_weight_g * 2)
                    const hasError = errorId === crop.id // Есть ли ошибка на этой карточке?
                    
                    return (
                        <div key={crop.id} className="card" style={{ display: 'flex', flexDirection: 'column', padding: '15px', border: hasError ? '1px solid #ef4444' : '1px solid #333' }}>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                            <div style={{ flexGrow: 1 }}>
                                <div style={{ fontWeight: 'bold', fontSize: '1.1em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Sprout size={18} color="#4ade80" />
                                {crop.name}
                                </div>
                                <div style={{ fontSize: '0.85em', opacity: 0.7, marginTop: '5px', display: 'flex', gap: '15px' }}>
                                <span title="Days Blackout">🌑 {crop.days_blackout}d</span>
                                <span title="Days Light">☀️ {crop.days_light}d</span>
                                <span title="Seed Weight">⚖️ {crop.default_seed_weight_g}g</span>
                                </div>
                                
                                <div style={{ marginTop: '8px', fontSize: '0.9em', color: isLowStock ? '#ef4444' : '#3b82f6', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Package size={14} /> {t('crops.stock_label')} {crop.current_stock_g}g</span>
                                    <button onClick={() => setRefillCrop(crop)} style={{ padding: '2px 8px', fontSize: '0.8em', width: 'auto', background: '#333', border: '1px solid #444', marginTop: 0 }}>+</button>
                                </div>
                            </div>

                            <button 
                                onClick={() => handleDeleteClick(crop.id)}
                                style={{ 
                                    width: 'auto', padding: '8px 12px', marginLeft: '10px',
                                    background: isDeleting ? '#ef4444' : 'transparent', 
                                    color: isDeleting ? '#fff' : '#ef4444', 
                                    border: isDeleting ? 'none' : '1px solid transparent',
                                    borderRadius: '6px',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {isDeleting ? t('common.are_you_sure') : <Trash2 size={20} />}
                            </button>
                        </div>

                        {/* ОТОБРАЖЕНИЕ ОШИБКИ ВНУТРИ КАРТОЧКИ */}
                        {hasError && (
                            <div style={{ 
                                marginTop: '10px', 
                                paddingTop: '10px', 
                                borderTop: '1px solid #ef4444', 
                                color: '#ef4444', 
                                fontSize: '0.9em',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px'
                            }}>
                                <AlertTriangle size={16} />
                                {t('crops.delete_error_used')}
                            </div>
                        )}

                        </div>
                    )
                })}
                </div>
            )}
        </>
      )}
    </div>
  )
}