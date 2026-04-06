export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-base flex flex-col items-center justify-center gap-4">
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-primary" />
        <span className="font-bold text-xl tracking-tight text-text-primary">WriteVault</span>
      </div>
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-text-muted text-sm">Loading...</p>
    </div>
  )
}
