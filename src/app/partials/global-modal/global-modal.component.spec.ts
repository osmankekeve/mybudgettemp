import { async, ComponentFixture, ComponentFixtureAutoDetect, TestBed } from '@angular/core/testing';

import { RouterTestingModule } from '@angular/router/testing';
import { GlobalModalComponent } from './global-modal.component';

describe('GlobalModalComponent', () => {
    let fixture: ComponentFixture<GlobalModalComponent>;
    let comp: GlobalModalComponent;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
              GlobalModalComponent
            ],
            providers: [
                {provide: ComponentFixtureAutoDetect, useValue: true}
            ],
            imports: [
                RouterTestingModule.withRoutes([{path: '', component: GlobalModalComponent}])
            ]
        })
            .compileComponents()
            .then(() => {
                fixture = TestBed.createComponent(GlobalModalComponent);
                comp = fixture.componentInstance;
                fixture.detectChanges();
            })
            .catch(reason => {
                expect(reason)
                    .toBeUndefined();
            });
    }));

    it('should create the app', async(() => {
        expect(comp)
            .toBeTruthy();
    }));

    it('should create the app and destroy with undefined subscription', async(() => {
        comp.subscription = undefined;
        expect(comp)
            .toBeTruthy();
    }));

    it('should add \'My success message\' to alert.service and get \'My success message\' from alert.service', async(() => {
        comp.alertService.getMessage()
            .subscribe(message => {
                expect(message.text)
                    .toContain('My success message');
            });
        comp.alertService.success('My success message', false);
        fixture.detectChanges();
    }));

    it('should add \'My error message\' to alert.service and get \'My error message\' from alert.service', async(() => {
        comp.alertService.getMessage()
            .subscribe(message => {
                expect(message.text)
                    .toContain('My error message');
            });
        comp.alertService.error('My error message', false);
        fixture.detectChanges();
    }));

});
