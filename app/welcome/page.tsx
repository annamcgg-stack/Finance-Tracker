import Link from "next/link";
import {
  Wallet,
  TrendingUp,
  Shield,
  PieChart,
  Home,
  LineChart,
} from "lucide-react";
import { Button } from "@/components/ui/Field";

const features = [
  {
    icon: Wallet,
    title: "Income & Tax",
    description: "Calculate take-home pay with country-specific tax engines.",
  },
  {
    icon: PieChart,
    title: "Budget & Allocation",
    description: "Track expenses, sinking funds, and allocate your surplus.",
  },
  {
    icon: LineChart,
    title: "Live Portfolio",
    description: "Track international stock holdings with live market prices.",
  },
  {
    icon: Home,
    title: "Mortgage Planner",
    description: "Model repayments and see how extra payments save interest.",
  },
  {
    icon: TrendingUp,
    title: "Net Worth",
    description: "See your complete financial picture in one dashboard.",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Your data is encrypted and protected with row-level security.",
  },
];

export default function WelcomePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-white">
          W
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Plan your wealth with clarity
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted">
          WealthPlan helps you understand your income, expenses, investments, and net worth —
          all in one clean dashboard.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link href="/signup">
            <Button size="lg">Get started free</Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="secondary">
              Log in
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div
            key={f.title}
            className="rounded-2xl border border-border bg-surface p-6 shadow-card"
          >
            <f.icon className="h-8 w-8 text-primary" />
            <h3 className="mt-3 font-semibold text-foreground">{f.title}</h3>
            <p className="mt-1 text-sm text-muted">{f.description}</p>
          </div>
        ))}
      </div>

      <p className="mt-12 text-center text-xs text-muted">
        This app provides estimates only and is not financial, tax, or investment advice.
      </p>
    </div>
  );
}
