/** True only when setup_completed is explicitly true in the profile row. */
export function parseSetupCompleted(
  profile: Record<string, unknown> | null | undefined
): boolean {
  if (!profile) {
    console.log("[FinanceTracker Debug] parseSetupCompleted", {
      profile,
      setup_completed: null,
      result: false,
      reason: "no profile row",
    });
    return false;
  }

  const raw = profile.setup_completed;
  let result: boolean;
  let reason: string;

  if (raw === true) {
    result = true;
    reason = "setup_completed=true";
  } else if (raw === false) {
    result = false;
    reason = "setup_completed=false";
  } else {
    result = Boolean(profile.onboarding_completed);
    reason = "legacy onboarding_completed fallback";
  }

  console.log("[FinanceTracker Debug] parseSetupCompleted", {
    profile,
    setup_completed: raw ?? null,
    onboarding_completed: profile.onboarding_completed ?? null,
    result,
    reason,
  });

  return result;
}

/** Redirect to onboarding only when setup is explicitly incomplete (not while unknown/loading). */
export function needsOnboarding(
  setupCompleted: boolean,
  options?: { profileReady?: boolean }
): boolean {
  if (options?.profileReady === false) return false;
  return setupCompleted === false;
}
