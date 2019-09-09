import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

/**
 * Html Info Component
 */
@Component({
    selector: 'app-html-info',
    templateUrl: 'html-info.component.html'
})

export class HtmlInfoComponent {
    title: string;
    details: string;
    detailsPre: string;
    detailsJson: any;

    constructor(public modal: NgbActiveModal) {
    }
}
