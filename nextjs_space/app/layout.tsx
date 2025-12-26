import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth/context';

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script src="https://apps.abacus.ai/chatllm/appllm-lib.js"></script>
      </head>
      <body className="antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
