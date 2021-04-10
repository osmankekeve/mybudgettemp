import {Component, OnInit, OnDestroy} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection} from '@angular/fire/firestore';
import {InformationService} from '../services/information.service';
import {AuthenticationService} from '../services/authentication.service';
import emailjs, {EmailJSResponseStatus} from 'emailjs-com';
import {ContactUsMainModel} from '../models/contact-us-main-model';
import {ContactUsService} from '../services/contact-us.service';
import {getDateForInput, getFirstDayOfMonthForInput, getTodayForInput, isNullOrEmpty} from '../core/correct-library';
import {Router} from '@angular/router';
import {CONFIG} from 'src/mail.config';
import { InfoModuleComponent } from '../partials/info-module/info-module.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ExcelService } from '../services/excel-service';
import { Subscription } from 'rxjs';
import { MainFilterComponent } from '../partials/main-filter/main-filter.component';

@Component({
  selector: 'app-contact-us',
  templateUrl: './contact-us.component.html',
  styleUrls: ['./contact-us.component.css']
})
export class ContactUsComponent implements OnInit, OnDestroy {
  mainList$: Subscription;
  mainList: Array<ContactUsMainModel>;
  collection: AngularFirestoreCollection<ContactUsMainModel>;
  selectedRecord: ContactUsMainModel;
  employeeDetail: any;
  filter = {
    filterBeginDate: getFirstDayOfMonthForInput(),
    filterFinishDate: getTodayForInput(),
  };
  searchText: '';
  onTransaction = false;

  constructor(public authService: AuthenticationService, public service: ContactUsService,
              public infoService: InformationService, public route: Router,
              public db: AngularFirestore, protected modalService: NgbModal, public excelService: ExcelService) {
  }

  ngOnInit() {
    this.employeeDetail = this.authService.isEmployeeLoggedIn();
    this.populateList();
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
        const item = data.returnData as ContactUsMainModel;
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
    this.selectedRecord = record as ContactUsMainModel;
  }

  btnNew_Click(): void {
    this.clearSelectedRecord();
  }

  async btnSave_Click(): Promise<void> {
    try {
      Promise.all([this.service.checkForSave(this.selectedRecord)])
        .then(async (values: any) => {
          await this.service.addItem(this.selectedRecord)
            .then(() => {
              this.infoService.success('Ticket başarıyla kaydedildi. En kısa süre de dönüş yapılacaktır.');
              if (CONFIG.isSendMail) {
                emailjs.send(CONFIG.mjsServiceID, CONFIG.mjsContactUsTemplateID, {
                  mailTo: CONFIG.mailTo,
                  mailToName: CONFIG.mailToName,
                  mailFromName: CONFIG.mailFromName,
                  employeeName: this.selectedRecord.employeeName,
                  content: this.selectedRecord.data.content
                }, CONFIG.mjsUserID).then((result: EmailJSResponseStatus) => {
                  console.log(result.text);
                }, (error) => {
                  console.log(error.text);
                });
              }
            })
            .catch((error) => {
              this.finishProcessAndError(error);
            });
        })
        .catch((error) => {
          this.finishProcessAndError(error);
        });
    } catch (error) {
      this.finishProcessAndError(error);
    }
  }

  btnReturnList_Click(): void {
    this.selectedRecord = undefined;
    this.route.navigate(['contact-us', {}]);
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

  btnExportToExcel_Click(): void {
    if (this.mainList.length > 0) {
      this.excelService.exportToExcel(this.mainList, 'contact-us');
    } else {
      this.infoService.error('Aktarılacak kayıt bulunamadı.');
    }
  }

  clearSelectedRecord(): void {
    this.selectedRecord = this.service.clearMainModel();
  }

  finishProcessAndError(error: any): void {
    // error.message sistem hatası
    // error kontrol hatası
    this.onTransaction = false;
    this.infoService.error(error.message !== undefined ? error.message : error);
  }
}
