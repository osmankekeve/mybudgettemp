import {Component, OnInit, OnDestroy} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {InformationService} from '../services/information.service';
import {AuthenticationService} from '../services/authentication.service';
import emailjs, {EmailJSResponseStatus} from 'emailjs-com';
import {getFirstDayOfMonthForInput, getTodayForInput, isNullOrEmpty} from '../core/correct-library';
import {Router} from '@angular/router';
import {CONFIG} from 'src/mail.config';
import {MailService} from '../services/mail.service';
import {MailMainModel} from '../models/mail-main-model';
import {CustomerModel} from '../models/customer-model';
import {CustomerService} from '../services/customer.service';
import {ProfileModel} from '../models/profile-model';
import {ProfileService} from '../services/profile.service';
import {SimpleModel} from '../models/simple-model';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ExcelService } from '../services/excel-service';
import { MainFilterComponent } from '../partials/main-filter/main-filter.component';
import { Subscription } from 'rxjs';
import { InfoModuleComponent } from '../partials/info-module/info-module.component';

@Component({
  selector: 'app-mail-sender',
  templateUrl: './mail-sender.component.html',
  styleUrls: ['./mail-sender.component.css']
})
export class MailSenderComponent implements OnInit, OnDestroy {
  mainList$: Subscription;
  mainList: Array<MailMainModel>;
  receiversList: Array<SimpleModel>;
  selectedRecord: MailMainModel;
  employeeDetail: any;
  userDetails: any;
  searchText: '';
  onTransaction = false;
  filter = {
    filterBeginDate: getFirstDayOfMonthForInput(),
    filterFinishDate: getTodayForInput(),
  };

  constructor(public authService: AuthenticationService, public service: MailService, public eService: ProfileService,
              public infoService: InformationService, public route: Router, public cService: CustomerService,
              public db: AngularFirestore, protected modalService: NgbModal, public excelService: ExcelService) {
  }

  ngOnInit() {
    this.populateList();
    this.userDetails = this.authService.isUserLoggedIn();
    this.employeeDetail = this.authService.isEmployeeLoggedIn();
  }

  ngOnDestroy() {
    if (this.mainList$ !== undefined) {
      this.mainList$.unsubscribe();
    }
  }

  populateList(): void {
    this.mainList = undefined;
    const beginDate = new Date(this.filter.filterBeginDate.year, this.filter.filterBeginDate.month - 1, this.filter.filterBeginDate.day, 0, 0, 0);
    const finishDate = new Date(this.filter.filterFinishDate.year, this.filter.filterFinishDate.month - 1, this.filter.filterFinishDate.day + 1, 0, 0, 0);
    this.mainList$ = this.service.getMainItemsBetweenDates(beginDate, finishDate).subscribe(list => {
      if (this.mainList === undefined) {
        this.mainList = [];
      }
      list.forEach((data: any) => {
        const item = data.returnData as MailMainModel;
        if (item.actionType === 'added') {
          this.mainList.push(item);
        }
        if (item.actionType === 'removed') {
          for (let i = 0; i < this.mainList.length; i++) {
            if (item.data.primaryKey === this.mainList[i].data.primaryKey) {
              this.mainList.splice(i, 1);
              break;
            }
          }
        }
        if (item.actionType === 'modified') {
          for (let i = 0; i < this.mainList.length; i++) {
            if (item.data.primaryKey === this.mainList[i].data.primaryKey) {
              this.mainList[i] = item;
              break;
            }
          }
        }
      });
    });
    setTimeout(() => {
      if (this.mainList === undefined) {
        this.mainList = [];
      }
    }, 1000);
  }

  showSelectedRecord(record: any): void {
    this.selectedRecord = record as MailMainModel;
  }

  btnNew_Click(): void {
    this.clearSelectedRecord();
  }

