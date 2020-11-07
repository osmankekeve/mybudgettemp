import {VisitModel} from './visit-model';
import {CustomerMainModel} from './customer-main-model';

export class VisitMainModel {
  visit?: VisitModel;
  customer?: CustomerMainModel;
  customerName: string;
  employeeName?: string;
  actionType?: string;
  isVisitedTr?: string;
}
