import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

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
    <form className="mt-5 space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-1.5">
        <label htmlFor="reg-name" className="block text-sm font-medium text-[#222222]">Full Name</label>
        <input
          id="reg-name"
          type="text"
          placeholder="Dr. Ananya Rao"
          disabled={isLoading}
          className="w-full h-[50px] px-4 bg-white border border-[#D8D8D8] rounded-md text-sm text-[#111111] placeholder:text-gray-400 focus:outline-none focus:border-[#111111] focus:ring-0 transition-colors disabled:opacity-60"
          {...register("name")}
        />
        {errors.name && (
          <p className="text-xs text-destructive mt-1">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="reg-email" className="block text-sm font-medium text-[#222222]">Email Address</label>
        <input
          id="reg-email"
          type="email"
          autoComplete="email"
          placeholder="your.email@institution.edu"
          disabled={isLoading}
          className="w-full h-[50px] px-4 bg-white border border-[#D8D8D8] rounded-md text-sm text-[#111111] placeholder:text-gray-400 focus:outline-none focus:border-[#111111] focus:ring-0 transition-colors disabled:opacity-60"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-xs text-destructive mt-1">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="reg-role" className="block text-sm font-medium text-[#222222]">Role</label>
        <Select
          value={selectedRole}
          onValueChange={(val) => setValue("role", val as UserRole)}
          disabled={isLoading}
        >
          <SelectTrigger id="reg-role" className="h-[50px] w-full border-[#D8D8D8] rounded-md text-sm text-[#111111]">
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
          <p className="text-xs text-destructive mt-1">{errors.role.message}</p>
        )}
      </div>

      {/* Canonical Department Selection for Faculty */}
      {selectedRole === "FACULTY" && (
        <div className="p-3.5 rounded-md bg-[#F8F8F8] border border-[#E0E0E0] space-y-3">
          <div className="space-y-1.5">
            <label htmlFor="reg-dept" className="block text-xs font-semibold text-[#333333]">Department</label>
            <Select defaultValue="ce" disabled={isLoading}>
              <SelectTrigger id="reg-dept" className="h-9 w-full bg-white border-[#D8D8D8]">
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

          <div className="space-y-1">
            <label htmlFor="reg-scholar" className="block text-xs font-medium text-[#555555]">Google Scholar Profile URL (Optional)</label>
            <input id="reg-scholar" placeholder="https://scholar.google.com/citations?user=..." className="w-full h-9 px-3 bg-white border border-[#D8D8D8] rounded text-xs text-[#111111]" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label htmlFor="reg-orcid" className="block text-xs font-medium text-[#555555]">ORCID iD (Optional)</label>
              <input id="reg-orcid" placeholder="0000-0002-1825-0097" className="w-full h-9 px-3 bg-white border border-[#D8D8D8] rounded text-xs text-[#111111]" />
            </div>
            <div className="space-y-1">
              <label htmlFor="reg-researcherid" className="block text-xs font-medium text-[#555555]">ResearcherID (Optional)</label>
              <input id="reg-researcherid" placeholder="A-1234-2025" className="w-full h-9 px-3 bg-white border border-[#D8D8D8] rounded text-xs text-[#111111]" />
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="reg-password" className="block text-sm font-medium text-[#222222]">Password</label>
          <div className="relative flex items-center">
            <input
              id="reg-password"
              type={showPassword ? "text" : "password"}
              placeholder="•••••••••••••"
              disabled={isLoading}
              className="w-full h-[50px] px-4 pr-10 bg-white border border-[#D8D8D8] rounded-md text-sm text-[#111111] placeholder:text-gray-400 focus:outline-none focus:border-[#111111] focus:ring-0 transition-colors disabled:opacity-60"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 text-gray-400 hover:text-[#111111]"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-destructive mt-1">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="reg-confirm-password" className="block text-sm font-medium text-[#222222]">Confirm Password</label>
          <div className="relative flex items-center">
            <input
              id="reg-confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="•••••••••••••"
              disabled={isLoading}
              className="w-full h-[50px] px-4 pr-10 bg-white border border-[#D8D8D8] rounded-md text-sm text-[#111111] placeholder:text-gray-400 focus:outline-none focus:border-[#111111] focus:ring-0 transition-colors disabled:opacity-60"
              {...register("confirmPassword")}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((v) => !v)}
              className="absolute right-3 text-gray-400 hover:text-[#111111]"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-destructive mt-1">{errors.confirmPassword.message}</p>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full h-[52px] bg-[#111111] hover:bg-[#2A2A2A] text-white font-semibold text-[15px] rounded-md transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-none disabled:opacity-70 mt-6"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Registering...</span>
          </>
        ) : (
          "Create Account"
        )}
      </button>
    </form>
  );
}

