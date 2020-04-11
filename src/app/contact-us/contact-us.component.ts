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

@Component({
  selector: 'app-contact-us',
  templateUrl: './contact-us.component.html',
  styleUrls: ['./contact-us.component.css']
})
export class ContactUsComponent implements OnInit, OnDestroy {
  mainList: Array<ContactUsMainModel>;
  collection: AngularFirestoreCollection<ContactUsMainModel>;
  selectedRecord: ContactUsMainModel;
  employeeDetail: any;
  isMainFilterOpened = false;
  filterBeginDate: any;
  filterFinishDate: any;
  searchText: '';
  onTransaction = false;

  constructor(public authService: AuthenticationService, public service: ContactUsService,
              public infoService: InformationService, public route: Router,
              public db: AngularFirestore) {
  }

  ngOnInit() {
    this.clearMainFiler();
    this.employeeDetail = this.authService.isEmployeeLoggedIn();
    this.populateList();
  }

  ngOnDestroy(): void {
  }

  populateList(): void {
    this.mainList = undefined;
    const beginDate = new Date(this.filterBeginDate.year, this.filterBeginDate.month - 1, this.filterBeginDate.day, 0, 0, 0);
    const finishDate = new Date(this.filterFinishDate.year, this.filterFinishDate.month - 1, this.filterFinishDate.day + 1, 0, 0, 0);
    this.service.getMainItemsBetweenDates(beginDate, finishDate).subscribe(list => {
      if (this.mainList === undefined) {
        this.mainList = [];
      }
      list.forEach((data: any) => {
        const item = data.returnData as ContactUsMainModel;
        if (item.actionType === 'added') {
          this.mainList.push(item);
        }
        if (item.actionType === 'removed') {
          // tslint:disable-next-line:prefer-for-of
          for (let i = 0; i < this.mainList.length; i++) {
            if (item.data.primaryKey === this.mainList[i].data.primaryKey) {
              this.mainList.splice(i, 1);
            }
          }
        }
        if (item.actionType === 'modified') {
          // tslint:disable-next-line:prefer-for-of
          for (let i = 0; i < this.mainList.length; i++) {
            if (item.data.primaryKey === this.mainList[i].data.primaryKey) {
              this.mainList[i] = item;
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

  btnShowMainFiler_Click(): void {
    if (this.isMainFilterOpened === true) {
      this.isMainFilterOpened = false;
    } else {
      this.isMainFilterOpened = true;
    }
    this.clearMainFiler();
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

  btnMainFilter_Click(): void {
    if (isNullOrEmpty(this.filterBeginDate)) {
      this.infoService.error('Lütfen başlangıç tarihi filtesinden tarih seçiniz.');
    } else if (isNullOrEmpty(this.filterFinishDate)) {
      this.infoService.error('Lütfen bitiş tarihi filtesinden tarih seçiniz.');
    } else {
      this.populateList();
    }
  }

  clearSelectedRecord(): void {
    this.selectedRecord = this.service.clearMainModel();
  }

  clearMainFiler(): void {
    this.filterBeginDate = getFirstDayOfMonthForInput();
    this.filterFinishDate = getTodayForInput();
  }

  finishProcessAndError(error: any): void {
    // error.message sistem hatası
    // error kontrol hatası
    this.onTransaction = false;
    this.infoService.error(error.message !== undefined ? error.message : error);
  }
}
