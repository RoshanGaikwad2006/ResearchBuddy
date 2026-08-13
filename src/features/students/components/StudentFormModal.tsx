import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateStudent, useUpdateStudent } from "../hooks/useStudents";
import { useDepartmentList } from "@/features/departments/hooks/useDepartments";
import { useFacultyList } from "@/features/faculty/hooks/useFaculty";
import type { StudentItem } from "@/services/student.service";

interface StudentFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentToEdit?: StudentItem | null;
}

export function StudentFormModal({ open, onOpenChange, studentToEdit }: StudentFormModalProps) {
  const { data: deptData } = useDepartmentList();
  const { data: facultyData } = useFacultyList({ limit: 100 });

  const createMutation = useCreateStudent();
  const updateMutation = useUpdateStudent();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      userId: "",
      rollNumber: "",
      departmentId: "",
      guideFacultyId: "",
      academicYear: "2023-2027",
    },
  });

  const selectedDepartmentId = watch("departmentId");
  const selectedGuideFacultyId = watch("guideFacultyId");

  useEffect(() => {
    if (studentToEdit) {
      setValue("userId", studentToEdit.userId);
      setValue("rollNumber", studentToEdit.rollNumber);
      setValue("departmentId", studentToEdit.departmentId);
      setValue("guideFacultyId", studentToEdit.guideFacultyId || "");
      setValue("academicYear", studentToEdit.academicYear);
    } else {
      reset();
    }
  }, [studentToEdit, setValue, reset]);

  const onSubmit = async (values: any) => {
    if (studentToEdit) {
      await updateMutation.mutateAsync({
        id: studentToEdit.id,
        data: {
          rollNumber: values.rollNumber,
          departmentId: values.departmentId,
          guideFacultyId: values.guideFacultyId || null,
          academicYear: values.academicYear,
        },
      });
    } else {
      await createMutation.mutateAsync({
        userId: values.userId,
        rollNumber: values.rollNumber,
        departmentId: values.departmentId,
        guideFacultyId: values.guideFacultyId || null,
        academicYear: values.academicYear,
      });
    }
    onOpenChange(false);
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{studentToEdit ? "Edit Student Profile" : "Add Student Record"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {!studentToEdit && (
            <div className="space-y-1.5">
              <Label htmlFor="std-userId">User ID / Account ID</Label>
              <Input
                id="std-userId"
                placeholder="Enter User UUID"
                disabled={isLoading}
                {...register("userId", { required: "User ID is required" })}
              />
              {errors.userId && <p className="text-xs text-destructive">{errors.userId.message}</p>}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="rollNumber">Roll Number</Label>
              <Input
                id="rollNumber"
                placeholder="23CSE01"
                disabled={isLoading}
                {...register("rollNumber", { required: "Roll Number is required" })}
              />
              {errors.rollNumber && <p className="text-xs text-destructive">{errors.rollNumber.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="academicYear">Academic Year</Label>
              <Input
                id="academicYear"
                placeholder="2023-2027"
                disabled={isLoading}
                {...register("academicYear", { required: "Academic year is required" })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="std-departmentId">Department</Label>
            <Select
              value={selectedDepartmentId}
              onValueChange={(val) => setValue("departmentId", val)}
              disabled={isLoading}
            >
              <SelectTrigger id="std-departmentId">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {(deptData?.departments || []).map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.code} - {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="guideFacultyId">Guide Faculty (Optional)</Label>
            <Select
              value={selectedGuideFacultyId}
              onValueChange={(val) => setValue("guideFacultyId", val)}
              disabled={isLoading}
            >
              <SelectTrigger id="guideFacultyId">
                <SelectValue placeholder="Select guide faculty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">-- No Guide Assigned --</SelectItem>
                {(facultyData?.items || []).map((fac) => (
                  <SelectItem key={fac.id} value={fac.id}>
                    {fac.user.name} ({fac.department.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {studentToEdit ? "Save Changes" : "Create Student"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
