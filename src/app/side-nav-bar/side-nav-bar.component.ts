import { Component, OnInit, AfterViewInit  } from '@angular/core';
import * as $ from 'jquery';
import { AuthenticationService } from '../services/authentication.service';
import {CustomerRelationService} from "../services/crm.service";
import {CookieService} from "ngx-cookie-service";

@Component({
  selector: 'app-side-nav-bar',
  templateUrl: './side-nav-bar.component.html',
  styleUrls: ['./side-nav-bar.component.css']
})
export class SideNavBarComponent implements OnInit, AfterViewInit {
  userDetails: any;
  employeeDetail: any;
  loginTime: any;

  constructor( private authService: AuthenticationService,
               private cookieService: CookieService) {  }

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
