export interface LocationModel {
  primaryKey?: string;
  userPrimaryKey: string;
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
