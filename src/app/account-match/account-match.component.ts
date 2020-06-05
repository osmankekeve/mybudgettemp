import {Component, OnInit} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {InformationService} from '../services/information.service';
import {AuthenticationService} from '../services/authentication.service';
import {Router, ActivatedRoute} from '@angular/router';
import {GlobalService} from '../services/global.service';
import {HttpClient, HttpHeaders} from '@angular/common/http';

@Component({
  selector: 'app-account-match',
  templateUrl: './account-match.component.html',
  styleUrls: ['./account-match.component.css']
})
export class AccountMatchComponent implements OnInit {

  date = new Date();
  searchText: '';
  onTransaction = false;
  public xmlItems: any;

  constructor(public authService: AuthenticationService, public globService: GlobalService, public infoService: InformationService,
              public route: Router, public router: ActivatedRoute, public db: AngularFirestore, private http: HttpClient) {
  }

  ngOnInit() {
    //this.loadXML();
    this.http.get('https://www.tcmb.gov.tr/kurlar/today.xml',
      {
        headers: new HttpHeaders()
          .set('Content-Type', 'text/xml')
          .append('Access-Control-Allow-Methods', 'GET')
          .append('Access-Control-Allow-Origin', 'https://www.tcmb.gov.tr')
          .append('Access-Control-Allow-Headers',
            'Access-Control-Allow-Headers, Access-Control-Allow-Origin, Access-Control-Request-Method'),
        responseType: 'text'
      })
      .subscribe(res => console.log(res));

  }

  loadXML() {
    this.http.get('https://www.tcmb.gov.tr/kurlar/today.xml',
      {
        headers: new HttpHeaders()
          .set('Content-Type', 'text/xml')
          .append('Access-Control-Allow-Methods', 'GET')
          .append('Access-Control-Allow-Origin', '*')
          .append('Access-Control-Allow-Headers',
            'Access-Control-Allow-Headers, Access-Control-Allow-Origin, Access-Control-Request-Method'),
        responseType: 'text'
      })
      .subscribe((data) => {
        console.table(data);
        /*this.parseXML(data)
          .then((data2) => {
            this.xmlItems = data2;
          });*/
      });
  }
}
