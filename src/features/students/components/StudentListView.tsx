import { useState } from "react";
import { Loader2, Plus, Search, GraduationCap, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useStudentList, useDeleteStudent } from "../hooks/useStudents";
import { StudentFormModal } from "./StudentFormModal";
import { useAuth } from "@/features/auth/hooks/useAuth";
import type { StudentItem } from "@/services/student.service";

export function StudentListView() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentItem | null>(null);

  const { role } = useAuth();
  const isAdmin = role === "ADMIN";

  const { data, isLoading, isError } = useStudentList({
    search: search || undefined,
    page,
    limit: 10,
  });

  const deleteMutation = useDeleteStudent();

  const handleEdit = (item: StudentItem) => {
    setEditingStudent(item);
    setIsModalOpen(true);
  };

  const handleCreateNew = () => {
    setEditingStudent(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this student record?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search student by name, roll number, or academic year..."
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
            Add Student Record
          </Button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-border bg-card">
          <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
          <span className="text-sm font-medium text-muted-foreground">Loading student directory...</span>
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center text-sm text-destructive">
          Failed to load student directory. Please try again.
        </div>
      ) : !data?.items || data.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-12 text-center">
          <GraduationCap className="h-10 w-10 text-muted-foreground/50 mb-2" />
          <p className="text-base font-semibold text-foreground">No student records found</p>
          <p className="text-xs text-muted-foreground mt-1">Try adjusting your search query.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-soft">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Roll Number</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Guide Faculty</th>
                <th className="px-4 py-3">Academic Year</th>
                {isAdmin && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.items.map((item) => (
                <tr key={item.id} className="transition-colors hover:bg-muted/30">
                  <td className="px-4 py-3.5">
                    <div className="font-medium text-foreground">{item.user.name}</div>
                    <div className="text-xs text-muted-foreground">{item.user.email}</div>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs text-foreground/80">{item.rollNumber}</td>
                  <td className="px-4 py-3.5">
                    <Badge variant="outline" className="font-semibold">
                      {item.department.code}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-foreground/90">
                    {item.guideFaculty?.user?.name ? (
                      <span className="font-medium text-primary">{item.guideFaculty.user.name}</span>
                    ) : (
                      <span className="italic text-muted-foreground">Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-muted-foreground">{item.academicYear}</td>
                  {isAdmin && (
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(item)}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  )}
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

      <StudentFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        studentToEdit={editingStudent}
      />
    </div>
  );
}
