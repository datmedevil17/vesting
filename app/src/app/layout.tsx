'use client'

import './globals.css'
import 'react-toastify/dist/ReactToastify.css'
import '@solana/wallet-adapter-react-ui/styles.css'
import { ToastContainer } from 'react-toastify'
import { ReactQueryProvider } from './provider'
import AppWalletProvider from '@/components/AppWalletProvider'
import Header from '@/components/Header'


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-white">
        <ReactQueryProvider>
            <AppWalletProvider>
              <Header/>
            
                {children}
             

              <ToastContainer
                position="bottom-center"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="dark"
              />
            </AppWalletProvider>
        </ReactQueryProvider>
      </body>
    </html>
  )
}