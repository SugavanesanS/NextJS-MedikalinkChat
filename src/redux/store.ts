import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { persistReducer, persistStore as perStore } from 'redux-persist';
import IDBStorage from './IDBStorage';
import DiscussionReducer from './reducer/DiscussionReducer';
import PatientListReducer from './reducer/PatientListReducer';



const persistConfig = (userId) => ({

  key: `chat_mod_${userId}`, 
  storage: IDBStorage
});

const rootReducer = combineReducers(
  {
    discussion: DiscussionReducer,
    patientList: PatientListReducer
  }
)


const Store = (userId) => {
 

  const persistedReducer = persistReducer(persistConfig(userId), rootReducer);

  const configStore =  configureStore({
    reducer: persistedReducer,
    devTools: process.env.NODE_ENV !== 'production',
    'middleware': (getDefaultMiddleware) =>
      getDefaultMiddleware({
        immutableCheck: process.env.NODE_ENV != 'production',
        serializableCheck: false,
      }),
  })

  const PersistStore = perStore(configStore)

  return { configStore, PersistStore }
} 

export default Store


export type RootState = ReturnType<typeof rootReducer>;
