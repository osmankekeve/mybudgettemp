export class CompanyModel {
  primaryKey?: string; // also userPrimaryKey
  companyName: string;
  companyOwner: string;
  companyOwnerMailAddress: string;
  companyManager: string;
  companyManagerMailAddress: string;
  companyMailAddress: string;
  address: string;
  telephone: string;
  fax: string;
  taxOffice?: string;
  taxNumber?: string;
  isActive?: boolean;
  imgUrl: string;
}
