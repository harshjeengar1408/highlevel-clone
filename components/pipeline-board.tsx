"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { moveOpportunity } from "@/app/actions/pipelines";
import { cn, money, relativeTime } from "@/lib/format";
import { Avatar } from "./ui";
import { Icon } from "./icons";

export type BoardStage = { id: string; name: string; color: string };
export type BoardCard = {
  id: string;
  name: string;
  value: number;
  stageId: string;
  contactId: string;
  contactName: string;
  ownerName: string | null;
  ownerColor: string;
  source: string | null;
  updatedAt: string;
};

export function PipelineBoard({
  stages,
  cards: initialCards,
  currency,
}: {
  stages: BoardStage[];
  cards: BoardCard[];
  currency: string;
}) {
  const router = useRouter();
  const [cards, setCards] = useState(initialCards);
  const [dragging, setDragging] = useState<string | null>(null);
  const [hoverStage, setHoverStage] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const grouped = useMemo(() => {
    const map = new Map<string, BoardCard[]>();
    for (const stage of stages) map.set(stage.id, []);
    for (const card of cards) map.get(card.stageId)?.push(card);
    return map;
  }, [cards, stages]);

  const totalValue = cards.reduce((sum, card) => sum + card.value, 0);

  function handleDrop(stageId: string) {
    if (!dragging) return;
    const card = cards.find((item) => item.id === dragging);
    setDragging(null);
    setHoverStage(null);
    if (!card || card.stageId === stageId) return;

    setCards((current) =>
      current.map((item) => (item.id === card.id ? { ...item, stageId } : item))
    );

    startTransition(async () => {
      const result = await moveOpportunity(card.id, stageId);
      if (!result.ok) {
        setCards(initialCards);
        window.alert(result.error ?? "Could not move that deal.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 ring-1 ring-inset ring-slate-200">
          <Icon name="funnel" className="h-3.5 w-3.5 text-indigo-500" />
          <strong className="font-semibold text-slate-900">{cards.length}</strong> open deals
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 ring-1 ring-inset ring-slate-200">
          <Icon name="money" className="h-3.5 w-3.5 text-emerald-500" />
          <strong className="font-semibold text-slate-900">{money(totalValue, currency)}</strong> total value
        </span>
        <span className="ml-auto hidden items-center gap-1.5 text-[11px] text-slate-400 sm:inline-flex">
          <Icon name="drag" className="h-3.5 w-3.5" />
          Drag a card to change its stage
        </span>
      </div>

      <div className="thin-scroll -mb-2 flex gap-3 overflow-x-auto pb-2">
        {stages.map((stage) => {
          const stageCards = grouped.get(stage.id) ?? [];
          const value = stageCards.reduce((sum, card) => sum + card.value, 0);

          return (
            <div
              key={stage.id}
              onDragOver={(event) => {
                event.preventDefault();
                setHoverStage(stage.id);
              }}
              onDragLeave={() => setHoverStage((current) => (current === stage.id ? null : current))}
              onDrop={(event) => {
                event.preventDefault();
                handleDrop(stage.id);
              }}
              className={cn(
                "flex w-[266px] shrink-0 flex-col rounded-2xl border bg-slate-100/70 p-2 transition-colors",
                hoverStage === stage.id
                  ? "border-indigo-300 bg-indigo-50/70"
                  : "border-slate-200/70"
              )}
            >
              <div className="flex items-center justify-between px-1.5 py-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: stage.color }} />
                  <span className="text-xs font-bold text-slate-800">{stage.name}</span>
                  <span className="rounded-full bg-white px-1.5 text-[10px] font-semibold text-slate-500 ring-1 ring-inset ring-slate-200">
                    {stageCards.length}
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-slate-500">
                  {money(value, currency)}
                </span>
              </div>

              <div className="flex min-h-[420px] flex-col gap-2 p-0.5">
                {stageCards.map((card) => (
                  <article
                    key={card.id}
                    draggable
                    onDragStart={() => setDragging(card.id)}
                    onDragEnd={() => {
                      setDragging(null);
                      setHoverStage(null);
                    }}
                    className={cn(
                      "group cursor-grab rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm transition-all active:cursor-grabbing",
                      dragging === card.id && "rotate-1 opacity-50"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold leading-snug text-slate-900">{card.name}</p>
                      <Icon
                        name="drag"
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-300 group-hover:text-slate-400"
                      />
                    </div>
                    <Link
                      href={`/contacts/${card.contactId}`}
                      className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      {card.contactName}
                      <Icon name="arrowRight" className="h-3 w-3" />
                    </Link>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900">{money(card.value, currency)}</span>
                      <Avatar
                        name={card.ownerName ?? "Unassigned"}
                        color={card.ownerColor}
                        size="xs"
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-1.5 text-[10px] text-slate-400">
                      <span className="truncate">{card.source ?? "Direct"}</span>
                      <span>{relativeTime(card.updatedAt)}</span>
                    </div>
                  </article>
                ))}

                {stageCards.length === 0 && (
                  <div className="flex flex-1 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-slate-300/70 p-4 text-center">
                    <Icon name="funnel" className="h-4 w-4 text-slate-300" />
                    <p className="text-[11px] text-slate-400">Drop deals here</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
