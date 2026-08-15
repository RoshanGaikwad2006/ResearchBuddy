import { BookOpen, FileText, BarChart3 } from "lucide-react";
import kkwaghLogo from "@/assets/kk-wagh-logo.png";
import kkwaghCampus from "@/assets/kkwagh-campus.jpg";
import { Toaster } from "@/components/ui/sonner";
import { AuthCard } from "../components/AuthCard";

export function AuthPage() {
  return (
    <>
      <Toaster />
      <div className="h-screen max-h-screen w-full flex flex-col lg:flex-row bg-white overflow-hidden font-sans text-[#111111] antialiased">
        {/* Left Panel: Institutional / Brand Section */}
        <section className="hidden lg:flex lg:w-1/2 bg-[#EFEFEF] flex-col justify-between relative overflow-hidden h-full border-r border-gray-200/60">
          {/* Full-panel Background Campus Photograph with 30-35% Visibility */}
          <div className="absolute inset-0 w-full h-full z-0 pointer-events-none overflow-hidden">
            <img
              src={kkwaghCampus}
              alt="K. K. Wagh Education Society Campus"
              className="w-full h-full object-cover object-center filter grayscale contrast-[1.06] opacity-[0.80]"
            />
            {/* Subtle light wash overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#EFEFEF]/75 via-[#EFEFEF]/55 to-[#EFEFEF]/80 mix-blend-normal" />
          </div>

          {/* Foreground Content with Intentional Vertical Rhythm */}
          <div className="relative z-10 px-8 py-10 lg:px-14 lg:py-12 flex flex-col justify-between max-w-[580px] h-full overflow-hidden">
            {/* Top Section: Top-Left Institutional Branding */}
            <div className="flex items-center gap-3.5">
              <img
                src={kkwaghLogo}
                alt="K K Wagh Education Society Seal"
                className="h-14 lg:h-16 w-auto object-contain filter grayscale contrast-[1.1]"
              />
              <div className="flex flex-col">
                <span className="font-sans font-bold text-xs lg:text-sm text-[#111111] leading-tight tracking-tight">
                  K K Wagh Education Society
                </span>
                <span className="font-sans text-[11px] lg:text-xs text-[#444444] font-medium tracking-wide mt-0.5">
                  Education. Research. Excellence.
                </span>
              </div>
            </div>

            {/* Middle Section: KRIYA Branding, Title, and Description */}
            <div className="flex flex-col items-start my-auto py-6">
              {/* KRIYA Identity Header */}
              <div className="flex items-center gap-4 my-1">
                <span className="font-editorial text-[64px] lg:text-[70px] font-normal text-[#111111] leading-none tracking-tighter select-none">
                  KRIYA
                </span>
                <div className="h-10 lg:h-12 w-[1px] bg-gray-400/50 self-center" />
                <div className="flex flex-col text-[10px] lg:text-[11px] font-semibold tracking-[0.22em] text-[#222222] uppercase leading-tight">
                  <span>INSTITUTIONAL</span>
                  <span className="mt-0.5">RESEARCH PLATFORM</span>
                </div>
              </div>

              {/* Divider Line */}
              <hr className="w-full max-w-[420px] mt-6 mb-5 border-t border-gray-300/80" />

              {/* Editorial Headline */}
              <h2 className="font-editorial text-[24px] lg:text-[28px] font-normal text-[#111111] leading-[1.22] tracking-tight">
                Research, organized.
                <br />
                Knowledge, connected.
              </h2>

              {/* Description */}
              <p className="mt-3.5 text-xs lg:text-[13px] text-[#444444] leading-relaxed max-w-[430px] font-medium">
                KRIYA brings publications, researchers, DOI metadata, research activities, and institutional insights together in one platform.
              </p>
            </div>

            {/* Bottom Section: Feature List */}
            <div className="relative max-w-[430px] pl-1">
              {/* Vertical line beside features */}
              <div className="absolute left-[15px] top-3 bottom-3 w-[1px] bg-gray-400/50 pointer-events-none" />

              <div className="space-y-4 lg:space-y-5">
                {/* Feature 1 */}
                <div className="relative flex items-start gap-4">
                  <div className="relative z-10 bg-[#EFEFEF]/95 p-0.5 text-[#111111] shrink-0 rounded-sm">
                    <BookOpen className="w-4 h-4 stroke-[1.6]" />
                  </div>
                  <div>
                    <h3 className="font-sans font-semibold text-xs lg:text-[13px] text-[#111111] leading-tight">
                      Research Repository
                    </h3>
                    <p className="text-[10.5px] lg:text-[11.5px] text-[#555555] mt-0.5 leading-normal font-medium">
                      Store, organize and manage all institutional research and publications.
                    </p>
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="relative flex items-start gap-4">
                  <div className="relative z-10 bg-[#EFEFEF]/95 p-0.5 text-[#111111] shrink-0 rounded-sm">
                    <FileText className="w-4 h-4 stroke-[1.6]" />
                  </div>
                  <div>
                    <h3 className="font-sans font-semibold text-xs lg:text-[13px] text-[#111111] leading-tight">
                      DOI &amp; Metadata
                    </h3>
                    <p className="text-[10.5px] lg:text-[11.5px] text-[#555555] mt-0.5 leading-normal font-medium">
                      Automate DOI integration and metadata retrieval for seamless management.
                    </p>
                  </div>
                </div>

                {/* Feature 3 */}
                <div className="relative flex items-start gap-4">
                  <div className="relative z-10 bg-[#EFEFEF]/95 p-0.5 text-[#111111] shrink-0 rounded-sm">
                    <BarChart3 className="w-4 h-4 stroke-[1.6]" />
                  </div>
                  <div>
                    <h3 className="font-sans font-semibold text-xs lg:text-[13px] text-[#111111] leading-tight">
                      Research Analytics
                    </h3>
                    <p className="text-[10.5px] lg:text-[11.5px] text-[#555555] mt-0.5 leading-normal font-medium">
                      Track research performance and discover insights with interactive analytics.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right Panel: Authentication Panel */}
        <section className="w-full lg:w-1/2 bg-white flex flex-col justify-between p-8 lg:p-12 h-full overflow-y-auto">
          {/* Centered Auth Card Container (Max-width 420px) */}
          <div className="my-auto w-full max-w-[420px] mx-auto py-4">
            <AuthCard />
          </div>

          {/* Institutional Footer (Separated nicely from form) */}
          <div className="pt-6 mt-8 lg:mt-10 border-t border-gray-100 flex items-center justify-center gap-3.5 text-xs text-gray-500 max-w-[420px] mx-auto w-full">
            <img
              src={kkwaghLogo}
              alt="K. K. W. Logo Emblem"
              className="h-12 w-auto object-contain filter grayscale opacity-90"
            />
            <div className="flex flex-col">
              <span className="font-semibold text-[#222222] text-xs">
                K. K. Wagh Education Society
              </span>
              <span className="text-gray-500 text-[11px] mt-0.5">
                KRIYA - Institutional Research Platform
              </span>
              <span className="text-gray-400 text-[10.5px] mt-0.5">
                Version 1.0 &nbsp;&bull;&nbsp; &copy; 2025 All rights reserved
              </span>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}




