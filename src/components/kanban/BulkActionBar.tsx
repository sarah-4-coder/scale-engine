/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { X, ChevronDown, Trash2, MessageSquare, Loader2, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface KanbanColumn {
  id: string;
  label: string;
}

interface BulkActionBarProps {
  selectedIds: string[];
  columns: KanbanColumn[];
  isLocked?: boolean;
  onDeselectAll: () => void;
  onBulkMove: (targetStatus: string) => Promise<void>;
  onBulkRemove: () => Promise<void>;
  onWhatsAppAll: (ids: string[]) => void;
  getApplicantPhone: (id: string) => string | null;
  getApplicantName: (id: string) => string;
}

export const BulkActionBar = ({
  selectedIds,
  columns,
  isLocked = false,
  onDeselectAll,
  onBulkMove,
  onBulkRemove,
  onWhatsAppAll,
}: BulkActionBarProps) => {
  const [confirmMove, setConfirmMove] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const count = selectedIds.length;
  if (count === 0) return null;

  const targetColumnLabel = columns.find(c => c.id === confirmMove)?.label || confirmMove || "";

  const handleMoveConfirm = async () => {
    if (!confirmMove) return;
    setIsProcessing(true);
    try {
      await onBulkMove(confirmMove);
      setConfirmMove(null);
      onDeselectAll();
    } catch {
      toast.error("Failed to move influencers");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveConfirm = async () => {
    setIsProcessing(true);
    try {
      await onBulkRemove();
      setConfirmRemove(false);
      onDeselectAll();
    } catch {
      toast.error("Failed to remove influencers");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {/* Sticky Bulk Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-4 px-4 pointer-events-none">
        <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl shadow-black/40 px-4 py-3 flex flex-wrap items-center gap-3 pointer-events-auto max-w-3xl w-full">
          {/* Counter */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="h-7 w-7 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-black text-primary">{count}</span>
            </div>
            <span className="text-sm font-bold text-white truncate">
              {count} influencer{count !== 1 ? "s" : ""} selected
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Move to Stage */}
            {!isLocked && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    className="h-8 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold gap-1.5"
                  >
                    Move to Stage
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  {columns.map(col => (
                    <DropdownMenuItem
                      key={col.id}
                      onClick={() => setConfirmMove(col.id)}
                      className="text-sm"
                    >
                      {col.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* WhatsApp All */}
            <Button
              size="sm"
              variant="outline"
              className="h-8 rounded-xl border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 text-xs font-bold gap-1.5"
              onClick={() => onWhatsAppAll(selectedIds)}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              WhatsApp All
            </Button>

            {/* AI Call All (placeholder) */}
            <Button
              size="sm"
              variant="outline"
              disabled
              title="AI Calling feature coming soon"
              className="h-8 rounded-xl border-violet-500/30 text-violet-400/50 text-xs font-bold gap-1.5 opacity-60 cursor-not-allowed"
            >
              <Bot className="h-3.5 w-3.5" />
              AI Call All
            </Button>

            {/* Remove */}
            {!isLocked && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 rounded-xl border-rose-500/40 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 text-xs font-bold gap-1.5"
                onClick={() => setConfirmRemove(true)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </Button>
            )}

            {/* Deselect */}
            <Button
              size="sm"
              variant="ghost"
              className="h-8 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 text-xs font-bold gap-1"
              onClick={onDeselectAll}
            >
              <X className="h-3.5 w-3.5" />
              Deselect All
            </Button>
          </div>
        </div>
      </div>

      {/* Move Confirmation Dialog */}
      <Dialog open={!!confirmMove} onOpenChange={() => setConfirmMove(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Move {count} Influencer{count !== 1 ? "s" : ""}</DialogTitle>
            <DialogDescription>
              Move <strong>{count}</strong> selected influencer{count !== 1 ? "s" : ""} to{" "}
              <strong>{targetColumnLabel}</strong>? This updates their campaign status immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setConfirmMove(null)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button onClick={handleMoveConfirm} disabled={isProcessing} className="gap-2">
              {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirm Move
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Confirmation Dialog */}
      <Dialog open={confirmRemove} onOpenChange={setConfirmRemove}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-rose-500">Remove {count} Influencer{count !== 1 ? "s" : ""}?</DialogTitle>
            <DialogDescription>
              This will permanently remove <strong>{count}</strong> influencer{count !== 1 ? "s" : ""} from this campaign.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setConfirmRemove(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveConfirm}
              disabled={isProcessing}
              className="gap-2"
            >
              {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
              Remove from Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
