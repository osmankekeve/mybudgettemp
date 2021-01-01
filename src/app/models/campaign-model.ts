export class CampaignModel {
  primaryKey?: string;
  userPrimaryKey: string;
  code: string;
  title: string;
  type?: string; // normal, packet,
  beginDate?: number;
  finishDate?: number;
  priceListPrimaryKey?: string;
  discountListPrimaryKey?: string;
  description: string;
  platform: string;
  insertDate?: number;
}
