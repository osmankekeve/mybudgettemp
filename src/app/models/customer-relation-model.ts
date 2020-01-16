export class CustomerRelationModel {
  primaryKey?: string;
  userPrimaryKey: string;
  employeePrimaryKey: string;
  parentPrimaryKey?: string;
  parentType?: string; // customer
  relationType?: string; // meeting, mailSending, phoneCall, visit, faxSending
  status?: string;
  description?: string;
  actionDate?: number;
  insertDate: number;
}
