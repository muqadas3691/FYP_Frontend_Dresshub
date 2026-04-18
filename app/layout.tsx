import type React from "react"
import type { Metadata } from "next"
import { Inter, Playfair_Display } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
})

 export const metadata: Metadata = {
  title: 'DressHub - Trendy Fashion for Everyone',
  description: 'Discover the latest styles at DressHub.',
  icons: {
    icon: '/updatedLogo.png',
  },
   generator: 'v0.dev'
}; 

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} font-sans`}>{children}</body>
    </html>
  )
}



import './globals.css'