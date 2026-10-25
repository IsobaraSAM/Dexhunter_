import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { ChevronDown, Feather, Globe, RotateCcw, Search, Send, ShieldCheck, X } from 'lucide-react'
import { ChainIcon } from './TokenShared'
import { getDexLogo } from '../lib/dexPriority'

type SocialState = 'any' | 'required'

interface SocialFilters {
  telegram: SocialState
  discord: SocialState
  website: SocialState
  xProfile: boolean
  xPost: boolean
}

export interface FilterState {
  preset: string | null
  chains: string[]
  sources: string[]
  pairAge: string
  volumeMin: number | null
  volumeMax: number | null
  marketCapMin: number | null
  marketCapMax: number | null
  liquidityMin: number | null
  change24hMin: number | null
  social: SocialFilters
  verifiedOnly: boolean
}

interface FilterPanelProps {
  initialFilters?: Partial<FilterState>
  resultCount?: number
  matchCount?: (filters: FilterState) => number
  onApply: (filters: FilterState) => void
  onReset?: () => void
  onClose: () => void
}

interface ChainOption {
  id: string
  label: string
}

interface SourceOption {
  id: string
  label: string
}

interface AgeOption {
  id: string
  label: string
}

const CHAINS: ChainOption[] = [
  { id: 'solana', label: 'Solana' },
  { id: 'ethereum', label: 'Ethereum' },
  { id: 'base', label: 'Base' },
  { id: 'bsc', label: 'BNB Chain' },
  { id: 'arbitrum', label: 'Arbitrum' },
  { id: 'hyperevm', label: 'HyperEVM' },
  { id: 'avalanche', label: 'Avalanche' },
  { id: 'robinhood', label: 'Robinhood' },
  { id: 'arc', label: 'Arc' },
]

const SOURCES: SourceOption[] = [
  { id: 'pumpfun', label: 'Pump.fun' },
  { id: 'raydium', label: 'Raydium' },
  { id: 'orca', label: 'Orca' },
  { id: 'meteora', label: 'Meteora' },
  { id: 'uniswap', label: 'Uniswap' },
  { id: 'pancakeswap', label: 'PancakeSwap' },
  { id: 'aerodrome', label: 'Aerodrome' },
  { id: 'argus', label: 'Argus' },
  { id: 'ponscurve', label: 'Pons bonding curve' },
  { id: 'pons', label: 'Pons valued' },
]

const PAIR_AGE_OPTIONS: AgeOption[] = [
  { id: 'all', label: 'All time' },
  { id: '1h', label: '< 1 hour' },
  { id: '6h', label: '< 6 hours' },
  { id: '24h', label: '< 24 hours' },
  { id: '48h', label: '< 48 hours' },
  { id: '1w', label: '< 1 week' },
  { id: '1m', label: '< 1 month' },
]

const VOLUME_PRESETS = [10_000, 50_000, 100_000, 500_000]
const MARKET_CAP_PRESETS = [100_000, 1_000_000, 10_000_000]
const LIQUIDITY_PRESETS = [5_000, 20_000, 50_000]
const CHANGE_PRESETS = [0, 10, 25, 100]

const SOCIAL_LABELS: Record<'telegram' | 'discord' | 'website', string> = {
  telegram: 'Telegram',
  discord: 'Discord',
  website: 'Website',
}

const DEFAULT_FILTERS: FilterState = {
  preset: null,
  chains: [],
  sources: [],
  pairAge: 'all',
  volumeMin: null,
  volumeMax: null,
  marketCapMin: null,
  marketCapMax: null,
  liquidityMin: null,
  change24hMin: null,
  social: { telegram: 'any', discord: 'any', website: 'any', xProfile: false, xPost: false },
  verifiedOnly: false,
}

function formatCompact(value: number): string {
  if (value >= 1_000_000) {
    const millions = value / 1_000_000
    return `$${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)}M`
  }
  if (value >= 1_000) {
    const thousands = value / 1_000
    return `$${thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1)}K`
  }
  return `$${value}`
}

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b35] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#151620]'

function XMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.3 2H21l-7.3 8.3L22 22h-6.6l-5.2-6.6L4.2 22H1.5l7.8-8.9L2 2h6.8l4.7 6.1L18.3 2Zm-1.2 18h1.8L7 4h-1.9l12 16Z" />
    </svg>
  )
}

function DiscordMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M20.3 5.4A17.6 17.6 0 0 0 15.9 4l-.3.6c1.6.4 2.9 1 4.2 1.8a14.7 14.7 0 0 0-12.6 0c1.3-.8 2.6-1.4 4.2-1.8L11.1 4a17.5 17.5 0 0 0-4.4 1.4C4 9 3.1 12.5 3.4 16a17.8 17.8 0 0 0 5.2 2.6l.8-1.3c-.8-.3-1.6-.7-2.3-1.2l.5-.4a12.7 12.7 0 0 0 10.8 0l.5.4c-.7.5-1.5.9-2.3 1.2l.8 1.3a17.6 17.6 0 0 0 5.2-2.6c.4-4-.6-7.5-2.3-10.6ZM9.7 13.8c-.8 0-1.5-.8-1.5-1.7 0-1 .6-1.7 1.5-1.7.8 0 1.5.8 1.5 1.7 0 1-.7 1.7-1.5 1.7Zm5.6 0c-.8 0-1.5-.8-1.5-1.7 0-1 .7-1.7 1.5-1.7.9 0 1.5.8 1.5 1.7 0 1-.6 1.7-1.5 1.7Z" />
    </svg>
  )
}

function SourceMark({ id }: { id: string }) {
  const [failed, setFailed] = useState(false)
  const src = getDexLogo(id)
  if (!src || failed) return null
  return (
    <img
      src={src}
      alt=""
      onError={() => setFailed(true)}
      referrerPolicy="no-referrer"
      className="h-4 w-4 shrink-0 rounded-full object-contain"
    />
  )
}

interface SectionProps {
  title: string
  badge?: ReactNode
  isOpen: boolean
  onToggle: () => void
  children: ReactNode
}

function Section({ title, badge, isOpen, onToggle, children }: SectionProps) {
  return (
    <div className="border-b border-slate-200 dark:border-zinc-800">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className={`flex w-full items-center justify-between py-3.5 text-left ${FOCUS_RING}`}
      >
        <span className="flex items-center gap-2 text-[14px] font-medium text-slate-900 dark:text-zinc-100">
          {title}
          {badge ? (
            <span className="rounded-full bg-[#ff6b35] px-1.5 py-0.5 text-[11px] font-semibold text-white">
              {badge}
            </span>
          ) : null}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 dark:text-zinc-500 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-200 ease-out"
        style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className="pb-4">{children}</div>
        </div>
      </div>
    </div>
  )
}

interface ChipProps {
  active: boolean
  onClick: () => void
  children: ReactNode
}

function Chip({ active, onClick, children }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors ${FOCUS_RING} ${
        active
          ? 'border-transparent bg-[#ff6b35] text-white'
          : 'border-slate-200 bg-slate-100 text-slate-700 hover:border-[#ff6b35]/40 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300'
      }`}
    >
      {children}
    </button>
  )
}

function LogoChip({ active, label, onClick, children }: ChipProps & { label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      title={label}
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors ${FOCUS_RING} ${
        active
          ? 'border-[#ff6b35] bg-[#ff6b35]/15 ring-2 ring-[#ff6b35]'
          : 'border-slate-200 bg-white hover:border-[#ff6b35]/40 dark:border-zinc-700 dark:bg-zinc-900'
      }`}
    >
      {children}
    </button>
  )
}

interface NumberInputProps {
  value: number | null
  onChange: (value: number | null) => void
  placeholder: string
  prefix?: string
  suffix?: string
}

function NumberInput({ value, onChange, placeholder, prefix, suffix }: NumberInputProps) {
  return (
    <div className="flex flex-1 items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-[#ff6b35] dark:border-zinc-800 dark:bg-[#12131c]">
      {prefix ? <span className="text-[13px] text-slate-400 dark:text-zinc-500">{prefix}</span> : null}
      <input
        type="number"
        inputMode="decimal"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
        placeholder={placeholder}
        className="w-full bg-transparent font-mono text-[13px] text-slate-900 outline-none placeholder:font-sans placeholder:text-slate-400 dark:text-white dark:placeholder:text-zinc-500"
      />
      {suffix ? <span className="text-[13px] text-slate-400 dark:text-zinc-500">{suffix}</span> : null}
    </div>
  )
}

