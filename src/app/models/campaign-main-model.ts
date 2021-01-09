import { CampaignDetailMainModel } from './campaign-detail-main-model';
import { CampaignModel } from './campaign-model';

export class CampaignMainModel {
  data: CampaignModel;
  actionType?: string;
  typeTr?: string;
  platformTr?: string;
  detailList: Array<CampaignDetailMainModel>;
  isAvaliableForNewDetail?: boolean;
}
