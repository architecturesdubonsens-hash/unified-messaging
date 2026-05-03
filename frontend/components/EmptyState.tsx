export default function EmptyState({ filter }: { filter: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-8">
      <span className="text-6xl mb-4">✉️</span>
      <p className="text-2xl font-bold text-slate-700 mb-2">Aucun message</p>
      <p className="text-lg text-slate-400">
        {filter === 'all'
          ? 'Vous n\'avez pas encore de messages.'
          : `Aucun message ${filter === 'whatsapp' ? 'WhatsApp' : filter === 'sms' ? 'SMS' : 'email'} pour l'instant.`}
      </p>
    </div>
  )
}
