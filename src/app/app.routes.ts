import { Routes } from '@angular/router';
import { FrontOfficeShell } from './layout/front-office-shell/front-office-shell';
import { TellerActivities } from './features/teller-activities/teller-activities';
import { CashDeposit } from './features/cash-deposit/cash-deposit';
import { CashWithdrawal } from './features/cash-withdrawal/cash-withdrawal';
import { TellerCallover } from './features/teller-callover/teller-callover';
import { Vault } from './features/vault/vault';

export const routes: Routes = [
  {
    path: '',
    component: FrontOfficeShell,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'teller-activities' },
      { path: 'teller-activities', component: TellerActivities },
      {
        path: 'teller-callover',
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'journal' },
          { path: 'journal', component: TellerCallover },
        ],
      },
      { path: 'cash-deposit', component: CashDeposit },
      { path: 'cash-withdrawal', component: CashWithdrawal },
      { path: 'vault', component: Vault },
    ],
  },
  { path: '**', redirectTo: 'teller-activities' },
];
