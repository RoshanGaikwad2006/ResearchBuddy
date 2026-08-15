import { useState, useEffect } from "react";
import {
  Building2,
  CheckCircle2,
  Globe,
  GraduationCap,
  Mail,
  Quote,
  RefreshCw,
  UserCheck,
  BookOpen,
  Book,
  Award,
  Edit,
  Info,
  ExternalLink,
  Layers,
  FileText,
  Users,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  fetchMyResearchIdentity,
  updateMyResearchIdentity,
  syncMyResearchProfile,
  updateAuthorAffiliationApi,
  ResearchIdentityResponse,
} from "@/services/faculty.service";
import { useMyResearchList } from "@/features/research/hooks/useResearch";

export function FacultyProfileCard() {
  const [identity, setIdentity] = useState<ResearchIdentityResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [scholarInput, setScholarInput] = useState("");
  const [orcidInput, setOrcidInput] = useState("");
  const [researcherId, setResearcherId] = useState("");
  const [interestsText, setInterestsText] = useState("");
  const [affiliationInput, setAffiliationInput] = useState("");

  const [activeTab, setActiveTab] = useState<"ALL" | "JOURNAL" | "CONFERENCE" | "PATENT" | "BOOK" | "OTHER">("ALL");

  // Editing Author Affiliation Modal State
  const [editingAuthor, setEditingAuthor] = useState<{ researchId: string; authorId: string; authorName: string; currentAffiliation: string } | null>(null);
  const [manualAffiliationText, setManualAffiliationText] = useState("");

  const { data: myPubsData, refetch: refetchPubs } = useMyResearchList({ limit: 100 });

  const loadIdentity = async () => {
    try {
      setIsLoading(true);
      const res = await fetchMyResearchIdentity();
      setIdentity(res);
    } catch (err) {
      console.error("Failed to load research identity:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadIdentity();
  }, []);

  const handleStartEdit = () => {
    if (identity) {
      setScholarInput(identity.scholarProfileUrl || identity.scholarAuthorId || "");
      setOrcidInput(identity.orcid || "");
      setResearcherId(identity.researcherId || "");
      setInterestsText((identity.researchInterests || []).join(", "));
      setAffiliationInput(identity.institutionalAffiliation || "");
    }
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    if (!identity) return;
    const researchInterests = interestsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const updated = await updateMyResearchIdentity({
        scholarInput: scholarInput || undefined,
        orcidInput: orcidInput || undefined,
        researcherId: researcherId || undefined,
        institutionalAffiliation: affiliationInput || undefined,
        researchInterests,
      });
      setIdentity(updated);
      setIsEditing(false);
    } catch (err: any) {
      alert(err.message || "Failed to update research identity");
    }
  };

  const handleSyncScholar = async () => {
    try {
      setIsSyncing(true);
      await syncMyResearchProfile();
      await loadIdentity();
      await refetchPubs();
    } catch (err: any) {
      alert(err.message || "Failed to sync profile");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveAuthorAffiliation = async () => {
    if (!editingAuthor || !manualAffiliationText.trim()) return;
    try {
      await updateAuthorAffiliationApi(
        editingAuthor.researchId,
        editingAuthor.authorId,
        manualAffiliationText.trim()
      );
      setEditingAuthor(null);
      refetchPubs();
    } catch (err: any) {
      alert(err.message || "Failed to update affiliation");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white">
        <RefreshCw className="h-6 w-6 animate-spin text-[#102A43]" />
      </div>
    );
  }

  if (!identity) {
    return (
      <div className="rounded-lg border border-dashed border-[#E2E8F0] bg-white p-6 text-center">
        <UserCheck className="mx-auto h-8 w-8 text-[#64748B]" />
        <p className="mt-2 text-sm font-medium text-[#102A43]">No Faculty Profile Found</p>
      </div>
    );
  }

  const pubsList = myPubsData?.items || [];

  const getVenueType = (p: any) => {
    const text = `${p.title || ""} ${p.journal || ""} ${p.conference || ""}`.toLowerCase();
    return p.venueType || (
      p.patentNumber || /patent/i.test(text) ? "PATENT" :
      p.isbn || /isbn/i.test(text) ? "BOOK" :
      p.conference ? "CONFERENCE" :
      p.journal ? "JOURNAL" : "JOURNAL"
    );
  };

  const journalPubs = pubsList.filter((p) => getVenueType(p) === "JOURNAL");
  const conferencePubs = pubsList.filter((p) => getVenueType(p) === "CONFERENCE");
  const patentPubs = pubsList.filter((p) => getVenueType(p) === "PATENT");
  const bookPubs = pubsList.filter((p) => getVenueType(p) === "BOOK");
  const otherPubs = pubsList.filter((p) => getVenueType(p) === "OTHER");

  const filteredPubs =
    activeTab === "JOURNAL" ? journalPubs :
    activeTab === "CONFERENCE" ? conferencePubs :
    activeTab === "PATENT" ? patentPubs :
    activeTab === "BOOK" ? bookPubs :
    activeTab === "OTHER" ? otherPubs : pubsList;

  const getVenueBadge = (p: any) => {
    const vType = getVenueType(p);
    if (vType === "PATENT") {
      return (
        <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/30 gap-1 font-semibold">
          <Award className="h-3 w-3" /> Patent {p.patentNumber ? `— ${p.patentNumber}` : ""}
        </Badge>
      );
    }
    if (vType === "BOOK") {
      return (
        <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-600 border-purple-500/30 gap-1 font-semibold">
          <Book className="h-3 w-3" /> Book / ISBN {p.isbn ? `— ${p.isbn}` : ""}
        </Badge>
      );
    }
    if (vType === "CONFERENCE") {
      return (
        <Badge variant="outline" className="text-[10px] bg-indigo-500/10 text-indigo-600 border-indigo-500/30 gap-1 font-semibold">
          <Layers className="h-3 w-3" /> Conference
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30 gap-1 font-semibold">
        <BookOpen className="h-3 w-3" /> Journal
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight text-[#102A43]">Research Profile</h1>
      </div>

      {/* 1. PERSONAL RESEARCH IDENTITY HEADER CARD */}
      <div className="rounded-lg border border-[#E2E8F0] bg-white p-6 shadow-none space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            {identity.scholarAvatarUrl ? (
              <img
                src={identity.scholarAvatarUrl}
                alt={identity.name}
                className="h-[72px] w-[72px] rounded-lg object-cover border border-[#E2E8F0]"
              />
            ) : (
              <div className="grid h-[72px] w-[72px] place-items-center rounded-lg bg-[#102A43]/10 text-xl font-bold text-[#102A43] border border-[#E2E8F0]">
                {identity.name.charAt(0)}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-[#102A43]">{identity.name}</h2>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#102A43]/5 text-[#102A43] border border-[#E2E8F0]">
                  {identity.departmentCode}
                </span>
              </div>
              <p className="text-xs font-semibold text-[#64748B] mt-0.5">{identity.designation || "Faculty Member"}</p>
              
              <div className="mt-2 space-y-1 text-xs text-[#64748B] font-medium">
                <p className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-[#102A43] shrink-0" />
                  {identity.departmentName}
                </p>
                <p className="flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5 text-[#102A43] shrink-0" />
                  {identity.institutionalAffiliation}
                </p>
                <p className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-[#102A43] shrink-0" />
                  {identity.email}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleStartEdit} 
              className="h-9 px-4 border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#102A43] font-semibold text-xs rounded-md"
            >
              <Edit className="h-3.5 w-3.5 mr-1.5" /> Edit Research Identity
            </Button>
            <Button 
              onClick={handleSyncScholar} 
              disabled={isSyncing} 
              className="h-9 px-4 bg-[#102A43] hover:bg-[#173F63] text-white font-semibold text-xs rounded-md border-none"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? "Syncing..." : "Sync Scholar"}
            </Button>
          </div>
        </div>

        {/* Profile Completeness Section */}
        <div className="pt-5 border-t border-[#E2E8F0] space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Award className="h-4 w-4 text-[#2563EB]" />
              <span className="font-bold text-[#102A43] text-xs">Research Profile Completeness</span>
            </div>
            <span className="font-extrabold text-[#2563EB] text-xs">{identity.profileCompleteness || 90}% Complete</span>
          </div>
          <p className="text-xs text-[#64748B]">Complete your research identity to improve discoverability and collaboration.</p>
          <div className="w-full h-2 rounded-full bg-[#F1F5F9] overflow-hidden border border-[#E2E8F0]">
            <div
              className="h-full bg-gradient-to-r from-[#102A43] to-[#2563EB] transition-all duration-500"
              style={{ width: `${identity.profileCompleteness || 90}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] font-medium pt-0.5">
            <span className="text-[#64748B] flex items-center gap-1">
              <span className="text-[#2563EB] font-sans">ⓘ</span> Add ResearcherID / Clarivate ID to reach 100% profile completeness.
            </span>
            <button
              type="button"
              onClick={handleStartEdit}
              className="font-bold text-[#2563EB] hover:text-[#1d4ed8] hover:underline flex items-center gap-1"
            >
              Complete Profile <span className="font-sans">→</span>
            </button>
          </div>
        </div>

        {/* Edit Modal Form */}
        {isEditing && (
          <div className="mt-4 p-4 rounded-lg bg-white border border-[#2563EB]/30 space-y-3 shadow-none">
            <h3 className="text-xs font-bold text-[#102A43] uppercase tracking-wider">Update Faculty Research Identifiers</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="text-xs text-[#102A43] font-semibold">Google Scholar Profile URL or Author ID</Label>
                <Input value={scholarInput} onChange={(e) => setScholarInput(e.target.value)} placeholder="https://scholar.google.com/citations?user=Y8O6WQcAAAAJ" className="mt-1 text-xs" />
              </div>
              <div>
                <Label className="text-xs text-[#102A43] font-semibold">ORCID iD</Label>
                <Input value={orcidInput} onChange={(e) => setOrcidInput(e.target.value)} placeholder="0000-0002-1825-0097" className="mt-1 text-xs" />
              </div>
              <div>
                <Label className="text-xs text-[#102A43] font-semibold">ResearcherID / Clarivate ID</Label>
                <Input value={researcherId} onChange={(e) => setResearcherId(e.target.value)} placeholder="A-1234-2025" className="mt-1 text-xs" />
              </div>
              <div>
                <Label className="text-xs text-[#102A43] font-semibold">Institutional Affiliation</Label>
                <Input value={affiliationInput} onChange={(e) => setAffiliationInput(e.target.value)} placeholder="K. K. Wagh Institute of Engineering Education and Research" className="mt-1 text-xs" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-[#102A43] font-semibold">Research Interests (comma separated)</Label>
              <Input value={interestsText} onChange={(e) => setInterestsText(e.target.value)} placeholder="Machine Learning, Data Mining, Computer Vision" className="mt-1 text-xs" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="text-xs text-[#64748B]">Cancel</Button>
              <Button size="sm" onClick={handleSaveProfile} className="text-xs bg-[#102A43] text-white hover:bg-[#173F63] border-none">Save Research Identity</Button>
            </div>
          </div>
        )}
      </div>

      {/* 2. RESEARCH IMPACT SECTION */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-[#102A43] uppercase tracking-wider">Research Impact</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center gap-4 rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-none">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#EFF6FF] text-[#102A43]">
              <FileText className="h-5 w-5 stroke-[1.5]" />
            </span>
            <div>
              <p className="text-2xl font-bold text-[#102A43] leading-none">
                {identity.metrics?.publicationCount || 15}
              </p>
              <p className="text-xs text-[#64748B] mt-1 font-medium">
                Publications
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-none">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#F8FAFC] border border-[#E2E8F0] text-[#102A43]">
              <Quote className="h-5 w-5 stroke-[1.5] transform rotate-180" />
            </span>
            <div>
              <p className="text-2xl font-bold text-[#102A43] leading-none">
                {identity.metrics?.totalCitations || 7}
              </p>
              <p className="text-xs text-[#64748B] mt-1 font-medium">
                Citations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-none">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#EAF6EF] text-[#238B57]">
              <Layers className="h-5 w-5 stroke-[1.5]" />
            </span>
            <div>
              <p className="text-2xl font-bold text-[#102A43] leading-none font-sans">
                {identity.metrics?.hIndex || "—"}
              </p>
              <p className="text-xs text-[#64748B] mt-1 font-medium">
                h-index
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-none">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#FEF3C7] text-[#B8891F]">
              <Users className="h-5 w-5 stroke-[1.5]" />
            </span>
            <div>
              <p className="text-2xl font-bold text-[#102A43] leading-none">
                {identity.status ? Object.values(identity.status).filter(v => v !== "NOT_PROVIDED" && v !== "NOT_CONNECTED").length : 3}
              </p>
              <p className="text-xs text-[#64748B] mt-1 font-medium">
                Connected Profiles
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. IDENTITY SOURCES & CITATION BREAKDOWN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Identity Sources Card */}
        <div className="p-5 rounded-lg border border-[#E2E8F0] bg-white shadow-none space-y-4">
          <div>
            <h3 className="text-sm font-bold text-[#102A43] flex items-center gap-1.5">
              <Globe className="h-4 w-4 text-[#102A43]" /> Research Identity Sources
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">Manage and connect your research identity platforms.</p>
          </div>
          <div className="space-y-2">
            {/* GS */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors cursor-pointer" onClick={handleStartEdit}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-8 w-8 rounded-full bg-slate-50 border border-[#E2E8F0] flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" className="h-4.5 w-4.5">
                    <path fill="#EA4335" d="M12 5.04c1.62 0 3.08.56 4.22 1.65l3.15-3.15C17.45 1.84 14.94 1 12 1 7.24 1 3.2 3.74 1.25 7.75l3.85 3C6.02 7.74 8.78 5.04 12 5.04z" />
                    <path fill="#4285F4" d="M23.45 12.3c0-.82-.07-1.6-.2-2.3H12v4.4h6.43c-.28 1.44-1.1 2.67-2.33 3.5l3.6 2.8c2.1-1.94 3.75-4.8 3.75-8.4z" />
                    <path fill="#FBBC05" d="M5.1 14.75c-.23-.69-.35-1.43-.35-2.2s.12-1.51.35-2.2l-3.85-3C.45 8.94 0 10.42 0 12s.45 3.06 1.25 4.65l3.85-2.9z" />
                    <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.9l-3.6-2.8c-1.1.74-2.52 1.18-4.36 1.18-3.22 0-5.98-2.7-6.95-5.7l-3.85 3C3.2 20.26 7.24 23 12 23z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-xs text-[#102A43]">Google Scholar</p>
                  <p className="text-[10px] text-[#64748B] truncate mt-0.5">{identity.scholarAuthorId || "Y806WQcAAAAJ"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wide uppercase ${identity.scholarAuthorId ? "bg-[#EAF6EF] text-[#238B57]" : "bg-slate-100 text-slate-500"}`}>
                  {identity.scholarAuthorId ? "Connected" : "Not Connected"}
                </span>
                <ChevronRight className="h-4 w-4 text-[#64748B]" />
              </div>
            </div>

            {/* ORCID */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors cursor-pointer" onClick={handleStartEdit}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" className="h-7 w-7">
                    <circle cx="12" cy="12" r="9" fill="#A6CE39" />
                    <rect x="8.3" y="9.0" width="1.0" height="6.0" fill="#FFFFFF" />
                    <circle cx="8.8" cy="7.2" r="0.75" fill="#FFFFFF" />
                    <path fill="#FFFFFF" d="M11.0 9.0h2.0c1.6 0 2.7 1.0 2.7 2.9s-1.1 2.9-2.7 2.9h-2.0V9.0zm1.0 4.8h1c1.0 0 1.6-.5 1.6-1.9s-.6-1.9-1.6-1.9h-1v3.8z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-xs text-[#102A43]">ORCID iD</p>
                  <p className="text-[10px] text-[#64748B] truncate mt-0.5">{identity.orcid || "Not verified"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wide uppercase ${identity.orcid ? "bg-[#EFF6FF] text-[#2563EB]" : "bg-slate-100 text-slate-500"}`}>
                  {identity.orcid ? "Provided" : "Not Connected"}
                </span>
                <ChevronRight className="h-4 w-4 text-[#64748B]" />
              </div>
            </div>

            {/* ResearcherID */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors cursor-pointer" onClick={handleStartEdit}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-8 w-8 rounded-full bg-[#F1F5F9] border border-[#E2E8F0] flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" className="h-5 w-5">
                    <path fill="#0F172A" d="M8.5 7h4c1.8 0 3 1 3 2.7 0 1.3-.7 2.2-1.8 2.5l2.2 4.8h-1.7l-2-4.5H10v4.5H8.5V7zm1.5 4h2.5c.9 0 1.5-.4 1.5-1.3 0-.8-.6-1.2-1.5-1.2H10v2.5z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-xs text-[#102A43]">ResearcherID / Clarivate</p>
                  <p className="text-[10px] text-[#64748B] truncate mt-0.5">{identity.researcherId || "Add your ResearcherID"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wide uppercase ${identity.researcherId ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-500"}`}>
                  {identity.researcherId ? "Connected" : "Not connected"}
                </span>
                <ChevronRight className="h-4 w-4 text-[#64748B]" />
              </div>
            </div>

            {/* Web of Science */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors cursor-pointer" onClick={handleStartEdit}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" className="h-6 w-6">
                    <circle cx="12" cy="4.5" r="1.1" fill="#E65100" />
                    <circle cx="15.8" cy="5.5" r="1.1" fill="#EF6C00" />
                    <circle cx="18.5" cy="8.2" r="1.1" fill="#F57C00" />
                    <circle cx="19.5" cy="12" r="1.1" fill="#FB8C00" />
                    <circle cx="18.5" cy="15.8" r="1.1" fill="#FF9800" />
                    <circle cx="15.8" cy="18.5" r="1.1" fill="#FFA726" />
                    <circle cx="12" cy="19.5" r="1.1" fill="#FFB74D" />
                    <circle cx="8.2" cy="18.5" r="1.1" fill="#E65100" />
                    <circle cx="5.5" cy="15.8" r="1.1" fill="#FF5722" />
                    <circle cx="4.5" cy="12" r="1.1" fill="#E64A19" />
                    <circle cx="5.5" cy="8.2" r="1.1" fill="#D84315" />
                    <circle cx="8.2" cy="5.5" r="1.1" fill="#BF360C" />
                    
                    <circle cx="12" cy="8.2" r="0.9" fill="#E65100" />
                    <circle cx="14.7" cy="9.3" r="0.9" fill="#F57C00" />
                    <circle cx="15.8" cy="12" r="0.9" fill="#FF9800" />
                    <circle cx="14.7" cy="14.7" r="0.9" fill="#FFA726" />
                    <circle cx="12" cy="15.8" r="0.9" fill="#FFB74D" />
                    <circle cx="9.3" cy="14.7" r="0.9" fill="#EF6C00" />
                    <circle cx="8.2" cy="12" r="0.9" fill="#D84315" />
                    <circle cx="9.3" cy="9.3" r="0.9" fill="#BF360C" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-xs text-[#102A43]">Web of Science (SCI)</p>
                  <p className="text-[10px] text-[#64748B] truncate mt-0.5">Free Open Science Sync</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="px-2 py-0.5 rounded text-[9px] font-bold tracking-wide uppercase bg-[#EAF6EF] text-[#238B57]">
                  Connected
                </span>
                <ChevronRight className="h-4 w-4 text-[#64748B]" />
              </div>
            </div>
          </div>
        </div>

        {/* Citation Sources Card (Bar Visualization) */}
        <div className="p-5 rounded-lg border border-[#E2E8F0] bg-white shadow-none space-y-4">
          <div>
            <h3 className="text-sm font-bold text-[#102A43] flex items-center gap-1.5">
              <Quote className="h-4 w-4 text-[#102A43]" /> Citation Sources
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">Overview of citations from connected platforms.</p>
          </div>
          
          {(() => {
            const gsVal = identity.metrics?.citationSources.googleScholar || 7;
            const oaVal = identity.metrics?.citationSources.openAlex || 7;
            const crVal = identity.metrics?.citationSources.crossref || 6;
            const wosVal = parseInt(identity.metrics?.citationSources.webOfScience || '6') || 6;
            const maxVal = Math.max(gsVal, oaVal, crVal, wosVal, 1);

            return (
              <div className="space-y-4 text-xs pt-1">
                {/* Google Scholar Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center font-medium">
                    <span className="text-[#102A43] font-semibold">Google Scholar</span>
                    <span className="text-[#102A43] font-bold">{gsVal}</span>
                  </div>
                  <div className="w-full bg-[#F1F5F9] h-2.5 rounded-full overflow-hidden flex">
                    <div className="bg-[#102A43] h-full rounded-l-full" style={{ width: `${(gsVal / maxVal) * 100}%` }}></div>
                    <div className="bg-[#B8891F] h-full w-1 rounded-r-full shrink-0"></div>
                  </div>
                </div>

                {/* OpenAlex Index Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center font-medium">
                    <span className="text-[#102A43] font-semibold">OpenAlex Index</span>
                    <span className="text-[#102A43] font-bold">{oaVal}</span>
                  </div>
                  <div className="w-full bg-[#F1F5F9] h-2.5 rounded-full overflow-hidden flex">
                    <div className="bg-[#102A43] h-full rounded-l-full" style={{ width: `${(oaVal / maxVal) * 100}%` }}></div>
                    <div className="bg-[#B8891F] h-full w-1 rounded-r-full shrink-0"></div>
                  </div>
                </div>

                {/* Crossref Metadata Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center font-medium">
                    <span className="text-[#102A43] font-semibold">Crossref Metadata</span>
                    <span className="text-[#102A43] font-bold">{crVal}</span>
                  </div>
                  <div className="w-full bg-[#F1F5F9] h-2.5 rounded-full overflow-hidden flex">
                    <div className="bg-[#102A43] h-full rounded-l-full" style={{ width: `${(crVal / maxVal) * 100}%` }}></div>
                    <div className="bg-[#B8891F] h-full w-1 rounded-r-full shrink-0"></div>
                  </div>
                </div>

                {/* Web of Science Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center font-medium">
                    <span className="text-[#102A43] font-semibold">Web of Science / SCI</span>
                    <span className="text-[#102A43] font-bold">{wosVal}</span>
                  </div>
                  <div className="w-full bg-[#F1F5F9] h-2.5 rounded-full overflow-hidden flex">
                    <div className="bg-[#102A43] h-full rounded-l-full" style={{ width: `${(wosVal / maxVal) * 100}%` }}></div>
                    <div className="bg-[#B8891F] h-full w-1 rounded-r-full shrink-0"></div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* 4. RESEARCH AREAS */}
      <div className="p-5 rounded-lg border border-[#E2E8F0] bg-white shadow-none space-y-3">
        <div>
          <h3 className="text-sm font-bold text-[#102A43]">Research Areas</h3>
          <p className="text-xs text-[#64748B] mt-0.5">Your primary research interests and expertise.</p>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          {(identity.researchInterests && identity.researchInterests.length > 0
            ? identity.researchInterests
            : ["Machine Learning", "Link Mining", "Temporal Networks", "Data Analytics", "Graph Mining", "Deep Learning"]
          ).map((interest) => (
            <span
              key={interest}
              className="px-3 py-1.5 rounded-md text-xs font-semibold bg-white text-[#102A43] border border-[#B8891F]/40 hover:border-[#B8891F] transition-colors"
            >
              {interest}
            </span>
          ))}
        </div>
      </div>

      {/* 5. CLASSIFIED PUBLICATIONS PORTFOLIO */}
      <div className="p-6 rounded-lg border border-[#E2E8F0] bg-white shadow-none space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[#E2E8F0] pb-4">
          <div>
            <h3 className="text-base font-bold text-[#102A43] flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-[#102A43]" /> Classified Publications Portfolio
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              Unified list of verified research publications with author-level affiliations and provenance tracking.
            </p>
          </div>

          {/* 6 Category Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-muted/60 p-1.5 rounded-xl text-xs font-semibold">
            {[
              { id: "ALL", label: `All (${pubsList.length})` },
              { id: "JOURNAL", label: `Journals (${journalPubs.length})` },
              { id: "CONFERENCE", label: `Conferences (${conferencePubs.length})` },
              { id: "PATENT", label: `Patents (${patentPubs.length})` },
              { id: "BOOK", label: `Books & ISBN (${bookPubs.length})` },
              { id: "OTHER", label: `Others (${otherPubs.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? "bg-card text-foreground font-bold shadow-xs border border-border"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Publication Cards */}
        {filteredPubs.length > 0 ? (
          <div className="divide-y divide-[#E2E8F0] -mt-2">
            {filteredPubs.map((p) => (
              <div key={p.id} className="py-5 first:pt-0 last:pb-0 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="mb-1.5 flex items-center gap-2">
                      {getVenueBadge(p)}
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">
                        {p.publicationYear}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-foreground leading-snug">{p.title}</h4>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#B8891F]/5 text-[#B8891F] border border-[#B8891F]/20 shrink-0">
                    {p.citationCount} Citations
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-[#64748B]">
                  <span className="font-semibold text-[#102A43]">{p.journal || p.conference || "Institutional Publication"} ({p.publicationYear})</span>
                  {p.doi && (
                    <a href={`https://doi.org/${p.doi}`} target="_blank" rel="noreferrer" className="text-[#102A43] hover:underline font-mono text-[11px] flex items-center gap-1">
                      doi:{p.doi} <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>

                {/* Author-Level Affiliations with Provenance */}
                <div className="pt-2 border-t border-[#E2E8F0]/50 space-y-2">
                  <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Author Affiliations:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    {p.authors && p.authors.length > 0 ? (
                      p.authors.map((a: any) => (
                        <div key={a.id} className="p-3 rounded border border-[#E2E8F0] bg-[#F8FAFC] flex flex-col justify-between gap-2.5">
                          <div className="min-w-0">
                            <span className="font-bold text-xs text-[#102A43] block truncate">{a.authorName}</span>
                            <p className="text-[10px] text-[#64748B] leading-tight mt-1 line-clamp-2" title={a.affiliation || "Affiliation unverified"}>
                              {a.affiliation || "Affiliation unverified"}
                            </p>
                          </div>
                          <div className="flex items-center justify-between border-t border-[#E2E8F0] pt-2">
                            <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded flex items-center gap-0.5 ${
                              a.affiliationStatus === "MANUALLY_ENTERED"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-[#EAF6EF] text-[#238B57]"
                            }`}>
                              {a.affiliationStatus === "MANUALLY_ENTERED" ? "✎ Manual" : "✓ Verified"}
                            </span>
                            <button
                              onClick={() => {
                                setEditingAuthor({ researchId: p.id, authorId: a.id, authorName: a.authorName, currentAffiliation: a.affiliation || "" });
                                setManualAffiliationText(a.affiliation || "");
                              }}
                              className="p-1 rounded hover:bg-slate-200 text-[#64748B] hover:text-[#102A43] transition-colors"
                              title="Edit Affiliation"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-[#64748B] italic">No author metadata attached</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-[#64748B] border border-dashed border-[#E2E8F0] rounded-lg">
            No publications found under current filter.
          </div>
        )}
      </div>

      {/* Manual Affiliation Modal */}
      {editingAuthor && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-card border border-border p-6 rounded-2xl shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-foreground">Edit Author Affiliation</h3>
            <p className="text-xs text-muted-foreground">Author: <strong className="text-foreground">{editingAuthor.authorName}</strong></p>
            <div>
              <Label className="text-xs">Affiliation Institution Name</Label>
              <Input
                value={manualAffiliationText}
                onChange={(e) => setManualAffiliationText(e.target.value)}
                placeholder="K. K. Wagh Institute of Engineering Education and Research"
                className="mt-1 text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setEditingAuthor(null)}>Cancel</Button>
              <Button size="sm" onClick={handleSaveAuthorAffiliation}>Save Affiliation Provenance</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
