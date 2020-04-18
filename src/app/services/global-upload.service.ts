import {Injectable} from '@angular/core';
import {NavigationStart, Router} from '@angular/router';
import {Observable, Subject} from 'rxjs';

@Injectable()
export class GlobalUploadService {
  private readonly subject = new Subject<any>();

  constructor(router: Router) {
    // clear alert message on route change
    router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.subject.next();
      }
    });
  }

  get(): Observable<any> {
    return this.subject.asObservable();
  }

  showModal(primaryKey: string, componentKey: string, model: any): void {
    this.openModal(primaryKey, componentKey, model);
  }

  private openModal(primaryKey: string, componentKey: string, model: any): void {
    this.subject.next({key: primaryKey, component: componentKey, keyModel: model});
  }
}
