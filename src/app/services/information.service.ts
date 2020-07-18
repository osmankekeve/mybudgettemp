import { Injectable } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Observable, Subject } from 'rxjs';
import { LogService } from './log.service';
import { AuthenticationService } from './authentication.service';

@Injectable()
export class InformationService {
    /** collection of messages */
    private readonly subject = new Subject<any>();
    /** do you want to keep message as shown even after gone to another page? */
    private keepAfterNavigationChange = false;
    /** last timer (just for auto hide) */
    private lastTimer: any;

    /**
     * constructor of AlertService
     * @param router: Router
     * @param modalService: NgbModal
     */
    constructor(private router: Router, private authService: AuthenticationService, private readonly modalService: NgbModal,
                private logService: LogService) {
        // clear alert message on route change
        router.events.subscribe(event => {
            if (event instanceof NavigationStart) {
                if (this.keepAfterNavigationChange) {
                    // only keep for a single location change
                    this.keepAfterNavigationChange = false;
                } else {
                    // clear alert
                    this.subject.next();
                }
            }
        });
    }

    /**
     * Show message to user
     * @param message: message text
     * @param keepAfterNavigationChange: do you want to keep message as shown even after gone to another page?
     */
    success(message: string, keepAfterNavigationChange?: boolean): void {
        if (this.lastTimer) {
            clearTimeout(this.lastTimer);
        }
        this.keepAfterNavigationChange = keepAfterNavigationChange;
        this.alert('success', message);
        if (!keepAfterNavigationChange) {
            this.lastTimer = setTimeout(() => {
                this.subject.next();
            }, 3000);
        }
    }

    /**
     * Show error to user
     * @param message: error text
     * @param keepAfterNavigationChange: do you want to keep message as shown even after gone to another page?
     */
    async error(message: any, keepAfterNavigationChange?: boolean): Promise<void> {
        if (this.lastTimer) {
            clearTimeout(this.lastTimer);
        }
        this.alert('error', message);
        this.keepAfterNavigationChange = keepAfterNavigationChange;
        if (!keepAfterNavigationChange) {
            this.lastTimer = setTimeout(() => {
                this.subject.next();
            }, 10000);
        }
        if (message.toString().startsWith('BUG')) {
          await this.logService.addToBug(message);
        }
    }

    /**
     * get current messages
     */
    getMessage(): Observable<any> {
        return this.subject.asObservable();
    }

    /**
     * Show alert to user
     * @param type: type of message
     * @param message: message text
     */
    private alert(type: string, message: any): void {
        // tslint:disable-next-line: no-console
        // console.log(typeof message === 'object', message);
        if (typeof message === 'object') {
            Object.keys(message)
                .forEach(key => {
                    this.alert(type, message[key]);
                });
        } else {
            this.subject.next({type, text: message});
        }
    }

}
