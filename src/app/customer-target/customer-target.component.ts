import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { InformationService } from '../services/information.service';
import { AuthenticationService } from '../services/authentication.service';
import { CustomerTargetMainModel } from '../models/customer-target-main-model';
import { CustomerTargetService } from '../services/customer-target.service';
import { Observable } from 'rxjs';
import { CustomerModel } from '../models/customer-model';
import { CustomerService } from '../services/customer.service';

@Component({
  selector: 'app-customer-target',
  templateUrl: './customer-target.component.html',
  styleUrls: ['./customer-target.component.css']
})
export class CustomerTargetComponent implements OnInit, OnDestroy {
  mainList: Array<CustomerTargetMainModel> = [];
  mainList1: Array<CustomerTargetMainModel> = [];
  mainList2: Array<CustomerTargetMainModel> = [];
  mainList3: Array<CustomerTargetMainModel> = [];
  selectedRecord: CustomerTargetMainModel;
  customerList$: Observable<CustomerModel[]>;
  refModel: CustomerTargetMainModel;

  constructor(public authServis: AuthenticationService,
              public infoService: InformationService,
              public cService: CustomerService,
              public service: CustomerTargetService,
              public db: AngularFirestore) { }

  async ngOnInit() {
    this.customerList$ = this.cService.getAllItems();
    this.populateList();
    this.selectedRecord = undefined;
  }

  ngOnDestroy(): void { }

  populateList(): void {
    this.mainList = [];
    this.mainList1 = [];
    this.mainList2 = [];
    this.mainList3 = [];
    this.service.getMainItems().subscribe(list => {
      list.forEach((data: any) => {
        const item = data.returnData as CustomerTargetMainModel;
        if (item.actionType === 'added') {
          if (item.data.type === 'yearly') {
            this.mainList1.push(item);
          } else if (item.data.type === 'monthly') {
            this.mainList2.push(item);
          } else if (item.data.type === 'periodic') {
            this.mainList3.push(item);
          } else {

          }
        } else if (item.actionType === 'removed') {
          if (item.data.type === 'yearly') {
            this.mainList1.splice(this.mainList1.indexOf(this.refModel), 1);
          } else if (item.data.type === 'monthly') {
            this.mainList2.splice(this.mainList2.indexOf(this.refModel), 1);
          } else if (item.data.type === 'periodic') {
            this.mainList3.splice(this.mainList3.indexOf(this.refModel), 1);
          } else {

          }
        } else if (item.actionType === 'modified') {
          if (item.data.type === 'yearly') {
            this.mainList1[this.mainList1.indexOf(this.refModel)] = item;
          } else if (item.data.type === 'monthly') {
            this.mainList2[this.mainList2.indexOf(this.refModel)] = item;
          } else if (item.data.type === 'periodic') {
            this.mainList3[this.mainList3.indexOf(this.refModel)] = item;
          } else {

          }
        } else {
          // nothing
        }
      });
    });
  }

  showSelectedRecord(record: any): void {
    this.selectedRecord = record as CustomerTargetMainModel;
    this.refModel = record as CustomerTargetMainModel;
  }

  btnReturnList_Click(): void {
    this.selectedRecord = undefined;
  }

  btnSave_Click(): void {
    if (this.selectedRecord.data.primaryKey === null) {
      this.selectedRecord.data.primaryKey = '';
      this.service.addItem(this.selectedRecord)
      .then(() => {
        this.infoService.success('Hedef başarıyla kaydedildi.');
        this.selectedRecord = undefined;
      }).catch(err => this.infoService.error(err));
    } else {
      this.service.updateItem(this.selectedRecord)
      .then(() => {
        this.infoService.success('Hedef başarıyla güncellendi.');
        this.selectedRecord = undefined;
      }).catch(err => this.infoService.error(err));
    }
  }

  btnRemove_Click(): void {
    this.service.removeItem(this.selectedRecord)
    .then(() => {
      this.infoService.success('Hedef başarıyla kaldırıldı.');
      this.selectedRecord = undefined;
    }).catch(err => this.infoService.error(err));
  }

  btnNew_Click(): void {
    this.clearSelectedRecord();
  }

  onChangeType(record: any): void {
    if (record === 'yearly') {
      this.selectedRecord.data.beginMonth = -1;
      this.selectedRecord.data.finishMonth = -1;
    } else if (record === 'monthly') {
      this.selectedRecord.data.beginMonth = 1;
      this.selectedRecord.data.finishMonth = -1;

    } else if (record === 'periodic') {
      this.selectedRecord.data.beginMonth = 1;
      this.selectedRecord.data.finishMonth = 12;
    } else {
      this.selectedRecord.data.beginMonth = -1;
      this.selectedRecord.data.finishMonth = -1;
    }
  }

  onChangeCustomer($event: any): void {
    this.selectedRecord.customerName = $event.target.options[$event.target.options.selectedIndex].text;
  }

  clearSelectedRecord(): void {
    this.refModel = undefined;
    this.selectedRecord = this.service.clearMainModel();
  }

}
