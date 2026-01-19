// Файл: src/components/BatchesManager.jsx
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useLanguage } from '../contexts/LanguageContext'
import { Play, Trash2, CheckSquare, XCircle, History, Sprout, AlertTriangle, Search, Lock, Key, ChevronDown, ChevronRight } from 'lucide-react'

// !!! ВСТАВЬ СЮДА СВОЮ ССЫЛКУ НА ТОВАР DIGISELLER !!!
const DIGISELLER_LINK = "https://oplata.info/asp2/pay.asp?id_d=5655420" 

// Принимаем ВСЕ пропсы: и для обновления, и для телепорта
export default function BatchesManager({ session, onUpdate, refreshTrigger, prefillData, onPrefillConsumed }) {
  const { t } = useLanguage()
  const [batches, setBatches] = useState([])
  const [crops, setCrops] = useState([]) 
  const [loading, setLoading] = useState(true)
  
  // Состояние сворачивания (по умолчанию развернуто)
  const [expanded, setExpanded] = useState(true)

  const [view, setView] = useState('active') 
  const [showForm, setShowForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Логика состояний
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  const [finishBatch, setFinishBatch] = useState(null)
  const [confirmationStep, setConfirmationStep] = useState(false) 
  const [dumpMode, setDumpMode] = useState(false) 
  const [stockWarning, setStockWarning] = useState(null) 

  // === FREEMIUM & PRO ===
  const [isPro, setIsPro] = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)
  const [activationKey, setActivationKey] = useState('')
  const [activating, setActivating] = useState(false)
  const FREE_LIMIT = 5

  const [newBatch, setNewBatch] = useState({
    crop_id: '',
    tray_number: '',
    start_date: new Date().toISOString().split('T')[0]
  })

  const [harvestData, setHarvestData] = useState({ weight: '', notes: '' })

  // 1. Проверяем статус PRO (Обернули в useCallback чтобы исправить ошибку)
  const checkProStatus = useCallback(async () => {
    const { data } = await supabase
      .from('user_status')
      .select('is_pro')
      .eq('user_id', session.user.id)
      .single()
    
    if (data && data.is_pro) {
      setIsPro(true)
    }
  }, [session.user.id])

  useEffect(() => {
    checkProStatus()
  }, [checkProStatus])

  // === ЭФФЕКТ: СЛЕЖИМ ЗА "ТЕЛЕПОРТОМ" ===
  useEffect(() => {
    if (prefillData) {
      setExpanded(true) // <--- Разворачиваем принудительно при телепорте
      
      // Проверка лимита
      const activeCount = batches.filter(b => b.status === 'active').length
      if (!isPro && activeCount >= FREE_LIMIT) {
        setShowPaywall(true)
        if (onPrefillConsumed) onPrefillConsumed()
        return
      }

      setShowForm(true)
      setView('active')
      setNewBatch(prev => ({ ...prev, crop_id: prefillData.crop_id, tray_number: '' }))
      if (onPrefillConsumed) onPrefillConsumed()
    }
  }, [prefillData, onPrefillConsumed, batches, isPro])

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const { data: cropsData } = await supabase.from('crops').select('*').order('name')
      setCrops(cropsData || [])

      let query = supabase.from('batches').select('*, crops(*)')

      if (view === 'active') {
        query = query.eq('status', 'active').order('start_date', { ascending: true })
      } else {
        query = query.in('status', ['harvested', 'dumped']).order('harvest_date', { ascending: false })
      }

      const { data: batchesData, error } = await query
      if (error) throw error
      setBatches(batchesData || [])
    } catch (error) { console.error(error.message) } 
    finally { setLoading(false) }
  }, [view])

  useEffect(() => {
    fetchData()
  }, [fetchData, refreshTrigger]) 

  const filteredBatches = batches.filter(batch => {
    if (!searchTerm) return true
    const lowerTerm = searchTerm.toLowerCase()
    return (
      batch.crops.name.toLowerCase().includes(lowerTerm) || 
      batch.tray_number.toLowerCase().includes(lowerTerm)
    )
  })

  // --- ОТКРЫТИЕ ФОРМЫ (С ПРОВЕРКОЙ ЛИМИТА) ---
  const handleOpenForm = () => {
    const activeCount = batches.filter(b => b.status === 'active').length
    if (!isPro && activeCount >= FREE_LIMIT) {
      setShowPaywall(true)
    } else {
      setShowForm(true)
    }
  }

  // --- АКТИВАЦИЯ КЛЮЧА ---
  const handleActivate = async () => {
    if (!activationKey) return
    setActivating(true)
    try {
      const { data, error } = await supabase.rpc('activate_pro', { input_key: activationKey.trim() })
      if (error) throw error

      if (data === true) {
        setIsPro(true)
        setShowPaywall(false)
        alert(t('batches.pro_activated'))
        // Сразу обновляем страницу или данные, чтобы кнопка стала зеленой
        checkProStatus()
      } else {
        alert(t('batches.invalid_key'))
      }
    } catch (error) {
      console.error(error)
      alert('Error activating key')
    } finally {
      setActivating(false)
    }
  }

  // --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---
  const checkStockAndPrepare = (e) => {
    e.preventDefault()
    if (!newBatch.crop_id) return alert(t('batches.select_crop'))
    const selectedCrop = crops.find(c => c.id === newBatch.crop_id)
    const seedWeight = selectedCrop.default_seed_weight_g || 0
    const currentStock = selectedCrop.current_stock_g || 0
    if (currentStock < seedWeight) {
         const msg = t('crops.stock_error').replace('{current}', currentStock).replace('{needed}', seedWeight)
         setStockWarning(msg)
    } else { executeStartBatch(seedWeight, currentStock) }
  }

  const executeStartBatch = async (seedWeight, currentStock) => {
    try {
      const { error: batchError } = await supabase.from('batches').insert([{
          user_id: session.user.id, crop_id: newBatch.crop_id, tray_number: newBatch.tray_number,
          start_date: newBatch.start_date, status: 'active', seed_weight_g: seedWeight
      }])
      if (batchError) throw batchError
      const newStock = currentStock - seedWeight
      await supabase.from('crops').update({ current_stock_g: newStock }).eq('id', newBatch.crop_id)
      setShowForm(false); setStockWarning(null); setNewBatch({ ...newBatch, tray_number: '' }); onUpdate() 
    } catch (error) { alert(error.message) }
  }

  const initiateFinish = (isDump) => { setDumpMode(isDump); setConfirmationStep(true) }
  const confirmFinish = async () => {
    if (!finishBatch) return
    try {
      const weight = dumpMode ? 0 : parseFloat(harvestData.weight || 0)
      const status = dumpMode ? 'dumped' : 'harvested'
      const { error } = await supabase.from('batches').update({
          status: status, harvest_weight_g: weight, harvest_date: new Date().toISOString().split('T')[0],
          notes: harvestData.notes, fail_reason: dumpMode ? 'Dumped' : (harvestData.notes ? 'Issues' : null) 
        }).eq('id', finishBatch.id)
      if (error) throw error
      closeFinishModal(); onUpdate() 
    } catch (error) { alert(error.message) }
  }
  const closeFinishModal = () => { setFinishBatch(null); setHarvestData({ weight: '', notes: '' }); setConfirmationStep(false) }
  const handleDeleteClick = (id) => { if (deleteConfirmId === id) deleteBatch(id); else { setDeleteConfirmId(id); setTimeout(() => setDeleteConfirmId(null), 3000) } }
  const deleteBatch = async (id) => { const { error } = await supabase.from('batches').delete().eq('id', id); if (!error) { setDeleteConfirmId(null); onUpdate() } }
  const getBatchStatus = (batch) => {
    const start = new Date(batch.start_date); const today = new Date(); const daysPassed = Math.floor((today - start) / (1000 * 60 * 60 * 24))
    const blackoutDays = batch.crops.days_blackout; const totalDays = batch.crops.days_blackout + batch.crops.days_light
    if (daysPassed < blackoutDays) return { stage: t('batches.stage_blackout'), color: '#a78bfa', daysLeft: blackoutDays - daysPassed, isReady: false }
    else if (daysPassed < totalDays) return { stage: t('batches.stage_light'), color: '#facc15', daysLeft: totalDays - daysPassed, isReady: false }
    else return { stage: t('batches.stage_ready'), color: '#4ade80', daysLeft: 0, isReady: true }
  }
  const getEfficiency = (batch) => { if (batch.status === 'dumped' || !batch.harvest_weight_g || !batch.seed_weight_g) return 0; return (batch.harvest_weight_g / batch.seed_weight_g).toFixed(1) }

  const activeCount = batches.length 
  // Логика цвета кнопки: если лимит - ЖЕЛТЫЙ (призыв к действию), иначе зеленый
  const isLimitReached = !isPro && activeCount >= FREE_LIMIT

  return (
    <div style={{ marginBottom: '40px' }}>
      
      {/* ЗАГОЛОВОК С КЛИКОМ ДЛЯ СВОРАЧИВАНИЯ */}
      <div 
        onClick={() => setExpanded(!expanded)}
        style={{ 
          marginBottom: '20px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          cursor: 'pointer',
          userSelect: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {expanded ? <ChevronDown size={24} /> : <ChevronRight size={24} />}
            <h2 style={{ margin: '0' }}>{t('batches.title')}</h2>
        </div>
        
        {view === 'active' && !isPro && (
            <span style={{ 
                fontSize: '0.8em', 
                background: isLimitReached ? '#ef4444' : '#333', 
                padding: '4px 8px', borderRadius: '4px',
                color: isLimitReached ? '#fff' : '#888'
            }}>
                {t('batches.active_count').replace('{current}', activeCount).replace('{max}', FREE_LIMIT)}
            </span>
        )}
      </div>
      
      {/* СКРЫВАЕМАЯ ОБЛАСТЬ */}
      {expanded && (
        <>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'stretch' }}>
            <div style={{ display: 'flex', background: '#333', borderRadius: '8px', padding: '4px', flexGrow: 1, justifyContent: 'center' }}>
                <button onClick={() => setView('active')} style={{ background: view === 'active' ? '#4ade80' : 'transparent', color: view === 'active' ? '#000' : '#fff', width: '100%', padding: '8px 12px', borderRadius: '6px', border: 'none', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Sprout size={16} /> {t('batches.tab_active')}
                </button>
                <button onClick={() => setView('history')} style={{ background: view === 'history' ? '#4ade80' : 'transparent', color: view === 'history' ? '#000' : '#fff', width: '100%', padding: '8px 12px', borderRadius: '6px', border: 'none', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <History size={16} /> {t('batches.tab_history')}
                </button>
            </div>
            {view === 'active' && !showForm && (
                <button 
                    onClick={handleOpenForm} 
                    style={{ 
                        flexGrow: 2, 
                        // Если лимит достигнут -> ЖЕЛТЫЙ, Иначе -> ЗЕЛЕНЫЙ
                        background: isLimitReached ? '#facc15' : '#4ade80', 
                        color: '#000', 
                        display: 'flex', gap: '6px', alignItems: 'center', justifyContent: 'center', 
                        border: 'none', fontWeight: '600', padding: '12px', marginTop: 0 
                    }}
                >
                {isLimitReached ? <Lock size={18} /> : <Play size={18} fill="black" />} 
                {isLimitReached ? t('batches.buy_pro') : t('batches.new_btn')}
                </button>
            )}
            </div>
            
            <div style={{ height: '15px' }}></div>

            {!loading && batches.length > 0 && !showForm && (
                <div style={{ marginBottom: '15px', position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                <input type="text" placeholder={t('batches.search_placeholder') || "Search..."} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ paddingLeft: '35px', margin: 0, background: '#1e1e1e', border: '1px solid #333' }} />
                </div>
            )}

            {showForm && (
                <div className="card" style={{ border: '1px solid #4ade80', marginBottom: '20px' }}>
                {!stockWarning ? (
                    <form onSubmit={checkStockAndPrepare}>
                    <label>{t('batches.select_crop')}</label>
                    <select value={newBatch.crop_id} onChange={e => setNewBatch({...newBatch, crop_id: e.target.value})} required>
                        <option value="">-- {t('common.select')} --</option>
                        {crops.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <label>{t('batches.tray_number')}</label>
                    <input type="text" placeholder="e.g. 10" value={newBatch.tray_number} onChange={e => setNewBatch({...newBatch, tray_number: e.target.value})} required autoFocus={!!prefillData} />
                    <label>{t('batches.start_date')}</label>
                    <input type="date" value={newBatch.start_date} onChange={e => setNewBatch({...newBatch, start_date: e.target.value})} required />
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                        <button type="submit" style={{ background: '#4ade80', color: 'black' }}>{t('common.save')}</button>
                        <button type="button" onClick={() => setShowForm(false)} style={{ background: '#333' }}>{t('common.cancel')}</button>
                    </div>
                    </form>
                ) : (
                    <div style={{ textAlign: 'center', padding: '10px' }}>
                    <AlertTriangle size={40} color="#facc15" style={{ marginBottom: '10px' }} />
                    <h3 style={{ margin: '0 0 10px 0', color: '#facc15' }}>{t('crops.stock_low_warning')}</h3>
                    <p>{stockWarning}</p>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                        <button onClick={() => { const selectedCrop = crops.find(c => c.id === newBatch.crop_id); executeStartBatch(selectedCrop.default_seed_weight_g, selectedCrop.current_stock_g) }} style={{ background: '#facc15', color: '#000', width: '100%', fontWeight: 'bold' }}>{t('common.confirm')}</button>
                        <button onClick={() => setStockWarning(null)} style={{ background: '#333', width: '100%' }}>{t('common.cancel')}</button>
                    </div>
                    </div>
                )}
                </div>
            )}

            {/* PAYWALL */}
            {showPaywall && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', zIndex: 200, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
                    <div className="card" style={{ width: '100%', maxWidth: '350px', border: '1px solid #facc15', textAlign: 'center', padding: '30px 20px' }}>
                        <Lock size={48} color="#facc15" style={{marginBottom: '20px'}} />
                        <h2 style={{marginTop: 0}}>{t('batches.limit_reached_title')}</h2>
                        <p style={{opacity: 0.8, marginBottom: '20px'}}>{t('batches.limit_reached_desc')}</p>
                        <a 
                            href={DIGISELLER_LINK} 
                            target="_blank" 
                            rel="noreferrer" 
                            style={{ 
                                display: 'block', 
                                width: '100%', 
                                padding: '12px', 
                                background: '#facc15', 
                                color: '#000', 
                                fontWeight: 'bold', 
                                textDecoration: 'none', 
                                borderRadius: '8px', 
                                marginBottom: '20px',
                                boxSizing: 'border-box' // Исправляет вылезание за края
                            }}
                        >
                            {t('batches.buy_pro')}
                        </a>
                        {/* ВВОД КЛЮЧА */}
                        <div style={{borderTop: '1px solid #333', paddingTop: '20px'}}>
                            <p style={{fontSize: '0.9em', marginBottom: '10px'}}>{t('batches.enter_key')}</p>
                            
                            {/* display: flex + alignItems: stretch выровняет высоту */}
                            <div style={{display: 'flex', gap: '8px', alignItems: 'stretch'}}>
                                <input 
                                    type="text" 
                                    placeholder={t('batches.key_placeholder')}
                                    value={activationKey}
                                    onChange={(e) => setActivationKey(e.target.value)}
                                    // margin: 0 обязательно, чтобы убрать глобальные отступы input
                                    style={{margin: 0, flex: 1}} 
                                />
                                <button 
                                    onClick={handleActivate} 
                                    disabled={activating} 
                                    style={{
                                        width: '50px', 
                                        background: '#333', 
                                        border: '1px solid #444',
                                        margin: 0, // Сброс глобального margin-top: 10px
                                        padding: 0,
                                        display: 'flex', 
                                        justifyContent: 'center', 
                                        alignItems: 'center',
                                        borderRadius: '6px' // Ставим 6px, чтобы совпадало с input
                                    }}
                                >
                                    {activating ? '...' : <Key size={20} />}
                                </button>
                            </div>
                        </div>
                        <button onClick={() => setShowPaywall(false)} style={{background: 'transparent', color: '#666', marginTop: '15px', border: 'none', fontSize: '0.9em'}}>{t('common.cancel')}</button>
                    </div>
                </div>
            )}

            {finishBatch && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
                <div className="card" style={{ width: '100%', maxWidth: '400px', border: '1px solid #4ade80' }}>
                    {!confirmationStep ? (
                    <>
                        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '15px'}}>
                        <h3>{t('batches.finish_title')}</h3>
                        <button onClick={closeFinishModal} style={{background: 'transparent', width: 'auto', padding: 0}}><XCircle /></button>
                        </div>
                        <p style={{marginBottom: '10px', opacity: 0.8}}>{finishBatch.crops.name} <small>(#{finishBatch.tray_number})</small></p>
                        <label>{t('batches.weight_placeholder')}</label>
                        <input type="number" placeholder="0" value={harvestData.weight} onChange={e => setHarvestData({...harvestData, weight: e.target.value})} autoFocus />
                        <label>{t('batches.notes_placeholder')}</label>
                        <input type="text" placeholder="..." value={harvestData.notes} onChange={e => setHarvestData({...harvestData, notes: e.target.value})} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
                        <button onClick={() => initiateFinish(false)} disabled={!harvestData.weight || harvestData.weight <= 0} style={{ background: '#4ade80', color: '#000', opacity: (!harvestData.weight || harvestData.weight <= 0) ? 0.5 : 1 }}>{t('batches.mark_harvested')}</button>
                        <button onClick={() => initiateFinish(true)} style={{ background: '#333', color: '#ef4444', border: '1px solid #ef4444' }}>{t('batches.mark_dumped')}</button>
                        </div>
                    </>
                    ) : (
                    <div style={{ textAlign: 'center', padding: '10px' }}>
                        <AlertTriangle size={48} color="#facc15" style={{ marginBottom: '15px' }} />
                        <h3 style={{ margin: '0 0 10px 0' }}>{t('batches.confirm_harvest_title')}</h3>
                        <p>{dumpMode ? t('batches.confirm_dump_text') : <>{t('batches.confirm_harvest_text')} <strong style={{color: '#4ade80'}}>{harvestData.weight}g</strong>?</>}</p>
                        <p style={{ opacity: 0.6, fontSize: '0.9em' }}>{t('batches.confirm_warning')}</p>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                        <button onClick={confirmFinish} style={{ background: dumpMode ? '#ef4444' : '#4ade80', color: dumpMode ? '#fff' : '#000', width: '100%' }}>{dumpMode ? t('batches.btn_yes_dump') : t('batches.btn_yes_save')}</button>
                        <button onClick={() => {setConfirmationStep(false); setDumpMode(false)}} style={{ background: '#333', width: '100%' }}>{t('common.back')}</button>
                        </div>
                    </div>
                    )}
                </div>
                </div>
            )}

            {loading ? (
                <p>{t('common.loading')}</p>
            ) : batches.length === 0 ? (
                <p style={{ textAlign: 'center', opacity: 0.5 }}>{t('batches.empty')}</p>
            ) : (
                <div style={{ display: 'grid', gap: '10px' }}>
                {filteredBatches.map(batch => {
                    if (view === 'active') {
                    const info = getBatchStatus(batch)
                    const start = new Date(batch.start_date)
                    const dayNum = Math.floor((new Date() - start) / (1000 * 60 * 60 * 24)) + 1
                    const isDeleting = deleteConfirmId === batch.id
                    return (
                        <div key={batch.id} className="card" style={{ padding: '15px', borderLeft: `5px solid ${info.color}`, position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                            <span style={{ background: '#333', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75em', marginRight: '8px', color: '#fff', border: '1px solid #555' }}>#{batch.tray_number}</span>
                            <span style={{ fontWeight: 'bold', fontSize: '1.1em' }}>{batch.crops.name}</span>
                            </div>
                            <div style={{display: 'flex', gap: '10px'}}>
                            <button onClick={() => { setFinishBatch(batch); setHarvestData({weight: '', notes: ''}); setConfirmationStep(false) }} style={{ width: 'auto', padding: '5px', background: '#333', border: '1px solid #555', color: '#4ade80' }}><CheckSquare size={20} /></button>
                            <button onClick={() => handleDeleteClick(batch.id)} style={{ width: 'auto', padding: '5px 10px', background: isDeleting ? '#ef4444' : 'transparent', color: isDeleting ? '#fff' : '#666', border: 'none', borderRadius: '4px', transition: '0.2s' }}>{isDeleting ? t('common.are_you_sure') : <Trash2 size={20} />}</button>
                            </div>
                        </div>
                        <div style={{ marginTop: '10px', color: info.color, fontWeight: '500', display: 'flex', alignItems: 'center', gap: '5px' }}>{info.stage}</div>
                        <div style={{ marginTop: '5px', fontSize: '0.85em', opacity: 0.7, display: 'flex', justifyContent: 'space-between' }}><span>{t('batches.days_total')} {dayNum}</span>{!info.isReady && <span>{info.daysLeft} {t('batches.days_left')}</span>}</div>
                        </div>
                    )
                    } else {
                    const isDumped = batch.status === 'dumped'
                    const efficiency = getEfficiency(batch)
                    const color = isDumped ? '#ef4444' : '#64748b'
                    const isDeleting = deleteConfirmId === batch.id
                    return (
                        <div key={batch.id} className="card" style={{ padding: '15px', borderLeft: `5px solid ${color}`, opacity: 0.8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                            <span style={{ fontSize: '0.9em', color: '#999' }}>{batch.harvest_date}</span>
                            <div style={{ fontWeight: 'bold', fontSize: '1.1em', marginTop: '2px' }}>{batch.crops.name}</div>
                            <div style={{ fontSize: '0.8em', opacity: 0.6 }}>#{batch.tray_number}</div>
                            </div>
                            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
                            <button onClick={() => handleDeleteClick(batch.id)} style={{ padding: '4px 8px', width: 'auto', background: isDeleting ? '#ef4444' : 'transparent', color: isDeleting ? '#fff' : '#666', border: 'none', cursor: 'pointer', marginBottom: '5px', borderRadius: '4px' }}>{isDeleting ? t('common.are_you_sure') : <Trash2 size={16} />}</button>
                            {isDumped ? <div style={{ color: '#ef4444', fontWeight: 'bold' }}>{t('batches.dumped')}</div> : <><div style={{ fontSize: '1.2em', fontWeight: 'bold', color: '#4ade80' }}>{batch.harvest_weight_g}g</div>{efficiency > 0 && <div style={{ fontSize: '0.8em', color: '#ccc' }}>{t('batches.efficiency')} <span style={{color: efficiency > 8 ? '#4ade80' : '#fff'}}>x{efficiency}</span></div>}</>}
                            </div>
                        </div>
                        {(batch.notes || batch.fail_reason) && <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #333', fontSize: '0.85em', color: '#999', fontStyle: 'italic' }}>{batch.notes || batch.fail_reason}</div>}
                        </div>
                    )
                    }
                })}
                </div>
            )}
        </>
      )}
    </div>
  )
}