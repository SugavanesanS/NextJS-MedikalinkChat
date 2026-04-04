import { OtherURL } from "../api/AppURL"


export const BlockLoader = ({ isLoading }: { isLoading: boolean }) => {
    if (isLoading) {
        return (
            <div className="block-loader">
                <img style={{
                    height: 45,
                    width: 45
                }} src={OtherURL.loader} alt="" />
            </div>
        )
    }
    return null
}