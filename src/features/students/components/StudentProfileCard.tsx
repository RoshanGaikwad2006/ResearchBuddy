import { GraduationCap, Building2, Mail, User, BookOpen, RefreshCw } from "lucide-react";
import { useMyStudentProfile } from "../hooks/useStudents";

export function StudentProfileCard() {
  const { data: studentRes, isLoading } = useMyStudentProfile();
  const student = studentRes?.student;

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-border bg-card">
        <RefreshCw className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-6 text-center">
        <GraduationCap className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-2 text-sm font-medium text-foreground">No Student Profile Found</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Your account is not linked to an active Student record. Please contact your administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-primary text-xl font-bold text-primary-foreground shadow-soft">
            {student.user.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">{student.user.name}</h2>
            <p className="text-sm font-medium text-primary">Student • Roll No: {student.rollNumber}</p>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" />
                {student.department?.name || "General Department"}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" />
                {student.user.email}
              </span>
              <span>•</span>
              <span>Academic Batch: {student.academicYear}</span>
            </div>
          </div>
        </div>

        {/* Assigned Guide Faculty Info */}
        <div className="mt-6 border-t border-border pt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <User className="h-4 w-4 text-primary" />
            Assigned Research Guide Faculty
          </h3>
          {student.guideFaculty ? (
            <div className="mt-2 rounded-xl border border-border bg-background p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{student.guideFaculty.user.name}</p>
                <p className="text-xs text-muted-foreground">{student.guideFaculty.user.email}</p>
              </div>
              <span className="text-xs font-semibold text-primary">Guide Faculty</span>
            </div>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">No Guide Faculty assigned yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
