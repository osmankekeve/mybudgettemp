import {Component, OnInit, OnDestroy} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {Router} from '@angular/router';
import {getFloat, getTodayStart, getTodayEnd, getEncryptionKey} from '../core/correct-library';
import {VisitMainModel} from '../models/visit-main-model';
import * as CryptoJS from 'crypto-js';
import {InformationService} from '../services/information.service';
import {TodoListMainModel} from '../models/to-do-list-main-model';
import { CustomerRelationMainModel } from '../models/customer-relation-main-model';

@Component({
  selector: 'app-dashboard-account',
  templateUrl: './dashboard-account.component.html',
  styleUrls: ['./dashboard-account.component.css']
})
export class DashboardAccountComponent implements OnInit, OnDestroy {
  encryptSecretKey: string = getEncryptionKey();

  constructor(public db: AngularFirestore, public router: Router, public infoService: InformationService) {
  }

  async ngOnInit() {
    
  }

  ngOnDestroy(): void {
  }
}
