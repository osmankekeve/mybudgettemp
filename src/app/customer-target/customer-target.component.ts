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
    this.service.getMainItems().subscribe(list => {
      console.log(list);
      list.forEach((data: any) => {
        const item = data.returnData as CustomerTargetMainModel;
        if (item.actionType === 'added') {
          this.mainList.push(item);
        } else if (item.actionType === 'removed') {
          this.mainList.splice(this.mainList.indexOf(this.refModel), 1);
        } else if (item.actionType === 'modified') {
          this.mainList[this.mainList.indexOf(this.refModel)] = item;
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

  clearSelectedRecord(): void {
    this.refModel = undefined;
    this.selectedRecord = this.service.clearProfileMainModel();
  }

}
