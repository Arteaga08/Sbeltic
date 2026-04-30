import { Toaster } from "sonner"; // 1. Importamos el componente
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f172a",
};

export const metadata = {
  title: "Sbeltic",
  description: "Sistema de gestión para clínica estética Sbeltic",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Sbeltic",
  },
  icons: {
    apple: "/apple-touch-icon.png",
  },
};

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"] });

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={`${jakarta.className} antialiased`}>
        {children}

        {/* 2. Agregamos el Toaster aquí. Aparecerá en TODAS las páginas */}
        <Toaster position="top-right" richColors closeButton theme="light" />
      </body>
    </html>
  );
}
