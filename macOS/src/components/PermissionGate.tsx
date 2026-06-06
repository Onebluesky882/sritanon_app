import { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'

type Status = 'checking' | 'granted' | 'denied'

export function PermissionGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>('checking')

  useEffect(() => {
    const unlisten = listen<{ kind: string }>('app-event', (event) => {
      if (event.payload.kind === 'permission_denied') setStatus('denied')
      else if (event.payload.kind === 'capture_started') setStatus('granted')
    })
    invoke<boolean>('check_permission')
      .then((ok) => setStatus(ok ? 'granted' : 'denied'))
      .catch(() => setStatus('denied'))
    return () => { unlisten.then(f => f()) }
  }, [])

  const openSettings = () => invoke('open_privacy_settings')
  const retry = async () => {
    setStatus('checking')
    const ok = await invoke<boolean>('check_permission').catch(() => false)
    setStatus(ok ? 'granted' : 'denied')
  }

  if (status === 'checking') {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-zinc-950">
        <div className="flex flex-col items-start gap-3 w-80">
          <div className="w-4 h-4 border border-zinc-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-zinc-400 uppercase tracking-widest font-medium">
            Checking access...
          </p>
        </div>
      </div>
    )
  }

  if (status === 'denied') {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-zinc-950 px-8">
        <div className="w-96">
          <p className="text-xs text-zinc-400 uppercase tracking-widest font-medium mb-8">
            audio recording access
          </p>

          <h2 className="text-xl font-medium text-zinc-900 dark:text-zinc-100 mb-3 leading-snug">
            Sritanon needs to hear your interview
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-10">
            Allow Screen Recording so the app can capture system audio.
            Your screen is never recorded — only the speaker output.
          </p>

          <div className="border-l border-zinc-200 dark:border-zinc-800 pl-4 mb-10 flex flex-col gap-3">
            {[
              'Open System Settings below',
              'Find Sritanon in the list',
              'Toggle it on, then come back here',
            ].map((step, i) => (
              <div key={i} className="flex gap-3">
                <span className="text-xs font-medium text-zinc-400 w-4 shrink-0 pt-0.5">{i + 1}</span>
                <span className="text-sm text-zinc-700 dark:text-zinc-300">{step}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => openSettings()}
              className="flex-1 py-2.5 px-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors"
            >
              Open System Settings
            </button>
            <button
              onClick={retry}
              className="py-2.5 px-4 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
