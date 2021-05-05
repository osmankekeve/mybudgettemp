import { Component, OnInit, AfterViewInit, OnDestroy  } from '@angular/core';
import * as $ from 'jquery';
import { AuthenticationService } from '../services/authentication.service';
import {CookieService} from 'ngx-cookie-service';
import { RefrasherService } from '../services/refrasher.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-side-nav-bar',
  templateUrl: './side-nav-bar.component.html',
  styleUrls: ['./side-nav-bar.component.css']
})
export class SideNavBarComponent implements OnInit , OnDestroy , AfterViewInit {
  companySubscription: Subscription;
  userDetails: any;
  employeeDetail: any;
  companyDetail: any;
  loginTime: any;
  projectVersion: any;

  constructor( private authService: AuthenticationService, private service: RefrasherService,
               private cookieService: CookieService) {
                //this.companySubscription = this.service.companyDetail$.subscribe(data => { this.companyDetail = data; }); burasida calisiyor
                this.companySubscription = this.service.companyDetail.subscribe(data => { this.companyDetail = data; });
               }

  ngOnInit() {
    this.userDetails = this.authService.isUserLoggedIn();
    if (this.userDetails) {
      this.employeeDetail = this.authService.isEmployeeLoggedIn();
      if (!this.employeeDetail) {
        this.employeeDetail = undefined;
      } else {
        this.loginTime = this.cookieService.get('loginTime');
      }
    }
    this.companyDetail = JSON.parse(sessionStorage.getItem('company'));
    const pjson = require('package.json');
    this.projectVersion = pjson.version;

  }

  ngOnDestroy() {
    this.companySubscription.unsubscribe();
  }

  downloadMobileAPK() {
    const FileSaver = require('file-saver');
    FileSaver.saveAs('./assets/files/kekeve-ofis.apk', 'kekeve-ofis');
  }

  ngAfterViewInit() {

    $('.sidebar-dropdown > a').click(function() {
      $('.sidebar-submenu').slideUp(200);
      if ( $(this).parent().hasClass('active')) {
        $('.sidebar-dropdown').removeClass('active');
        $(this).parent().removeClass('active');
      } else {
        $('.sidebar-dropdown').removeClass('active');
        $(this).next('.sidebar-submenu').slideDown(200);
        $(this).parent().addClass('active');
      }
    });

    $('.sidebar-dropdown > sidebar-submenu > ul > li > a').click(function() {
      if ( $(this).parent().hasClass('active')) {
        $('.sidebar-submenu').removeClass('active');
        $(this).parent().removeClass('active');
      } else {
        $('.sidebar-submenu').removeClass('active');
        $(this).parent().addClass('active');
      }
    });

    // tslint:disable-next-line: only-arrow-functions
    $('#close-sidebar').click(function() {
      $('.page-wrapper').removeClass('toggled');
    });
    // tslint:disable-next-line: only-arrow-functions
    $('#show-sidebar').click(function() {
      $('.page-wrapper').addClass('toggled');
    });
  }

}
