import React, { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface CustomSelectOption<T extends string | number = string> {
  value: T;
  label: string;
  sublabel?: string;
  badge?: string;
  badgeColor?: 'blue' | 'emerald' | 'amber' | 'slate' | 'rose';
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface CustomSelectProps<T extends string | number = string> {
  value: T;
  onChange: (value: T) => void;
  options: CustomSelectOption<T>[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  menuClassName?: string;
  id?: string;
  ariaLabel?: string;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  alignMenu?: 'left' | 'right';
}

export function CustomSelect<T extends string | number = string>({
  value,
  onChange,
  options,
  placeholder = 'Select option...',
  disabled = false,
  className = '',
  menuClassName = '',
  id,
  ariaLabel,
  size = 'md',
  fullWidth = true,
  alignMenu = 'left',
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const generatedId = useId();
  const selectId = id || generatedId;

  // Selected option lookup
  const selectedOption = options.find(opt => opt.value === value);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(prev => !prev);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        const currentIndex = options.findIndex(opt => opt.value === value);
        const nextIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
        if (!options[nextIndex]?.disabled) {
          onChange(options[nextIndex].value);
        }
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        const currentIndex = options.findIndex(opt => opt.value === value);
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
        if (!options[prevIndex]?.disabled) {
          onChange(options[prevIndex].value);
        }
      }
    }
  };

  const handleSelect = (option: CustomSelectOption<T>) => {
    if (option.disabled) return;
    onChange(option.value);
    setIsOpen(false);
  };

  // Size styles
  const sizeClasses = {
    sm: 'text-xs py-1.5 px-2.5 rounded-lg min-h-[34px]',
    md: 'text-xs sm:text-sm py-2 px-3 rounded-xl min-h-[40px]',
    lg: 'text-sm sm:text-base py-2.5 px-3.5 rounded-xl min-h-[44px]',
  }[size];

  // Badge styles
  const getBadgeClass = (color?: 'blue' | 'emerald' | 'amber' | 'slate' | 'rose') => {
    switch (color) {
      case 'emerald':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'amber':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'rose':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'slate':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'blue':
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-block text-left ${fullWidth ? 'w-full' : ''}`}
    >
      {/* Trigger Button */}
      <button
        type="button"
        id={selectId}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(prev => !prev)}
        onKeyDown={handleKeyDown}
        className={`w-full flex items-center justify-between gap-2 border bg-white text-left font-bold transition-all shadow-2xs cursor-pointer select-none
          ${isOpen ? 'border-[#2563EB] ring-2 ring-[#2563EB]/20 text-[#17365D]' : 'border-slate-300 text-[#17365D] hover:border-slate-400'}
          ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'active:scale-[0.99]'}
          ${sizeClasses}
          ${className}`}
      >
        <span className="flex items-center gap-1.5 min-w-0 flex-1 truncate">
          {selectedOption?.icon && (
            <span className="shrink-0 text-slate-500">{selectedOption.icon}</span>
          )}
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge && (
            <span
              className={`ml-1 shrink-0 px-1.5 py-0.2 rounded text-[10px] font-bold border ${getBadgeClass(
                selectedOption.badgeColor
              )}`}
            >
              {selectedOption.badge}
            </span>
          )}
        </span>

        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#2563EB]' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu Portal / Attached Popover */}
      {isOpen && (
        <div
          role="listbox"
          tabIndex={-1}
          className={`absolute z-50 mt-1 max-h-64 w-full min-w-[200px] overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl shadow-slate-900/10 focus:outline-hidden animate-in fade-in zoom-in-95 duration-150
            ${alignMenu === 'right' ? 'right-0' : 'left-0'}
            ${menuClassName}`}
          style={{
            maxWidth: 'calc(100vw - 32px)',
          }}
        >
          {options.length === 0 ? (
            <div className="py-2.5 px-3 text-xs text-slate-400 text-center font-medium">
              No options available
            </div>
          ) : (
            options.map(option => {
              const isSelected = option.value === value;
              return (
                <button
                  type="button"
                  key={String(option.value)}
                  role="option"
                  aria-selected={isSelected}
                  disabled={option.disabled}
                  onClick={() => handleSelect(option)}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs rounded-lg text-left transition-colors cursor-pointer select-none
                    ${
                      isSelected
                        ? 'bg-blue-50/90 text-[#17365D] font-bold'
                        : 'text-slate-700 hover:bg-slate-100/80 font-medium'
                    }
                    ${option.disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {option.icon && (
                      <span className="shrink-0 text-slate-500">{option.icon}</span>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="truncate">{option.label}</span>
                        {option.badge && (
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${getBadgeClass(
                              option.badgeColor
                            )}`}
                          >
                            {option.badge}
                          </span>
                        )}
                      </div>
                      {option.sublabel && (
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">
                          {option.sublabel}
                        </div>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
