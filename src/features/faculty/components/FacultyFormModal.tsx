import { useState, useEffect } from "react";
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
import { useCreateFaculty, useUpdateFaculty } from "../hooks/useFaculty";
import { useDepartmentList } from "@/features/departments/hooks/useDepartments";
import type { FacultyItem } from "@/services/faculty.service";

interface FacultyFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facultyToEdit?: FacultyItem | null;
}

export function FacultyFormModal({ open, onOpenChange, facultyToEdit }: FacultyFormModalProps) {
  const { data: deptData } = useDepartmentList();
  const createMutation = useCreateFaculty();
  const updateMutation = useUpdateFaculty();

  const [interestsText, setInterestsText] = useState("");

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
      employeeId: "",
      designation: "Assistant Professor",
      departmentId: "",
      orcid: "",
      scholarUrl: "",
    },
  });

  const selectedDepartmentId = watch("departmentId");
  const selectedDesignation = watch("designation");

  useEffect(() => {
    if (facultyToEdit) {
      setValue("userId", facultyToEdit.userId);
      setValue("employeeId", facultyToEdit.employeeId);
      setValue("designation", facultyToEdit.designation);
      setValue("departmentId", facultyToEdit.departmentId);
      setValue("orcid", facultyToEdit.orcid || "");
      setValue("scholarUrl", facultyToEdit.scholarUrl || "");
      setInterestsText((facultyToEdit.researchInterests || []).join(", "));
    } else {
      reset();
      setInterestsText("");
    }
  }, [facultyToEdit, setValue, reset]);

  const onSubmit = async (values: any) => {
    const researchInterests = interestsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (facultyToEdit) {
      await updateMutation.mutateAsync({
        id: facultyToEdit.id,
        data: {
          employeeId: values.employeeId,
          designation: values.designation,
          departmentId: values.departmentId,
          orcid: values.orcid || undefined,
          scholarUrl: values.scholarUrl || undefined,
          researchInterests,
        },
      });
    } else {
      await createMutation.mutateAsync({
        userId: values.userId,
        employeeId: values.employeeId,
        designation: values.designation,
        departmentId: values.departmentId,
        orcid: values.orcid || undefined,
        scholarUrl: values.scholarUrl || undefined,
        researchInterests,
      });
    }
    onOpenChange(false);
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{facultyToEdit ? "Edit Faculty Profile" : "Add Faculty Profile"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {!facultyToEdit && (
            <div className="space-y-1.5">
              <Label htmlFor="userId">User Account / Email</Label>
              <Input
                id="userId"
                placeholder="faculty.email@university.edu or User UUID"
                disabled={isLoading}
                {...register("userId", { required: "User Email or User ID is required" })}
              />
              {errors.userId && <p className="text-xs text-destructive">{errors.userId.message}</p>}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="employeeId">Employee ID</Label>
              <Input
                id="employeeId"
                placeholder="EMP-2026-01"
                disabled={isLoading}
                {...register("employeeId", { required: "Employee ID is required" })}
              />
              {errors.employeeId && <p className="text-xs text-destructive">{errors.employeeId.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="designation">Designation</Label>
              <Select
                value={selectedDesignation}
                onValueChange={(val) => setValue("designation", val)}
                disabled={isLoading}
              >
                <SelectTrigger id="designation">
                  <SelectValue placeholder="Select designation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Professor">Professor</SelectItem>
                  <SelectItem value="Associate Professor">Associate Professor</SelectItem>
                  <SelectItem value="Assistant Professor">Assistant Professor</SelectItem>
                  <SelectItem value="Research Fellow">Research Fellow</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="departmentId">Department</Label>
            <Select
              value={selectedDepartmentId}
              onValueChange={(val) => setValue("departmentId", val)}
              disabled={isLoading}
            >
              <SelectTrigger id="departmentId">
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
            <Label htmlFor="scholarUrl">Google Scholar Profile URL / Author ID</Label>
            <Input
              id="scholarUrl"
              placeholder="https://scholar.google.com/citations?user=LS01_s8AAAAJ"
              disabled={isLoading}
              {...register("scholarUrl")}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="orcid">ORCID ID (Optional)</Label>
            <Input
              id="orcid"
              placeholder="0000-0002-1825-0097"
              disabled={isLoading}
              {...register("orcid")}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="interests">Research Interests (Comma separated)</Label>
            <Input
              id="interests"
              placeholder="Machine Learning, Computer Vision, Bioinformatics"
              value={interestsText}
              onChange={(e) => setInterestsText(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {facultyToEdit ? "Save Changes" : "Create Profile"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
