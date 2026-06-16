import { describe, it, expect } from "vitest";
import { SETUP_CHOICE_LABELS } from "../setup";

describe("setup choices", () => {
  it("labels all setup paths", () => {
    expect(SETUP_CHOICE_LABELS.individual).toBe("Individual");
    expect(SETUP_CHOICE_LABELS.create_household).toBe("Create household");
    expect(SETUP_CHOICE_LABELS.join_household).toBe("Join household");
  });
});
