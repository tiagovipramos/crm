import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vipseg CRM - Proteção Veicular",
  description: "Sistema de gerenciamento de relacionamento com clientes da Vipseg Brasil",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased bg-gray-50">
        {children}
      </body>
    </html>
  );
}
