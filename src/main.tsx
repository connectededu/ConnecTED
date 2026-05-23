import './i18n/config'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import App from './App.tsx'
import './index.css'
import { store, persistor } from './store/index'
import { setLogoutHandler } from './services/api'
import { logout } from './store/slices/authSlice'

// Handle unauthorized API responses by logging out from Redux
setLogoutHandler(() => {
	store.dispatch(logout())
})

createRoot(document.getElementById('root')!).render(
	<Provider store={store}>
		<PersistGate loading={null} persistor={persistor}>
			<App />
		</PersistGate>
	</Provider>
)

