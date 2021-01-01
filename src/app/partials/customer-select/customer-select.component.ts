import {Component, OnInit, Input, Output, EventEmitter} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {InformationService} from '../../services/information.service';
import {CustomerMainModel} from '../../models/customer-main-model';
import {CustomerService} from '../../services/customer.service';
import {Router} from '@angular/router';
import {AngularFirestore, CollectionReference, Query} from '@angular/fire/firestore';
import {ProfileService} from '../../services/profile.service';
import {AuthenticationService} from '../../services/authentication.service';
import {CustomerModel} from '../../models/customer-model';

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

  constructor(public activeModal: NgbActiveModal, protected service: CustomerService, protected infoService: InformationService,
              protected route: Router, public db: AngularFirestore, public authService: AuthenticationService) {
  }

  async ngOnInit(): Promise<void> {
    const module = this.route.url.replace('/', '');
    if (this.customer === null) {
      this.customer = this.service.clearMainModel();
    }
    if (module === 'sales-invoice') {
      const type = [];
      type.push('approved');
      type.push('portion');
      const collection = this.db.collection('tblSalesOrder', ref => {
        let query: CollectionReference | Query = ref;
        query = query
          .where('userPrimaryKey', '==', this.authService.getUid())
          .where('status', 'in', type);
        return query;
      }).get();
      collection.toPromise().then((snapshot) => {
        if (snapshot.size === 0) {
          this.customerList = [];
        } else {
          const aa = [];
          snapshot.forEach(async doc => {
            this.service.getItem(doc.data().customerPrimaryKey).then(result => {
              const a = result.data as CustomerModel;
              const aMain = this.service.convertMainModel(a);
              if (!aa.includes(aMain)) {
                aa.push(aMain);
              }
            });
          });
          this.customerList = aa;
        }
      });
    } else if (module === 'purchaseInvoice') {
      const type = [];
      type.push('approved');
      type.push('portion');
      const collection = this.db.collection('tblPurchaseOrder', ref => {
        let query: CollectionReference | Query = ref;
        query = query
          .where('userPrimaryKey', '==', this.authService.getUid())
          .where('status', 'in', type);
        return query;
      }).get();
      collection.toPromise().then((snapshot) => {
        if (snapshot.size === 0) {
          this.customerList = [];
        } else {
          const aa = [];
          snapshot.forEach(async doc => {
            this.service.getItem(doc.data().customerPrimaryKey).then(result => {
              const a = result.data as CustomerModel;
              aa.push(this.service.convertMainModel(a));
            });
          });
          this.customerList = aa;
        }
      });
    } else {
      Promise.all([this.service.getCustomersMain(this.customerTypes)]).then((values: any) => {
        this.customerList = [];
        if (values[0] !== null) {
          const returnData = values[0] as Array<CustomerMainModel>;
          returnData.forEach(value => {
            this.customerList.push(value);
          });
        }
      });
    }
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
