import { useState } from "react";
import { Loader2, Plus, Search, UserCheck, Trash2, Edit, RefreshCw, GraduationCap, Quote, Eye, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useFacultyList, useDeleteFaculty } from "../hooks/useFaculty";
import { useSyncScholar } from "@/features/scholar/hooks/useScholar";
import { FacultyFormModal } from "./FacultyFormModal";
import { PublicFacultyProfileModal } from "./PublicFacultyProfileModal";
import { useAuth } from "@/features/auth/hooks/useAuth";
import type { FacultyItem } from "@/services/faculty.service";

export function FacultyListView() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<FacultyItem | null>(null);
  const [selectedPublicFaculty, setSelectedPublicFaculty] = useState<FacultyItem | null>(null);
  const [isPublicModalOpen, setIsPublicModalOpen] = useState(false);

  const { role } = useAuth();
  const isAdmin = role === "ADMIN";

  const { data, isLoading, isError } = useFacultyList({
    search: search || undefined,
    page,
    limit: 10,
  });

  const deleteMutation = useDeleteFaculty();
  const syncScholarMutation = useSyncScholar();

  const handleEdit = (item: FacultyItem) => {
    setEditingFaculty(item);
    setIsModalOpen(true);
  };

  const handleCreateNew = () => {
    setEditingFaculty(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this faculty profile?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleSyncScholar = async (item: FacultyItem) => {
    const scholarUrl = item.scholarUrl || prompt("Enter Google Scholar Profile URL or Author ID:");
    if (!scholarUrl) return;

    await syncScholarMutation.mutateAsync({
      facultyId: item.id,
      scholarUrl,
    });
  };

  return (
    <div className="space-y-4">
      {/* Header controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search faculty by name, employee ID, or research interest..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9 h-10"
          />
        </div>

        {isAdmin && (
          <Button onClick={handleCreateNew} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Faculty Profile
          </Button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-border bg-card">
          <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
          <span className="text-sm font-medium text-muted-foreground">Loading faculty directory...</span>
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center text-sm text-destructive">
          Failed to load faculty directory. Please try again.
        </div>
      ) : !data?.items || data.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-12 text-center">
          <UserCheck className="h-10 w-10 text-muted-foreground/50 mb-2" />
          <p className="text-base font-semibold text-foreground">No faculty profiles found</p>
          <p className="text-xs text-muted-foreground mt-1">Try adjusting your search query.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-soft">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Faculty Member</th>
                <th className="px-4 py-3">Employee ID</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Scholar Metrics</th>
                <th className="px-4 py-3">Research Interests</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.items.map((item: any) => (
                <tr key={item.id} className="transition-colors hover:bg-muted/30">
                  <td className="px-4 py-3.5">
                    <div className="font-medium text-foreground">{item.user.name}</div>
                    <div className="text-xs text-muted-foreground">{item.user.email}</div>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs text-foreground/80">{item.employeeId}</td>
                  <td className="px-4 py-3.5">
                    <Badge variant="outline" className="font-semibold">
                      {item.department.code}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 font-semibold text-foreground">
                        <BookOpen className="h-3.5 w-3.5 text-cyan-600 shrink-0" />
                        <span>{(item.publications?.length || item.researchAuthorships?.length || 0)} Publications</span>
                      </div>
                      {item.totalCitations !== undefined && item.totalCitations > 0 ? (
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Quote className="h-3 w-3 text-amber-500 shrink-0" /> {item.totalCitations} Citations • h-index: {item.hIndex || 0}
                        </div>
                      ) : (
                        <span className="text-[10px] italic text-muted-foreground">Scholar Not Synced</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-wrap gap-1">
                      {(item.researchInterests || []).map((interest: string, i: number) => (
                        <span key={i} className="inline-flex rounded bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                          {interest}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1 text-xs text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                        title="View Public Academic Profile"
                        onClick={() => {
                          setSelectedPublicFaculty(item);
                          setIsPublicModalOpen(true);
                        }}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View Profile
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1 text-xs text-primary"
                        title="Sync Google Scholar Profile"
                        disabled={syncScholarMutation.isPending}
                        onClick={() => handleSyncScholar(item)}
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${syncScholarMutation.isPending ? "animate-spin" : ""}`} />
                        Sync Scholar
                      </Button>
                      {isAdmin && (
                        <>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(item)}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(item.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Showing Page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} Total)</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= data.pagination.totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}

      <FacultyFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        facultyToEdit={editingFaculty}
      />

      <PublicFacultyProfileModal
        open={isPublicModalOpen}
        onOpenChange={setIsPublicModalOpen}
        faculty={selectedPublicFaculty}
      />
    </div>
  );
}
