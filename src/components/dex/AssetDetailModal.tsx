import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingUp, Shield, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWallet } from "@/hooks/useWallet";
import { useToast } from "@/hooks/use-toast";

interface AssetData {
  symbol: string;
  logo: string;
  totalSupplied: number;
  totalBorrowed: number;
  supplyAPY: number;
  borrowAPY: number;
  utilization: number;
  collateralFactor: number;
  liquidationThreshold: number;
  userSupplied?: number;
  userBorrowed?: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  asset: AssetData | null;
}

const AssetDetailModal = ({ open, onClose, asset }: Props) => {
  const { address, connect } = useWallet();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);

  if (!open || !asset) return null;

  const parsed = parseFloat(amount);
  const isValid = !isNaN(parsed) && parsed > 0;

  const handleAction = async (action: string) => {
    if (!isValid || !address) return;
    setIsExecuting(true);
    await new Promise((r) => setTimeout(r, 1500));
    setIsExecuting(false);
    setAmount("");
    toast({
      title: `${action} Successful`,
      description: `${parsed.toLocaleString()} ${asset.symbol} — Fee: ${(parsed * 0.003).toFixed(4)}`,
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-background/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-lg rounded-xl border border-border bg-card p-5 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={asset.logo} alt="" className="h-10 w-10 rounded-full" />
              <div>
                <h3 className="font-display text-lg font-bold text-foreground">{asset.symbol}</h3>
                <p className="text-xs text-muted-foreground">Utilization: {asset.utilization}%</p>
              </div>
            </div>
            <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted/40">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Stats Row */}
          <div className="mb-4 grid grid-cols-3 gap-3 rounded-lg border border-border/40 bg-muted/10 p-3 text-center text-xs">
            <div>
              <p className="text-muted-foreground">Supply APY</p>
              <p className="mt-0.5 text-sm font-semibold text-[hsl(142,70%,50%)]">{asset.supplyAPY}%</p>
            </div>
            <div>
              <p className="text-muted-foreground">Borrow APY</p>
              <p className="mt-0.5 text-sm font-semibold text-amber-400">{asset.borrowAPY}%</p>
            </div>
            <div>
              <p className="text-muted-foreground">Collateral Factor</p>
              <p className="mt-0.5 text-sm font-semibold text-foreground">{asset.collateralFactor}%</p>
            </div>
          </div>

          {/* Risk Info */}
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-400">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            Liquidation at {asset.liquidationThreshold}% collateral ratio
          </div>

          {/* Action Tabs */}
          <Tabs defaultValue="supply">
            <TabsList className="grid w-full grid-cols-4 bg-muted/30">
              <TabsTrigger value="supply" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Supply</TabsTrigger>
              <TabsTrigger value="withdraw" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Withdraw</TabsTrigger>
              <TabsTrigger value="borrow" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Borrow</TabsTrigger>
              <TabsTrigger value="repay" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Repay</TabsTrigger>
            </TabsList>

            {(["supply", "withdraw", "borrow", "repay"] as const).map((action) => (
              <TabsContent key={action} value={action} className="mt-4 space-y-3">
                <Input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="text-lg font-semibold border-border/50 bg-muted/20"
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {action === "supply" || action === "borrow" ? "APY" : "Available"}
                  </span>
                  <span className="font-medium text-foreground">
                    {action === "supply" ? `${asset.supplyAPY}%` : action === "borrow" ? `${asset.borrowAPY}%` : `${(asset.userSupplied || 0).toLocaleString()} ${asset.symbol}`}
                  </span>
                </div>
                {isValid && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Protocol Fee (0.3%)</span>
                    <span>{(parsed * 0.003).toFixed(4)} {asset.symbol}</span>
                  </div>
                )}
                {!address ? (
                  <Button onClick={connect} className="w-full bg-gradient-fire text-primary-foreground" size="lg">
                    Connect Wallet
                  </Button>
                ) : (
                  <Button
                    disabled={!isValid || isExecuting}
                    onClick={() => handleAction(action.charAt(0).toUpperCase() + action.slice(1))}
                    className="w-full bg-gradient-fire text-primary-foreground hover:opacity-90 disabled:opacity-50"
                    size="lg"
                  >
                    {isExecuting ? "Processing…" : `${action.charAt(0).toUpperCase() + action.slice(1)} ${asset.symbol}`}
                  </Button>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AssetDetailModal;
