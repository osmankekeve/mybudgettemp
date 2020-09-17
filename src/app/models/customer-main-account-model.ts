
import {CustomerAccountModel} from './customer-account-model';
import {CustomerMainModel} from './customer-main-model';

export class CustomerAccountMainModel {
  data?: CustomerAccountModel;
  customer: CustomerMainModel;
  actionType?: string;
  currencyTr?: string;
  isActiveTr?: string;
}
