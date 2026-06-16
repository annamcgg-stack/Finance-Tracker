"use client";

import { Plus, Trash2 } from "lucide-react";
import { useFinance } from "@/hooks/useFinanceData";
import {
  calculateMortgageWithExtraPayments,
  calculateRequiredRepayment,
} from "@/lib/calculations/mortgage";
import { formatCurrency, formatDate, generateId } from "@/lib/format";
import type { MortgageAccount, MortgageExtraPayment } from "@/lib/types";
import { DEFAULT_SHAREABLE } from "@/lib/household/defaults";
import { ShareVisibilityControl } from "@/components/household/ShareVisibilityControl";
import { VisibilityBadge } from "@/components/household/VisibilityBadge";
import { useHousehold } from "@/hooks/useHousehold";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";
import { SectionHeader, StatCard, EmptyState } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select, Button } from "@/components/ui/Field";
import { TrendLineChart } from "@/components/charts/FinanceCharts";

export default function MortgagePage() {
  const { data, updateData } = useFinance();
  const { household } = useHousehold();
  const { user } = useSupabaseUser();
  const country = data.income.country;
  const fmt = (v: number) => formatCurrency(v, country);

  const addMortgage = () => {
    const account: MortgageAccount = {
      id: generateId(),
      propertyName: "New Property",
      propertyValue: 750000,
      loanAmount: 600000,
      currentBalance: 580000,
      interestRate: 6.2,
      loanTermYears: 30,
      repaymentFrequency: "monthly",
      regularRepaymentAmount: 0,
      loanStartDate: new Date().toISOString().slice(0, 10),
      rateType: "variable",
      offsetBalance: 0,
      ownershipSplitPercent: 50,
      userRepaymentContribution: 0,
      partnerRepaymentContribution: 0,
      ...DEFAULT_SHAREABLE,
    };
    updateData({ mortgageAccounts: [...data.mortgageAccounts, account] });
  };

  const updateMortgage = (id: string, patch: Partial<MortgageAccount>) => {
    updateData({
      mortgageAccounts: data.mortgageAccounts.map((m) =>
        m.id === id ? { ...m, ...patch } : m
      ),
    });
  };

  const removeMortgage = (id: string) => {
    updateData({
      mortgageAccounts: data.mortgageAccounts.filter((m) => m.id !== id),
      mortgageExtraPayments: data.mortgageExtraPayments.filter(
        (p) => p.mortgageAccountId !== id
      ),
    });
  };

  const addExtraPayment = (mortgageId: string) => {
    const extra: MortgageExtraPayment = {
      id: generateId(),
      mortgageAccountId: mortgageId,
      amount: 200,
      frequency: "monthly",
      startDate: new Date().toISOString().slice(0, 10),
      endDate: null,
      paidByUserId: user?.id ?? null,
    };
    updateData({ mortgageExtraPayments: [...data.mortgageExtraPayments, extra] });
  };

  const updateExtra = (id: string, patch: Partial<MortgageExtraPayment>) => {
    updateData({
      mortgageExtraPayments: data.mortgageExtraPayments.map((p) =>
        p.id === id ? { ...p, ...patch } : p
      ),
    });
  };

  const removeExtra = (id: string) => {
    updateData({
      mortgageExtraPayments: data.mortgageExtraPayments.filter((p) => p.id !== id),
    });
  };

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Mortgage Tracker"
        description="Model repayments and see how extra payments save time and interest."
        action={
          <Button onClick={addMortgage}>
            <Plus className="h-4 w-4" /> Add Mortgage
          </Button>
        }
      />

      {data.mortgageAccounts.length === 0 ? (
        <EmptyState
          title="No mortgages yet"
          description="Add a mortgage to calculate repayments, payoff dates, and interest savings from extra payments."
          action={
            <Button onClick={addMortgage}>
              <Plus className="h-4 w-4" /> Add Mortgage
            </Button>
          }
        />
      ) : (
        data.mortgageAccounts.map((account) => {
          const extras = data.mortgageExtraPayments.filter(
            (p) => p.mortgageAccountId === account.id
          );
          const comparison = calculateMortgageWithExtraPayments(account, extras);
          const requiredRepayment =
            account.regularRepaymentAmount > 0
              ? account.regularRepaymentAmount
              : calculateRequiredRepayment(
                  account.currentBalance,
                  account.interestRate,
                  account.loanTermYears,
                  account.repaymentFrequency
                );

          const chartData = comparison.withExtra.schedule
            .filter((_, i) => i % 12 === 0 || i === comparison.withExtra.schedule.length - 1)
            .map((row) => ({
              label: `P${row.period}`,
              balance: Math.round(row.closingBalance),
            }));

          return (
            <div key={account.id} className="space-y-4">
              <Card className="p-5">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-foreground">{account.propertyName}</h3>
                    <VisibilityBadge visibility={account.visibility} />
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeMortgage(account.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Field label="Property Name">
                    <Input
                      value={account.propertyName}
                      onChange={(e) => updateMortgage(account.id, { propertyName: e.target.value })}
                    />
                  </Field>
                  <Field label="Property Value">
                    <Input
                      type="number"
                      value={account.propertyValue || ""}
                      onChange={(e) =>
                        updateMortgage(account.id, { propertyValue: Number(e.target.value) })
                      }
                    />
                  </Field>
                  <Field label="Current Balance">
                    <Input
                      type="number"
                      value={account.currentBalance || ""}
                      onChange={(e) =>
                        updateMortgage(account.id, { currentBalance: Number(e.target.value) })
                      }
                    />
                  </Field>
                  <Field label="Interest Rate (%)">
                    <Input
                      type="number"
                      step="0.01"
                      value={account.interestRate || ""}
                      onChange={(e) =>
                        updateMortgage(account.id, { interestRate: Number(e.target.value) })
                      }
                    />
                  </Field>
                  <Field label="Loan Term (years)">
                    <Input
                      type="number"
                      value={account.loanTermYears || ""}
                      onChange={(e) =>
                        updateMortgage(account.id, { loanTermYears: Number(e.target.value) })
                      }
                    />
                  </Field>
                  <Field label="Repayment Frequency">
                    <Select
                      value={account.repaymentFrequency}
                      onChange={(e) =>
                        updateMortgage(account.id, {
                          repaymentFrequency: e.target.value as MortgageAccount["repaymentFrequency"],
                        })
                      }
                    >
                      <option value="weekly">Weekly</option>
                      <option value="fortnightly">Fortnightly</option>
                      <option value="monthly">Monthly</option>
                    </Select>
                  </Field>
                  <Field label="Regular Repayment">
                    <Input
                      type="number"
                      value={account.regularRepaymentAmount || ""}
                      onChange={(e) =>
                        updateMortgage(account.id, {
                          regularRepaymentAmount: Number(e.target.value),
                        })
                      }
                      placeholder={fmt(requiredRepayment)}
                    />
                  </Field>
                  <Field label="Offset Balance">
                    <Input
                      type="number"
                      value={account.offsetBalance || ""}
                      onChange={(e) =>
                        updateMortgage(account.id, { offsetBalance: Number(e.target.value) })
                      }
                    />
                  </Field>
                  <Field label="Loan Start Date">
                    <Input
                      type="date"
                      value={account.loanStartDate}
                      onChange={(e) =>
                        updateMortgage(account.id, { loanStartDate: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="Rate Type">
                    <Select
                      value={account.rateType}
                      onChange={(e) =>
                        updateMortgage(account.id, {
                          rateType: e.target.value as MortgageAccount["rateType"],
                        })
                      }
                    >
                      <option value="variable">Variable</option>
                      <option value="fixed">Fixed</option>
                    </Select>
                  </Field>
                </div>

                {household && (
                  <div className="mt-4 space-y-3 border-t border-border pt-4">
                    <ShareVisibilityControl
                      visibility={account.visibility}
                      householdId={account.householdId}
                      activeHouseholdId={household.id}
                      onChange={(visibility, householdId) =>
                        updateMortgage(account.id, { visibility, householdId })
                      }
                    />
                    {account.visibility !== "private" && (
                      <>
                        <div className="grid gap-3 sm:grid-cols-3">
                          <Field label="Your ownership %">
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              value={account.ownershipSplitPercent}
                              onChange={(e) =>
                                updateMortgage(account.id, {
                                  ownershipSplitPercent: Number(e.target.value),
                                })
                              }
                            />
                          </Field>
                          <Field label="Your repayment">
                            <Input
                              type="number"
                              value={account.userRepaymentContribution || ""}
                              onChange={(e) =>
                                updateMortgage(account.id, {
                                  userRepaymentContribution: Number(e.target.value),
                                })
                              }
                            />
                          </Field>
                          <Field label="Partner repayment">
                            <Input
                              type="number"
                              value={account.partnerRepaymentContribution || ""}
                              onChange={(e) =>
                                updateMortgage(account.id, {
                                  partnerRepaymentContribution: Number(e.target.value),
                                })
                              }
                            />
                          </Field>
                        </div>
                        <p className="text-xs text-muted">
                          Household equity:{" "}
                          {fmt(
                            account.propertyValue * (account.ownershipSplitPercent / 100) -
                              account.currentBalance * (account.ownershipSplitPercent / 100)
                          )}{" "}
                          (your share)
                        </p>
                      </>
                    )}
                  </div>
                )}
              </Card>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Required Repayment" value={fmt(requiredRepayment)} />
                <StatCard
                  label="Payoff Date (base)"
                  value={
                    comparison.base.payoffDate
                      ? formatDate(comparison.base.payoffDate.toISOString())
                      : "—"
                  }
                />
                <StatCard
                  label="Payoff Date (with extras)"
                  value={
                    comparison.withExtra.payoffDate
                      ? formatDate(comparison.withExtra.payoffDate.toISOString())
                      : "—"
                  }
                />
                <StatCard label="Interest Saved" value={fmt(comparison.interestSaved)} trend="up" />
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="p-5">
                  <h4 className="mb-3 font-semibold text-foreground">Base Case</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted">Total Interest</span>
                      <span>{fmt(comparison.base.totalInterest)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Remaining Periods</span>
                      <span>{comparison.base.remainingPeriods}</span>
                    </div>
                  </div>
                </Card>
                <Card className="p-5">
                  <h4 className="mb-3 font-semibold text-foreground">With Extra Repayments</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted">Total Interest</span>
                      <span>{fmt(comparison.withExtra.totalInterest)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Time Saved</span>
                      <span>{comparison.timeSavedMonths.toFixed(0)} months</span>
                    </div>
                  </div>
                </Card>
              </div>

              <Card className="p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="font-semibold text-foreground">Extra Repayments</h4>
                  <Button size="sm" variant="secondary" onClick={() => addExtraPayment(account.id)}>
                    <Plus className="h-4 w-4" /> Add Extra
                  </Button>
                </div>
                {extras.length === 0 ? (
                  <p className="text-sm text-muted">No extra repayments configured.</p>
                ) : (
                  <div className="space-y-3">
                    {extras.map((extra) => (
                      <div key={extra.id} className="grid gap-3 sm:grid-cols-4 sm:items-end">
                        <Field label="Amount">
                          <Input
                            type="number"
                            value={extra.amount || ""}
                            onChange={(e) => updateExtra(extra.id, { amount: Number(e.target.value) })}
                          />
                        </Field>
                        <Field label="Frequency">
                          <Select
                            value={extra.frequency}
                            onChange={(e) =>
                              updateExtra(extra.id, {
                                frequency: e.target.value as MortgageExtraPayment["frequency"],
                              })
                            }
                          >
                            <option value="weekly">Weekly</option>
                            <option value="fortnightly">Fortnightly</option>
                            <option value="monthly">Monthly</option>
                          </Select>
                        </Field>
                        <Field label="Start Date">
                          <Input
                            type="date"
                            value={extra.startDate}
                            onChange={(e) => updateExtra(extra.id, { startDate: e.target.value })}
                          />
                        </Field>
                        <Button variant="ghost" size="sm" onClick={() => removeExtra(extra.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {chartData.length > 0 && (
                <Card className="p-5">
                  <h4 className="mb-4 font-semibold text-foreground">Balance Over Time</h4>
                  <TrendLineChart data={chartData} dataKey="balance" formatter={fmt} />
                </Card>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
