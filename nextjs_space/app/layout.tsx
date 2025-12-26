import type { Metadata } from 'next';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: 'JNX-OS - The Neural Engine For SaaS Logic',
  description:
    'JNX is not just software. It is a self-healing, predictive computational core designed to scale modern digital infrastructure autonomously.',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
  openGraph: {
    title: 'JNX-OS - The Neural Engine For SaaS Logic',
    description:
      'JNX is not just software. It is a self-healing, predictive computational core designed to scale modern digital infrastructure autonomously.',
    images: ['/og-image.png'],
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: '#06b6d4',
          colorBackground: '#030712',
          colorInputBackground: '#0b1221',
          colorInputText: '#ffffff',
        },
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <head>
          <script src="https://apps.abacus.ai/chatllm/appllm-lib.js"></script>
        </head>
        <body className="antialiased">{children}</body>
      </html>
    </ClerkProvider>
  );
}
