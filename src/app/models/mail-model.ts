
export class MailModel {
  primaryKey?: string;
  mailFrom?: string;
  mailTo?: string;
  userPrimaryKey?: string;
  employeePrimaryKey?: string; // mail sender employee primaryKey
  employeeName?: string;
  subject?: string;
  parentType?: string; // anyone, customer, employee
  parentPrimaryKey?: string;
  content?: string;
  html?: string;
  isSend?: boolean;
  insertDate?: number;
}
