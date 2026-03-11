import "./globals.css";

export const metadata = {
  title: 'Chet GPT Pro',
  description: 'The most unhinged AI.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo.png" />
      </head>
      <body className="bg-black">{children}</body>
    </html>
  );
}