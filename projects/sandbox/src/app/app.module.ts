import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import Commander from '../../../ng-commander/src/Application/commander.service';

@NgModule({
  declarations: [

  ],
  imports: [
    BrowserModule,
    AppComponent
  ],
  providers: [Commander],
  bootstrap: [AppComponent]
})
export class AppModule { }
