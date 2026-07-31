import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {TenantProvider} from './tenant';
import './index.css';

document.getElementById('app-skeleton')?.remove();

createRoot(document.getElementById('root')!).render(
  <TenantProvider>
    <App />
  </TenantProvider>
);
