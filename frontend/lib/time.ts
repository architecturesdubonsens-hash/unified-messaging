import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns'
import { fr } from 'date-fns/locale'

export function relativeTime(iso: string): string {
  const d = new Date(iso)
  if (isToday(d)) {
    const mins = Math.floor((Date.now() - d.getTime()) / 60000)
    if (mins < 1)  return "à l'instant"
    if (mins < 60) return `il y a ${mins} min`
    return format(d, 'HH:mm')
  }
  if (isYesterday(d)) return 'Hier'
  return format(d, 'd MMM', { locale: fr })
}
