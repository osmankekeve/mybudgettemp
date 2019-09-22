import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from './services/authentication.service';
import { LogModel } from './models/log-model';
import { LogService } from './services/log.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  notificationList: Array<LogModel> = [];

  title = 'MyBudgetWeb';
  selectedVal: string;
  responseMessage = '';
  responseMessageType = '';
  emailInput: string;
  passwordInput: string;
  isForgotPassword: boolean;
  userDetails: any;
  notificationCount = 0;
  showSnotificationPanel = false;

  constructor(
    private authService: AuthenticationService,
    private logService: LogService
  ) {
    this.selectedVal = 'login';
    this.isForgotPassword = false;
  }

  ngOnInit() {
    this.isUserLoggedIn();
    this.populateNotificationList();
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
  }

  // SignOut Firebase Session and Clean LocalStorage
  logoutUser() {
    this.authService.logout()
      .then(res => {
        console.log(res);
        this.userDetails = undefined;
        localStorage.removeItem('user');
      }, err => {
        this.showMessage('danger', err.message);
      });
  }

  // Login user with  provided Email/ Password
  loginUser() {
    this.responseMessage = '';
    this.authService.login(this.emailInput, this.passwordInput)
      .then(res => {
        console.log(res);
        this.showMessage('success', 'Successfully Logged In!');
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
          console.log(res);
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
        console.log(res);
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
        console.log(res);
        this.showMessage('success', 'Successfully Logged In with Google');
        this.isUserLoggedIn();
      }, err => {
        this.showMessage('danger', err.message);
      });
  }

  populateNotificationList(): void {
    const date = new Date();
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const end = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
    this.logService.getNotificationsBetweenDates(start, end).subscribe(list => {
      console.log(list);
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

}
