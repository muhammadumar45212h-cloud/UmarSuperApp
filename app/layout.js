export const metadata = {
  title: 'Umar Super App',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{margin: 0, padding: 0, background: '#000', color: '#fff'}}>{children}</body>
    </html>
  )
}
