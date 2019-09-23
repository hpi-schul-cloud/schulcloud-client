import * as Browser from '@sentry/browser';
import * as Integrations from '@sentry/integrations';

window.Sentry = Browser;
window.SentryIntegrations = Integrations;
