// pages/_app.js or pages/_app.tsx
import '../globals.css';
import type { AppProps } from 'next/app';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from "@vercel/speed-insights/next"

import { Manrope } from 'next/font/google';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
});

function MyApp({ Component, pageProps }: AppProps) {
    return (
        <div className={`${manrope.variable} ${manrope.className} font-sans`}>
            <Component {...pageProps} />
            <Analytics />
            <SpeedInsights/>
        </div>
    );
}

export default MyApp;
