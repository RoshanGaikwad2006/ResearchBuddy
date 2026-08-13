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
import { useCreateDepartment, useUpdateDepartment } from "../hooks/useDepartments";
import { useFacultyList } from "@/features/faculty/hooks/useFaculty";
import type { DepartmentItem } from "@/services/department.service";

interface DepartmentFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  departmentToEdit?: DepartmentItem | null;
}

export function DepartmentFormModal({ open, onOpenChange, departmentToEdit }: DepartmentFormModalProps) {
  const { data: facultyData } = useFacultyList({ limit: 100 });

  const createMutation = useCreateDepartment();
  const updateMutation = useUpdateDepartment();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      code: "",
      name: "",
      headId: "",
    },
  });

  const selectedHeadId = watch("headId");

  useEffect(() => {
    if (departmentToEdit) {
      setValue("code", departmentToEdit.code);
      setValue("name", departmentToEdit.name);
      setValue("headId", departmentToEdit.headId || "");
    } else {
      reset();
    }
  }, [departmentToEdit, setValue, reset]);

  const onSubmit = async (values: any) => {
    if (departmentToEdit) {
      await updateMutation.mutateAsync({
        id: departmentToEdit.id,
        data: {
          code: values.code,
          name: values.name,
          headId: values.headId || null,
        },
      });
    } else {
      await createMutation.mutateAsync({
        code: values.code,
        name: values.name,
        headId: values.headId || null,
      });
    }
    onOpenChange(false);
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{departmentToEdit ? "Edit Department" : "Add Department"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="dept-code">Department Code</Label>
              <Input
                id="dept-code"
                placeholder="CSE"
                disabled={isLoading}
                {...register("code", { required: "Department code is required" })}
              />
              {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dept-name">Department Name</Label>
              <Input
                id="dept-name"
                placeholder="Computer Science"
                disabled={isLoading}
                {...register("name", { required: "Department name is required" })}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="headId">Department Head (Faculty)</Label>
            <Select
              value={selectedHeadId}
              onValueChange={(val) => setValue("headId", val)}
              disabled={isLoading}
            >
              <SelectTrigger id="headId">
                <SelectValue placeholder="Select Department Head" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">-- No Head Assigned --</SelectItem>
                {(facultyData?.items || []).map((fac) => (
                  <SelectItem key={fac.id} value={fac.id}>
                    {fac.user.name} ({fac.designation})
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
              {departmentToEdit ? "Save Changes" : "Create Department"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
