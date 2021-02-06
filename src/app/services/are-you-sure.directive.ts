import { Directive, ElementRef, EventEmitter, Inject, Input, OnInit, Output } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AreYouSureComponent } from '../partials/are-you-sure/are-you-sure.component';

@Directive({
    selector: '[appAreYouSure]'
})
export class AreYouSureDirective implements OnInit {

    @Output() readonly then = new EventEmitter<any>();
    @Output() readonly else = new EventEmitter<any>();
    @Input() readonly getValue: () => string;
    @Input() readonly replaceValue: string;
    @Input() readonly recordName: string;
    @Input() readonly title: string;
    @Input() readonly details: string;

    constructor(@Inject(ElementRef) private readonly element: ElementRef,
                private readonly modalService: NgbModal) { }

    ngOnInit(): void {
        this.element.nativeElement.onclick = (): void => {
            const activeModal = this.modalService.open(AreYouSureComponent);
            const comp = activeModal.componentInstance as AreYouSureComponent;
            if (this.recordName) {
                comp.title = this.title ? this.title : 'Emin misiniz?';
                comp.details = this.details ? this.details : `<strong>
<span class="text-primary">"${this.recordName}"</span> Kaydı silmek istediğinize emin misiniz?</strong>
<div>Bu kayıtla ilişkili tüm bilgiler kalıcı olarak silinecektir.
<br/>
<span class="text-danger">Bu işlem geri alınamaz.</span></div>`;
            } else if (this.replaceValue && this.getValue && this.details) {
                comp.title = this.title ? this.title : 'Emin misiniz?';
                comp.details = this.details.replace(this.replaceValue, this.getValue());
            } else if (this.getValue) {
                comp.title = this.title ? this.title : 'Emin misiniz?';
                comp.details = this.details ? this.details : `<strong>
<span class="text-primary">"${this.getValue()}"</span> Kaydı silmek istediğinize emin misiniz?</strong>
<div>Bu kayıtla ilişkili tüm bilgiler kalıcı olarak silinecektir.
<br/>
<span class="text-danger">Bu işlem geri alınamaz.</span></div>`;
            } else {
                comp.title = this.title ? this.title : 'Emin misiniz?';
                comp.details = this.details ? this.details : `
<div>Bu kayıtla ilişkili tüm bilgiler kalıcı olarak silinecektir.
<br/>
<span class="text-danger">Bu işlem geri alınamaz.</span></div>`;
            }
            activeModal.result
                .then((result: any) => {
                    if (this.then) {
                        this.then.emit(true);
                    }
                }, (reason: any) => {
                    if (this.else) {
                        this.else.emit(true);
                    }
                });
        };
    }
}
