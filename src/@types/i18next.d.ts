import { defaultNS } from '../services/i18next/i18next';
import resources from './resources';

declare module 'i18next' {
    interface CustomTypeOptions {
        defaultNS: typeof defaultNS;
        resources: typeof resources;
    }
}