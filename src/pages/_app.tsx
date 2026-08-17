import '../globals.css';
import type { AppProps } from 'next/app';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from "@vercel/speed-insights/next";

import localFont from 'next/font/local';

/**
 * Manrope is checked in rather than pulled from Google Fonts at build time, so
 * a build never depends on fonts.googleapis.com being reachable.
 */
const manrope = localFont({
    src: '../fonts/Manrope-Variable.woff2',
    weight: '200 800',
    style: 'normal',
    display: 'swap',
    variable: '--font-manrope',
    fallback: ['system-ui', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
});

function MyApp({ Component, pageProps }: AppProps) {
    return (
        <div className={`${manrope.variable} ${manrope.className} font-sans`}>
            <Component {...pageProps} />
            <Analytics />
            <SpeedInsights />
        </div>
    );
}

export default MyApp;
