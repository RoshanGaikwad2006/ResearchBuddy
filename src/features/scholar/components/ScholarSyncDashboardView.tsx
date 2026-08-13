import React, { useState } from "react";
import { useScholarSyncRuns, useSyncInstitutionalScholar } from "../hooks/useScholar";
import { ScholarSyncRun, ScholarSyncRunItem } from "@/services/googleScholar.service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RefreshCw, Play, CheckCircle2, AlertTriangle, XCircle, Clock, Users, BookOpen, FileCheck, Layers } from "lucide-react";

export const ScholarSyncDashboardView: React.FC = () => {
  const { data, isLoading, refetch } = useScholarSyncRuns();
  const syncMutation = useSyncInstitutionalScholar();
  const [selectedRun, setSelectedRun] = useState<ScholarSyncRun | null>(null);

  const handleRunSync = () => {
    syncMutation.mutate({ force: true });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-medium">SUCCESS</Badge>;
      case "PARTIAL_SUCCESS":
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 font-medium">PARTIAL SUCCESS</Badge>;
      case "FAILED":
        return <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20 font-medium">FAILED</Badge>;
      case "RUNNING":
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 font-medium animate-pulse">RUNNING</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const runs = data?.runs || [];
  const latestRun = runs[0];

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Card */}
      <Card className="border shadow-sm bg-card">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-teal-600" />
              Autonomous Scholar Synchronization Agent
            </CardTitle>
            <CardDescription className="mt-1">
              Monitors registered faculty Google Scholar profiles, enriches via OpenAlex & Crossref, and reconciles institutional research data.
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={handleRunSync}
              disabled={syncMutation.isPending}
              className="bg-teal-600 hover:bg-teal-700 text-white font-semibold gap-2 shadow"
            >
              <Play className={`h-4 w-4 ${syncMutation.isPending ? "animate-spin" : ""}`} />
              {syncMutation.isPending ? "Syncing Institution..." : "Run Institutional Sync"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Key Metric Tiles */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4">
            <div className="p-4 rounded-xl border bg-background/50 flex flex-col justify-between">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-teal-600" /> Total Sync Runs
              </span>
              <span className="text-2xl font-bold mt-2">{runs.length}</span>
            </div>
            <div className="p-4 rounded-xl border bg-background/50 flex flex-col justify-between">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-blue-600" /> Last Faculties Processed
              </span>
              <span className="text-2xl font-bold mt-2">{latestRun ? latestRun.facultiesProcessed : 0}</span>
            </div>
            <div className="p-4 rounded-xl border bg-background/50 flex flex-col justify-between">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-indigo-600" /> Papers Discovered
              </span>
              <span className="text-2xl font-bold mt-2">{latestRun ? latestRun.publicationsDiscovered : 0}</span>
            </div>
            <div className="p-4 rounded-xl border bg-background/50 flex flex-col justify-between">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <FileCheck className="h-3.5 w-3.5 text-emerald-600" /> Papers Added
              </span>
              <span className="text-2xl font-bold mt-2">{latestRun ? latestRun.publicationsAdded : 0}</span>
            </div>
            <div className="p-4 rounded-xl border bg-background/50 flex flex-col justify-between">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-rose-600" /> Recent Errors
              </span>
              <span className="text-2xl font-bold mt-2 text-rose-600">{latestRun ? latestRun.errorsCount : 0}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sync Execution History Log Table */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Layers className="h-5 w-5 text-indigo-600" />
            Institutional Sync Execution Log
          </CardTitle>
          <CardDescription>Historical log of background and manual scholar sync executions.</CardDescription>
        </CardHeader>
        <CardContent>
          {runs.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              No Scholar sync runs recorded yet. Click "Run Institutional Sync" above to launch an execution.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Run ID / Started</TableHead>
                  <TableHead>Trigger Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Faculties</TableHead>
                  <TableHead className="text-right">Discovered</TableHead>
                  <TableHead className="text-right">Added</TableHead>
                  <TableHead className="text-right">Updated</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.map((run) => (
                  <TableRow key={run.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-mono text-xs">
                      <div>{run.id.slice(0, 8)}...</div>
                      <div className="text-[11px] text-muted-foreground">
                        {new Date(run.startedAt).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-[11px]">
                        {run.triggerType}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(run.status)}</TableCell>
                    <TableCell className="text-right font-medium">{run.facultiesProcessed}</TableCell>
                    <TableCell className="text-right font-medium">{run.publicationsDiscovered}</TableCell>
                    <TableCell className="text-right font-medium text-emerald-600">+{run.publicationsAdded}</TableCell>
                    <TableCell className="text-right font-medium text-blue-600">{run.publicationsUpdated}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => setSelectedRun(run)}
                        className="text-xs font-semibold text-teal-600 hover:text-teal-700"
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Structured Run Item Details Modal */}
      <Dialog open={!!selectedRun} onOpenChange={() => setSelectedRun(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Layers className="h-5 w-5 text-teal-600" />
              Sync Run Detail Breakdown
            </DialogTitle>
            <DialogDescription>
              Run ID: <span className="font-mono text-xs text-foreground">{selectedRun?.id}</span> | Started:{" "}
              {selectedRun ? new Date(selectedRun.startedAt).toLocaleString() : ""}
            </DialogDescription>
          </DialogHeader>

          {selectedRun && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-4 gap-3 p-3 rounded-lg border bg-muted/30">
                <div>
                  <div className="text-xs text-muted-foreground">Status</div>
                  <div className="mt-1">{getStatusBadge(selectedRun.status)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Faculties</div>
                  <div className="text-base font-bold mt-1">{selectedRun.facultiesProcessed}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Discovered</div>
                  <div className="text-base font-bold mt-1">{selectedRun.publicationsDiscovered}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Errors</div>
                  <div className="text-base font-bold text-rose-600 mt-1">{selectedRun.errorsCount}</div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Per-Faculty Execution Items</h4>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead>Faculty Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Discovered</TableHead>
                        <TableHead className="text-right">Added</TableHead>
                        <TableHead className="text-right">Updated</TableHead>
                        <TableHead>Error Message</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(selectedRun.items || []).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                            No faculty detail items recorded.
                          </TableCell>
                        </TableRow>
                      ) : (
                        selectedRun.items?.map((item: ScholarSyncRunItem) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">
                              <div>{item.faculty?.user?.name || "Faculty Member"}</div>
                              <div className="text-[11px] text-muted-foreground">
                                {item.faculty?.department?.code || ""} - {item.faculty?.designation || ""}
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(item.status)}</TableCell>
                            <TableCell className="text-right font-medium">{item.publicationsDiscovered}</TableCell>
                            <TableCell className="text-right font-medium text-emerald-600">+{item.publicationsAdded}</TableCell>
                            <TableCell className="text-right font-medium text-blue-600">{item.publicationsUpdated}</TableCell>
                            <TableCell className="text-xs text-rose-600 max-w-[200px] truncate">
                              {item.error || "—"}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
