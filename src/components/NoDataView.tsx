import i18n from "../services/i18next/i18next"


export const NoDataView = () => {
    return (
        <div className="react-error-view" style={{ flex: 1 }}>
            <span children={i18n.t('no_files_found')} />
        </div>
    )
}