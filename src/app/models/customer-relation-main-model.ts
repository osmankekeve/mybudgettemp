import {CustomerRelationModel} from './customer-relation-model';
import {CustomerMainModel} from './customer-main-model';

export class CustomerRelationMainModel {
  data?: CustomerRelationModel;
  customer?: CustomerMainModel;
  actionType?: string;
  relationTypeTR?: string;
}