interface RangeFieldProps {
  label: string
  unit: string
  min: number | null
  max: number | null
  onMinChange: (value: number | null) => void
  onMaxChange: (value: number | null) => void
  presets: number[]
  presetSide?: 'min' | 'max'
  formatPreset: (value: number) => string
}

function RangeField({
  label,
  unit,
  min,
  max,
  onMinChange,
  onMaxChange,
  presets,
  presetSide = 'min',
  formatPreset,
}: RangeFieldProps) {
  const selected = presetSide === 'max' ? max : min
  const setSelected = presetSide === 'max' ? onMaxChange : onMinChange
  return (
    <div>
      <span className="mb-2 block text-[13px] font-medium text-slate-600 dark:text-zinc-300">{label}</span>
      <div className="flex items-center gap-2">
        <NumberInput value={min} onChange={onMinChange} placeholder="Min" prefix={unit} />
        <span className="text-[13px] text-slate-400 dark:text-zinc-500">to</span>
        <NumberInput value={max} onChange={onMaxChange} placeholder="Max" prefix={unit} />
      </div>
      {presets.length > 0 ? (
        <div className="mt-2 flex gap-1.5 overflow-x-auto pb-0.5">
          {presets.map((p) => (
            <Chip key={p} active={selected === p} onClick={() => setSelected(selected === p ? null : p)}>
              {formatPreset(p)}
            </Chip>
          ))}
        </div>
      ) : null}
    </div>
  )
}

interface SocialToggleProps {
  icon: ReactNode
  label: string
  value: SocialState
  onToggle: () => void
}

