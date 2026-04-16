import * as React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

// ── PixelPanel ─────────────────────────────────────────────────────────────
interface PixelPanelProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children?: React.ReactNode;
  title?: string;
  showCorners?: boolean;
}

export function PixelPanel({
  children,
  className,
  title,
  showCorners = true,
  ...props
}: PixelPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={cn(
        'relative bg-pixel-panel border-2 border-pixel-amber dither-bg p-4',
        className,
      )}
      style={{ boxShadow: '4px 4px 0 #000', outline: '2px solid #0d0d1a', outlineOffset: '2px' }}
      {...props}
    >
      {showCorners && (
        <>
          <div className="absolute top-1 left-1 w-2 h-2 border-l-2 border-t-2 border-pixel-amber" />
          <div className="absolute top-1 right-1 w-2 h-2 border-r-2 border-t-2 border-pixel-amber" />
          <div className="absolute bottom-1 left-1 w-2 h-2 border-l-2 border-b-2 border-pixel-amber" />
          <div className="absolute bottom-1 right-1 w-2 h-2 border-r-2 border-b-2 border-pixel-amber" />
        </>
      )}
      {title && (
        <h3 className="font-heading text-xs text-pixel-amber uppercase tracking-wider mb-4 cursor-blink">
          {title}
        </h3>
      )}
      {children}
    </motion.div>
  );
}

// ── PixelButton ────────────────────────────────────────────────────────────
interface PixelButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export function PixelButton({
  children,
  className,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled,
  ...props
}: PixelButtonProps) {
  const variants = {
    primary:   'bg-pixel-amber text-black border-black hover:bg-pixel-gold',
    secondary: 'bg-transparent text-pixel-amber border-pixel-amber hover:bg-pixel-amber/15',
    danger:    'bg-pixel-red text-white border-black hover:bg-pixel-red/80',
  };
  const sizes = {
    sm: 'px-3 py-1 text-[8px]',
    md: 'px-4 py-2 text-[10px]',
    lg: 'px-6 py-3 text-xs',
  };

  return (
    <motion.button
      whileHover={disabled ? {} : { y: -2, boxShadow: '4px 6px 0 #000' }}
      whileTap={disabled  ? {} : { y:  2, boxShadow: '2px 2px 0 #000' }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      className={cn(
        'font-heading uppercase tracking-wider border-2 transition-all duration-100 cursor-crosshair',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        disabled  && 'opacity-50 cursor-not-allowed',
        className,
      )}
      style={{ boxShadow: '4px 4px 0 #000' }}
      disabled={disabled}
      {...(props as React.ComponentProps<typeof motion.button>)}
    >
      {children}
    </motion.button>
  );
}

// ── PixelInput ─────────────────────────────────────────────────────────────
interface PixelInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function PixelInput({ className, label, ...props }: PixelInputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block font-body text-lg text-pixel-muted mb-1">{label}</label>
      )}
      <input
        className={cn(
          'w-full bg-pixel-panel border-b-2 border-pixel-amber px-3 py-2',
          'font-body text-xl text-pixel-text placeholder:text-pixel-muted/50',
          'focus:outline-none focus:border-2 focus:border-pixel-amber',
          'focus:shadow-[0_0_0_2px_#f4a834] caret-pixel-amber',
          className,
        )}
        {...props}
      />
    </div>
  );
}

// ── PixelBadge ─────────────────────────────────────────────────────────────
type BadgeVariant = 'default' | 'tank' | 'damage' | 'support' | 'host' | 'gold' | 'silver' | 'bronze';

interface PixelBadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function PixelBadge({ children, variant = 'default', className }: PixelBadgeProps) {
  const variants: Record<BadgeVariant, string> = {
    default: 'bg-pixel-panel border-pixel-amber text-pixel-amber',
    tank:    'bg-pixel-teal/20 border-pixel-teal text-pixel-teal',
    damage:  'bg-pixel-red/20 border-pixel-red text-pixel-red',
    support: 'bg-pixel-green/20 border-pixel-green text-pixel-green',
    host:    'bg-pixel-gold/20 border-pixel-gold text-pixel-gold',
    gold:    'bg-pixel-gold/20 border-pixel-gold text-pixel-gold',
    silver:  'bg-pixel-muted/20 border-pixel-muted text-pixel-muted',
    bronze:  'bg-orange-600/20 border-orange-600 text-orange-400',
  };
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 border font-heading text-[8px] uppercase tracking-wider',
      variants[variant],
      className,
    )}>
      {children}
    </span>
  );
}

// ── PixelProgressBar ───────────────────────────────────────────────────────
interface PixelProgressBarProps {
  value: number;
  max?: number;
  variant?: 'hp' | 'xp' | 'default';
  showLabel?: boolean;
  label?: string;
  className?: string;
}

