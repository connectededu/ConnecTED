import './i18n/config'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import App from './App.tsx'
import './index.css'
import { store, persistor } from './store/index'
import { setLogoutHandler } from './services/api'
import { logout } from './store/slices/authSlice'
import { registerServiceWorker, initializeMessaging } from './services/pushNotifications'

// Handle unauthorized API responses by logging out from Redux
setLogoutHandler(() => {
	store.dispatch(logout())
})

// Register service worker for push notifications
registerServiceWorker().then((registered) => {
	if (registered) {
		console.log('Service Worker ready for push notifications')
		initializeMessaging()
	}
})

createRoot(document.getElementById('root')!).render(
	<Provider store={store}>
		<PersistGate loading={null} persistor={persistor}>
			<App />
		</PersistGate>
	</Provider>
)

