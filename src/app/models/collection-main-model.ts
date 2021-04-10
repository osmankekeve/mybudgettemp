import {CollectionModel} from './collection-model';
import {CustomerMainModel} from './customer-main-model';

export class CollectionMainModel {
  data: CollectionModel;
  customer?: CustomerMainModel;
  customerName?: string;
  employeeName?: string;
  approverName?: string;
  actionType?: string;
  statusTr?: string;
  platformTr?: string;
  typeTr?: string;
  amountFormatted?: string;
}