export function PixelProgressBar({
  value,
  max = 100,
  variant = 'default',
  showLabel = false,
  label,
  className,
}: PixelProgressBarProps) {
  const pct = Math.min((value / max) * 100, 100);
  const colors = { hp: 'bg-pixel-red', xp: 'bg-pixel-teal', default: 'bg-pixel-amber' };
  return (
    <div className={cn('w-full', className)}>
      {(showLabel || label) && (
        <div className="flex justify-between mb-1">
          <span className="font-body text-sm text-pixel-muted">{label}</span>
          <span className="font-body text-sm text-pixel-text">{value}/{max}</span>
        </div>
      )}
      <div className="relative h-4 bg-pixel-bg border-2 border-pixel-border">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={cn('h-full', colors[variant])}
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg,transparent,transparent 4px,rgba(0,0,0,0.3) 4px,rgba(0,0,0,0.3) 6px)',
          }}
        />
      </div>
    </div>
  );
}

// ── PixelToggle ────────────────────────────────────────────────────────────
interface PixelToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}

export function PixelToggle({ checked, onChange, label }: PixelToggleProps) {
  return (
    <button onClick={() => onChange(!checked)} className="flex items-center gap-3 cursor-crosshair">
      <div className={cn(
        'w-12 h-6 border-2 flex items-center px-0.5 transition-colors',
        checked ? 'bg-pixel-amber border-pixel-amber' : 'bg-pixel-panel border-pixel-border',
      )}>
        <motion.div
          animate={{ x: checked ? 20 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={cn('w-4 h-4 border', checked ? 'bg-black border-black' : 'bg-pixel-muted border-pixel-muted')}
        />
      </div>
      {label && <span className="font-body text-lg text-pixel-text">{label}</span>}
    </button>
  );
}

// ── PixelTabs ──────────────────────────────────────────────────────────────
interface PixelTabsProps {
  tabs: string[];
  activeTab: number;
  onChange: (i: number) => void;
}

export function PixelTabs({ tabs, activeTab, onChange }: PixelTabsProps) {
  return (
    <div className="flex border-b-2 border-pixel-border">
      {tabs.map((tab, i) => (
        <button
          key={tab}
          onClick={() => onChange(i)}
          className={cn(
            'flex-1 px-4 py-2 font-heading text-[10px] uppercase tracking-wider transition-colors cursor-crosshair',
            activeTab === i
              ? 'bg-pixel-amber text-black'
              : 'text-pixel-amber hover:bg-pixel-amber/10',
          )}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

// ── PixelDivider ───────────────────────────────────────────────────────────
export function PixelDivider({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center py-4', className)}>
      <span className="text-pixel-amber font-body text-lg tracking-widest">
        ────────⚔────────
      </span>
    </div>
  );
}

// ── PixelSlider ────────────────────────────────────────────────────────────
interface PixelSliderProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  label?: string;
}

export function PixelSlider({ value, onChange, min = 0, max = 100, label }: PixelSliderProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        {label && <span className="font-body text-lg text-pixel-text">{label}</span>}
        <span className="font-heading text-[10px] text-pixel-amber">
          [{String(value).padStart(3, '0')}%]
        </span>
      </div>
      <div className="relative h-4 bg-pixel-bg border-2 border-pixel-border">
        <div className="h-full bg-pixel-amber" style={{ width: `${value}%` }} />
        <input
          type="range" min={min} max={max} value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-crosshair"
        />
      </div>
    </div>
  );
}

// ── PixelRadioGroup ────────────────────────────────────────────────────────
interface PixelRadioGroupProps {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}

export function PixelRadioGroup({ options, value, onChange }: PixelRadioGroupProps) {
  return (
    <div className="flex gap-2">
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={cn(
            'px-3 py-1 font-heading text-[10px] border-2 transition-colors cursor-crosshair',
            value === opt
              ? 'bg-pixel-amber text-black border-pixel-amber'
              : 'bg-transparent text-pixel-amber border-pixel-amber hover:bg-pixel-amber/15',
          )}
        >
          [{opt}]
        </button>
      ))}
    </div>
  );
}

// ── FloatingParticles ──────────────────────────────────────────────────────
const PARTICLE_DATA = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  left: `${(i * 8.5) % 100}%`,
  drift: (i % 2 === 0 ? 1 : -1) * (10 + (i % 4) * 6),
  delay: -(i * 1.4),
  duration: 10 + (i % 5) * 2,
}));

export function FloatingParticles() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {PARTICLE_DATA.map(p => (
        <motion.div
          key={p.id}
          className="absolute w-1 h-1 bg-pixel-amber"
          style={{ left: p.left, bottom: -10 }}
          animate={{ y: ['0vh', '-110vh'], x: [0, p.drift], opacity: [0, 0.8, 0.8, 0] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'linear' }}
        />
      ))}
    </div>
  );
}
