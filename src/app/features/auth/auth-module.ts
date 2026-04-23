import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule} from '@angular/forms';
import { LoginComponent } from './login/login.component';
import { RegisterComponent} from './register/register.component';

import { AuthRoutingModule } from './auth-routing-module';

@NgModule({
  imports: [CommonModule, AuthRoutingModule],
  exports : [
    
  ]
})
export class AuthModule {}
