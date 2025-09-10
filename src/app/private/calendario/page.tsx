'use client'

import { useEffect, useMemo, useState } from 'react'
import { Calendar, Views, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import es from 'date-fns/locale/es'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import './agenda.css'

interface EventItem {
  id: string
  title: string
  start: Date | string
  end: Date | string
  allDay?: boolean
  description?: string
  location?: string
  color?: string
}

function ReminderEditor({ value, onChange }: { value?: number[]; onChange: (v: number[]) => void }) {
  const presets = [5,10,15,30,60,120, 24*60];
  const v = Array.isArray(value) ? value : [];
  function toggle(mins: number) {
    if (v.includes(mins)) onChange(v.filter(x => x!==mins)); else onChange([...v, mins]);
  }
  const [custom, setCustom] = useState('');
  function addCustom() {
    const mins = parseInt(custom, 10);
    if (!isNaN(mins) && mins>0 && mins<=60*24*365) {
      if (!v.includes(mins)) onChange([...v, mins]);
      setCustom('');
    }
  }
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {presets.map(m => (
          <button type="button" key={m}
            className={`px-2 py-1 rounded border text-sm ${v.includes(m)?'bg-primary text-white border-primary':'bg-white hover:bg-gray-50'}`}
            onClick={()=>toggle(m)}>
            {m>=60 ? (m%60===0 ? `${m/60} h` : `${Math.floor(m/60)}h ${m%60}m`) : `${m} m`}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input type="number" min={1} max={525600} placeholder="Minutos" value={custom} onChange={(e)=>setCustom(e.target.value)} className="w-28 border rounded px-2 py-1 text-sm" />
        <button type="button" className="px-2 py-1 rounded bg-primary text-white text-sm" onClick={addCustom}>Agregar</button>
        {v.length>0 && <span className="text-sm text-gray-600">Seleccionados: {v.sort((a,b)=>a-b).map(m => m>=60 ? (m%60===0?`${m/60} h`:`${Math.floor(m/60)}h ${m%60}m`) : `${m} m`).join(', ')}</span>}
      </div>
    </div>
  )
}

const locales = { es }
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
})

export default function CalendarioPage() {
  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<EventItem | null>(null)

  // Estado de conexión con Google Calendar
  const [googleConnected, setGoogleConnected] = useState<boolean>(false)
  const [googleCalendars, setGoogleCalendars] = useState<any[]>([])
  const [googleSelectedId, setGoogleSelectedId] = useState<string | null>(null)
  const [googleSelectedName, setGoogleSelectedName] = useState<string | null>(null)
  const [showSelectModal, setShowSelectModal] = useState(false)
  const [showSelectButton, setShowSelectButton] = useState(false)

  async function refreshGoogleStatus() {
    try {
      const res = await fetch('/api/integrations/google/calendar/status', { cache: 'no-store' })
      const data = await res.json();
      setGoogleConnected(!!data.connected)
    } catch {}
  }

  async function selectGoogleCalendar(calendarId: string) {
    const res = await fetch('/api/integrations/google/calendar/select', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ calendarId })
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data.success) {
      alert(data?.error || 'No se pudo seleccionar el calendario')
      return
    }
    setGoogleSelectedId(calendarId)
    setGoogleSelectedName(data?.selected?.summary || 'Calendario Google')
  }

  async function loadGoogleCalendars() {
    if (!googleConnected) return
    try {
      const res = await fetch('/api/integrations/google/calendar/calendars', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data?.error || 'Error al listar calendarios')

      const items = Array.isArray(data.calendars) ? data.calendars : []
      setGoogleCalendars(items)

      const selected: string | null = data.selected || null
      setGoogleSelectedId(selected)

      const writeable = items.filter((c: any) => c.accessRole === 'owner' || c.accessRole === 'writer')

      if (selected) {
        const sel = items.find((c: any) => c.id === selected)
        setGoogleSelectedName(sel?.summary || (sel?.primary ? 'Primary' : 'Calendario'))
        setShowSelectButton(writeable.length > 1)
      } else {
        if (writeable.length === 1) {
          // Autoselección cuando solo hay un calendario con permiso de escritura
          await selectGoogleCalendar(writeable[0].id)
          setShowSelectButton(false)
        } else {
          setShowSelectButton(writeable.length > 1)
        }
      }
    } catch (e) {
      // Silencioso, mantenemos el estado actual
    }
  }

  useEffect(() => {
    refreshGoogleStatus()
  }, [])

  useEffect(() => {
    if (googleConnected) {
      loadGoogleCalendars()
    } else {
      setGoogleCalendars([])
      setGoogleSelectedId(null)
      setGoogleSelectedName(null)
      setShowSelectButton(false)
    }
  }, [googleConnected])

  const PALETTE = [
    '#222052', '#FFDE59', '#e74c3c', '#16a34a', '#2563eb', '#0891b2', '#9333ea', '#f97316', '#dc2626', '#059669',
    '#0ea5e9', '#64748b', '#111827', '#f59e0b', '#9d174d'
  ]

  const defaultDate = useMemo(() => new Date(), [])

  async function fetchEvents(range: { start: Date; end: Date }) {
    setLoading(true)
    setError(null)
    try {
      const qs = new URLSearchParams({ start: range.start.toISOString(), end: range.end.toISOString() })
      const res = await fetch(`/api/calendar/events?${qs.toString()}`, { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Error al obtener eventos')
      const items = (data.events || []).map((e: any) => ({ ...e, start: new Date(e.start), end: new Date(e.end) }))
      setEvents(items)
    } catch (err: any) {
      setError(err.message || 'Error al obtener eventos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const start = new Date(); start.setDate(1); start.setHours(0,0,0,0)
    const end = new Date(start); end.setMonth(end.getMonth() + 2); end.setHours(23,59,59,999)
    fetchEvents({ start, end })
  }, [])

  function onRangeChange(range: any) {
    let start: Date, end: Date
    if (Array.isArray(range)) {
      start = range[0]
      end = range[range.length - 1]
    } else {
      start = range.start
      end = range.end
    }
    fetchEvents({ start, end })
  }

  function openCreate(slotInfo: { start: Date; end: Date }) {
    setEditing({ id: '', title: '', start: slotInfo.start, end: slotInfo.end, allDay: false })
    setModalOpen(true)
  }

  function openEdit(event: EventItem) {
    setEditing(event)
    setModalOpen(true)
  }

  async function saveEvent(e: EventItem) {
    const payload = {
      title: e.title,
      description: e.description,
      location: e.location,
      start: new Date(e.start).toISOString(),
      end: new Date(e.end).toISOString(),
      allDay: !!e.allDay,
      color: e.color || '#222052',
    }
    if (!e.title || !e.start || !e.end) {
      alert('Título, inicio y fin son obligatorios')
      return
    }

    const method = e.id ? 'PUT' : 'POST'
    const url = e.id ? `/api/calendar/events/${e.id}` : '/api/calendar/events'

    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const data = await res.json()
    if (!res.ok) {
      alert(data?.error || 'Error al guardar el evento')
      return
    }
    setModalOpen(false)
    // Reload range
    const start = new Date(); start.setDate(1); start.setHours(0,0,0,0)
    const end = new Date(start); end.setMonth(end.getMonth() + 2); end.setHours(23,59,59,999)
    fetchEvents({ start, end })
  }

  async function deleteEvent(id: string) {
    if (!confirm('¿Eliminar este evento?')) return
    const res = await fetch(`/api/calendar/events/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      alert(data?.error || 'Error al eliminar')
      return
    }
    const start = new Date(); start.setDate(1); start.setHours(0,0,0,0)
    const end = new Date(start); end.setMonth(end.getMonth() + 2); end.setHours(23,59,59,999)
    fetchEvents({ start, end })
  }

function eventStyleGetter(event?: any) {
    return {
      style: {
        backgroundColor: 'transparent', // dejamos el contenedor sin color
        borderRadius: '6px',
        color: '#111827',
        border: 'none',
        display: 'block',
        padding: 0,
      }
    }
  }

  return (
    <div className="w-full">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Calendario</h1>

      <div className="mb-4 flex items-center justify-between bg-white rounded border p-3">
        <div className="text-sm flex items-center gap-2">
          <span className="inline-flex items-center gap-1">
            <GoogleCalendarIcon />
            <span className="font-semibold">Google Calendar:</span>
          </span>
          {googleConnected ? (
            <>
              <span className="text-green-700">Conectado</span>
              {googleSelectedName && (
                <span className="text-gray-700">— Calendario: <span className="font-medium">{googleSelectedName}</span></span>
              )}
            </>
          ) : (
            <span className="text-gray-600">No conectado</span>
          )}
        </div>
        <div className="flex gap-2">
          {!googleConnected ? (
            <a href="/api/integrations/google/calendar/connect" className="px-3 py-1.5 rounded bg-primary text-white hover:bg-blue-900 text-sm">Conectar</a>
          ) : (
            <>
              {showSelectButton && (
                <button onClick={()=> setShowSelectModal(true)} className="px-3 py-1.5 rounded border text-sm hover:bg-gray-50">Seleccionar calendario</button>
              )}
              <button onClick={async()=>{await fetch('/api/integrations/google/calendar/disconnect',{method:'POST'}); refreshGoogleStatus();}} className="px-3 py-1.5 rounded bg-red-600 text-white hover:bg-red-700 text-sm">Desconectar</button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 text-red-700 p-3">{error}</div>
      )}

      <div className="bg-white rounded-lg shadow p-4">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          selectable
          style={{ height: 620 }}
          defaultView={Views.MONTH}
          defaultDate={defaultDate}
          onRangeChange={onRangeChange}
          onSelectSlot={(slot) => openCreate(slot as any)}
          onSelectEvent={(event) => openEdit(event as EventItem)}
          eventPropGetter={eventStyleGetter}
          components={{
            event: ({ event }) => (
              <div style={{ backgroundColor: (event as any).color || '#222052', color: '#fff', padding: '2px 6px', borderRadius: 4 }}>
                {(event as any).title}
              </div>
            ),
            agenda: {
              event: ({ event }) => (
                <div style={{ backgroundColor: (event as any).color || '#222052', color: '#fff', padding: '2px 8px', borderRadius: 4 }}>
                  {(event as any).title}
                </div>
              )
            }
          }}
          messages={{
            next: 'Sig',
            previous: 'Ant',
            today: 'Hoy',
            month: 'Mes',
            week: 'Semana',
            day: 'Día',
            agenda: 'Agenda',
            date: 'Fecha',
            time: 'Hora',
            event: 'Evento'
          }}
        />
      </div>

      {modalOpen && editing && (
        <Modal onClose={() => setModalOpen(false)}>
          <EventForm
            value={editing}
            onChange={setEditing}
            onSave={() => saveEvent(editing)}
            onDelete={editing.id ? () => deleteEvent(editing.id) : undefined}
          />
        </Modal>
      )}

      {showSelectModal && (
        <Modal onClose={() => setShowSelectModal(false)}>
          <CalendarSelectForm
            calendars={googleCalendars}
            selectedId={googleSelectedId}
            onCancel={() => setShowSelectModal(false)}
            onConfirm={async (id) => { await selectGoogleCalendar(id); setShowSelectModal(false); }}
          />
        </Modal>
      )}
    </div>
  )
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Evento</h2>
          <button className="text-gray-500 hover:text-gray-700" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function GoogleCalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="4" fill="#1a73e8"/>
      <rect x="3" y="3" width="18" height="6" rx="4" fill="#4285F4"/>
      <rect x="3" y="3" width="18" height="3" rx="4" fill="#DB4437"/>
      <rect x="3" y="6" width="18" height="3" fill="#F4B400"/>
      <rect x="3" y="9" width="18" height="3" fill="#0F9D58"/>
      <text x="12" y="17" textAnchor="middle" fontSize="9" fontFamily="Arial, Helvetica, sans-serif" fill="#ffffff">31</text>
    </svg>
  )
}

function CalendarSelectForm({ calendars, selectedId, onCancel, onConfirm }: {
  calendars: Array<{ id: string; summary: string; timeZone?: string; primary?: boolean; accessRole: string }>;
  selectedId: string | null;
  onCancel: () => void;
  onConfirm: (id: string) => void;
}) {
  const [current, setCurrent] = useState<string | null>(selectedId)
  const writeable = (calendars || []).filter(c => c.accessRole === 'owner' || c.accessRole === 'writer')

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-gray-600 mb-2">Selecciona el calendario de Google donde se crearán/editarán los eventos.</p>
        {writeable.length === 0 ? (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">No tienes calendarios con permiso de escritura.</div>
        ) : (
          <div className="max-h-64 overflow-auto border rounded divide-y">
            {writeable.map((c) => (
              <label key={c.id} className="flex items-center gap-3 p-2 cursor-pointer hover:bg-gray-50">
                <input type="radio" name="gcal" checked={current===c.id} onChange={()=> setCurrent(c.id)} />
                <div className="flex flex-col">
                  <span className="font-medium">{c.summary || (c.primary ? 'Primary' : c.id)}</span>
                  <span className="text-xs text-gray-600">{c.timeZone || 'UTC'} • {c.accessRole}{c.primary ? ' • principal' : ''}</span>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>
      <div className="flex justify-end gap-2">
        <button className="px-3 py-1.5 rounded border hover:bg-gray-50" onClick={onCancel}>Cancelar</button>
        <button className="px-3 py-1.5 rounded bg-primary text-white hover:bg-blue-900 disabled:opacity-50" disabled={!current} onClick={()=> current && onConfirm(current)}>Guardar</button>
      </div>
    </div>
  )
}

function EventForm({ value, onChange, onSave, onDelete }: {
  value: EventItem;
  onChange: (e: EventItem) => void;
  onSave: () => void;
  onDelete?: () => void;
}) {
  function set<K extends keyof EventItem>(k: K, v: EventItem[K]) { onChange({ ...value, [k]: v }) }
  const toLocal = (d: any) => {
    const dt = new Date(d)
    const pad = (n: number) => `${n}`.padStart(2, '0')
    return `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
        <input className="w-full border rounded px-3 py-2" value={value.title} onChange={(e) => set('title', e.target.value)} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Inicio</label>
          <input type="datetime-local" className="w-full border rounded px-3 py-2" value={toLocal(value.start)} onChange={(e) => set('start', new Date(e.target.value))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fin</label>
          <input type="datetime-local" className="w-full border rounded px-3 py-2" value={toLocal(value.end)} onChange={(e) => set('end', new Date(e.target.value))} />
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <input id="allDay" type="checkbox" className="h-4 w-4" checked={!!value.allDay} onChange={(e) => set('allDay', e.target.checked)} />
        <label htmlFor="allDay">Todo el día</label>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
        <textarea className="w-full border rounded px-3 py-2" rows={3} value={value.description || ''} onChange={(e) => set('description', e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
        <input className="w-full border rounded px-3 py-2" value={value.location || ''} onChange={(e) => set('location', e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Color del evento</label>
        <div className="flex flex-wrap gap-2 items-center">
          {['#222052','#FFDE59','#e74c3c','#16a34a','#2563eb','#0891b2','#9333ea','#f97316','#dc2626','#059669','#0ea5e9','#64748b','#111827','#f59e0b','#9d174d'].map(c => {
            const selected = value.color === c;
            const isLight = (() => { try { const hex = c.replace('#',''); const r=parseInt(hex.substring(0,2),16); const g=parseInt(hex.substring(2,4),16); const b=parseInt(hex.substring(4,6),16); return ((r*299 + g*587 + b*114)/1000) > 150; } catch { return false; } })();
            const iconColor = isLight ? '#111827' : '#ffffff';
            return (
              <button type="button" key={c} title={c}
                aria-pressed={selected}
                className={`relative h-6 w-6 rounded focus:outline-none ${selected?'ring-2 ring-offset-2 ring-primary':''}`}
                style={{ backgroundColor: c }}
                onClick={() => set('color', c)}
              >
                {selected && (
                  <svg className="absolute inset-0 m-auto h-4 w-4 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Alertas (recordatorios)</label>
        <ReminderEditor value={(value as any).reminders as number[] | undefined} onChange={(r)=> onChange({ ...value, reminders: r } as any)} />
      </div>
      <div className="flex justify-end space-x-2 pt-2">
        {onDelete && (
          <button className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700" onClick={onDelete}>Eliminar</button>
        )}
        <button className="px-4 py-2 rounded bg-primary text-white hover:bg-blue-900" onClick={onSave}>Guardar</button>
      </div>
    </div>
  )
}
