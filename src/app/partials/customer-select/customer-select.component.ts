import {Component, OnInit, Input, Output, EventEmitter} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {InformationService} from '../../services/information.service';
import {CustomerMainModel} from '../../models/customer-main-model';
import {CustomerService} from '../../services/customer.service';

@Component({
  selector: 'app-customer-select',
  templateUrl: 'customer-select.component.html'
})

export class CustomerSelectComponent implements OnInit {

  @Input() public customer: CustomerMainModel;
  @Input() public customerTypes: Array<string>;
  @Output() passEntry: EventEmitter<any> = new EventEmitter();
  customerList: Array<CustomerMainModel>;
  searchText: '';

  constructor(public activeModal: NgbActiveModal, protected service: CustomerService, protected infoService: InformationService) {
  }

  async ngOnInit(): Promise<void> {
    if (this.customer === null) {
      this.customer = this.service.clearMainModel();
    }

    Promise.all([this.service.getCustomersMain(this.customerTypes)]).then((values: any) => {
      this.customerList = [];
      if (values[0] !== undefined || values[0] !== null) {
        const returnData = values[0] as Array<CustomerMainModel>;
        returnData.forEach(value => {
          this.customerList.push(value);
        });
      }
    });
  }

  markSelectedCustomer(selectedCustomer: CustomerMainModel) {
    this.customer = selectedCustomer;
  }

  async btnSelect_Click() {
    try {
      this.passEntry.emit(this.customer);
      this.activeModal.close(this.customer);
    } catch (error) {
      await this.infoService.error(error);
    }
  }
}
