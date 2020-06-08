import {CustomerRelationModel} from './customer-relation-model';
import {CustomerModel} from './customer-model';
import {LocationModel} from './location-model';

export class LocationMainModel {
  data?: LocationModel;
  customer?: CustomerModel;
  actionType?: string;
}
