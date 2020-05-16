import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { AccountTransactionService } from '../services/account-transaction.service';
import { InformationService } from '../services/information.service';
import { AuthenticationService } from '../services/authentication.service';
import {LocationService} from '../services/location.service';
import {LocationModel} from '../models/location-model';

@Component({
  selector: 'app-location',
  templateUrl: './location.component.html',
  styleUrls: ['./location.component.css']
})
export class LocationComponent implements OnInit, OnDestroy {
  mainList: Array<LocationModel>;
  collection: AngularFirestoreCollection<LocationModel>;
  lat: any;
  lng: any;
  searchText = '';

  constructor(public authService: AuthenticationService, public service: LocationService,
              public atService: AccountTransactionService,
              public infoService: InformationService,
              public db: AngularFirestore) { }

  ngOnInit() {
    this.showCurrentLocation();
    this.populateList();
  }

  ngOnDestroy(): void {
  }

  populateList(): void {
    this.mainList = [];
    this.service.getMainItems().subscribe(list => {
      list.forEach((item: any) => {
        if (item.actionType === 'added') {
          this.mainList.push(item);
        }
        if (item.actionType === 'removed') {
          for (let i = 0; i < this.mainList.length; i++) {
            if (item.primaryKey === this.mainList[i].primaryKey) {
              this.mainList.splice(i, 1);
              break;
            }
          }
        }
        if (item.actionType === 'modified') {
          for (let i = 0; i < this.mainList.length; i++) {
            if (item.primaryKey === this.mainList[i].primaryKey) {
              this.mainList[i] = item;
              break;
            }
          }
        }
      });
    });
  }

  showSelectedRecord(record: any): void {
    this.lat = record.data.latitude;
    this.lng = record.data.longitude;
  }

  showCurrentLocation(): void {
    if (navigator) {
      navigator.geolocation.getCurrentPosition(pos => {
        this.lng = +pos.coords.longitude;
        this.lat = +pos.coords.latitude;
      });
    }
  }
}
