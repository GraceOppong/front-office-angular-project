export const TRANSFER_COMMISSION_RATE = 0.005;
export const VAT_ON_COMMISSION_RATE = 0.15;

/** Flat fees. No tariff was supplied, so these stay at zero until one is set. */
export const SWIFT_CHARGE = 0;
export const CORRESPONDENT_HANDLING_FEE = 0;

export interface CashCharges {
  swift: number;
  transferCommission: number;
  correspondentHandling: number;
  vatOnCommission: number;
  total: number;
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateCashCharges(amount: number | null): CashCharges {
  const base = amount !== null && amount > 0 ? amount : 0;
  const transferCommission = roundMoney(base * TRANSFER_COMMISSION_RATE);
  const vatOnCommission = roundMoney(transferCommission * VAT_ON_COMMISSION_RATE);
  const total = roundMoney(
    SWIFT_CHARGE + transferCommission + CORRESPONDENT_HANDLING_FEE + vatOnCommission,
  );

  return {
    swift: SWIFT_CHARGE,
    transferCommission,
    correspondentHandling: CORRESPONDENT_HANDLING_FEE,
    vatOnCommission,
    total,
  };
}
