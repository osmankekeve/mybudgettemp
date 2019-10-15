import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from './services/authentication.service';
import { LogModel } from './models/log-model';
import { LogService } from './services/log.service';
import { InformationService } from './services/information.service';
import {CustomerRelationService} from './services/crm.service';
import {CustomerRelationModel} from './models/customer-relation-model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  notificationList: Array<LogModel> = [];
  actionList: Array<CustomerRelationModel> = [];

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
  showProfilePanel = false;
  employeeDetail: any;
  employeeEmail: string;
  employeePassword: string;

  constructor(
    private authService: AuthenticationService, public infoService: InformationService,
    private logService: LogService, public crmService: CustomerRelationService
  ) {
    this.selectedVal = 'login';
    this.isForgotPassword = false;
  }

  ngOnInit() {
    this.isUserLoggedIn();
    this.isEmployeeLoggedIn();
  }

  // Check localStorage is having User Data
  isUserLoggedIn() {
    this.userDetails = this.authService.isUserLoggedIn();
    if (!this.userDetails) {
      this.employeeDetail = undefined;
    }
  }

  // Check localStorage is having employee Data
  isEmployeeLoggedIn() {
    this.employeeDetail = this.authService.isEmployeeLoggedIn();
    if (!this.employeeDetail) {
      this.employeeDetail = undefined;
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
        this.populateNotificationList();
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
    const date = new Date();
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
    const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
    this.logService.getNotificationsBetweenDates(start, end).subscribe(list => {
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
    const todayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
    const endDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 7, 23, 59, 59);
    this.crmService.getMainItemsBetweenDates(todayStart, endDate).subscribe(list => {
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

}
