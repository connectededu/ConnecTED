// slices
import auth from './slices/authSlice'
import app from './slices/appSlice'
import data from './slices/dataSlice'

const rootReducer = {
	auth,
	app,
	data
}

export default rootReducer
