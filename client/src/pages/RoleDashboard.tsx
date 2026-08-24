import {
  ArrowUpRight,
  BriefcaseBusiness,
  CheckCircle2,
  GraduationCap,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function RoleDashboard() {
  const dashboard = trpc.dashboard.role.useQuery();
  if (dashboard.isLoading)
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-slate-500">
        Loading your school dashboard…
      </div>
    );
  if (dashboard.error)
    return (
      <div className="mx-auto max-w-2xl px-5 py-16">
        <Card>
          <CardContent className="p-8">
            <p className="text-sm font-semibold text-destructive">
              Dashboard unavailable
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {dashboard.error.message}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  const data = dashboard.data;
  if (!data) return null;
  return (
    <div className="min-h-[calc(100vh-3rem)] bg-[#f6f8fb] px-5 py-8 text-slate-900 sm:px-8 lg:px-10">
      <main className="mx-auto max-w-6xl space-y-7">
        <section className="rounded-3xl bg-[#0f3049] p-7 text-white shadow-[0_18px_50px_rgba(15,48,73,0.18)] sm:p-10">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <Badge className="border-white/20 bg-white/10 text-blue-50">
                {data.roleCodes.join(" · ")}
              </Badge>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                {data.title}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100/80">
                {data.summary}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <ShieldCheck className="h-5 w-5 text-[#e4c477]" />
              <p className="mt-3 text-xs text-blue-100/70">
                Server-authorized scope
              </p>
              <p className="mt-1 text-sm font-semibold">
                No menu-only security
              </p>
            </div>
          </div>
        </section>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            icon={Users}
            label="Visible learners"
            value={data.counts.learners}
            note={
              data.audience === "GUARDIAN"
                ? "Linked children only"
                : data.audience === "LEARNER"
                  ? "Your official record"
                  : "Within assigned scope"
            }
          />
          <StatCard
            icon={BriefcaseBusiness}
            label="Visible staff"
            value={data.counts.staff}
            note="Based on your school role"
          />
          <StatCard
            icon={GraduationCap}
            label="Assigned classes"
            value={data.assignedClassIds.length}
            note="Class scope from records"
          />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your school workspace</CardTitle>
            <CardDescription>
              Only functions relevant to your role and current assignments are
              shown.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.navigation.map(item => (
              <Link
                key={item.path}
                href={item.path}
                className="group rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{item.label}</span>
                  <ArrowUpRight className="h-4 w-4 text-slate-400 transition group-hover:text-primary" />
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Open the role-scoped workspace.
                </p>
              </Link>
            ))}
            {!data.navigation.length && (
              <p className="text-sm text-slate-500">
                No workspace has been assigned to this account yet.
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Access summary</CardTitle>
            <CardDescription>
              These identifiers are informational; the server remains the
              authority for every request.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Info label="Audience" value={data.audience} />
            <Info label="Roles" value={data.roleCodes.join(", ") || "None"} />
            <Info label="Subjects" value={data.assignedSubjectIds.length} />
            <Info
              label="Departments"
              value={data.assignedDepartmentIds.length}
            />
          </CardContent>
        </Card>
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-900">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          Official records, marks, attendance, finance, welfare, and examination
          data remain protected by server-side procedures and domain
          permissions.
        </div>
      </main>
    </div>
  );
}
function StatCard({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  note: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <Icon className="h-4 w-4 text-primary" />
        <p className="mt-3 text-xs text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-semibold">{value}</p>
        <p className="mt-1 text-xs text-slate-500">{note}</p>
      </CardContent>
    </Card>
  );
}
function Info({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}
