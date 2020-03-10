import {VisitModel} from './visit-model';
import {CustomerModel} from './customer-model';

export class VisitMainModel {
  visit?: VisitModel;
  customer?: CustomerModel;
  customerName: string;
  employeeName?: string;
  actionType?: string;
  isVisitedTr?: string;
}
