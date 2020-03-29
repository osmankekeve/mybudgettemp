import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { InformationService } from 'src/app/services/information.service';

/**
 * Alert Component
 */
@Component({
    selector: 'app-global-modal',
    templateUrl: 'global-modal.component.html'
})

export class GlobalModalComponent implements OnDestroy, OnInit {
    /** message object */
    message: any;
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
                this.message = message;
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

    /**
     * ngOnDestroy
     */
    ngOnDestroy(): void {
        if (this.subscription !== undefined) {
            this.subscription.unsubscribe();
        }
    }
}
