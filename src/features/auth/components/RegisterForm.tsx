import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

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
import { registerSchema, type RegisterSchemaType } from "../validation/auth.schemas";
import { useAuth } from "../hooks/useAuth";
import type { UserRole } from "../types/auth.types";

interface RegisterFormProps {
  onSuccess?: () => void;
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register: registerAccount, isLoading } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterSchemaType>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "FACULTY",
    },
  });

  const selectedRole = watch("role");

  const onSubmit = async (data: RegisterSchemaType) => {
    try {
      await registerAccount({
        name: data.name,
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
        role: data.role as UserRole,
      });
      if (onSuccess) {
        onSuccess();
      } else {
        navigate({ to: "/dashboard" });
      }
    } catch {
      // Handled in store with toasts
    }
  };

  return (
    <form className="mt-4 space-y-3.5" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-1.5">
        <Label htmlFor="reg-name">Full Name</Label>
        <Input
          id="reg-name"
          type="text"
          placeholder="Dr. Ananya Rao"
          className="h-11"
          disabled={isLoading}
          {...register("name")}
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="reg-email">Email</Label>
        <Input
          id="reg-email"
          type="email"
          autoComplete="email"
          placeholder="name@university.edu"
          className="h-11"
          disabled={isLoading}
          {...register("email")}
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="reg-role">Role</Label>
        <Select
          value={selectedRole}
          onValueChange={(val) => setValue("role", val as UserRole)}
          disabled={isLoading}
        >
          <SelectTrigger id="reg-role" className="h-11 w-full">
            <SelectValue placeholder="Select your role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="FACULTY">Faculty</SelectItem>
            <SelectItem value="STUDENT">Student</SelectItem>
            <SelectItem value="RESEARCH_CELL">Research Cell</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
          </SelectContent>
        </Select>
        {errors.role && (
          <p className="text-xs text-destructive">{errors.role.message}</p>
        )}
      </div>

      {/* Canonical Department Selection for Faculty */}
      {selectedRole === "FACULTY" && (
        <div className="p-3 rounded-xl bg-muted/40 border border-border/60 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="reg-dept">Department</Label>
            <Select defaultItem="ce" disabled={isLoading}>
              <SelectTrigger id="reg-dept" className="h-10 w-full bg-card">
                <SelectValue placeholder="Select Canonical Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ce">Computer Engineering (CE)</SelectItem>
                <SelectItem value="it">Information Technology (IT)</SelectItem>
                <SelectItem value="aids">Artificial Intelligence and Data Science (AI&DS)</SelectItem>
                <SelectItem value="etc">Electronics and Telecommunication Engineering (E&TC)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reg-scholar" className="text-xs">Google Scholar Profile URL (Optional)</Label>
            <Input id="reg-scholar" placeholder="https://scholar.google.com/citations?user=Y8O6WQcAAAAJ" className="h-9 text-xs" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="reg-orcid" className="text-xs">ORCID iD (Optional)</Label>
              <Input id="reg-orcid" placeholder="0000-0002-1825-0097" className="h-9 text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reg-researcherid" className="text-xs">ResearcherID (Optional)</Label>
              <Input id="reg-researcherid" placeholder="A-1234-2025" className="h-9 text-xs" />
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="reg-password">Password</Label>
          <div className="relative">
            <Input
              id="reg-password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="h-11 pr-10"
              disabled={isLoading}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 grid w-10 place-items-center rounded-r-md text-muted-foreground transition-colors hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="reg-confirm-password">Confirm Password</Label>
          <div className="relative">
            <Input
              id="reg-confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
              className="h-11 pr-10"
              disabled={isLoading}
              {...register("confirmPassword")}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((v) => !v)}
              className="absolute inset-y-0 right-0 grid w-10 place-items-center rounded-r-md text-muted-foreground transition-colors hover:text-foreground"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
          )}
        </div>
      </div>

      <Button type="submit" disabled={isLoading} className="h-11 w-full text-base mt-3">
        {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        Create Account
      </Button>
    </form>
  );
}
