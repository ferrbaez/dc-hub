"use client";

import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { Loader2, MessageSquarePlus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function formatRelative(date: Date) {
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.round(diffMs / 60_000);
  if (diffMin < 1) return "ahora";
  if (diffMin < 60) return `${diffMin} min`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr} h`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 7) return `${diffDay} d`;
  return date.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
}

export function ConversationList({ activeId }: { activeId: string | null }) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const { data: conversations, isLoading } = trpc.core.chat.conversations.list.useQuery();
  const deleteMutation = trpc.core.chat.conversations.delete.useMutation({
    onSuccess: () => {
      utils.core.chat.conversations.list.invalidate();
    },
  });

  async function onDelete(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("¿Eliminar esta conversación?")) return;
    await deleteMutation.mutateAsync({ id });
    if (activeId === id) {
      router.push("/analytics");
    }
  }

  return (
    <div className="flex h-full flex-col bg-surface theme-transition">
      <div className="border-b border-surface-border p-3">
        <Link
          href="/analytics"
          className="flex items-center justify-center gap-2 rounded-lg bg-penguin-violet px-3 py-2 text-sm font-medium text-white shadow-sm shadow-penguin-violet/30 transition-all hover:bg-penguin-violet/90 hover:shadow-md"
        >
          <MessageSquarePlus className="h-4 w-4" />
          Nueva consulta
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-xs text-content-muted">
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            Cargando...
          </div>
        ) : !conversations || conversations.length === 0 ? (
          <div className="px-3 py-8 text-center text-xs text-content-muted">
            Sin conversaciones aún.
            <br />
            Hacé una pregunta para empezar.
          </div>
        ) : (
          <ul className="space-y-0.5">
            {conversations.map((c) => {
              const active = c.id === activeId;
              return (
                <li key={c.id}>
                  <Link
                    href={`/analytics?c=${c.id}`}
                    className={cn(
                      "group flex items-start gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors",
                      active
                        ? "bg-penguin-violet/10 text-content dark:bg-penguin-violet/20"
                        : "text-content hover:bg-surface-soft",
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div
                        className={cn(
                          "truncate text-[13px] font-medium",
                          active ? "text-penguin-violet" : "text-content",
                        )}
                      >
                        {c.title}
                      </div>
                      <div className="text-[10px] text-content-muted">
                        {formatRelative(new Date(c.updatedAt))}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => onDelete(c.id, e)}
                      className={cn(
                        "shrink-0 rounded p-1 text-content-muted opacity-0 transition-opacity hover:bg-rose-500/15 hover:text-rose-500 group-hover:opacity-100",
                        active && "opacity-60",
                      )}
                      aria-label="Eliminar conversación"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
