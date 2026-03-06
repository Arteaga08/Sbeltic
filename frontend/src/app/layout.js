import { Toaster } from "sonner"; // 1. Importamos el componente
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

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
