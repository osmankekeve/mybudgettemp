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
  responseMessage = '';
  responseMessageType = '';
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
    this.populateNotificationList();
    this.populateActivityList();
  }

  showMessage(type, msg) {
    this.responseMessageType = type;
    this.responseMessage = msg;
    setTimeout(() => {
      this.responseMessage = '';
    }, 2000);
  }

  // Called on switching Login/ Register tabs
  public onValChange(val: string) {
    this.showMessage('', '');
    this.selectedVal = val;
  }

  // Check localStorage is having User Data
  isUserLoggedIn() {
    this.userDetails = this.authService.isUserLoggedIn();
    if (!this.userDetails) {
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
        this.showMessage('danger', err.message);
      });
  }

  // Login user with  provided Email/ Password
  loginUser() {
    this.responseMessage = '';
    this.authService.login(this.emailInput, this.passwordInput)
      .then(res => {
        this.showMessage('success', 'Mail adresi ve şifre doğrulandı. Lütfen kullanıcı girişini gerçekleştiriniz.');
        this.isUserLoggedIn();
      }, err => {
        this.showMessage('danger', err.message);
      });
  }

  // Register user with  provided Email/ Password
  registerUser() {
    this.authService.register(this.emailInput, this.passwordInput)
      .then(res => {

        // Send Varification link in email
        this.authService.sendEmailVerification().then(res => {
          this.isForgotPassword = false;
          this.showMessage('success', 'Registration Successful! Please Verify Your Email');
        }, err => {
          this.showMessage('danger', err.message);
        });
        this.isUserLoggedIn();


      }, err => {
        this.showMessage('danger', err.message);
      });
  }

  // Send link on given email to reset password
  forgotPassword() {
    this.authService.sendPasswordResetEmail(this.emailInput)
      .then(res => {
        this.isForgotPassword = false;
        this.showMessage('success', 'Please Check Your Email');
      }, err => {
        this.showMessage('danger', err.message);
      });
  }

  // Open Popup to Login with Google Account
  googleLogin() {
    this.authService.loginWithGoogle()
      .then(res => {
        this.showMessage('success', 'Successfully Logged In with Google');
        this.isUserLoggedIn();
      }, err => {
        this.showMessage('danger', err.message);
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
    this.responseMessage = '';
    const data = await this.authService.employeeLogin(this.employeeEmail, this.employeePassword);
    console.log(data);
  }

}