function SocialToggle({ icon, label, value, onToggle }: SocialToggleProps) {
  const required = value === 'required'
  return (
    <button
      type="button"
      role="switch"
      aria-checked={required}
      onClick={onToggle}
      className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-left transition-colors ${FOCUS_RING} ${
        required
          ? 'border-[#ff6b35]/50 bg-[#ff6b35]/10'
          : 'border-slate-200 bg-slate-50 dark:border-zinc-800 dark:bg-zinc-800/40'
      }`}
    >
      <span className="flex items-center gap-2 text-[13px] text-slate-900 dark:text-zinc-100">
        {icon}
        {label}
      </span>
      <span className={`text-[11px] font-semibold ${required ? 'text-[#ff6b35]' : 'text-slate-400 dark:text-zinc-500'}`}>
        {required ? 'Required' : 'Any'}
      </span>
    </button>
  )
}

export default function FilterPanel({
  initialFilters,
  resultCount,
  matchCount,
  onApply,
  onReset,
  onClose,
}: FilterPanelProps) {
  const [filters, setFilters] = useState<FilterState>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
    preset: null,
    social: { ...DEFAULT_FILTERS.social, ...initialFilters?.social },
  })
  const [chainQuery, setChainQuery] = useState('')
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['networks', 'sources']))
  const [xMenuOpen, setXMenuOpen] = useState(() => Boolean(initialFilters?.social?.xProfile || initialFilters?.social?.xPost))

  useEffect(() => {
    const root = document.getElementById('filter_drawer_modal')
    const previously = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const focusable = () =>
      Array.from(
        root?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) || []
      )
    focusable()[0]?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (!root) return
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        onClose()
        return
      }
      if (event.key !== 'Tab') return
      const current = focusable()
      if (!current.length) return
      const first = current[0]
      const last = current[current.length - 1]
      const active = document.activeElement
      if (event.shiftKey && (active === first || !root.contains(active))) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (active === last || !root.contains(active))) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      previously?.focus()
    }
  }, [onClose])

  const toggleSection = (id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleChain = (id: string) => {
    setFilters((prev) => ({
      ...prev,
      chains: prev.chains.includes(id) ? prev.chains.filter((x) => x !== id) : [...prev.chains, id],
    }))
  }

  const toggleSource = (id: string) => {
    setFilters((prev) => ({
      ...prev,
      sources: prev.sources.includes(id) ? prev.sources.filter((x) => x !== id) : [...prev.sources, id],
    }))
  }

  const toggleSocial = (platform: 'telegram' | 'discord' | 'website') => {
    setFilters((prev) => ({
      ...prev,
      social: {
        ...prev.social,
        [platform]: prev.social[platform] === 'any' ? 'required' : 'any',
      },
    }))
  }

  const resetAll = () => {
    setFilters(DEFAULT_FILTERS)
    setXMenuOpen(false)
    onReset?.()
  }

  const visibleChains = useMemo(
    () => CHAINS.filter((c) => c.label.toLowerCase().includes(chainQuery.toLowerCase())),
    [chainQuery]
  )

  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; onRemove: () => void }[] = []

    filters.chains.forEach((id) => {
      const chain = CHAINS.find((c) => c.id === id)
      if (chain) chips.push({ key: `chain-${id}`, label: chain.label, onRemove: () => toggleChain(id) })
    })

    filters.sources.forEach((id) => {
      const source = SOURCES.find((s) => s.id === id)
      if (source) chips.push({ key: `source-${id}`, label: source.label, onRemove: () => toggleSource(id) })
    })

    if (filters.pairAge !== 'all') {
      const age = PAIR_AGE_OPTIONS.find((a) => a.id === filters.pairAge)
      if (age) chips.push({ key: 'age', label: age.label, onRemove: () => setFilters((f) => ({ ...f, pairAge: 'all' })) })
    }

    if (filters.volumeMin != null) {
      chips.push({ key: 'volmin', label: `Vol over ${formatCompact(filters.volumeMin)}`, onRemove: () => setFilters((f) => ({ ...f, volumeMin: null })) })
    }
    if (filters.volumeMax != null) {
      chips.push({ key: 'volmax', label: `Vol under ${formatCompact(filters.volumeMax)}`, onRemove: () => setFilters((f) => ({ ...f, volumeMax: null })) })
    }
    if (filters.marketCapMin != null) {
      chips.push({ key: 'mcmin', label: `MCap over ${formatCompact(filters.marketCapMin)}`, onRemove: () => setFilters((f) => ({ ...f, marketCapMin: null })) })
    }
    if (filters.marketCapMax != null) {
      chips.push({ key: 'mcmax', label: `MCap under ${formatCompact(filters.marketCapMax)}`, onRemove: () => setFilters((f) => ({ ...f, marketCapMax: null })) })
    }
    if (filters.liquidityMin != null) {
      chips.push({ key: 'liq', label: `Liquidity over ${formatCompact(filters.liquidityMin)}`, onRemove: () => setFilters((f) => ({ ...f, liquidityMin: null })) })
    }
    if (filters.change24hMin != null) {
      chips.push({ key: 'chg', label: `24h change over ${filters.change24hMin}%`, onRemove: () => setFilters((f) => ({ ...f, change24hMin: null })) })
    }

    ;(Object.keys(SOCIAL_LABELS) as Array<keyof typeof SOCIAL_LABELS>).forEach((platform) => {
      if (filters.social[platform] === 'required') {
        chips.push({
          key: `social-${platform}`,
          label: `${SOCIAL_LABELS[platform]} required`,
          onRemove: () => toggleSocial(platform),
        })
      }
    })

    if (filters.social.xProfile) {
      chips.push({
        key: 'x-profile',
        label: 'X profiles',
        onRemove: () => setFilters((f) => ({ ...f, social: { ...f.social, xProfile: false } })),
      })
    }
    if (filters.social.xPost) {
      chips.push({
        key: 'x-post',
        label: 'X posts',
        onRemove: () => setFilters((f) => ({ ...f, social: { ...f.social, xPost: false } })),
      })
    }

    if (filters.verifiedOnly) {
      chips.push({
        key: 'verified',
        label: '2+ socials',
        onRemove: () => setFilters((f) => ({ ...f, verifiedOnly: false })),
      })
    }

    return chips
  }, [filters])

  const deferredFilters = useDeferredValue(filters)
  const shownCount = matchCount ? matchCount(deferredFilters) : resultCount
  const metricsBadge =
    [filters.volumeMin, filters.volumeMax, filters.marketCapMin, filters.marketCapMax].filter((v) => v != null).length || undefined
  const liquidityBadge = [filters.liquidityMin, filters.change24hMin].filter((v) => v != null).length || undefined
  const socialBadge =
    (['telegram', 'discord', 'website'] as const).filter((platform) => filters.social[platform] === 'required').length +
    (filters.social.xProfile ? 1 : 0) +
    (filters.social.xPost ? 1 : 0) +
    (filters.verifiedOnly ? 1 : 0) || undefined

  return (
    <div
      id="filter_drawer_modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="filter_drawer_title"
      className="flex h-full w-full flex-col"
    >
      <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3.5 dark:border-zinc-800">
        <span id="filter_drawer_title" className="text-[15px] font-semibold text-slate-900 dark:text-zinc-100">
          Filters
        </span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            id="btn_reset_filters_header"
            aria-label="Reset filters and close"
            onClick={resetAll}
            className={`flex items-center gap-1 rounded px-1 text-[13px] font-medium text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white ${FOCUS_RING}`}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
          <button
            type="button"
            onClick={onClose}
            id="btn_close_filters_modal"
            aria-label="Close filters"
            className={`rounded-full p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white ${FOCUS_RING}`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {activeChips.length > 0 ? (
        <div className="flex shrink-0 items-center gap-1.5 overflow-x-auto border-b border-slate-200 px-4 py-2.5 dark:border-zinc-800">
          {activeChips.map((chip) => (
            <span
              key={chip.key}
              className="flex shrink-0 items-center gap-1 rounded-full bg-[#ff6b35]/10 px-2.5 py-1 text-[12px] font-medium text-[#ff6b35]"
            >
              {chip.label}
              <button type="button" onClick={chip.onRemove} aria-label={`Remove ${chip.label}`} className="rounded-full hover:text-slate-900 dark:hover:text-white">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <div className="flex-1 overflow-y-auto px-4">
        <Section
          title="Networks"
          badge={filters.chains.length || undefined}
          isOpen={openSections.has('networks')}
          onToggle={() => toggleSection('networks')}
        >
          <div className="relative mb-2.5">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
            <input
              type="text"
              value={chainQuery}
              onChange={(e) => setChainQuery(e.target.value)}
              placeholder="Search chains"
              aria-label="Search chains"
              className={`w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-[13px] text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#ff6b35] dark:border-zinc-800 dark:bg-[#12131c] dark:text-white dark:placeholder:text-zinc-500 ${FOCUS_RING}`}
            />
          </div>
          {visibleChains.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {visibleChains.map((chain) => (
                <LogoChip key={chain.id} active={filters.chains.includes(chain.id)} label={chain.label} onClick={() => toggleChain(chain.id)}>
                  <ChainIcon chainId={chain.id} iconOnly />
                </LogoChip>
              ))}
            </div>
          ) : (
            <p className="py-1 text-[12px] text-slate-400 dark:text-zinc-500">No chains match "{chainQuery}"</p>
          )}
        </Section>

        <Section
          title="Sources"
          badge={filters.sources.length || undefined}
          isOpen={openSections.has('sources')}
          onToggle={() => toggleSection('sources')}
        >
          <div className="flex flex-wrap gap-1.5">
            {SOURCES.map((source) => (
              <LogoChip key={source.id} active={filters.sources.includes(source.id)} label={source.label} onClick={() => toggleSource(source.id)}>
                <span className="relative">
                  <SourceMark id={source.id} />
                  {source.id === 'ponscurve' ? <span className="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-emerald-500" /> : null}
                  {source.id === 'pons' ? <span className="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-amber-400" /> : null}
                </span>
              </LogoChip>
            ))}
          </div>
        </Section>

        <Section
          title="Pair age"
          badge={filters.pairAge !== 'all' ? PAIR_AGE_OPTIONS.find((a) => a.id === filters.pairAge)?.label : undefined}
          isOpen={openSections.has('age')}
          onToggle={() => toggleSection('age')}
        >
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            {PAIR_AGE_OPTIONS.map((age) => (
              <Chip key={age.id} active={filters.pairAge === age.id} onClick={() => setFilters((f) => ({ ...f, pairAge: age.id }))}>
                {age.label}
              </Chip>
            ))}
          </div>
        </Section>

        <Section
          title="Volume and market cap"
          badge={metricsBadge}
          isOpen={openSections.has('metrics')}
          onToggle={() => toggleSection('metrics')}
        >
          <div className="space-y-4">
            <RangeField
              label="24h volume"
              unit="$"
              min={filters.volumeMin}
              max={filters.volumeMax}
              onMinChange={(v) => setFilters((f) => ({ ...f, volumeMin: v }))}
              onMaxChange={(v) => setFilters((f) => ({ ...f, volumeMax: v }))}
              presets={VOLUME_PRESETS}
              formatPreset={(v) => `Over ${formatCompact(v)}`}
            />
            <RangeField
              label="Market cap"
              unit="$"
              min={filters.marketCapMin}
              max={filters.marketCapMax}
              onMinChange={(v) => setFilters((f) => ({ ...f, marketCapMin: v }))}
              onMaxChange={(v) => setFilters((f) => ({ ...f, marketCapMax: v }))}
              presets={MARKET_CAP_PRESETS}
              presetSide="max"
              formatPreset={(v) => `Under ${formatCompact(v)}`}
            />
          </div>
        </Section>

        <Section
          title="Liquidity and momentum"
          badge={liquidityBadge}
          isOpen={openSections.has('liquidity')}
          onToggle={() => toggleSection('liquidity')}
        >
          <div className="space-y-4">
            <div>
              <span className="mb-2 block text-[13px] font-medium text-slate-600 dark:text-zinc-300">Min liquidity</span>
              <NumberInput
                value={filters.liquidityMin}
                onChange={(v) => setFilters((f) => ({ ...f, liquidityMin: v }))}
                placeholder="Any"
                prefix="$"
              />
              <div className="mt-2 flex gap-1.5 overflow-x-auto pb-0.5">
                {LIQUIDITY_PRESETS.map((v) => (
                  <Chip
                    key={v}
                    active={filters.liquidityMin === v}
                    onClick={() => setFilters((f) => ({ ...f, liquidityMin: f.liquidityMin === v ? null : v }))}
                  >
                    {formatCompact(v)}+
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              <span className="mb-2 block text-[13px] font-medium text-slate-600 dark:text-zinc-300">Min 24h change</span>
              <NumberInput
                value={filters.change24hMin}
                onChange={(v) => setFilters((f) => ({ ...f, change24hMin: v }))}
                placeholder="Any"
                suffix="%"
              />
              <div className="mt-2 flex gap-1.5 overflow-x-auto pb-0.5">
                {CHANGE_PRESETS.map((v) => (
                  <Chip
                    key={v}
                    active={filters.change24hMin === v}
                    onClick={() => setFilters((f) => ({ ...f, change24hMin: f.change24hMin === v ? null : v }))}
                  >
                    +{v}%
                  </Chip>
                ))}
              </div>
            </div>
          </div>
        </Section>

        <Section
          title="Social and trust"
          badge={socialBadge}
          isOpen={openSections.has('social')}
          onToggle={() => toggleSection('social')}
        >
          <div className="grid grid-cols-2 gap-2">
            <SocialToggle icon={<Send className="h-4 w-4" />} label={SOCIAL_LABELS.telegram} value={filters.social.telegram} onToggle={() => toggleSocial('telegram')} />
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                aria-expanded={xMenuOpen}
                aria-controls="x-link-filters"
                onClick={() => setXMenuOpen((open) => !open)}
                className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-left transition-colors ${FOCUS_RING} ${
                  filters.social.xProfile || filters.social.xPost
                    ? 'border-[#ff6b35]/50 bg-[#ff6b35]/10'
                    : 'border-slate-200 bg-slate-50 dark:border-zinc-800 dark:bg-zinc-800/40'
                }`}
              >
                <span className="flex items-center gap-2 text-[13px] text-slate-900 dark:text-zinc-100">
                  <XMark className="h-4 w-4" />
                  X
                </span>
                <span className="flex items-center gap-1">
                  <span className={`text-[11px] font-semibold ${filters.social.xProfile || filters.social.xPost ? 'text-[#ff6b35]' : 'text-slate-400 dark:text-zinc-500'}`}>
                    {filters.social.xProfile && filters.social.xPost
                      ? 'Both'
                      : filters.social.xProfile
                        ? 'Profiles'
                        : filters.social.xPost
                          ? 'Posts'
                          : 'Any'}
                  </span>
                  <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 dark:text-zinc-500 ${xMenuOpen ? 'rotate-180' : ''}`} />
                </span>
              </button>
            </div>
            {xMenuOpen ? (
              <div id="x-link-filters" className="col-span-2 grid grid-cols-2 gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-1.5 dark:border-zinc-800 dark:bg-zinc-900/50">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={filters.social.xProfile}
                  onClick={() => setFilters((f) => ({ ...f, social: { ...f.social, xProfile: !f.social.xProfile } }))}
                  className={`flex items-center justify-between rounded-lg border px-2.5 py-2 text-left transition-colors ${FOCUS_RING} ${
                    filters.social.xProfile
                      ? 'border-[#ff6b35]/50 bg-[#ff6b35]/10'
                      : 'border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-800/40'
                  }`}
                >
                  <span className="flex items-center gap-2 text-[12px] text-slate-900 dark:text-zinc-100">
                    <XMark className="h-3.5 w-3.5" />
                    X Profiles
                  </span>
                  <span className={`text-[11px] font-semibold ${filters.social.xProfile ? 'text-[#ff6b35]' : 'text-slate-400 dark:text-zinc-500'}`}>
                    {filters.social.xProfile ? 'Required' : 'Any'}
                  </span>
                </button>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={filters.social.xPost}
                  onClick={() => setFilters((f) => ({ ...f, social: { ...f.social, xPost: !f.social.xPost } }))}
                  className={`flex items-center justify-between rounded-lg border px-2.5 py-2 text-left transition-colors ${FOCUS_RING} ${
                    filters.social.xPost
                      ? 'border-[#ff6b35]/50 bg-[#ff6b35]/10'
                      : 'border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-800/40'
                  }`}
                >
                  <span className="flex items-center gap-2 text-[12px] text-slate-900 dark:text-zinc-100">
                    <Feather className="h-3.5 w-3.5" />
                    X Posts
                  </span>
                  <span className={`text-[11px] font-semibold ${filters.social.xPost ? 'text-[#ff6b35]' : 'text-slate-400 dark:text-zinc-500'}`}>
                    {filters.social.xPost ? 'Required' : 'Any'}
                  </span>
                </button>
              </div>
            ) : null}
            <SocialToggle icon={<DiscordMark className="h-4 w-4" />} label={SOCIAL_LABELS.discord} value={filters.social.discord} onToggle={() => toggleSocial('discord')} />
            <SocialToggle icon={<Globe className="h-4 w-4" />} label={SOCIAL_LABELS.website} value={filters.social.website} onToggle={() => toggleSocial('website')} />
          </div>

          <label className="mt-3 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-800/40">
            <span className="flex flex-col text-left">
              <span className="flex items-center gap-2 text-[13px] text-slate-900 dark:text-zinc-100">
                <ShieldCheck className="h-4 w-4 text-[#ff6b35]" />
                At least two social links
              </span>
              <span className="pl-6 text-[11px] text-slate-500 dark:text-zinc-500">Not a verification or safety check</span>
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={filters.verifiedOnly}
              onClick={() => setFilters((f) => ({ ...f, verifiedOnly: !f.verifiedOnly }))}
              className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${FOCUS_RING} ${
                filters.verifiedOnly ? 'bg-[#ff6b35]' : 'bg-slate-200 dark:bg-zinc-700'
              }`}
            >
              <span
                className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform dark:bg-zinc-950 ${
                  filters.verifiedOnly ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </label>
        </Section>
      </div>

      <div className="shrink-0 border-t border-slate-200 px-4 py-3 dark:border-zinc-800">
        <button
          type="button"
          id="btn_apply_filters_modal"
          onClick={() => onApply(filters)}
          className={`w-full rounded-xl bg-[#ff6b35] py-3 text-center text-[14px] font-semibold text-white hover:bg-[#ff6b35]/90 ${FOCUS_RING}`}
        >
          {shownCount != null ? `Show ${shownCount} results` : 'Apply filters'}
          {activeChips.length > 0 ? ` (${activeChips.length} active)` : ''}
        </button>
      </div>
    </div>
  )
}
