export function californiaStateTax(taxableIncome = 0) {
  void taxableIncome;
  return {
    tax: 0,
    warning: "State income tax estimate is not yet available for this state.",
  };
}
