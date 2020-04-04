import {Component, OnInit} from '@angular/core';
import {AuthenticationService} from './services/authentication.service';
import {LogModel} from './models/log-model';
import {LogService} from './services/log.service';
import {InformationService} from './services/information.service';
import {CustomerRelationService} from './services/crm.service';
import {CustomerRelationModel} from './models/customer-relation-model';
import {getBool, getFloat, getString, getTodayEnd, getTodayStart, getTomorrowEnd} from './core/correct-library';
import {ReminderService} from './services/reminder.service';
import {Router} from '@angular/router';
import {CookieService} from 'ngx-cookie-service';
import {AccountTransactionService} from './services/account-transaction.service';
import {SettingService} from './services/setting.service';
import {PurchaseInvoiceMainModel} from './models/purchase-invoice-main-model';
import {PurchaseInvoiceService} from './services/purchase-invoice.service';
import {WaitingWorkModel} from './models/waiting-work-model';
import {SalesInvoiceService} from './services/sales-invoice.service';
import {CollectionService} from './services/collection.service';
import {PaymentService} from './services/payment.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  notificationList: Array<LogModel> = [];
  actionList: Array<CustomerRelationModel> = [];
  reminderList: Array<CustomerRelationModel> = [];
  waitingWorkList: Array<WaitingWorkModel> = [];

  title = 'MyBudgetWeb';
  selectedVal: string;
  emailInput = '';
  passwordInput: string;
  isForgotPassword: boolean;
  userDetails: any;
  notificationCount = 0;
  showNotificationPanel = false;
  actionCount = 0;
  showActionPanel = false;
  reminderCount = 0;
  showReminderPanel = false;
  waitingWorksCount = 0;
  showWaitingWorksPanel = false;
  showProfilePanel = false;
  employeeDetail: any;
  employeeEmail: string;
  employeePassword: string;
  isCMAChecked = false;
  cookieCMA = ''; // Company Mail Address
  isEMAChecked = false;
  cookieEMA = ''; // Company Mail Address
  onTransaction = false;

  constructor(
    private authService: AuthenticationService, private infoService: InformationService, private router: Router,
    private logService: LogService, private remService: ReminderService, private crmService: CustomerRelationService,
    private cookieService: CookieService, public atService: AccountTransactionService, private setService: SettingService,
    private piService: PurchaseInvoiceService, private siService: SalesInvoiceService, private colService: CollectionService,
    private payService: PaymentService,
  ) {
    this.selectedVal = 'login';
    this.isForgotPassword = false;
  }

  ngOnInit() {
    /*if (this.cookieService.check('cookieCMA')) {
      const cookieCMA: string = getString(this.cookieService.get('cookieCMA'));
      this.emailInput = cookieCMA;
      this.isCMAChecked = true;
    }
    if (this.cookieService.check('cookieEMA')) {
      const cookieEMA: string = getString(this.cookieService.get('cookieEMA'));
      this.employeeEmail = cookieEMA;
      this.isEMAChecked = true;
    }*/
    if (localStorage.getItem('cookieCMA') !== null) {
      this.emailInput = getString(localStorage.getItem('cookieCMA'));
      this.isCMAChecked = true;
    }
    if (localStorage.getItem('cookieEMA') !== null) {
      this.employeeEmail = getString(localStorage.getItem('cookieEMA'));
      this.isEMAChecked = true;
    }
    this.isUserLoggedIn();
  }

  // Check localStorage is having User Data
  isUserLoggedIn() {
    this.userDetails = this.authService.isUserLoggedIn();
    if (!this.userDetails) {
      this.employeeDetail = undefined;
    } else {
      this.isEmployeeLoggedIn();
      this.populateNotificationList();
      this.populateReminderList();
      this.populateActivityList();
    }
  }

  // Check localStorage is having employee Data
  isEmployeeLoggedIn() {
    this.employeeDetail = this.authService.isEmployeeLoggedIn();
    if (!this.employeeDetail) {
      this.employeeDetail = undefined;
    } else {
      this.populateEmployeeReminderList();
      if (this.employeeDetail.data.type === 'manager' || this.employeeDetail.data.type === 'admin') {
        this.populateWaitingWorks();
      }
    }
  }

  // SignOut Firebase Session and Clean LocalStorage
  logoutUser() {
    this.authService.logout()
      .then(res => {
        this.userDetails = undefined;
        this.employeeDetail = undefined;
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('employee');
        sessionStorage.clear();
      }, err => {
        this.infoService.error(err.message);
      });
  }

  // Login user with  provided Email/ Password
  btnLoginUser_Click() {
    this.onTransaction = true;
    try {
      if (this.emailInput === undefined || this.emailInput.trim() === '') {
        this.finishProcess('Lütfen sistem mail adresi giriniz.', null);
      } else if (this.passwordInput === undefined || this.passwordInput.trim() === '') {
        this.finishProcess('Lütfen sistem şifresi giriniz.', null);
      } else {
        this.authService.login(this.emailInput, this.passwordInput)
          .then(res => {
            this.isUserLoggedIn();
            this.populateSettings();
            if (this.isCMAChecked) {
              localStorage.setItem('cookieCMA', this.emailInput);
            } else {
              if (localStorage.getItem('cookieCMA') !== null) {
                localStorage.removeItem('cookieCMA');
              }
            }
            this.finishProcess(null, 'Mail adresi ve şifre doğrulandı. Lütfen kullanıcı girişini gerçekleştiriniz.');
          })
          .catch((error) => {
            this.finishProcess(error, null);
          })
          .finally(() => {
            this.finishFinally();
          });
      }
    } catch (error) {
      this.finishProcess(error, null);
    }
  }

  // Register user with  provided Email/ Password
  registerUser() {
    this.authService.register(this.emailInput, this.passwordInput)
      .then(res => {

        // Send Varification link in email
        this.authService.sendEmailVerification().then(res2 => {
          this.isForgotPassword = false;
          this.infoService.success('Registration Successful! Please Verify Your Email');
        }, err => {
          this.infoService.error(err.message);
        });
        this.isUserLoggedIn();
      }, err => {
        this.infoService.error(err.message);
      });
  }

  // Send link on given email to reset password
  forgotPassword() {
    this.authService.sendPasswordResetEmail(this.emailInput)
      .then(res => {
        this.isForgotPassword = false;
        this.infoService.success('Please Check Your Email');
      }, err => {
        this.infoService.error(err.message);
      });
  }

  // Open Popup to Login with Google Account
  googleLogin() {
    this.authService.loginWithGoogle()
      .then(res => {
        this.infoService.success('Successfully Logged In with Google');
        this.isUserLoggedIn();
      }, err => {
        this.infoService.error(err.message);
      });
  }

  populateNotificationList(): void {
    this.logService.getNotificationsBetweenDates(getTodayStart(), getTodayEnd()).subscribe(list => {
      list.forEach((item: any) => {
        if (item.actionType === 'added') {
          this.notificationCount++;
          this.notificationList.push(item);
        } else if (item.actionType === 'removed') {
          this.notificationCount--;
          this.notificationList.splice(this.notificationList.indexOf(item), 1);
        } else {
          // nothing
        }
      });
    });
  }

  populateActivityList(): void {
    const date = new Date();
    const endDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 7, 23, 59, 59);
    this.crmService.getMainItemsBetweenDates(getTodayStart(), endDate).subscribe(list => {
      list.forEach((item: any) => {
        if (item.actionType === 'added') {
          this.actionCount++;
          this.actionList.push(item);
        } else if (item.actionType === 'removed') {
          this.actionCount--;
          this.actionList.splice(this.actionList.indexOf(item), 1);
        } else if (item.actionType === 'modified') {
          this.actionList[this.actionList.indexOf(item)] = item.data;
        } else {
          // nothing
        }
      });
    });
  }

  populateReminderList(): void {
    this.remService.getMainItemsBetweenDates(getTodayStart(), getTomorrowEnd()).subscribe(list => {
      list.forEach((item: any) => {
        if (item.actionType === 'added') {
          this.reminderCount++;
          this.reminderList.push(item);
        } else if (item.actionType === 'removed') {
          this.reminderCount--;
          this.reminderList.splice(this.reminderList.indexOf(item), 1);
        } else if (item.actionType === 'modified') {
          this.reminderList[this.reminderList.indexOf(item)] = item.data;
        } else {
          // nothing
        }
      });
    });
  }

  populateEmployeeReminderList(): void {
    this.remService.getEmployeeDailyReminderCollection(getTodayStart()).subscribe(list => {
      list.forEach((item: any) => {
        if (item.actionType === 'added') {
          this.reminderCount++;
          this.reminderList.push(item);
        } else if (item.actionType === 'removed') {
          this.reminderCount--;
          this.reminderList.splice(this.reminderList.indexOf(item), 1);
        } else if (item.actionType === 'modified') {
          this.reminderList[this.reminderList.indexOf(item)] = item.data;
        } else {
          // nothing
        }
      });
    });

    this.remService.getEmployeeMonthlyReminderCollection(getTodayStart()).subscribe(list => {
      list.forEach((item: any) => {
        if (item.actionType === 'added') {
          this.reminderCount++;
          this.reminderList.push(item);
        } else if (item.actionType === 'removed') {
          this.reminderCount--;
          this.reminderList.splice(this.reminderList.indexOf(item), 1);
        } else if (item.actionType === 'modified') {
          this.reminderList[this.reminderList.indexOf(item)] = item.data;
        } else {
          // nothing
        }
      });
    });

    this.remService.getEmployeeYearlyReminderCollection(getTodayStart()).subscribe(list => {
      list.forEach((item: any) => {
        if (item.actionType === 'added') {
          this.reminderCount++;
          this.reminderList.push(item);
        } else if (item.actionType === 'removed') {
          this.reminderCount--;
          this.reminderList.splice(this.reminderList.indexOf(item), 1);
        } else if (item.actionType === 'modified') {
          this.reminderList[this.reminderList.indexOf(item)] = item.data;
        } else {
          // nothing
        }
      });
    });
  }

  populateSettings(): void {

  }

  populateWaitingWorks(): void {
    this.piService.getMainItemsBetweenDatesWithCustomer(null, null, null, 'waitingForApprove')
      .subscribe(list => {
      list.forEach((data: any) => {
        const item = data.returnData as PurchaseInvoiceMainModel;
        const workData = new WaitingWorkModel();
        workData.parentType = 'purchaseInvoice';
        workData.parentPrimaryKey = item.data.primaryKey;
        workData.insertDate = item.data.insertDate;
        workData.log = item.data.receiptNo + ' fiş numaralı Alım Faturası onay bekliyor.';

        if (item.actionType === 'added') {
          this.waitingWorksCount++;
          this.waitingWorkList.push(workData);
        }
        if ((item.actionType === 'removed') || (item.actionType === 'modified' && item.data.status !== 'waitingForApprove')) {
          this.reminderCount--;
          this.reminderList.splice(this.waitingWorkList.indexOf(workData), 1);
        }
      });
    });
    this.siService.getMainItemsBetweenDatesWithCustomer(null, null, null, 'waitingForApprove')
      .subscribe(list => {
      list.forEach((data: any) => {
        const item = data.returnData as PurchaseInvoiceMainModel;
        const workData = new WaitingWorkModel();
        workData.parentType = 'salesInvoice';
        workData.parentPrimaryKey = item.data.primaryKey;
        workData.insertDate = item.data.insertDate;
        workData.log = item.data.receiptNo + ' fiş numaralı Satış Faturası onay bekliyor.';

        if (item.actionType === 'added') {
          this.waitingWorksCount++;
          this.waitingWorkList.push(workData);
        }
        if ((item.actionType === 'removed') || (item.actionType === 'modified' && item.data.status !== 'waitingForApprove')) {
          this.reminderCount--;
          this.reminderList.splice(this.waitingWorkList.indexOf(workData), 1);
        }
      });
    });
    this.colService.getMainItemsBetweenDatesWithCustomer(null, null, null, 'waitingForApprove')
      .subscribe(list => {
      list.forEach((data: any) => {
        const item = data.returnData as PurchaseInvoiceMainModel;
        const workData = new WaitingWorkModel();
        workData.parentType = 'collection';
        workData.parentPrimaryKey = item.data.primaryKey;
        workData.insertDate = item.data.insertDate;
        workData.log = item.data.receiptNo + ' fiş numaralı Tahsilat onay bekliyor.';

        if (item.actionType === 'added') {
          this.waitingWorksCount++;
          this.waitingWorkList.push(workData);
        }
        if ((item.actionType === 'removed') || (item.actionType === 'modified' && item.data.status !== 'waitingForApprove')) {
          this.reminderCount--;
          this.reminderList.splice(this.waitingWorkList.indexOf(workData), 1);
        }
      });
    });
    this.payService.getMainItemsBetweenDatesWithCustomer(null, null, null, 'waitingForApprove')
      .subscribe(list => {
      list.forEach((data: any) => {
        const item = data.returnData as PurchaseInvoiceMainModel;
        const workData = new WaitingWorkModel();
        workData.parentType = 'payment';
        workData.parentPrimaryKey = item.data.primaryKey;
        workData.insertDate = item.data.insertDate;
        workData.log = item.data.receiptNo + ' fiş numaralı Ödeme onay bekliyor.';

        if (item.actionType === 'added') {
          this.waitingWorksCount++;
          this.waitingWorkList.push(workData);
        }
        if ((item.actionType === 'removed') || (item.actionType === 'modified' && item.data.status !== 'waitingForApprove')) {
          this.reminderCount--;
          this.reminderList.splice(this.waitingWorkList.indexOf(workData), 1);
        }
      });
    });
  }

  setNotificationToPassive(item: any): void {
    const refModel = item;
    item.data.isActive = false;
    this.logService.updateItem(item.data).then(() => {
      this.notificationList.splice(this.notificationList.indexOf(refModel), 1);
    }).catch(err => this.infoService.error(err));

  }

  async getAssignedUser(): Promise<string> {
    return await this.authService.employeeLogin(this.employeeEmail, this.employeePassword);
  }

  async btnLoginEmployee_Click() {
    try {
      this.onTransaction = true;
      if (this.employeeEmail === undefined || this.employeeEmail.trim() === '') {
        this.finishProcess('Lütfen mail adresi giriniz.', null);
      } else if (this.employeePassword === undefined || this.employeePassword.trim() === '') {
        this.finishProcess('Lütfen şifre giriniz.', null);
      } else {
        await this.authService.employeeLogin(this.employeeEmail, this.employeePassword)
          .then(result => {
            this.isEmployeeLoggedIn();
            this.cookieService.set('loginTime', Date.now().toString());
            if (this.isEMAChecked) {
              localStorage.setItem('cookieEMA', this.employeeEmail);
            } else {
              if (localStorage.getItem('cookieEMA') !== null) {
                localStorage.removeItem('cookieEMA');
              }
            }
            this.logService.addToLog('employee', this.authService.getEid(), 'login', '');
            this.finishProcess(null, 'Giriş başarılı. Sisteme yönlendiriliyorsunuz.');
        })
          .catch((error) => {
            this.finishProcess(error, null);
          })
          .finally(() => {
            this.finishFinally();
          });
      }
    } catch (error) {
      this.finishProcess(error, null);
    }
  }

  showReminder(item: any): void {
    this.router.navigate(['reminder', {primaryKey: item.data.primaryKey}]);
  }

  showWaitingWorkRecord(item: any): void {
    //this.router.navigate(['reminder', {primaryKey: item.data.primaryKey}]);
  }

  finishProcessAndError(error: any): void {
    // error.message sistem hatası
    // error kontrol hatası
    this.onTransaction = false;
    this.infoService.error(error.message !== undefined ? error.message : error);
  }

  finishFinally(): void {
    this.onTransaction = false;
  }

  finishProcess(error: any, info: any): void {
    // error.message sistem hatası
    // error kontrol hatası
    if (error === null) {
      this.infoService.success(info !== null ? info : 'Belirtilmeyen Bilgi');
    } else {
      this.infoService.error(error.message !== undefined ? error.message : error);
    }
    this.onTransaction = false;
  }

}
