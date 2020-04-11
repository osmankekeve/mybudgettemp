import {CustomerRelationModel} from './customer-relation-model';
import {CustomerModel} from './customer-model';

export class CustomerRelationMainModel {
  data?: CustomerRelationModel;
  customer?: CustomerModel;
  actionType?: string;
  relationTypeTR?: string;
}
