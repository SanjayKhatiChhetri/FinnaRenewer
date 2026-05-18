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
}
