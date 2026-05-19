export interface Loan {
  id: string;
  title: string;
  dueDate: Date;
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
  authTarget?: string; // Required for MultiILS (e.g., "oy" for Oulu)
}

export type FinnaInstanceId = "outi" | "oula";
