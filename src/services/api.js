import { db } from './firebase'

export const fetchRegions = async () => {
    try {
        const regionsRef = db.ref("/regions")
        const snapshot = await regionsRef.get()
        if (snapshot.exists()) {
            const data = snapshot.val()
            return data
        } else {
            console.log("No state data available")
            return {}
        }
    } catch {
        throw new Error("Error with firebase database")
    }
}

export const fetchCharities = async () => {
    try {
        const charitiesListRef = db.ref("/charities")
        const snapshot = await charitiesListRef.get()
        if (snapshot.exists()) {
            const data = snapshot.val()
            return data
        } else {
            console.log("No charity data available")
            return {}
        }
    } catch {
        throw new Error("Error with firebase database")
    }
}

const fetchCharityInfo = async (charityKey) => {
    try {
        // get info on the given charity
        const charitiesRef = db.ref(`/charities/${charityKey}`)
        const snapshot = await charitiesRef.get()
        if (snapshot.exists()) {
            const data = snapshot.val()
            return data
        } else {
            console.log("Charity not found")
            return {}
        }
    } catch {
        throw new Error("Error with firebase database")
    }
}

export const fetchAllRegionsCharities = async () => {
    try {
        // get the list of charities in the region
        const regionsCharitiesRef = db.ref(`/regions_charities`)
        const snapshot = await regionsCharitiesRef.get()
        if (snapshot.exists()) {
            const data = snapshot.val()
            return data
        } else {
            console.log("No charity and region data")
            return []
        }
    } catch {
        throw new Error("Error with firebase database")
    }
}

export const fetchRegionCharities = async (regionKey, info = false) => {
    try {
        // get the list of charities in the region
        const regionsCharitiesRef = db.ref(`/regions_charities/${regionKey}`)
        const snapshot = await regionsCharitiesRef.get()
        if (snapshot.exists()) {
            const data = snapshot.val()
            if(info) {
                // obtain data on each listed charity
                const charityKeys = Object.keys(data)
                const charitiesInRegion = await Promise.all(charityKeys.map((key) => fetchCharityInfo(key)))
                return charitiesInRegion
            } else return data
        } else {
            console.log("No charity data available for the given region")
            return []
        }
    } catch {
        throw new Error("Error with firebase database")
    }
}

// Modifications
export const addCharity = async (params) => {
    try {
        const charitiesRef = db.ref('/charities')
        await charitiesRef.push(params)
    } catch {
        throw new Error("Error with firebase database")
    }
}

export const deleteCharities = async (charityKeys) => {
    try {
        await Promise.all(charityKeys.map((key) => {
            const charityRef = db.ref(`/charities/${key}`)
            return charityRef.remove()
        }))
    } catch {
        throw new Error("Error with firebase database")
    }
}

export const deleteRegionFromCharity = async (charityKey, regionKey) => {
    try {
        const regionCharityRef = db.ref(`/regions_charities/${regionKey}/${charityKey}`)
        await regionCharityRef.remove()
    } catch {
        throw new Error("Error with firebase database")
    }
}
