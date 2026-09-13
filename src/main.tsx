import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/dm-sans/400.css'
import '@fontsource/dm-sans/500.css'
import '@fontsource/dm-sans/600.css'
import '@fontsource/dm-sans/700.css'
import '@fontsource/dm-serif-display/400.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import AppErrorBoundary from './components/AppErrorBoundary'
import { getUnsupportedBrowserFeatures } from './services/browserSupport'
import './styles.css'

const root = createRoot(document.getElementById('root')!)
const unsupported = getUnsupportedBrowserFeatures()

root.render(
  <StrictMode>
    {unsupported.length ? (
      <main className="unsupported-browser" role="alert">
        <div className="brand-mark">C</div>
        <h1>This browser cannot run CertStudio safely.</h1>
        <p>Use a current version of Chrome, Edge, Firefox, or Safari with these required browser features:</p>
        <ul>{unsupported.map((feature) => <li key={feature}>{feature}</li>)}</ul>
      </main>
    ) : (
      <AppErrorBoundary><App /></AppErrorBoundary>
    )}
  </StrictMode>,
)
