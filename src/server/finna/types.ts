export interface Loan {
  id: string;
  title: string;
  dueDate: Date;
  coverUrl?: string;
  author?: string;
  year?: string;
  barcode?: string;
  checkedOutDate?: Date;
  branch?: string;
  itemType?: string;
  /** Which library credential this loan belongs to (for multi-card) */
  credentialId?: string;
  /** Display label for the card, e.g. "OUTI" or user-chosen nickname */
  cardLabel?: string;
}

export interface LinkedCard {
  id: string;
  label: string | null;
  finnaInstance: string;
  finnaUsername: string;
  instanceName: string;
}

export interface RenewalResult {
  loan: Loan;
  success: boolean;
  newDueDate?: Date;
  errorMessage?: string;
}

export interface CheckoutPageData {
  loans: Loan[];
  csrf: string;
  renewalUrl: string;
}

export interface FinnaSession {
  cookies: string;
  baseUrl: string;
}

export interface FinnaInstance {
  id: string;
  name: string;
  baseUrl: string;
  authMethod: "Database" | "MultiILS";
}

export type FinnaInstanceId = "outi" | "oula";