  async btnSave_Click() {
    this.onTransaction = true;
    try {
      Promise.all([this.service.checkForSave(this.selectedRecord)])
        .then(async (values: any) => {
          if (this.selectedRecord.data.primaryKey === null) {
            const mailAddress = this.selectedRecord.data.mailTo.split(';');
            if (this.selectedRecord.customerName.trim() === '') {this.selectedRecord.customerName = this.selectedRecord.data.mailTo;}
            const sendData = {
              receiverMailAddress: this.selectedRecord.data.mailTo,
              receiverName: this.selectedRecord.customerName,
              senderName: this.selectedRecord.employeeName,
              subject: this.selectedRecord.data.subject,
              content: this.selectedRecord.data.content
            };

            if (CONFIG.isSendMail) {
              emailjs.send(CONFIG.mjsServiceID, CONFIG.mjsMainTemplateID, sendData, CONFIG.mjsUserID)
                .then(async (result: EmailJSResponseStatus) => {
                  if (result.text === 'OK') {
                    this.selectedRecord.data.isSend = true;
                    this.selectedRecord.isSendTr = 'Gönderildi';
                  } else {
                    this.selectedRecord.data.isSend = false;
                    this.selectedRecord.isSendTr = 'Gönderilemedi';
                  }
                  this.selectedRecord.data.primaryKey = '';
                  await this.service.addItem(this.selectedRecord)
                    .then((item) => {
                      this.infoService.success('Mail başarıyla gönderildi.');
                      this.selectedRecord = undefined;
                    })
                    .catch((error) => {
                      this.finishProcess(error, null);
                    })
                    .finally(() => {
                      this.finishFinally();
                    });
                })
                .catch((error) => {
                  this.finishProcess(error, null);
                })
                .finally(() => {
                  this.finishFinally();
                });
            }
          }
        })
        .catch((error) => {
          this.finishProcess(error, null);
        });
    } catch (err) {
      this.infoService.error(err);
    }
  }

  async btnReturnList_Click(): Promise<void> {
    try {
      this.selectedRecord = undefined;
      await this.route.navigate(['mail-sender', {}]);
    } catch (err) {
      this.infoService.error(err);
    }
  }

  btnExportToExcel_Click(): void {
    if (this.mainList.length > 0) {
      this.excelService.exportToExcel(this.mainList, 'mail-sender');
    } else {
      this.infoService.error('Aktarılacak kayıt bulunamadı.');
    }
  }

  async btnShowMainFiler_Click(): Promise<void> {
    try {
      const modalRef = this.modalService.open(MainFilterComponent, {size: 'md'});
      modalRef.result.then((result: any) => {
        if (result) {
          this.filter.filterBeginDate = result.filterBeginDate;
          this.filter.filterFinishDate = result.filterFinishDate;
          this.ngOnDestroy();
          this.populateList();
        }
      }, () => {});
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnShowJsonData_Click(): Promise<void> {
    try {
      await this.infoService.showJsonData(JSON.stringify(this.selectedRecord, null, 2));
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnShowInfoModule_Click(): Promise<void> {
    try {
      this.modalService.open(InfoModuleComponent, {size: 'lg'});
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  onChangeType(record: any): void {
    this.receiversList = [];
    if (record === 'customer') {
      this.cService.getAllItems().subscribe(list => {
        list.forEach(item => {
          const key = item as CustomerModel;
          if (key.email !== '') {
            this.receiversList.push({key: key.primaryKey, value: key.name, text: key.email});
          }
        });
      });
    } else if (record === 'employee') {
      this.eService.getItems().subscribe(list => {
        list.forEach(item => {
          const key = item as ProfileModel;
          if (key.mailAddress !== '') {
            this.receiversList.push({key: key.primaryKey, value: key.longName, text: key.mailAddress});
          }
        });
      });
    } else {

    }
  }

  onChangeReceiver($event: any): void {
    try {
      this.selectedRecord.customerName = $event.target.options[$event.target.options.selectedIndex].text;
      const receiver = this.receiversList[$event.target.options.selectedIndex] as SimpleModel;
      this.selectedRecord.data.mailTo = receiver.text;
      // this.selectedRecord.data.mailTo += receiver.text + ';';
    } catch (err) {
      this.infoService.error(err);
    }
  }

  clearSelectedRecord(): void {
    this.selectedRecord = this.service.clearMainModel();
  }

  finishProcess(error: any, info: any): void {
    // error.message sistem hatası
    // error kontrol hatası
    if (error === null) {
      this.infoService.success(info !== null ? info : 'Belirtilmeyen Bilgi');
      this.clearSelectedRecord();
      this.selectedRecord = undefined;
    } else {
      this.infoService.error(error.message !== undefined ? error.message : error);
    }
    this.onTransaction = false;
  }

  finishFinally(): void {
    this.clearSelectedRecord();
    this.selectedRecord = undefined;
    this.onTransaction = false;
  }
}
