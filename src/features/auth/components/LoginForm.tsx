import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, Mail, Lock } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

import { Checkbox } from "@/components/ui/checkbox";
import { loginSchema, type LoginSchemaType } from "../validation/auth.schemas";
import { useAuth } from "../hooks/useAuth";

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LoginSchemaType>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      remember: false,
    },
  });

  const remember = watch("remember");

  const onSubmit = async (data: LoginSchemaType) => {
    try {
      await login({
        email: data.email,
        password: data.password,
      });
      navigate({ to: "/dashboard" });
    } catch {
      // Error handling is handled in authStore with toasts
    }
  };

  return (
    <form className="mt-5 space-y-4" onSubmit={handleSubmit(onSubmit)}>
      {/* Email Field */}
      <div className="space-y-1.5">
        <label htmlFor="email" className="block text-xs lg:text-[13.5px] font-medium text-[#222222]">
          Email Address
        </label>
        <div className="relative flex items-center">
          <Mail className="absolute left-4 h-[18px] w-[18px] text-gray-400 pointer-events-none" />
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="your.email@institution.edu"
            disabled={isLoading}
            className="w-full h-[52px] pl-11 pr-4 bg-white border border-[#D8D8D8] rounded-md text-xs lg:text-sm text-[#111111] placeholder:text-gray-400 focus:outline-none focus:border-[#111111] focus:ring-0 transition-colors disabled:opacity-60"
            {...register("email")}
          />
        </div>
        {errors.email && (
          <p className="text-[11px] text-destructive mt-0.5">{errors.email.message}</p>
        )}
      </div>

      {/* Password Field */}
      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-xs lg:text-[13.5px] font-medium text-[#222222]">
          Password
        </label>
        <div className="relative flex items-center">
          <Lock className="absolute left-4 h-[18px] w-[18px] text-gray-400 pointer-events-none" />
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="•••••••••••••"
            disabled={isLoading}
            className="w-full h-[52px] pl-11 pr-11 bg-white border border-[#D8D8D8] rounded-md text-xs lg:text-sm text-[#111111] placeholder:text-gray-400 focus:outline-none focus:border-[#111111] focus:ring-0 transition-colors disabled:opacity-60"
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            disabled={isLoading}
            className="absolute right-4 text-gray-400 hover:text-[#111111] transition-colors focus:outline-none"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-[11px] text-destructive mt-0.5">{errors.password.message}</p>
        )}
      </div>

      {/* Remember Me & Forgot Password (22-24px gap after password) */}
      <div className="flex items-center justify-between pt-1 mt-5 mb-6">
        <div className="flex items-center gap-2">
          <Checkbox
            id="remember"
            checked={remember ?? false}
            onCheckedChange={(checked) => setValue("remember", !!checked)}
            disabled={isLoading}
            className="h-4 w-4 rounded border-[#D8D8D8] data-[state=checked]:bg-[#111111] data-[state=checked]:border-[#111111]"
          />
          <label htmlFor="remember" className="text-xs lg:text-[13.5px] font-normal text-[#444444] cursor-pointer select-none">
            Remember me
          </label>
        </div>
        <a
          href="#"
          onClick={(e) => e.preventDefault()}
          className="text-xs lg:text-[13.5px] font-medium text-[#222222] hover:underline underline-offset-2 transition-colors"
        >
          Forgot password?
        </a>
      </div>

      {/* Sign In Submit Button (24-28px gap after checkbox row) */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full h-[52px] bg-[#111111] hover:bg-[#2A2A2A] text-white font-semibold text-[15px] rounded-md transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-none disabled:opacity-70 mt-6"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Signing in...</span>
          </>
        ) : (
          "Sign In"
        )}
      </button>
    </form>
  );


}

