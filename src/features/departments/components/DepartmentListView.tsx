import { useState } from "react";
import { Loader2, Plus, Building2, Users, GraduationCap, FileText, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDepartmentList, useDeleteDepartment } from "../hooks/useDepartments";
import { DepartmentFormModal } from "./DepartmentFormModal";
import { useAuth } from "@/features/auth/hooks/useAuth";
import type { DepartmentItem } from "@/services/department.service";

export function DepartmentListView() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<DepartmentItem | null>(null);

  const { role } = useAuth();
  const isAdmin = role === "ADMIN";

  const { data, isLoading, isError } = useDepartmentList();
  const deleteMutation = useDeleteDepartment();

  const handleEdit = (item: DepartmentItem) => {
    setEditingDept(item);
    setIsModalOpen(true);
  };

  const handleCreateNew = () => {
    setEditingDept(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this department?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Academic Departments</h2>
          <p className="text-xs text-muted-foreground">Manage college departments, heads, faculty and student metrics.</p>
        </div>

        {isAdmin && (
          <Button onClick={handleCreateNew} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Department
          </Button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-border bg-card">
          <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
          <span className="text-sm font-medium text-muted-foreground">Loading departments...</span>
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center text-sm text-destructive">
          Failed to load department directory. Please try again.
        </div>
      ) : !data?.departments || data.departments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-12 text-center">
          <Building2 className="h-10 w-10 text-muted-foreground/50 mb-2" />
          <p className="text-base font-semibold text-foreground">No departments registered</p>
          <p className="text-xs text-muted-foreground mt-1">Create your first department to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.departments.map((dept) => (
            <div key={dept.id} className="rounded-xl border border-border bg-card p-5 shadow-soft transition-all hover:shadow-card">
              <div className="flex items-start justify-between">
                <div>
                  <Badge variant="outline" className="font-bold text-primary">
                    {dept.code}
                  </Badge>
                  <h3 className="mt-2 text-base font-semibold text-foreground">{dept.name}</h3>
                </div>
                {isAdmin && (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(dept)}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(dept.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="mt-4 border-t border-border pt-3">
                <p className="text-xs text-muted-foreground">
                  Head of Department:{" "}
                  <strong className="text-foreground font-medium">
                    {dept.head?.user?.name || "Unassigned"}
                  </strong>
                </p>

                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-lg bg-muted p-2">
                    <Users className="mx-auto h-4 w-4 text-primary mb-1" />
                    <span className="block font-semibold text-foreground">{dept._count?.faculties || 0}</span>
                    <span className="text-[10px] text-muted-foreground">Faculty</span>
                  </div>
                  <div className="rounded-lg bg-muted p-2">
                    <GraduationCap className="mx-auto h-4 w-4 text-primary mb-1" />
                    <span className="block font-semibold text-foreground">{dept._count?.students || 0}</span>
                    <span className="text-[10px] text-muted-foreground">Students</span>
                  </div>
                  <div className="rounded-lg bg-muted p-2">
                    <FileText className="mx-auto h-4 w-4 text-primary mb-1" />
                    <span className="block font-semibold text-foreground">{dept._count?.researches || 0}</span>
                    <span className="text-[10px] text-muted-foreground">Papers</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <DepartmentFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        departmentToEdit={editingDept}
      />
    </div>
  );
}
