import {CollectionModel} from './collection-model';
import {CustomerModel} from './customer-model';

export class CollectionMainModel {
  data: CollectionModel;
  customer?: CustomerModel;
  customerName?: string;
  employeeName?: string;
  approverName?: string;
  actionType?: string;
  statusTr?: string;
  platformTr?: string;
  amountFormatted?: string;
}
