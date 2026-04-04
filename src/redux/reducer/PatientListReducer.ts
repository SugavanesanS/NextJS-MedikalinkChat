import { createSlice } from "@reduxjs/toolkit";
import { Patients } from "../../types/data";


const initialState = [] as Patients[]

const PatientListSlice = createSlice({
    name: 'PatientListReducer',
    initialState,
    reducers: {
        update(state, { payload }) {
            return [...payload]
        },
        reset(state) {
            state = initialState
            return { ...state }
        },
    }

})


const PatientListReducer = PatientListSlice.reducer
export const PatientListActions = PatientListSlice.actions
export default PatientListReducer