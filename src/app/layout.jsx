import './globals.css';
import Providers from './providers';

export const metadata = {
  title: 'Bluepips - Professional Forex Trading Platform',
  description: 'AI-powered forex trading signals and automation',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-inter antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
