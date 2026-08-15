import { useState } from "react";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";

export function AuthCard() {
  const [mode, setMode] = useState<"login" | "register">("login");

  return (
    <div className="w-full">
      {/* Login Tabs */}
      <div className="grid grid-cols-2 border-b border-gray-200 mb-7">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`py-2.5 text-center text-xs lg:text-sm font-semibold transition-colors relative cursor-pointer ${
            mode === "login"
              ? "text-[#111111] border-b-[1.5px] border-[#111111] -mb-[1.5px]"
              : "text-gray-400 font-medium hover:text-gray-600"
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => setMode("register")}
          className={`py-2.5 text-center text-xs lg:text-sm font-semibold transition-colors relative cursor-pointer ${
            mode === "register"
              ? "text-[#111111] border-b-[1.5px] border-[#111111] -mb-[1.5px]"
              : "text-gray-400 font-medium hover:text-gray-600"
          }`}
        >
          Create Account
        </button>
      </div>

      {mode === "login" ? (
        <>
          <h1 className="font-editorial text-[30px] lg:text-[32px] font-normal text-[#111111] tracking-tight leading-tight">
            Welcome Back
          </h1>
          <p className="mt-1.5 text-xs lg:text-[14px] text-[#666666]">
            Sign in to access your research workspace.
          </p>
          <LoginForm />
          <div className="relative flex items-center justify-center my-6">
            <div className="w-full border-t border-gray-200" />
            <span className="absolute bg-white px-3 text-xs lg:text-sm text-gray-500 font-normal">
              New to KRIYA?{" "}
              <button
                type="button"
                onClick={() => setMode("register")}
                className="text-[#111111] font-semibold underline underline-offset-2 hover:text-black ml-1 cursor-pointer"
              >
                Create an account
              </button>
            </span>
          </div>
        </>
      ) : (
        <>
          <h1 className="font-editorial text-[30px] lg:text-[32px] font-normal text-[#111111] tracking-tight leading-tight">
            Register Account
          </h1>
          <p className="mt-1.5 text-xs lg:text-[14px] text-[#666666]">
            Join the KRIYA research platform today.
          </p>
          <RegisterForm onSuccess={() => setMode("login")} />
          <div className="relative flex items-center justify-center my-6">
            <div className="w-full border-t border-gray-200" />
            <span className="absolute bg-white px-3 text-xs lg:text-sm text-gray-500 font-normal">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setMode("login")}
                className="text-[#111111] font-semibold underline underline-offset-2 hover:text-black ml-1 cursor-pointer"
              >
                Sign in
              </button>
            </span>
          </div>
        </>
      )}

    </div>
  );
}


