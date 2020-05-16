export class VisitModel {
  primaryKey?: string;
  userPrimaryKey: string;
  customerPrimaryKey: string;
  employeePrimaryKey: string;
  description?: string;
  result?: string;
  isVisited?: boolean;
  longitude?: number;
  latitude?: number;
  visitDate?: number;
  visitStartDate?: number;
  visitFinishDate?: number;
  insertDate: number;
}
