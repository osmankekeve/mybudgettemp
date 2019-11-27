import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from './services/authentication.service';
import { LogModel } from './models/log-model';
import { LogService } from './services/log.service';
import { InformationService } from './services/information.service';
import {CustomerRelationService} from './services/crm.service';
import {CustomerRelationModel} from './models/customer-relation-model';
import {getDateAndTime, getTodayEnd, getTodayStart, getTomorrowEnd} from './core/correct-library';
import {ReminderService} from './services/reminder.service';
import {ActivatedRoute, Router} from '@angular/router';
import {AngularFirestore} from '@angular/fire/firestore';
import {ReminderModel} from './models/reminder-model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  notificationList: Array<LogModel> = [];
  actionList: Array<CustomerRelationModel> = [];
  reminderList: Array<CustomerRelationModel> = [];

  title = 'MyBudgetWeb';
  selectedVal: string;
  emailInput: string;
  passwordInput: string;
  isForgotPassword: boolean;
  userDetails: any;
  notificationCount = 0;
  showNotificationPanel = false;
  actionCount = 0;
  showActionPanel = false;
  reminderCount = 0;
  showReminderPanel = false;
  showProfilePanel = false;
  employeeDetail: any;
  employeeEmail: string;
  employeePassword: string;

  constructor(
    private authService: AuthenticationService, public infoService: InformationService, public router: Router,
    private logService: LogService, private remService: ReminderService, public crmService: CustomerRelationService
  ) {
    this.selectedVal = 'login';
    this.isForgotPassword = false;
  }

  ngOnInit() {
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
    }
  }

  // SignOut Firebase Session and Clean LocalStorage
  logoutUser() {
    this.authService.logout()
      .then(res => {
        this.userDetails = undefined;
        this.employeeDetail = undefined;
        localStorage.removeItem('user');
        localStorage.removeItem('employee');
        localStorage.clear();
      }, err => {
        this.infoService.error(err.message);
      });
  }

  // Login user with  provided Email/ Password
  loginUser() {
    this.authService.login(this.emailInput, this.passwordInput)
      .then(res => {
        this.infoService.success('Mail adresi ve şifre doğrulandı. Lütfen kullanıcı girişini gerçekleştiriniz.');
        this.isUserLoggedIn();
        this.populateActivityList();
      }, err => {
        this.infoService.error(err.message);
      });
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
          this.notificationCount ++;
          this.notificationList.push(item);
        } else if (item.actionType === 'removed') {
          this.notificationCount --;
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
          this.actionCount ++;
          this.actionList.push(item);
        } else if (item.actionType === 'removed') {
          this.actionCount --;
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
          this.reminderCount ++;
          this.reminderList.push(item);
        } else if (item.actionType === 'removed') {
          this.reminderCount --;
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
          this.reminderCount ++;
          this.reminderList.push(item);
        } else if (item.actionType === 'removed') {
          this.reminderCount --;
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
          this.reminderCount ++;
          this.reminderList.push(item);
        } else if (item.actionType === 'removed') {
          this.reminderCount --;
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
          this.reminderCount ++;
          this.reminderList.push(item);
        } else if (item.actionType === 'removed') {
          this.reminderCount --;
          this.reminderList.splice(this.reminderList.indexOf(item), 1);
        } else if (item.actionType === 'modified') {
          this.reminderList[this.reminderList.indexOf(item)] = item.data;
        } else {
          // nothing
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
    const data = await this.authService.employeeLogin(this.employeeEmail, this.employeePassword);
    if (data) {
      this.isEmployeeLoggedIn();
      this.infoService.success('Giriş başarılı. Sisteme yönlendiriliyorsunuz.');
    } else {
      this.infoService.error('Kullanıcı sistemde kayıtlı değil');
    }
  }

  showReminder(item: any): void {
    this.router.navigate(['reminder', {primaryKey: item.data.primaryKey}]);
  }

}
