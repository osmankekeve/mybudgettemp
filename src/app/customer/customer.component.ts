import { Component, OnInit } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs/internal/Observable';
import { CustomerModel } from '../models/customer-model';
import { CustomerService } from '../../app/services/customer.service'
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-customer',
  templateUrl: './customer.component.html',
  styleUrls: ['./customer.component.css']
})

export class CustomerComponent implements OnInit {
  customerList: Observable<CustomerModel[]>;
  customerCollection : AngularFirestoreCollection<CustomerModel>;
  selectedCustomer : CustomerModel;

  constructor(public customerService: CustomerService, public db :AngularFirestore) { 
  }

  ngOnInit() {
    this.populateCustomerList();
    this.selectedCustomer = undefined;
  }

  populateCustomerList() : void {
    this.customerList = this.customerService.getAllItems();

  }

  showSelectedCustomer(_customer: CustomerModel): void {
    this.selectedCustomer = _customer;
  }

  btnReturnList_Click(): void {
    this.selectedCustomer = undefined;
  }

  btnNew_Click(): void {
    this.clearSelectedCustomer();
  }

  btnSave_Click(): void {
    if (this.selectedCustomer.primaryKey == undefined) {
      this.selectedCustomer.primaryKey ="";
      this.customerService.addItem(this.selectedCustomer);
      this.selectedCustomer = undefined;
    } else {

    }
  }

  btnRemove_Click(): void {
    this.customerService.removeItem(this.selectedCustomer);
    this.selectedCustomer = undefined;
  }

  clearSelectedCustomer(): void {
    this.selectedCustomer = {primaryKey:undefined, name:'', owner:'', phone1:'', phone2:'', email:''};
  }

}
