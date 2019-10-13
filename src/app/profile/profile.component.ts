import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { InformationService } from '../services/information.service';
import { AuthenticationService } from '../services/authentication.service';
import { ProfileModel } from '../models/profile-model';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit, OnDestroy {
  openedPanel = 'mainPanel';
  selectedRecord: ProfileModel;

  constructor(public authServis: AuthenticationService,
              public infoService: InformationService,
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

}
