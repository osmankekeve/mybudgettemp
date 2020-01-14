import { Injectable } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Observable, Subject } from 'rxjs';
import { HtmlInfoComponent } from '../partials/html-info/html-info.component';
import { LogService } from './log.service';
import { LogModel } from '../models/log-model';
import { AuthenticationService } from './authentication.service';

/**
 * Alert Service
 */
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
    constructor(router: Router,
                private authService: AuthenticationService,
                private readonly modalService: NgbModal,
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
    error(message: any, keepAfterNavigationChange?: boolean): void {
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
    }

    /**
     * get current messages
     */
    getMessage(): Observable<any> {
        return this.subject.asObservable();
    }

    showHtmlInfo(title: string, details: any, isJson?: boolean): void {
        const activeModal = this.modalService.open(HtmlInfoComponent, {size: 'lg'});
        const comp = activeModal.componentInstance as HtmlInfoComponent;
        comp.title = title;
        if (isJson) {
            if (details.hasOwnProperty('data') && Object.keys(details).length === 1) {
                comp.details = undefined;
                comp.detailsPre = details.data;
                comp.detailsJson = undefined;
            } else {
                comp.details = undefined;
                comp.detailsPre = undefined;
                comp.detailsJson = details;
                try {
                    Object.keys(comp.detailsJson)
                        .forEach(key => {
                            if (typeof comp.detailsJson[key] === 'object') {
                                Object.keys(comp.detailsJson[key])
                                    .forEach(prop => {
                                        if (prop === 'commandData') {
                                            comp.detailsJson[key][prop] = JSON.parse(comp.detailsJson[key][prop]);
                                        }
                                    });
                            } else if (key === 'commandData') {
                                comp.detailsJson[key] = JSON.parse(comp.detailsJson[key]);
                            }
                        });
                } catch (e) {
                    // pass
                }
            }
        } else {
            comp.details = details;
            comp.detailsPre = undefined;
            comp.detailsJson = undefined;
        }
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
