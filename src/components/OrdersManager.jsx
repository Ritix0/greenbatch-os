// Файл: src/components/OrdersManager.jsx
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useLanguage } from '../contexts/LanguageContext'
import { Plus, Trash2, ArrowRight, Zap, ChevronDown, ChevronRight } from 'lucide-react'

// Принимаем onUpdate, refreshTrigger и onPlant (для Телепорта)
export default function OrdersManager({ session, onUpdate, refreshTrigger, onPlant }) {
  const { t } = useLanguage()
  const [orders, setOrders] = useState([])
  const [crops, setCrops] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  
  // Состояние сворачивания
  const [expanded, setExpanded] = useState(true)
  
  // Состояние для подтверждения удаления
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)

  // 1=Пн, ..., 7=Вс. (В массиве locales 0=Вс, поэтому будем корректировать)
  const daysOptions = [
    { val: 1, label: t('orders.week_days')[1] }, // Пн
    { val: 2, label: t('orders.week_days')[2] }, // Вт
    { val: 3, label: t('orders.week_days')[3] }, // Ср
    { val: 4, label: t('orders.week_days')[4] }, // Чт
    { val: 5, label: t('orders.week_days')[5] }, // Пт
    { val: 6, label: t('orders.week_days')[6] }, // Сб
    { val: 7, label: t('orders.week_days')[0] }, // Вс
  ]

  const [newOrder, setNewOrder] = useState({
    customer_name: '',
    crop_id: '',
    trays_count: 1,
    target_day_of_week: 5 // По умолчанию Пятница
  })

  // Оборачиваем в useCallback
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      const { data: cropsData } = await supabase.from('crops').select('*').order('name')
      setCrops(cropsData || [])

      const { data: ordersData, error } = await supabase
        .from('standing_orders')
        .select('*, crops(*)')
        .order('customer_name')

      if (error) throw error
      setOrders(ordersData || [])
    } catch (error) {
      console.error(error.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Слушаем сигнал обновления
  useEffect(() => {
    fetchOrders()
  }, [fetchOrders, refreshTrigger])

  const handleAddOrder = async (e) => {
    e.preventDefault()
    try {
      const { error } = await supabase.from('standing_orders').insert([{
        user_id: session.user.id,
        customer_name: newOrder.customer_name,
        crop_id: newOrder.crop_id,
        trays_count: parseInt(newOrder.trays_count),
        target_day_of_week: parseInt(newOrder.target_day_of_week)
      }])
      if (error) throw error
      setShowForm(false)
      setNewOrder({ ...newOrder, customer_name: '', trays_count: 1 })
      
      onUpdate() // <--- Сигнал обновления

    } catch (error) {
      alert(error.message)
    }
  }

  // --- ЛОГИКА УДАЛЕНИЯ (Новая) ---
  const handleDeleteClick = (id) => {
    if (deleteConfirmId === id) {
      deleteOrder(id)
    } else {
      setDeleteConfirmId(id)
      setTimeout(() => setDeleteConfirmId(null), 3000)
    }
  }

  const deleteOrder = async (id) => {
    const { error } = await supabase.from('standing_orders').delete().eq('id', id)
    if (!error) {
      setDeleteConfirmId(null)
      onUpdate() // <--- Сигнал обновления
    }
  }

  // === ГЛАВНАЯ ЛОГИКА (Back-Scheduling) ===
  const calculatePlantDay = (targetDay, blackout, light) => {
    const totalDays = blackout + light
    const targetIdx = targetDay - 1 
    let plantIdx = (targetIdx - totalDays) % 7
    if (plantIdx < 0) plantIdx += 7
    
    const mapToLocale = [1, 2, 3, 4, 5, 6, 0] 
    return t('orders.week_days')[mapToLocale[plantIdx]]
  }

  return (
    <div style={{ marginBottom: '40px' }}>
      
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
            <h2 style={{ margin: 0 }}>{t('orders.title')}</h2>
        </div>

        {expanded && !showForm && (
          <button 
            onClick={(e) => { e.stopPropagation(); setShowForm(true) }} // stopPropagation
            style={{ width: 'auto', background: '#3b82f6', color: '#fff', display: 'flex', gap: '5px', alignItems: 'center', border: 'none', fontWeight: '600' }}
          >
            <Plus size={18} /> {t('orders.add_btn')}
          </button>
        )}
      </div>

      {/* СКРЫВАЕМЫЙ КОНТЕНТ */}
      {expanded && (
        <>
            {showForm && (
                <div className="card" style={{ border: '1px solid #3b82f6', marginBottom: '20px' }}>
                <form onSubmit={handleAddOrder}>
                    <label>{t('orders.customer_placeholder')}</label>
                    <input 
                    type="text" 
                    value={newOrder.customer_name} 
                    onChange={e => setNewOrder({...newOrder, customer_name: e.target.value})} 
                    required 
                    placeholder="Restaurant Mario"
                    />
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                        <label>{t('batches.select_crop')}</label>
                        <select value={newOrder.crop_id} onChange={e => setNewOrder({...newOrder, crop_id: e.target.value})} required>
                        <option value="">--</option>
                        {crops.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label>{t('orders.trays_count')}</label>
                        <input type="number" value={newOrder.trays_count} onChange={e => setNewOrder({...newOrder, trays_count: e.target.value})} required min="1"/>
                    </div>
                    </div>

                    <label>{t('orders.shipment_day')} ({t('orders.every')}...)</label>
                    <select value={newOrder.target_day_of_week} onChange={e => setNewOrder({...newOrder, target_day_of_week: e.target.value})}>
                    {daysOptions.map(d => <option key={d.val} value={d.val}>{d.label}</option>)}
                    </select>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                    <button type="submit" style={{ background: '#3b82f6' }}>{t('common.save')}</button>
                    <button type="button" onClick={() => setShowForm(false)} style={{ background: '#333' }}>{t('common.cancel')}</button>
                    </div>
                </form>
                </div>
            )}

            {loading ? <p>{t('common.loading')}</p> : orders.length === 0 ? (
                <p style={{ textAlign: 'center', opacity: 0.5 }}>{t('orders.empty')}</p>
            ) : (
                <div style={{ display: 'grid', gap: '10px' }}>
                {orders.map(order => {
                    const plantDayName = calculatePlantDay(
                    order.target_day_of_week, 
                    order.crops.days_blackout, 
                    order.crops.days_light
                    )
                    const targetDayName = daysOptions.find(d => d.val === order.target_day_of_week)?.label
                    const isDeleting = deleteConfirmId === order.id

                    return (
                    <div key={order.id} className="card" style={{ padding: '15px', borderLeft: '5px solid #3b82f6' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '1.1em' }}>{order.customer_name}</div>
                        
                        {/* КНОПКА УДАЛЕНИЯ */}
                        <button 
                            onClick={() => handleDeleteClick(order.id)}
                            style={{ 
                            width: 'auto', padding: '5px 10px', 
                            background: isDeleting ? '#ef4444' : 'transparent', 
                            color: isDeleting ? '#fff' : '#666', 
                            border: 'none', borderRadius: '4px', transition: '0.2s' 
                            }}
                        >
                            {isDeleting ? t('common.are_you_sure') : <Trash2 size={18} />}
                        </button>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '8px 0' }}>
                        <span style={{ background: '#222', padding: '3px 8px', borderRadius: '4px' }}>
                            {order.crops.name} <span style={{opacity: 0.5}}>x</span>{order.trays_count}
                        </span>
                        </div>

                        {/* ЛОГИКА ПЛАНИРОВАНИЯ */}
                        <div style={{ 
                        marginTop: '10px', background: '#2a2a2a', padding: '10px', borderRadius: '6px',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.9em'
                        }}>
                            <div style={{ textAlign: 'center' }}>
                            <div style={{ opacity: 0.5, fontSize: '0.8em' }}>{t('orders.plant_day')}</div>
                            <div style={{ color: '#facc15', fontWeight: 'bold' }}>{plantDayName}</div>
                            </div>
                            
                            <ArrowRight size={16} style={{ opacity: 0.3 }} />
                            
                            <div style={{ textAlign: 'center' }}>
                            <div style={{ opacity: 0.5, fontSize: '0.8em' }}>{t('orders.shipment_day')}</div>
                            <div style={{ color: '#3b82f6', fontWeight: 'bold' }}>{targetDayName}</div>
                            </div>
                        </div>

                        {/* КНОПКА ТЕЛЕПОРТА (PLANT NOW) */}
                        <button 
                            onClick={() => onPlant && onPlant({ crop_id: order.crop_id })}
                            style={{ 
                                marginTop: '10px', width: '100%', 
                                background: '#333', border: '1px solid #444', 
                                display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px',
                                fontSize: '0.9em' 
                            }}
                        >
                            <Zap size={14} color="#facc15" fill="#facc15"/>
                            {t('orders.plant_now')}
                        </button>

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