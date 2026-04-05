import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  TrendingUp, 
  DollarSign, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight,
  Filter,
  Download,
  Search,
  CheckCircle2,
  Check
} from "lucide-react";
import { toast } from "sonner";
import { generateInvoice } from "@/lib/InvoiceGenerator";
import AdminNavbar from "@/components/adminNavbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePayment } from "@/hooks/usePayment";

interface Transaction {
  id: string;
  created_at: string;
  amount: number;
  type: 'brand_inflow' | 'influencer_payout' | 'platform_fee' | 'agency_fee';
  status: 'pending' | 'completed' | 'failed';
  description: string;
  provider_tx_id?: string;
  metadata?: any;
  influencer_profiles?: {
    full_name: string;
    instagram_handle: string;
  };
  campaigns?: {
    name: string;
  };
}

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface VerifiedInfluencer {
  id: string;
  final_payout: number;
  net_payout: number;
  tds_amount: number;
  funding_status: 'unfunded' | 'settled' | 'funded';
  campaigns: { name: string };
  influencer_profiles: {
    full_name: string;
    instagram_handle: string;
    upi_id: string | null;
    account_number: string | null;
    ifsc_code: string | null;
    bank_name: string | null;
    bank_account_name: string | null;
  };
}

const AdminFinancials = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { 
    isProcessingPayment, 
    handlePayoutDistribution, 
    handleBatchPayoutDistribution 
  } = usePayment(() => {
    fetchData();
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch Transactions
      const { data: txData } = await supabase
        .from("transactions")
        .select(`
          *,
          influencer_profiles(full_name, instagram_handle),
          campaigns(name)
        `)
        .order("created_at", { ascending: false });

      if (txData) setTransactions(txData as any);
    } catch (e: any) {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const stats = {
    totalRevenue: transactions
      .filter(t => (t.type === 'platform_fee' || t.type === 'agency_fee') && t.status === 'completed')
      .reduce((acc, t) => acc + t.amount, 0),
    totalInflow: transactions
      .filter(t => t.type === 'brand_inflow' && t.status === 'completed')
      .reduce((acc, t) => acc + t.amount, 0),
    totalPayout: transactions
      .filter(t => t.type === 'influencer_payout' && t.status === 'completed')
      .reduce((acc, t) => acc + t.amount, 0),
  };

  const filtered = transactions.filter(t => 
    t.description.toLowerCase().includes(search.toLowerCase()) ||
    t.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-10">
      <AdminNavbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Financial Hub</h1>
            <p className="text-muted-foreground mt-1">Manage ledger entries and influencer settlements.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={() => fetchData()}>
              Refresh
            </Button>
            <Button size="sm">
              <Download className="mr-2 h-4 w-4" /> Export All
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase flex justify-between">
                Total Revenue
                <TrendingUp className="h-4 w-4 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">₹{stats.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Earnings from platform & agency fees</p>
            </CardContent>
          </Card>

          <Card className="bg-amber-500/5 border-amber-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase flex justify-between">
                Total Payouts
                <Clock className="h-4 w-4 text-amber-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-500">₹{stats.totalPayout.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Total amount distributed to influencers</p>
            </CardContent>
          </Card>

          <Card className="bg-emerald-500/5 border-emerald-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase flex justify-between">
                Total Inflow
                <DollarSign className="h-4 w-4 text-emerald-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-500">₹{stats.totalInflow.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Total money received from brands</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <CardTitle>Transactions</CardTitle>
                <CardDescription>Real-time audit trail of all financial movements.</CardDescription>
              </div>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search ledger..." 
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 opacity-50">Loading ledger entries...</TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 opacity-50">No transactions found.</TableCell>
                  </TableRow>
                ) : (
                  filtered.map((t) => (
                    <TableRow 
                      key={t.id} 
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setSelectedTx(t)}
                    >
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {new Date(t.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(
                          "capitalize",
                          t.type === 'brand_inflow' && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
                          t.type === 'influencer_payout' && "bg-rose-500/10 text-rose-500 border-rose-500/20",
                          (t.type === 'platform_fee' || t.type === 'agency_fee') && "bg-primary/10 text-primary border-primary/20",
                        )}>
                          {t.type.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-bold">
                        <span className="flex items-center gap-1">
                          {t.type === 'brand_inflow' || t.type === 'platform_fee' || t.type === 'agency_fee' 
                            ? <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                            : <ArrowDownRight className="h-3 w-3 text-rose-500" />
                          }
                          ₹{t.amount.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={t.status === 'completed' ? 'default' : 'secondary'} className="capitalize">
                          {t.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{t.description}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      {/* Transaction Detail Modal */}
      <Dialog open={!!selectedTx} onOpenChange={() => setSelectedTx(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Transaction Details
              {selectedTx && (
                <Badge variant={selectedTx.status === 'completed' ? 'default' : 'secondary'}>
                  {selectedTx.status}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {selectedTx && (
            <div className="space-y-6 py-4">
              <div className="flex justify-between items-center p-4 bg-muted/30 rounded-lg border border-dashed">
                <span className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Amount</span>
                <span className="text-2xl font-bold text-primary">₹{selectedTx.amount.toLocaleString()}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Type</label>
                  <p className="capitalize text-sm font-medium">{selectedTx.type.replace('_', ' ')}</p>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Date</label>
                  <p className="text-sm font-medium">{new Date(selectedTx.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Influencer</label>
                  <p className="text-sm font-medium">{selectedTx.influencer_profiles?.full_name || 'N/A'}</p>
                  <p className="text-xs text-muted-foreground">@{selectedTx.influencer_profiles?.instagram_handle || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Campaign</label>
                  <p className="text-sm font-medium">{selectedTx.campaigns?.name || 'Global Settlement'}</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Description</label>
                <p className="text-sm p-3 bg-muted/20 rounded border italic">"{selectedTx.description}"</p>
              </div>

              {selectedTx.provider_tx_id && (
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Razorpay Order ID</label>
                  <p className="text-xs font-mono text-muted-foreground bg-muted/10 p-2 rounded truncate">{selectedTx.provider_tx_id}</p>
                </div>
              )}

              <div className="pt-4 flex justify-between gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => generateInvoice(selectedTx)}
                >
                  <Download className="mr-2 h-4 w-4" /> Invoice
                </Button>
                <Button variant="ghost" onClick={() => setSelectedTx(null)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminFinancials;
