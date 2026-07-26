export function ScoreGauge({
  label,
  score,
  size = 'sm',
}: {
  label: string
  score: number
  size?: 'sm' | 'lg'
}) {
  const color = score >= 90 ? 'text-green-600' : score >= 50 ? 'text-orange-600' : 'text-red-600'
  const numberSize = size === 'lg' ? 'text-6xl' : 'text-2xl'
  return (
    <div className="flex flex-col items-center">
      <span className={`font-bold ${color} ${numberSize}`}>{score}</span>
      <span className="text-sm text-gray-500">{label}</span>
    </div>
  )
}
