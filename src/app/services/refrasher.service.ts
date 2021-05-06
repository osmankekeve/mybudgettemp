import { ProfileMainModel } from './../models/profile-main-model';
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { CompanyModel } from '../models/company-model';

@Injectable({ providedIn: 'root' })
export class RefrasherService {
    userDetails = new Subject<any>();
    employeeDetail = new Subject<ProfileMainModel>();
    employeeDetail$ = this.employeeDetail.asObservable();
    companyDetail = new Subject<CompanyModel>();
    companyDetail$ = this.companyDetail.asObservable();
    subjectName = new Subject<any>(); // need to create a subject

    priceListDetailUpdate = new Subject<any>();
    discountListDetailUpdate = new Subject<any>();

    sendUpdate(message: string) { // the component that wants to update something, calls this fn
        this.subjectName.next({ text: message }); // next() will feed the value in Subject
    }

    getUpdate(): Observable<any> { // the receiver component calls this function
        return this.subjectName.asObservable(); // it returns as an observable to which the receiver funtion will subscribe
    }

    sendCompanyUpdate(item: CompanyModel) {
        this.companyDetail.next(item);
    }

    getCompanyUpdate(): Observable<any> {
        return this.companyDetail.asObservable();
    }

    sendEmployeeUpdate(item: ProfileMainModel) {
        this.employeeDetail.next(item);
    }

    getEmployeeUpdate(): Observable<any> {
        return this.employeeDetail.asObservable();
    }

    sendDiscountListDetailUpdate() {
        this.discountListDetailUpdate.next();
    }

    sendPriceListDetailUpdate() {
        this.priceListDetailUpdate.next();
    }
}

