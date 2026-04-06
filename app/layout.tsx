import type { Metadata } from 'next';
import Script from 'next/script';
import 'react-toastify/dist/ReactToastify.css';
import 'react-calendar/dist/Calendar.css';
import '@/src/assets/animation.scss';
import '@/src/assets/styles.scss';
import '@/src/assets/_develop.scss';
import '@/src/services/jsConfig';
import '@/src/services/prototype/prototype';
import FirebaseAuthWrapper from '@/src/contextAndProvider/FirebaseAuthWrapper';
import { Suspense } from 'react';

export const metadata: Metadata = { title: 'Medikalink Chat' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" />
        <Script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.3.122/pdf.min.js" strategy="beforeInteractive" />
        <Script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.3.122/pdf.worker.min.js" strategy="beforeInteractive" />
        <Script src="https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.30.1/moment-with-locales.min.js" strategy="beforeInteractive" />
      </head>
      <body>
        <Suspense>
          <FirebaseAuthWrapper>{children}</FirebaseAuthWrapper>
        </Suspense>
        <div
          id="app-loader"
          className="loading"
          style={{ display: 'none', position: 'fixed', zIndex: 10000, inset: '0%' }}
        >
          <img
            src="http://172.21.4.100/medicallink/resources/images/load.gif"
            alt="loader"
            width={32}
            height={32}
          />
        </div>
        <span id="total_unread_counter" style={{ display: 'block' }}>1</span>
        <div id="react-chat-mod-root" />
        <div id="message_container" />
        <div className="col-md-6" id="recent_msg_block" />
        <div className="col-md-6" id="urgent_msg_block" />
        <div className="col-md-6" id="pinned_msg_block" />
      </body>
    </html>
  );
}
