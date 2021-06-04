import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import MapHeader from "../../components/Header/map";
import LeafletMap from "./Leaflet";
import Region from "./Region";
import Loading from "../../components/Loading";
import Error from "../../components/Error";
import "./index.mod.scss";

import { isEmpty } from "../../utils";
import { fetchRegions, fetchRegionCharities, fetchCovidDatabase } from "../../services/api";
import IndiaGeoJson from "../../assets/india.simplified.json";
// Original data obtained from: https://github.com/markmarkoh/datamaps
// Simplified using: https://mapshaper.org/

const Map = () => {
	const history = useHistory();

	const [regions, setRegions] = useState({});
	const [regionDataCharities, setRegionDataCharities] = useState(null);
	const [selectedRegionKey, setSelectedRegionKey] = useState(null);

	const [error, setError] = useState(false);
	const [regionError, setRegionError] = useState(false);
	const [basicDataLoaded, setBasicDataLoaded] = useState(false);
	const [regionDataLoaded, setRegionDataLoaded] = useState(false);
	const [mapLoaded, setMapLoaded] = useState(false);

	const getRegions = async () => {
		try {
			console.debug("** API GET: FIREBASE REGION DATA");
			const regionsResponse = await fetchRegions();
			console.debug("** API GET: COVID DATA");
			const covidDataResponse = await fetchCovidDatabase();

			for (const key in regionsResponse) {
				// combine covid data into region data
				const data = Object.values(covidDataResponse.regionData).find((region) => region.region === regionsResponse[key].name);
				// indicate if data cannot be found (something wrong that needs to be updated!)
				if (isEmpty(data)) {
					console.error(`COVID data not found for region '${regionsResponse[key].name}'`);
					continue;
				}
				regionsResponse[key] = { ...regionsResponse[key], ...data };

				// calculate and add severity index to geojson data
				const severityIndex = data.activeCases / regionsResponse[key].population_2021 * 100;

				// **********************
				// TEMP: AVERAGE SEVERITY COUNTING
				console.log("SEVERITY", regionsResponse[key].name, severityIndex);
				// **********************

				// combine severity index calculations (covid data) to geojson
				const feature = IndiaGeoJson.features.find((feature) => feature.properties.code === key);
				// indicate if data cannot be found (something wrong that needs to be updated!)
				if (isEmpty(feature)) {
					console.error(`No GeoJSON data found for region '${regionsResponse[key].name}'`);
					continue;
				}
				// this will directly edit the json object getting passed
				feature.properties.severityIndex = severityIndex;
			}

			setRegions(regionsResponse);
			setBasicDataLoaded(covidDataResponse.lastUpdatedAtApify);
		} catch (err) {
			setError(err.message || true);
			console.error(err);
		}
	};

	const getRegionDataCharities = async (regionKey = null) => {
		try {
			console.debug("** API GET: FIREBASE CHARITY DATA FOR REGION", regionKey);
			const charitiesInRegion = await fetchRegionCharities(regionKey, true);
			setRegionDataCharities(charitiesInRegion);
			setRegionDataLoaded(true);
		} catch (err) {
			setRegionError(true);
			console.error(err);
		}
	};

	const refreshPage = async () => {
		// refresh region data
		await getRegions();
		// set the query to none
		history.replace({ region: "" });
	};

	const handleSelectMapRegion = (regionKey = null) => {
		if (regionKey) history.push({ search: `?region=${regionKey}` });
		else history.push({ search: null });
	};

	// ONLY ON FIRST LOAD AND PAGE QUERY CHANGES
	useEffect(() => {
		// do nothing if error exists
		if (error) return;

		// get search query, if any
		const urlParams = new URLSearchParams(history.location.search);
		const regionQuery = urlParams.get("region");

		// if basic data has not been loaded, load that first
		if (isEmpty(regions)) getRegions();
		// if a query was given, load that data
		else if (regionQuery && regions[regionQuery]) setSelectedRegionKey(regionQuery);
		// if no query was given, but one was already selected, remove that query
		else if (selectedRegionKey && !regionQuery) setSelectedRegionKey(null);
	}, [history, history.location.search, basicDataLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

	// ON SELECT REGIONS
	useEffect(() => {
		// do nothing if error exists, or if basic data hasn't been loaded
		if (error || !basicDataLoaded) return;
		// set to loaded if no region selected
		setRegionDataLoaded(false);
		if (!selectedRegionKey) return;
		// fetch all required data
		getRegionDataCharities(selectedRegionKey);
	}, [selectedRegionKey]); // eslint-disable-line react-hooks/exhaustive-deps

	return (
		<div className="Page MapPage">
			<MapHeader reloadPage={refreshPage} />
			<div className="map-container">
				{error && <Error message={error} />}
				{!error && (basicDataLoaded
					? <LeafletMap
						loaded={mapLoaded}
						setLoaded={setMapLoaded}
						data={IndiaGeoJson}
						selectedRegionKey={selectedRegionKey}
						handleSelectMapRegion={handleSelectMapRegion}
						sidebarOpen={Boolean(selectedRegionKey && regionDataCharities)}
					/>
					: <Loading />)}
				<div className={`map-sidebar ${selectedRegionKey && "active"}`}>
					{selectedRegionKey
						? <Region
							error={regionError}
							loaded={regionDataLoaded}
							refresh={() => { handleSelectMapRegion(); }}
							lastUpdated={basicDataLoaded}
							selectedRegionInfo={regions[selectedRegionKey]}
							selectedRegionCharities={regionDataCharities}
						/>
						: <Loading />}
				</div>
			</div>
		</div>
	);
};

export default Map;
