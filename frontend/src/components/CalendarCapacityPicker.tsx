import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  Users,
  Check,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

interface CalendarCapacityPickerProps {
  value: number;
  onChange: (val: number) => void;
  className?: string;
}

// Numbers range: 2 to 99 (total 98 numbers)
const ALL_NUMBERS = Array.from({ length: 98 }, (_, i) => i + 2);
const CHUNK_SIZE = 20;

export default function CalendarCapacityPicker({
  value,
  onChange,
  className,
}: CalendarCapacityPickerProps) {
  // Split numbers into 5 chunks of 20 (last has 18)
  const chunks = useMemo(() => {
    const list: number[][] = [];
    for (let i = 0; i < ALL_NUMBERS.length; i += CHUNK_SIZE) {
      list.push(ALL_NUMBERS.slice(i, i + CHUNK_SIZE));
    }
    return list;
  }, []);

  const totalChunks = chunks.length; // 5 chunks

  // Initial page based on current value
  const initialChunk = useMemo(() => {
    return Math.max(0, Math.min(totalChunks - 1, Math.floor((value - 2) / CHUNK_SIZE)));
  }, [value, totalChunks]);

  const [currentChunkIndex, setCurrentChunkIndex] = useState(initialChunk);

  // Sync current chunk when value externally changes (if out of view)
  useEffect(() => {
    const targetChunk = Math.max(0, Math.min(totalChunks - 1, Math.floor((value - 2) / CHUNK_SIZE)));
    // If current value is not visible in current chunk(s), jump to it
    if (targetChunk !== currentChunkIndex && targetChunk !== currentChunkIndex + 1) {
      setCurrentChunkIndex(targetChunk);
    }
  }, [value, totalChunks]);

  // Responsive page navigation:
  // Mobile (< md): 1 chunk per view, moves by 1
  // Desktop (>= md): 2 chunks per view, moves by 2
  const handlePrevMobile = () => {
    setCurrentChunkIndex((prev) => Math.max(0, prev - 1));
  };
  const handleNextMobile = () => {
    setCurrentChunkIndex((prev) => Math.min(totalChunks - 1, prev + 1));
  };

  const handlePrevDesktop = () => {
    setCurrentChunkIndex((prev) => Math.max(0, prev - 2));
  };
  const handleNextDesktop = () => {
    setCurrentChunkIndex((prev) => Math.min(totalChunks - 2, prev + 2));
  };

  const canPrevMobile = currentChunkIndex > 0;
  const canNextMobile = currentChunkIndex < totalChunks - 1;

  const canPrevDesktop = currentChunkIndex > 0;
  const canNextDesktop = currentChunkIndex < totalChunks - 2;

  // Render a single calendar chunk block
  const renderCalendarChunk = (chunkIdx: number, titlePrefix?: string) => {
    const numbers = chunks[chunkIdx];
    if (!numbers) return null;
    const firstNum = numbers[0];
    const lastNum = numbers[numbers.length - 1];

    return (
      <div
        key={chunkIdx}
        className="flex-1 rounded-2xl border border-white/10 bg-[#0d0922]/90 p-3.5 sm:p-4 shadow-xl backdrop-blur-xl flex flex-col justify-between"
      >
        {/* Calendar Month-like Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-violet-500/15 text-violet-300 border border-violet-500/30">
              <CalendarIcon className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-xs font-bold text-white tracking-wide">
                {titlePrefix ? `${titlePrefix}: ` : ""}{chunkIdx + 1}-qism
              </span>
              <span className="block text-[10px] text-zinc-400 font-mono">
                {firstNum} — {lastNum} kishi
              </span>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-300 font-mono">
            {numbers.length} ta sig'im
          </span>
        </div>

        {/* Calendar Day Grid (5 columns x 4 rows) */}
        <div className="grid grid-cols-5 gap-2 sm:gap-2.5">
          {numbers.map((num) => {
            const isSelected = num === value;
            return (
              <button
                key={num}
                type="button"
                onClick={() => onChange(num)}
                className={cn(
                  "relative flex flex-col items-center justify-center rounded-xl p-2 sm:p-2.5 transition-all duration-200 outline-none select-none cursor-pointer group",
                  isSelected
                    ? "bg-gradient-to-tr from-violet-600 via-purple-600 to-fuchsia-500 text-white font-black shadow-[0_0_20px_rgba(168,85,247,0.55)] scale-[1.04] z-10 ring-2 ring-violet-300 ring-offset-2 ring-offset-[#0d0922]"
                    : "bg-white/[0.04] text-zinc-300 hover:text-white hover:bg-white/[0.1] border border-white/[0.06] hover:border-violet-500/40"
                )}
              >
                {/* Floating "Tanlandi" badge on top of selected button */}
                {isSelected && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 flex items-center gap-0.5 rounded-full bg-emerald-400 text-slate-950 px-1.5 py-0.2 text-[8px] font-black uppercase tracking-wider shadow-md animate-in zoom-in-75 duration-200 whitespace-nowrap">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                    <span>Tanlandi</span>
                  </span>
                )}

                {/* Number Day */}
                <span className={cn(
                  "font-mono text-sm sm:text-base font-extrabold leading-tight",
                  isSelected ? "text-white" : "group-hover:text-violet-300"
                )}>
                  {num}
                </span>

                {/* Mini label: kishi */}
                <span className={cn(
                  "text-[9px] font-medium leading-none mt-0.5",
                  isSelected ? "text-violet-100 font-bold" : "text-zinc-500 group-hover:text-zinc-400"
                )}>
                  kishi
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* ── MOBILE VIEW: Exactly 1 chunk displayed (Moves by 1) ─────────── */}
      <div className="block md:hidden space-y-3">
        {renderCalendarChunk(currentChunkIndex)}

        {/* Mobile Pagination Control */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs font-mono font-bold text-zinc-400">
            {currentChunkIndex + 1} / {totalChunks} qism
          </span>

          <Pagination className="mx-0 w-auto justify-end">
            <PaginationContent className="gap-0 divide-x divide-white/10 overflow-hidden rounded-xl border border-white/15 bg-white/5 backdrop-blur-md shadow-lg">
              <PaginationItem>
                <PaginationPrevious
                  disabled={!canPrevMobile}
                  onClick={(e) => {
                    e.preventDefault();
                    if (canPrevMobile) handlePrevMobile();
                  }}
                  className="rounded-none px-3 py-2 text-xs font-bold text-white hover:bg-violet-600/30"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Back</span>
                </PaginationPrevious>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  disabled={!canNextMobile}
                  onClick={(e) => {
                    e.preventDefault();
                    if (canNextMobile) handleNextMobile();
                  }}
                  className="rounded-none px-3 py-2 text-xs font-bold text-white hover:bg-violet-600/30"
                >
                  <span>Oldinga</span>
                  <ChevronRight className="h-4 w-4" />
                </PaginationNext>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>

      {/* ── DESKTOP VIEW: Exactly 2 chunks side-by-side (Moves by 2) ──────── */}
      <div className="hidden md:block space-y-3">
        <div className="grid grid-cols-2 gap-4">
          {renderCalendarChunk(currentChunkIndex, "1-blok")}
          {currentChunkIndex + 1 < totalChunks ? (
            renderCalendarChunk(currentChunkIndex + 1, "2-blok")
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 flex flex-col items-center justify-center text-center text-zinc-500 text-xs">
              <Sparkles className="w-6 h-6 text-violet-400/40 mb-2" />
              <span>Raqamlar yakuniga yetdi (2 — 99 kishi)</span>
            </div>
          )}
        </div>

        {/* Desktop Pagination Control */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-zinc-400">
            <span>
              Qismlar: {currentChunkIndex + 1}
              {currentChunkIndex + 1 < totalChunks ? ` - ${currentChunkIndex + 2}` : ""} / {totalChunks}
            </span>
          
          </div>

          <Pagination className="mx-0 w-auto justify-end">
            <PaginationContent className="gap-0 divide-x divide-white/10 overflow-hidden rounded-xl border border-white/15 bg-white/5 backdrop-blur-md shadow-lg">
              <PaginationItem>
                <PaginationPrevious
                  disabled={!canPrevDesktop}
                  onClick={(e) => {
                    e.preventDefault();
                    if (canPrevDesktop) handlePrevDesktop();
                  }}
                  className="rounded-none px-4 py-2 text-xs font-bold text-white hover:bg-violet-600/30"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Back (2 ta orqaga)</span>
                </PaginationPrevious>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  disabled={!canNextDesktop}
                  onClick={(e) => {
                    e.preventDefault();
                    if (canNextDesktop) handleNextDesktop();
                  }}
                  className="rounded-none px-4 py-2 text-xs font-bold text-white hover:bg-violet-600/30"
                >
                  <span>Oldinga (2 ta keyingi)</span>
                  <ChevronRight className="h-4 w-4" />
                </PaginationNext>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>

      {/* Selected Indicator Summary */}
      <div className="p-3 rounded-xl border border-violet-500/25 bg-violet-500/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-violet-400" />
          <span className="text-xs text-zinc-300">
            Tanlangan sig'im: <strong className="text-white font-mono font-bold">{value} kishilik xona</strong>
          </span>
        </div>
        <span className="text-[11px] font-semibold text-emerald-300">
          (1 ta Siz + {Math.max(1, value - 1)} ta ishtirokchi)
        </span>
      </div>
    </div>
  );
}
