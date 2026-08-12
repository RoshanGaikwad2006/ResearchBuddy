import { useState } from "react";
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
  Award,
  Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useMyFacultyProfile, useUpdateFaculty } from "../hooks/useFaculty";
import { useSyncMyScholar } from "@/features/scholar/hooks/useScholar";

export function FacultyProfileCard() {
  const { data: facultyRes, isLoading, refetch } = useMyFacultyProfile();
  const updateMutation = useUpdateFaculty();
  const syncScholarMutation = useSyncMyScholar();

  const faculty = facultyRes?.faculty;

  const [isEditing, setIsEditing] = useState(false);
  const [scholarUrl, setScholarUrl] = useState("");
  const [orcid, setOrcid] = useState("");
  const [interestsText, setInterestsText] = useState("");

  const handleStartEdit = () => {
    if (faculty) {
      setScholarUrl(faculty.scholarUrl || "");
      setOrcid(faculty.orcid || "");
      setInterestsText((faculty.researchInterests || []).join(", "));
    }
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    if (!faculty) return;
    const researchInterests = interestsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    await updateMutation.mutateAsync({
      id: faculty.id,
      data: {
        scholarUrl: scholarUrl || undefined,
        orcid: orcid || undefined,
        researchInterests,
      },
    });

    setIsEditing(false);
    refetch();
  };

  const handleSyncScholar = async () => {
    await syncScholarMutation.mutateAsync(faculty?.scholarUrl || undefined);
    refetch();
  };

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-border bg-card">
        <RefreshCw className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!faculty) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-6 text-center">
        <UserCheck className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-2 text-sm font-medium text-foreground">No Faculty Profile Found</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Your user account is not currently linked to a Faculty record. Please contact your institution administrator.
        </p>
      </div>
    );
  }

  const isCooldownActive = false;
  const remainingMinutes = 0;

  return (
    <div className="space-y-5">
      {/* 1. PERSONAL INFORMATION CARD */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {faculty.scholarAvatarUrl ? (
              <img
                src={faculty.scholarAvatarUrl}
                alt={faculty.user.name}
                className="h-16 w-16 rounded-2xl object-cover border border-primary/20 shadow-soft"
              />
            ) : (
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-primary text-xl font-bold text-primary-foreground shadow-soft">
                {faculty.user.name.charAt(0)}
              </div>
            )}
            <div>
              <h2 className="text-xl font-semibold text-foreground">{faculty.user.name}</h2>
              <p className="text-sm font-medium text-primary">{faculty.designation}</p>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" />
                  {faculty.department?.name || "General Department"}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" />
                  {faculty.user.email}
                </span>
                <span>•</span>
                <span>ID: {faculty.employeeId}</span>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleStartEdit}
            className="gap-1.5 self-start sm:self-center"
          >
            <Edit className="h-3.5 w-3.5" /> Edit Identity
          </Button>
        </div>

        {/* Editing Modal/Form */}
        {isEditing && (
          <div className="mt-5 rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-primary">
              Update Research Identity
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="scholarUrl" className="text-xs">Google Scholar Profile URL or Author ID</Label>
                <Input
                  id="scholarUrl"
                  placeholder="https://scholar.google.com/citations?user=..."
                  value={scholarUrl}
                  onChange={(e) => setScholarUrl(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="orcid" className="text-xs">ORCID ID</Label>
                <Input
                  id="orcid"
                  placeholder="0000-0002-1825-0097"
                  value={orcid}
                  onChange={(e) => setOrcid(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="interests" className="text-xs">Research Interests (comma separated)</Label>
              <Input
                id="interests"
                placeholder="Machine Learning, Deep Learning, Computer Vision"
                value={interestsText}
                onChange={(e) => setInterestsText(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveProfile} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save Identity"}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 2. SCHOLAR METRICS CARD */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              Google Scholar & Citation Metrics
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Verified publication impact and index scores belonging strictly to your faculty identity.
            </p>
          </div>

          <Button
            onClick={handleSyncScholar}
            disabled={syncScholarMutation.isPending || isCooldownActive}
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            title={isCooldownActive ? `Sync in cooldown. Retry in ${remainingMinutes} min.` : "Sync Google Scholar"}
          >
            <RefreshCw className={`h-4 w-4 ${syncScholarMutation.isPending ? "animate-spin" : ""}`} />
            {syncScholarMutation.isPending
              ? "Syncing..."
              : isCooldownActive
              ? `Cooldown (${remainingMinutes}m)`
              : "Sync Google Scholar"}
          </Button>
        </div>

        {/* Metrics Grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-background p-4 shadow-soft">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
              <BookOpen className="h-4 w-4" />
            </span>
            <p className="mt-2 text-xs text-muted-foreground">Total Publications</p>
            <p className="text-xl font-bold text-foreground">{faculty.publicationCount || 0}</p>
          </div>

          <div className="rounded-xl border border-border bg-background p-4 shadow-soft">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
              <Quote className="h-4 w-4" />
            </span>
            <p className="mt-2 text-xs text-muted-foreground">Citations</p>
            <p className="text-xl font-bold text-primary">{faculty.totalCitations || 0}</p>
          </div>

          <div className="rounded-xl border border-border bg-background p-4 shadow-soft">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <Award className="h-4 w-4" />
            </span>
            <p className="mt-2 text-xs text-muted-foreground">h-index</p>
            <p className="text-xl font-bold text-foreground">{faculty.hIndex || 0}</p>
          </div>

          <div className="rounded-xl border border-border bg-background p-4 shadow-soft">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-accent-foreground">
              <CheckCircle2 className="h-4 w-4" />
            </span>
            <p className="mt-2 text-xs text-muted-foreground">i10-index</p>
            <p className="text-xl font-bold text-foreground">{faculty.i10Index || 0}</p>
          </div>
        </div>

        {/* Academic Identifiers Badges */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <div className="flex flex-wrap items-center gap-2">
            {faculty.scholarUrl ? (
              <a
                href={faculty.scholarUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
              >
                <Globe className="h-3.5 w-3.5" />
                Google Scholar Linked
              </a>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">
                Scholar Not Linked
              </Badge>
            )}

            <Badge variant="outline" className="text-emerald-600 bg-emerald-500/10 border-emerald-500/20 text-xs gap-1">
              <CheckCircle2 className="h-3 w-3" /> Live Google Scholar Data
            </Badge>

            {faculty.orcid ? (
              <a
                href={faculty.orcid.startsWith("http") ? faculty.orcid : `https://orcid.org/${faculty.orcid}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-500/20 transition-colors"
              >
                <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-600 text-[9px] font-extrabold text-white">iD</span>
                ORCID: {faculty.orcid.replace(/^https?:\/\/orcid\.org\//i, "")}
              </a>
            ) : (
              <Badge variant="outline" className="text-amber-600 bg-amber-500/10 border-amber-500/30 text-xs gap-1">
                <span className="flex h-3 w-3 items-center justify-center rounded-full bg-amber-600 text-[8px] font-bold text-white">iD</span>
                ORCID iD Not Linked
              </Badge>
            )}
          </div>

          {faculty.lastSyncTime && (
            <p className="text-xs text-muted-foreground">
              Last synced: {new Date(faculty.lastSyncTime).toLocaleDateString()} {new Date(faculty.lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>

        {/* Research Interests Tags */}
        {faculty.researchInterests && faculty.researchInterests.length > 0 && (
          <div className="border-t border-border pt-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Research Expertise & Interests
            </p>
            <div className="flex flex-wrap gap-1.5">
              {faculty.researchInterests.map((tag, idx) => (
                <Badge key={idx} variant="outline" className="text-xs font-normal">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
