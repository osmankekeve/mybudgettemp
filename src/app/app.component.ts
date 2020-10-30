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
import {GlobalService} from './services/global.service';
import {CollectionMainModel} from './models/collection-main-model';
import {SalesInvoiceMainModel} from './models/sales-invoice-main-model';
import {PaymentMainModel} from './models/payment-main-model';
import {RouterModel} from './models/router-model';
import {ReminderMainModel} from './models/reminder-main-model';
import {AngularFireAuth} from '@angular/fire/auth';
import {SalesOrderService} from './services/sales-order.service';
import {SalesOrderMainModel} from './models/sales-order-main-model';
import {PurchaseOrderService} from './services/purchase-order.service';
import {PurchaseOrderMainModel} from './models/purchase-order-main-model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  notificationList: Array<LogModel> = [];
  actionList: Array<CustomerRelationModel> = [];
  reminderList: Array<ReminderMainModel> = [];
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
    private payService: PaymentService, public globService: GlobalService, protected angularFireAuth: AngularFireAuth,
    protected soService: SalesOrderService,  protected poService: PurchaseOrderService
  ) {
    this.selectedVal = 'login';
    this.isForgotPassword = false;
    this.angularFireAuth.authState.subscribe(userResponse => {
      if (userResponse) {
        this.userDetails = JSON.stringify(userResponse);
        sessionStorage.setItem('user', this.userDetails);
      } else {
        sessionStorage.setItem('user', null);
      }
    });
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
      this.populateNotificationList();
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
            if (res != null) {
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
            }
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
      list.forEach((data: any) => {
        const item = data.returnData as ReminderMainModel;
        if (item.actionType === 'added') {
          this.reminderCount++;
          this.reminderList.push(item);
        }
        if (item.actionType === 'removed') {
          for (let i = 0; i < this.reminderList.length; i++) {
            if (item.data.primaryKey === this.reminderList[i].data.primaryKey) {
              this.reminderCount--;
              this.reminderList.splice(i, 1);
              break;
            }
          }
        }
        if (item.actionType === 'modified') {
          for (let i = 0; i < this.reminderList.length; i++) {
            if (item.data.primaryKey === this.reminderList[i].data.primaryKey) {
              this.reminderList[i] = item;
              break;
            }
          }
        }
      });
    });
  }

  populateEmployeeReminderList(): void {

    this.remService.getEmployeeOneTimeReminderCollection(getTodayStart()).subscribe(list => {
      list.forEach((data: any) => {
        const item = data.returnData as ReminderMainModel;
        if (item.actionType === 'added') {
          this.reminderCount++;
          this.reminderList.push(item);
        }
        if (item.actionType === 'removed') {
          for (let i = 0; i < this.reminderList.length; i++) {
            if (item.data.primaryKey === this.reminderList[i].data.primaryKey) {
              this.reminderCount--;
              this.reminderList.splice(i, 1);
              break;
            }
          }
        }
        if (item.actionType === 'modified') {
          for (let i = 0; i < this.reminderList.length; i++) {
            if (item.data.primaryKey === this.reminderList[i].data.primaryKey) {
              this.reminderList[i] = item;
              break;
            }
          }
        }
      });
    });

    this.remService.getEmployeeDailyReminderCollection(getTodayStart()).subscribe(list => {
      list.forEach((data: any) => {
        const item = data.returnData as ReminderMainModel;
        if (item.actionType === 'added') {
          this.reminderCount++;
          this.reminderList.push(item);
        }
        if (item.actionType === 'removed') {
          for (let i = 0; i < this.reminderList.length; i++) {
            if (item.data.primaryKey === this.reminderList[i].data.primaryKey) {
              this.reminderCount--;
              this.reminderList.splice(i, 1);
              break;
            }
          }
        }
        if (item.actionType === 'modified') {
          for (let i = 0; i < this.reminderList.length; i++) {
            if (item.data.primaryKey === this.reminderList[i].data.primaryKey) {
              this.reminderList[i] = item;
              break;
            }
          }
        }
      });
    });

    this.remService.getEmployeeMonthlyReminderCollection(getTodayStart()).subscribe(list => {
      list.forEach((data: any) => {
        const item = data.returnData as ReminderMainModel;
        if (item.actionType === 'added') {
          this.reminderCount++;
          this.reminderList.push(item);
        }
        if (item.actionType === 'removed') {
          for (let i = 0; i < this.reminderList.length; i++) {
            if (item.data.primaryKey === this.reminderList[i].data.primaryKey) {
              this.reminderCount--;
              this.reminderList.splice(i, 1);
              break;
            }
          }
        }
        if (item.actionType === 'modified') {
          for (let i = 0; i < this.reminderList.length; i++) {
            if (item.data.primaryKey === this.reminderList[i].data.primaryKey) {
              this.reminderList[i] = item;
              break;
            }
          }
        }
      });
    });

    this.remService.getEmployeeYearlyReminderCollection(getTodayStart()).subscribe(list => {
      list.forEach((data: any) => {
        const item = data.returnData as ReminderMainModel;
        if (item.actionType === 'added') {
          this.reminderCount++;
          this.reminderList.push(item);
        }
        if (item.actionType === 'removed') {
          for (let i = 0; i < this.reminderList.length; i++) {
            if (item.data.primaryKey === this.reminderList[i].data.primaryKey) {
              this.reminderCount--;
              this.reminderList.splice(i, 1);
              break;
            }
          }
        }
        if (item.actionType === 'modified') {
          for (let i = 0; i < this.reminderList.length; i++) {
            if (item.data.primaryKey === this.reminderList[i].data.primaryKey) {
              this.reminderList[i] = item;
              break;
            }
          }
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
        workData.transactionType = 'purchaseInvoice';
        workData.transactionPrimaryKey = item.data.primaryKey;
        workData.insertDate = item.data.insertDate;
        workData.log = item.data.receiptNo + ' fiş numaralı Alım Faturası onay bekliyor.';

        if (item.actionType === 'added') {
          this.waitingWorksCount++;
          this.waitingWorkList.push(workData);
        }
        if ((item.actionType === 'removed') || (item.actionType === 'modified' && item.data.status !== 'waitingForApprove')) {
          this.waitingWorksCount--;
          this.waitingWorkList.splice(this.waitingWorkList.indexOf(workData), 1);
        }
      });
    });
    this.siService.getMainItemsBetweenDatesWithCustomer(null, null, null, 'waitingForApprove')
      .subscribe(list => {
      list.forEach((data: any) => {
        const item = data.returnData as SalesInvoiceMainModel;
        const workData = new WaitingWorkModel();
        workData.transactionType = 'salesInvoice';
        workData.transactionPrimaryKey = item.data.primaryKey;
        workData.insertDate = item.data.insertDate;
        workData.log = item.data.receiptNo + ' fiş numaralı Satış Faturası onay bekliyor.';

        if (item.actionType === 'added') {
          this.waitingWorksCount++;
          this.waitingWorkList.push(workData);
        }
        if ((item.actionType === 'removed') || (item.actionType === 'modified' && item.data.status !== 'waitingForApprove')) {
          this.waitingWorksCount--;
          this.waitingWorkList.splice(this.waitingWorkList.indexOf(workData), 1);
        }
      });
    });
    this.colService.getMainItemsBetweenDatesWithCustomer(null, null, null, 'waitingForApprove')
      .subscribe(list => {
      list.forEach((data: any) => {
        const item = data.returnData as CollectionMainModel;
        const workData = new WaitingWorkModel();
        workData.transactionType = 'collection';
        workData.transactionPrimaryKey = item.data.primaryKey;
        workData.insertDate = item.data.insertDate;
        workData.log = item.data.receiptNo + ' fiş numaralı Tahsilat onay bekliyor.';

        if (item.actionType === 'added') {
          this.waitingWorksCount++;
          this.waitingWorkList.push(workData);
        }
        if ((item.actionType === 'removed') || (item.actionType === 'modified' && item.data.status !== 'waitingForApprove')) {
          this.waitingWorksCount--;
          this.waitingWorkList.splice(this.waitingWorkList.indexOf(workData), 1);
        }
      });
    });
    this.payService.getMainItemsBetweenDatesWithCustomer(null, null, null, 'waitingForApprove')
      .subscribe(list => {
      list.forEach((data: any) => {
        const item = data.returnData as PaymentMainModel;
        const workData = new WaitingWorkModel();
        workData.transactionType = 'payment';
        workData.transactionPrimaryKey = item.data.primaryKey;
        workData.insertDate = item.data.insertDate;
        workData.log = item.data.receiptNo + ' fiş numaralı Ödeme onay bekliyor.';

        if (item.actionType === 'added') {
          this.waitingWorksCount++;
          this.waitingWorkList.push(workData);
        }
        if ((item.actionType === 'removed') || (item.actionType === 'modified' && item.data.status !== 'waitingForApprove')) {
          this.waitingWorksCount--;
          this.waitingWorkList.splice(this.waitingWorkList.indexOf(workData), 1);
        }
      });
    });
    const type = [];
    type.push('waitingForApprove');
    this.soService.getMainItemsBetweenDates(null, null,  type)
      .subscribe(list => {
        list.forEach((data: any) => {
          const item = data.returnData as SalesOrderMainModel;
          const workData = new WaitingWorkModel();
          workData.transactionType = 'salesOrder';
          workData.transactionPrimaryKey = item.data.primaryKey;
          workData.insertDate = item.data.insertDate;
          workData.log = item.data.receiptNo + ' fiş numaralı Satış Siparişi onay bekliyor.';

          if (item.actionType === 'added') {
            this.waitingWorksCount++;
            this.waitingWorkList.push(workData);
          }
          if ((item.actionType === 'removed') || (item.actionType === 'modified' && item.data.status !== 'waitingForApprove')) {
            this.waitingWorksCount--;
            this.waitingWorkList.splice(this.waitingWorkList.indexOf(workData), 1);
          }
        });
      });
    this.poService.getMainItemsBetweenDates(null, null,  type)
      .subscribe(list => {
        list.forEach((data: any) => {
          const item = data.returnData as PurchaseOrderMainModel;
          const workData = new WaitingWorkModel();
          workData.transactionType = 'purchaseOrder';
          workData.transactionPrimaryKey = item.data.primaryKey;
          workData.insertDate = item.data.insertDate;
          workData.log = item.data.receiptNo + ' fiş numaralı Alım Siparişi onay bekliyor.';

          if (item.actionType === 'added') {
            this.waitingWorksCount++;
            this.waitingWorkList.push(workData);
          }
          if ((item.actionType === 'removed') || (item.actionType === 'modified' && item.data.status !== 'waitingForApprove')) {
            this.waitingWorksCount--;
            this.waitingWorkList.splice(this.waitingWorkList.indexOf(workData), 1);
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
            this.logService.addToLogUser(
              'employee',
              this.authService.getEid(),
              'login',
              'Web Sistem girişi başarılı.',
              this.authService.getEid());
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

  async showReminder(item: any): Promise<void> {
    await this.router.navigate(['reminder', {primaryKey: item.data.primaryKey}]);
  }

  async showWaitingWorkRecord(item: any): Promise<void> {
    const r = new RouterModel();
    r.nextModule = item.transactionType;
    r.nextModulePrimaryKey = item.transactionPrimaryKey;
    r.previousModule = 'dashboard';
    r.previousModulePrimaryKey = '';
    await this.globService.showTransactionRecord(r);
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
