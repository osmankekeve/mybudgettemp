import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from '../services/authentication.service';
import { InformationService } from '../services/information.service';

@Component({
  selector: 'app-nav-bar',
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.css']
})
export class NavBarComponent implements OnInit {
  userDetails: any;

  constructor(
    private authService: AuthenticationService, public infoService: InformationService) { }

  ngOnInit() {
  }

  logoutUser() {
    this.authService.logout()
      .then(res => {
        this.infoService.success('Sistemden çıkış yaptınız.');
        this.userDetails = undefined;
        localStorage.removeItem('user');
      }, err => {
        this.infoService.error(err.message);
      });
  }

}
