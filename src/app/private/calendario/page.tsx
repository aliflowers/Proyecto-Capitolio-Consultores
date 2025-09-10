'use client'

import { useEffect, useMemo, useState } from 'react'
import { Calendar, Views, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import es from 'date-fns/locale/es'
import 'react-big-calendar/lib/css/react-big-calendar.css'

interface EventItem {
  id: string
  title: string
  start: Date | string
  end: Date | string
  allDay?: boolean
  description?: string
  location?: string
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

  function eventStyleGetter() {
    return {
      style: {
        backgroundColor: '#222052', // primary
        borderRadius: '6px',
        color: '#fff',
        border: 'none',
        display: 'block'
      }
    }
  }

  return (
    <div className="w-full">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Calendario</h1>

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
      <div className="flex justify-end space-x-2 pt-2">
        {onDelete && (
          <button className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700" onClick={onDelete}>Eliminar</button>
        )}
        <button className="px-4 py-2 rounded bg-primary text-white hover:bg-blue-900" onClick={onSave}>Guardar</button>
      </div>
    </div>
  )
}
