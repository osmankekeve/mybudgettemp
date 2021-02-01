import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

/**
 * Are You Sure Component
 */
@Component({
    selector: 'app-are-you-sure',
    templateUrl: 'are-you-sure.component.html'
})

export class AreYouSureComponent {
    title: string;
    details: string;

    constructor(public modal: NgbActiveModal) {
    }
}
