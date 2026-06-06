import { useState, useRef } from 'react'
import { Briefcase, X, Check } from 'lucide-react'
import { useJobStore } from '@/stores/job-store'

const QUICK_JOBS = [
  'Software Engineer',
  'Frontend Developer',
  'Backend Developer',
  'Product Manager',
  'Data Analyst',
  'Teacher',
  'Intent Engineer',
  'Accountant',
  'Marketing Manager',
  'Sales Executive',
  'Designer',
  'DevOps Engineer',
  'Data Scientist',
  'Business Analyst',
]

export function JobInput() {
  const { jobPosition, setJobPosition } = useJobStore()
  const [focused, setFocused] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = QUICK_JOBS.filter((j) =>
    j.toLowerCase().includes(jobPosition.toLowerCase())
  )

  const showDropdown = focused && !confirmed && filtered.length > 0 && filtered[0] !== jobPosition

  const confirm = () => {
    if (!jobPosition) return
    setConfirmed(true)
    setFocused(false)
    inputRef.current?.blur()
    console.log(`💼 Job position confirmed: "${jobPosition}"`)
  }

  const handleChange = (v: string) => {
    const letters = v.replace(/[0-9]/g, '')
    setJobPosition(letters)
    setConfirmed(false)
  }

  const handleClear = () => {
    setJobPosition('')
    setConfirmed(false)
    inputRef.current?.focus()
  }

  return (
    <div className="relative">
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
        confirmed && jobPosition
          ? 'bg-zinc-50/80 dark:bg-zinc-800/80 border-zinc-300 dark:border-zinc-600'
          : focused
          ? 'bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-600'
          : 'bg-zinc-100 dark:bg-zinc-800 border-transparent'
      }`}>
        <Briefcase size={12} className="text-zinc-400 shrink-0" />

        <input
          ref={inputRef}
          value={jobPosition}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => { setFocused(true); setConfirmed(false) }}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onKeyDown={(e) => { if (e.key === 'Enter') confirm() }}
          placeholder="Job position..."
          className={`bg-transparent text-xs w-36 outline-none placeholder:text-zinc-400 transition-colors ${
            confirmed && jobPosition
              ? 'text-zinc-500/80 dark:text-zinc-400/80'
              : 'text-zinc-700 dark:text-zinc-300'
          }`}
        />

        {jobPosition && !confirmed && (
          <button
            onMouseDown={(e) => { e.preventDefault(); confirm() }}
            className="text-zinc-400 hover:text-green-500 transition-colors"
            title="Confirm"
          >
            <Check size={12} />
          </button>
        )}

        {jobPosition && confirmed && (
          <button
            onClick={handleClear}
            className="text-red-400 hover:text-red-600 transition-colors"
            title="Clear"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute top-full mt-1 left-0 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg overflow-hidden z-50 w-52 max-h-48 overflow-y-auto">
          {filtered.map((job) => (
            <button
              key={job}
              onMouseDown={() => {
                setJobPosition(job)
                setConfirmed(true)
                setFocused(false)
                inputRef.current?.blur()
                console.log(`💼 Job position set: "${job}"`)
              }}
              className="w-full text-left px-3 py-2 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
            >
              {job}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
