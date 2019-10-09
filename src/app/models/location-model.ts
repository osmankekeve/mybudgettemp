export interface LocationModel {
  primaryKey?: string;
  userPrimaryKey: string;
  customerPrimaryKey?: string;
  name?: string;
  longitude?: number;
  latitude?: number;
  insertDate: number;
  district?: string;
  description?: string;
  country?: string;
  city?: string;
  address?: string;
}
