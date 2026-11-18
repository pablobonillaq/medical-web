import { useDispatch, useSelector, useStore } from 'react-redux'
import type { AppDispatch, AppStore, RootState } from './store'

// The react-redux hooks with the types of this store, so components need no casts
export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()
export const useAppStore = useStore.withTypes<AppStore>()
