import { Component, OnInit, AfterViewInit  } from '@angular/core';
import * as $ from 'jquery';
import { AuthenticationService } from '../services/authentication.service';

@Component({
  selector: 'app-side-nav-bar',
  templateUrl: './side-nav-bar.component.html',
  styleUrls: ['./side-nav-bar.component.css']
})
export class SideNavBarComponent implements OnInit, AfterViewInit {
  userDetails: any;
  employeeDetail: any;

  constructor(
    private authService: AuthenticationService) { }

  ngOnInit() {
    this.userDetails = this.authService.isUserLoggedIn();
    if (this.userDetails) {
      this.employeeDetail = this.authService.isEmployeeLoggedIn();
      if (!this.employeeDetail) {
        this.employeeDetail = undefined;
      }
    }
  }

  ngAfterViewInit() {

    $('.sidebar-dropdown > a').click(function() {
      $('.sidebar-submenu').slideUp(200);
      if (
        $(this)
          .parent()
          .hasClass('active')
      ) {
        $('.sidebar-dropdown').removeClass('active');
        $(this)
          .parent()
          .removeClass('active');
      } else {
        $('.sidebar-dropdown').removeClass('active');
        $(this)
          .next('.sidebar-submenu')
          .slideDown(200);
        $(this)
          .parent()
          .addClass('active');
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
