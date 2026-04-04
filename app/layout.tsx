import type { Metadata } from 'next';
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
  const isDev = process.env.NODE_ENV === 'development';
  return (
    <html lang="en">
      <body>
        <Suspense>
          <FirebaseAuthWrapper>{children}</FirebaseAuthWrapper>
        </Suspense>
        {/* Dev only: simulate Laravel blade DOM elements */}
        {isDev && (
          <>
            <div id="message_container" />
            <div id="recent_msg_block" />
            <div id="urgent_msg_block" />
            <div id="app-loader" style={{ display: 'none' }} />
            <span id="total_unread_counter" style={{ display: 'none' }} />
          </>
        )}
      </body>
    </html>
  );
}
