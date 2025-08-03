import { JsonPipe } from '@angular/common';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { Commander } from '../../../ng-commander/src/Application/commander.service';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule],
  providers: [Commander, JsonPipe],
  bootstrap: [AppComponent],
})
export class AppModule {}
