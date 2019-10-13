import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { InformationService } from '../services/information.service';
import { AuthenticationService } from '../services/authentication.service';

@Component({
  selector: 'app-setting',
  templateUrl: './setting.component.html',
  styleUrls: ['./setting.component.css']
})
export class SettingComponent implements OnInit, OnDestroy {

  constructor(public authServis: AuthenticationService,
              public infoService: InformationService,
              public db: AngularFirestore) { }

  ngOnInit() {
  }

  ngOnDestroy(): void { }

}
