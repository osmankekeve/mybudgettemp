import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { AccountTransactionService } from '../services/account-transaction.service';
import { InformationService } from '../services/information.service';
import { AuthenticationService } from '../services/authentication.service';
import { LocationService } from '../services/location.service';
import { LocationMainModel } from '../models/location-main-model';

@Component({
  selector: 'app-location',
  templateUrl: './location.component.html',
  styleUrls: ['./location.component.css']
})
export class LocationComponent implements OnInit, OnDestroy {
  mainList: Array<LocationMainModel>;
  lat: any;
  lng: any;
  searchText = '';

  constructor(public authService: AuthenticationService, public service: LocationService, public atService: AccountTransactionService,
              public infoService: InformationService, public db: AngularFirestore) { }

  ngOnInit() {
    this.showCurrentLocation();
    this.populateList();
  }

  ngOnDestroy(): void {
  }

  populateList(): void {
    this.mainList = undefined;

    this.service.getMainItems().subscribe(list => {
        if (this.mainList === undefined) {
          this.mainList = [];
        }
        list.forEach((data: any) => {
          const item = data.returnData as LocationMainModel;
          if (item.actionType === 'added') {
            this.mainList.push(item);
          }
          if (item.actionType === 'removed') {
            for (let i = 0; i < this.mainList.length; i++) {
              if (item.data.primaryKey === this.mainList[i].data.primaryKey) {
                this.mainList.splice(i, 1);
              }
            }
          }
          if (item.actionType === 'modified') {
            for (let i = 0; i < this.mainList.length; i++) {
              if (item.data.primaryKey === this.mainList[i].data.primaryKey) {
                this.mainList[i] = item;
              }
            }
          }
        });
      });
    setTimeout(() => {
      if (this.mainList === undefined) {
        this.mainList = [];
      }
    }, 1000);
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
