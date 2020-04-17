import {Component, OnDestroy, OnInit, ViewChild, AfterViewInit} from '@angular/core';
import {Subscription} from 'rxjs';
import {GlobalUploadService} from '../../services/global-upload.service';

@Component({
  selector: 'app-global-upload',
  templateUrl: 'global-upload.component.html'
})

export class GlobalUploadComponent implements OnDestroy, OnInit {
  primaryKey: string;
  componentKey: string;
  subscription: Subscription | undefined;

  constructor(public service: GlobalUploadService) {
  }

  ngOnInit(): void {
    this.subscription = this.service.get()
      .subscribe(params => {
        console.log(params);
        if (params !== undefined) {
          this.primaryKey = params.primaryKey;
          this.componentKey = params.component;
          // @ts-ignore
          $('#myModal').modal();
        }
        const scrollToTop = window.setInterval(() => {
          const pos = window.pageYOffset;
          if (pos > 0) {
            window.scrollTo(0, pos - 60); // how far to scroll on each step
          } else {
            window.clearInterval(scrollToTop);
          }
        }, 16);
      });
  }

  ngOnDestroy(): void {
    if (this.subscription !== undefined) {
      this.subscription.unsubscribe();
    }
  }

}
