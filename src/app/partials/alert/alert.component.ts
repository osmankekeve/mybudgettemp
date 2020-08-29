import {Component, OnDestroy, OnInit} from '@angular/core';
import {Subscription} from 'rxjs';
import {InformationService} from 'src/app/services/information.service';

/**
 * Alert Component
 */
@Component({
  selector: 'app-alert',
  templateUrl: 'alert.component.html'
})

export class AlertComponent implements OnDestroy, OnInit {
  /** message object */
  message: any;
  jsonData: any;
  /** subscription */
  subscription: Subscription | undefined;

  /**
   * constructor of AlertComponent
   * @param alertService: AlertService
   */
  constructor(public alertService: InformationService) {
  }

  /**
   * ngOnInit
   */
  ngOnInit(): void {
    this.subscription = this.alertService.getMessage()
      .subscribe(message => {
        if (message !== undefined && message !== '') {
          // @ts-ignore
          $('#myModal').modal();
          this.message = message;
        }
      });
    this.subscription = this.alertService.getJsonData()
      .subscribe(jsonData => {
        if (jsonData !== undefined && jsonData !== '') {
          // @ts-ignore
          $('#myModal').modal();
          this.jsonData = jsonData;
        }
      });
  }

  /**
   * ngOnDestroy
   */
  ngOnDestroy(): void {
    if (this.subscription !== undefined) {
      this.subscription.unsubscribe();
    }
  }
}
