import { Geist, Geist_Mono } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { ToastProvider } from "@/components/ui/Toast"
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/hooks/useAuth";
import { SocketIOProvider } from "@/components/providers/SocketIOProvider";
import { RealtimeNotificationBell } from "@/components/common/RealtimeNotificationBell";
// import { SocketIODiagnostics } from "@/components/SocketIODiagnostics";
import { Toaster } from "sonner";
import HealthSenseBot from "@/components/ai/health-sense-bot";

const geist = Geist({subsets:['latin'],variable:'--font-sans'})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", geist.variable)}
    >
      <head>
        <title>HealthSenseAI</title>
      </head>
      <body suppressHydrationWarning>
        <AuthProvider>
          <SocketIOProvider enabled={true} debug={false}>
            <ThemeProvider>
              {children}
              <RealtimeNotificationBell />
              {/* <SocketIODiagnostics /> */}
              <HealthSenseBot />
              <Toaster position="top-right" />
            </ThemeProvider>
          </SocketIOProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
