import { useState } from "react";
import {
  Loader2,
  Plus,
  Search,
  UserCheck,
  Trash2,
  Edit,
  RefreshCw,
  Quote,
  Eye,
  BookOpen,
  ShieldCheck,
  ShieldAlert,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFacultyList, useDeleteFaculty, useUpdateFacultyRole } from "../hooks/useFaculty";
import { useDepartmentList } from "@/features/departments/hooks/useDepartments";
import { useSyncScholar } from "@/features/scholar/hooks/useScholar";
import { FacultyFormModal } from "./FacultyFormModal";
import { PublicFacultyProfileModal } from "./PublicFacultyProfileModal";
import { useAuth } from "@/features/auth/hooks/useAuth";
import type { FacultyItem } from "@/services/faculty.service";

export function FacultyListView() {
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<FacultyItem | null>(null);
  const [selectedPublicFaculty, setSelectedPublicFaculty] = useState<FacultyItem | null>(null);
  const [isPublicModalOpen, setIsPublicModalOpen] = useState(false);

  const { role } = useAuth();
  const isAdmin = role === "ADMIN";

  const { data: deptData } = useDepartmentList();
  const departments = deptData?.departments || [];

  const { data, isLoading, isError } = useFacultyList({
    search: search || undefined,
    departmentId: departmentFilter === "ALL" ? undefined : departmentFilter,
    page,
    limit: pageSize,
  });

  const deleteMutation = useDeleteFaculty();
  const syncScholarMutation = useSyncScholar();
  const updateRoleMutation = useUpdateFacultyRole();

  const handleRoleToggle = async (item: FacultyItem) => {
    const currentRole = item.user?.role;
    const newRole = currentRole === "ADMIN" ? "FACULTY" : "ADMIN";
    const actionLabel = newRole === "ADMIN" ? "promote to ADMIN" : "demote to FACULTY";

    if (confirm(`Are you sure you want to ${actionLabel} for ${item.user.name}?`)) {
      await updateRoleMutation.mutateAsync({
        facultyId: item.id,
        role: newRole,
      });
    }
  };

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

  const selectedDept = departments.find((d) => d.id === departmentFilter);

  return (
    <div className="space-y-4">
      {/* Header controls & Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search faculty by name, employee ID, or research..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9 h-10"
              />
            </div>

            {/* Department Filter */}
            <div className="flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
              <Select
                value={departmentFilter}
                onValueChange={(val) => {
                  setDepartmentFilter(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[220px] h-10 text-xs font-medium">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Page Size */}
            <Select
              value={String(pageSize)}
              onValueChange={(val) => {
                setPageSize(Number(val));
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[110px] h-10 text-xs">
                <SelectValue placeholder="Page Size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 / page</SelectItem>
                <SelectItem value="25">25 / page</SelectItem>
                <SelectItem value="50">50 / page</SelectItem>
                <SelectItem value="100">100 / page</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isAdmin && (
            <Button onClick={handleCreateNew} className="gap-2 shrink-0">
              <Plus className="h-4 w-4" />
              Add Faculty Profile
            </Button>
          )}
        </div>

        {/* Quick Filter Info & Department context banner */}
        <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>
              Showing{" "}
              <strong className="text-foreground">{data?.items?.length || 0}</strong> of{" "}
              <strong className="text-foreground">{data?.pagination?.total || 0}</strong> faculty members
              {selectedDept ? ` in ${selectedDept.name} (${selectedDept.code})` : " across all departments"}
            </span>
            {departmentFilter !== "ALL" && (
              <Badge
                variant="secondary"
                className="cursor-pointer hover:bg-muted text-[11px]"
                onClick={() => setDepartmentFilter("ALL")}
              >
                Clear Filter ✕
              </Badge>
            )}
          </div>
          {isAdmin && (
            <span className="text-[11px] text-primary/80 font-medium hidden sm:inline">
              Admin Mode: You can promote any faculty member to Admin or change role.
            </span>
          )}
        </div>
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
          <p className="text-xs text-muted-foreground mt-1">Try adjusting your department or search query.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-soft">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Faculty Member</th>
                <th className="px-4 py-3">Role</th>
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
                    <div className="font-medium text-foreground">{item.user?.name || "Unnamed"}</div>
                    <div className="text-xs text-muted-foreground">{item.user?.email}</div>
                  </td>
                  <td className="px-4 py-3.5">
                    {item.user?.role === "ADMIN" ? (
                      <Badge className="bg-purple-600/15 text-purple-700 hover:bg-purple-600/25 border-purple-300 dark:border-purple-800 dark:text-purple-300 gap-1 text-[11px] font-semibold py-0.5">
                        <ShieldCheck className="h-3 w-3" /> Admin
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-slate-600 dark:text-slate-400 text-[11px] font-normal py-0.5">
                        Faculty
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs text-foreground/80">{item.employeeId}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-col">
                      <Badge variant="outline" className="font-semibold w-fit">
                        {item.department?.code}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground mt-0.5 max-w-[140px] truncate" title={item.department?.name}>
                        {item.department?.name}
                      </span>
                    </div>
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
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {(item.researchInterests || []).map((interest: string, i: number) => (
                        <span key={i} className="inline-flex rounded bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                          {interest}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                      {/* Admin Role Toggle */}
                      {isAdmin && (
                        <Button
                          variant="outline"
                          size="sm"
                          className={`h-7 px-2 text-xs gap-1 ${
                            item.user?.role === "ADMIN"
                              ? "text-amber-700 border-amber-300 hover:bg-amber-50 dark:border-amber-700 dark:hover:bg-amber-950/30"
                              : "text-purple-700 border-purple-300 hover:bg-purple-50 dark:border-purple-700 dark:hover:bg-purple-950/30"
                          }`}
                          title={item.user?.role === "ADMIN" ? "Change role to Faculty" : "Promote to Admin"}
                          disabled={updateRoleMutation.isPending}
                          onClick={() => handleRoleToggle(item)}
                        >
                          {item.user?.role === "ADMIN" ? (
                            <>
                              <ShieldAlert className="h-3 w-3" />
                              <span className="hidden lg:inline">Demote</span>
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="h-3 w-3" />
                              <span>Make Admin</span>
                            </>
                          )}
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10 gap-1"
                        title="View Public Academic Profile"
                        onClick={() => {
                          setSelectedPublicFaculty(item);
                          setIsPublicModalOpen(true);
                        }}
                      >
                        <Eye className="h-3 w-3" />
                        <span className="hidden xl:inline">Profile</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs text-primary gap-1"
                        title="Sync Google Scholar Profile"
                        disabled={syncScholarMutation.isPending}
                        onClick={() => handleSyncScholar(item)}
                      >
                        <RefreshCw className={`h-3 w-3 ${syncScholarMutation.isPending ? "animate-spin" : ""}`} />
                        <span className="hidden xl:inline">Sync</span>
                      </Button>
                      {isAdmin && (
                        <>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(item)}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(item.id)}>
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
