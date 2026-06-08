import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import SidebarWrapper from "@/components/SidebarWrapper"
import { ThemeProvider } from "next-themes"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export const metadata = { title: "Sistem Monitoring Barang", description: "Aplikasi monitoring stok untuk UMKM" }

export default function RootLayout({ children }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem={true} disableTransitionOnChange>
          <SidebarWrapper />
          <div id="main-content" className="pt-14 md:pt-0 md:ml-64 transition-all duration-300 min-h-screen bg-gray-100 dark:bg-gray-950">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}