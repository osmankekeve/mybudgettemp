export class LocationModel {
  primaryKey?: string;
  userPrimaryKey: string;
  employeePrimaryKey: string;
  customerPrimaryKey?: string;
  name?: string;
  longitude?: number;
  latitude?: number;
  country?: string;
  city?: string;
  district?: string;
  address?: string;
  description?: string;
  insertDate: number;
}
