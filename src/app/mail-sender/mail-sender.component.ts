import { Component, OnInit, OnDestroy } from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import { InformationService } from '../services/information.service';
import { AuthenticationService } from '../services/authentication.service';
import emailjs, { EmailJSResponseStatus } from 'emailjs-com';
import {ContactUsMainModel} from '../models/contact-us-main-model';
import { getFirstDayOfMonthForInput, getTodayForInput, isNullOrEmpty} from '../core/correct-library';
import {Router} from '@angular/router';
import {CONFIG} from 'src/mail.config';
import {MailService} from '../services/mail.service';
import {MailMainModel} from '../models/mail-main-model';
import {Observable} from 'rxjs/internal/Observable';
import {CustomerModel} from '../models/customer-model';
import {CustomerService} from '../services/customer.service';
import {ProfileModel} from '../models/profile-model';
import {ProfileService} from '../services/profile.service';
import {ProfileMainModel} from '../models/profile-main-model';
import {SimpleModel} from '../models/simple-model';

@Component({
  selector: 'app-mail-sender',
  templateUrl: './mail-sender.component.html',
  styleUrls: ['./mail-sender.component.css']
})
export class MailSenderComponent implements OnInit, OnDestroy {
  mainList: Array<MailMainModel>;
  customerList$: Observable<CustomerModel[]>;
  employeeList$: Observable<ProfileModel[]>;
  receivers: Array<SimpleModel>;
  selectedRecord: MailMainModel;
  refModel: MailMainModel;
  employeeDetail: any;
  isMainFilterOpened = false;
  filterBeginDate: any;
  filterFinishDate: any;
  searchText: '';

  constructor(public authService: AuthenticationService, public service: MailService, public eService: ProfileService,
              public infoService: InformationService, public route: Router, public cService: CustomerService,
              public db: AngularFirestore) { }

  ngOnInit() {
    this.clearMainFiler();
    this.customerList$ = this.cService.getAllItems();
    this.employeeList$ = this.eService.getItems();
    this.employeeDetail = this.authService.isEmployeeLoggedIn();
    this.populateList();
  }

  ngOnDestroy(): void { }

  populateList(): void {
    this.mainList = undefined;
    const beginDate = new Date(this.filterBeginDate.year, this.filterBeginDate.month - 1, this.filterBeginDate.day, 0, 0, 0);
    const finishDate = new Date(this.filterFinishDate.year, this.filterFinishDate.month - 1, this.filterFinishDate.day + 1, 0, 0, 0);
    this.service.getMainItemsBetweenDates(beginDate, finishDate).subscribe(list => {
      if (this.mainList === undefined) { this.mainList = []; }
      list.forEach((data: any) => {
        const item = data.returnData as MailMainModel;
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
    setTimeout (() => {
      if (this.mainList === undefined) {
        this.mainList = [];
      }
    }, 1000);
  }

  showSelectedRecord(record: any): void {
    this.selectedRecord = record as MailMainModel;
    this.refModel = record as MailMainModel;
  }

  btnNew_Click(): void {
    this.clearSelectedRecord();
  }

  btnShowMainFiler_Click(): void {
    if (this.isMainFilterOpened === true) {
      this.isMainFilterOpened = false;
    } else {
      this.isMainFilterOpened = true;
    }
    this.clearMainFiler();
  }

  btnSave_Click() {
    try {
      if (this.selectedRecord.data.mailTo === '') {
        this.infoService.error('Lütfen alıcı adresi giriniz');
      } else if (this.selectedRecord.data.subject === '') {
        this.infoService.error('Lütfen başlık giriniz');
      } else if (this.selectedRecord.data.content === '') {
        this.infoService.error('Lütfen içerik giriniz');
      } else {
        if (this.selectedRecord.data.primaryKey === null) {
          console.log(this.selectedRecord);

        }
      }
    } catch (err) {
      this.infoService.error(err);
    }
  }

  btnReturnList_Click(): void {
    try {
      this.selectedRecord = undefined;
      this.route.navigate(['contact-us', {}]);
    } catch (err) {
      this.infoService.error(err);
    }
  }

  btnMainFilter_Click(): void {
    try {
      if (isNullOrEmpty(this.filterBeginDate)) {
        this.infoService.error('Lütfen başlangıç tarihi filtesinden tarih seçiniz.');
      } else if (isNullOrEmpty(this.filterFinishDate)) {
        this.infoService.error('Lütfen bitiş tarihi filtesinden tarih seçiniz.');
      } else {
        this.populateList();
      }
    } catch (err) {
      this.infoService.error(err);
    }
  }

  onChangeType(record: any): void {
    this.receivers = [];
    if (record === 'customer') {
      this.customerList$.subscribe(list => {
        list.forEach(item => {
          const key = item as CustomerModel;
          this.receivers.push({key: key.primaryKey, value: key.name});
        });
      });
    } else if (record === 'employee') {
      this.employeeList$.subscribe(list => {
        list.forEach(item => {
          const key = item as ProfileModel;
          this.receivers.push({key: key.primaryKey, value: key.longName});
        });
      });
    } else {

    }
  }

  clearSelectedRecord(): void {
    this.refModel = undefined;
    this.selectedRecord = this.service.clearMainModel();
  }

  clearMainFiler(): void {
    this.filterBeginDate = getFirstDayOfMonthForInput();
    this.filterFinishDate = getTodayForInput();
  }
}
