import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { InformationService } from '../services/information.service';
import { AuthenticationService } from '../services/authentication.service';
import { ProfileModel } from '../models/profile-model';
import {ProfileService} from '../services/profile.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit, OnDestroy {
  openedPanel = 'mainPanel';
  selectedRecord: ProfileModel;

  constructor(public authService: AuthenticationService,
              public infoService: InformationService,
              public service: ProfileService,
              public db: AngularFirestore) { }

  ngOnInit() {
  }

  ngOnDestroy(): void { }

  btnSaveProfileClick(): void {
    try {

    } catch (err) {
      this.infoService.error(err);
    }
  }

  async showProfileData() {
    const data = await this.service.getProfile();
  }

  openPanel(panel: string): void {
    this.openedPanel = panel;
    if ( this.openedPanel === 'personalPanel') {
      this.selectedRecord = JSON.parse(localStorage.getItem('employee'));
    }
  }

}
