import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { proposeTx } from "@/hooks/useLiveGovernor";
import { Loader2, Plus, Trash2 } from "lucide-react";

interface Action {
  target: string;
  value: string;
  calldata: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  governorAddress: string;
  governorLabel: string;
  isLive: boolean;
  onSubmitted: () => void;
}

export default function CreateProposalModal({
  open,
  onOpenChange,
  governorAddress,
  governorLabel,
  isLive,
  onSubmitted,
}: Props) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [actions, setActions] = useState<Action[]>([{ target: "", value: "0", calldata: "0x" }]);
  const [submitting, setSubmitting] = useState(false);

  const updateAction = (i: number, k: keyof Action, v: string) => {
    setActions((a) => a.map((x, idx) => (idx === i ? { ...x, [k]: v } : x)));
  };
  const addAction = () => setActions((a) => [...a, { target: "", value: "0", calldata: "0x" }]);
  const removeAction = (i: number) => setActions((a) => a.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({ title: "Title required", variant: "destructive" });
      return;
    }
    for (const a of actions) {
      if (!/^0x[a-fA-F0-9]{40}$/.test(a.target)) {
        toast({ title: "Invalid target address", description: a.target, variant: "destructive" });
        return;
      }
      if (!/^0x[a-fA-F0-9]*$/.test(a.calldata)) {
        toast({ title: "Calldata must be hex (0x…)", variant: "destructive" });
        return;
      }
    }
    const description = `${title.trim()}\n\n${body.trim()}`;
    if (!isLive) {
      toast({
        title: "Simulated · contract not deployed",
        description: `Would call propose() on ${governorLabel} with ${actions.length} action(s).`,
      });
      onSubmitted();
      onOpenChange(false);
      return;
    }
    setSubmitting(true);
    try {
      const tx = await proposeTx(
        governorAddress,
        actions.map((a) => a.target),
        actions.map((a) => a.value),
        actions.map((a) => a.calldata),
        description,
      );
      toast({ title: "Proposal submitted", description: `Tx: ${tx.hash.slice(0, 10)}…` });
      await tx.wait();
      toast({ title: "Proposal created", description: "Awaiting voting delay." });
      onSubmitted();
      onOpenChange(false);
    } catch (e: any) {
      toast({
        title: "Proposal failed",
        description: e?.shortMessage || e?.message || "Transaction rejected",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create proposal · {governorLabel}</DialogTitle>
          <DialogDescription>
            Submit an on-chain proposal. First line becomes the title; remaining text is the body.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="prop-title">Title</Label>
            <Input
              id="prop-title"
              placeholder="Increase BLAZE burn share to 55%"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="prop-body">Description (markdown)</Label>
            <Textarea
              id="prop-body"
              placeholder="Rationale, parameters, expected impact…"
              rows={5}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>On-chain actions</Label>
              <Button variant="ghost" size="sm" onClick={addAction} className="h-7 text-xs">
                <Plus className="mr-1 h-3 w-3" /> Add action
              </Button>
            </div>

            {actions.map((a, i) => (
              <div key={i} className="space-y-2 rounded-md border border-border/50 bg-muted/20 p-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Action #{i + 1}</span>
                  {actions.length > 1 && (
                    <Button variant="ghost" size="sm" className="h-6 text-xs text-destructive" onClick={() => removeAction(i)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <Input
                  placeholder="Target (0x…)"
                  value={a.target}
                  onChange={(e) => updateAction(i, "target", e.target.value)}
                  className="font-mono text-xs"
                />
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    placeholder="Value (wei)"
                    value={a.value}
                    onChange={(e) => updateAction(i, "value", e.target.value)}
                    className="font-mono text-xs"
                  />
                  <Input
                    placeholder="Calldata (0x…)"
                    value={a.calldata}
                    onChange={(e) => updateAction(i, "calldata", e.target.value)}
                    className="col-span-2 font-mono text-xs"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting} className="bg-gradient-fire text-primary-foreground">
            {submitting && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            Submit proposal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
