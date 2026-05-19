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
}

export type FinnaInstanceId = "outi" | "oula";
