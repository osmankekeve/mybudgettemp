import {CustomerTargetModel} from './customer-target-model';
import {CustomerMainModel} from './customer-main-model';

export class CustomerTargetMainModel {
  data?: CustomerTargetModel;
  customer?: CustomerMainModel;
  typeTr?: string;
  beginMonthTr?: string;
  finishMonthTr?: string;
  actionType?: string;
  amountFormatted?: string;
}
