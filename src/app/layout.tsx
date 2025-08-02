import type { Metadata } from 'next';
import { JetBrains_Mono, Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import { AuthProvider } from '@/lib/firebase/Auth';

// Configure Google Fonts with fallback display to reduce font swapping
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jetbrains-mono',
  display: 'fallback',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'fallback',
});

export const metadata: Metadata = {
  title: 'OmniCode',
  description: 'An interactive platform for mastering machine learning concepts.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <head>
        {/* Preload Aurora Pro font to prevent font swapping issues */}
        <link
          rel="preload"
          href="/fonts/AURORA-PRO.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        {/* Preload Code 7x5 font for headings and navigation */}
        <link
          rel="preload"
          href="/fonts/Code-7x5.otf"
          as="font"
          type="font/otf"
          crossOrigin="anonymous"
        />
        {/* Preload Gontserrat ExtraLight font for body text */}
        <link
          rel="preload"
          href="/fonts/Gontserrat-ExtraLight.otf"
          as="font"
          type="font/otf"
          crossOrigin="anonymous"
        />
        {/* Preload Code 7x5 font for primary app typography */}
        <link
          rel="preload"
          href="/fonts/Code-7x5.otf"
          as="font"
          type="font/otf"
          crossOrigin="anonymous"
        />
      </head>
      <body className={`font-sans antialiased ${jetbrainsMono.variable} ${inter.variable}`} suppressHydrationWarning={true}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
