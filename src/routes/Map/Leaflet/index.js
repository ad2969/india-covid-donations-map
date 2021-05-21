import React, { useEffect, useState, useRef } from "react";
import {
	GeoJSON,
	MapContainer,
	TileLayer
} from "react-leaflet";
import "./index.mod.scss";

const MAPBOX_USER = "onlinkers";
const MAPBOX_STYLE_ID = "ckowxflz50ozk17qvv8vq24q8";
const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

// https://leafletjs.com/examples/choropleth/
// https://leafletjs.com/examples/geojson/

const COLOR_PALETTE = {
	1000: "#800026",
	500: "#BD0026",
	200: "#E31A1C",
	100: "#FC4E2A",
	50: "#FD8D3C",
	20: "#FEB24C",
	10: "#FED976",
	default: "#FFEDA0",
	line: "#fff",
	lineHighlight: "#666"
};

const DEFAULT_STYLES = {
	color: COLOR_PALETTE.line,
	fillColor: COLOR_PALETTE.default,
	fillOpacity: 0.3
};
const LOCK_STYLES = {
	color: COLOR_PALETTE.lineHighlight,
	fillColor: COLOR_PALETTE.default,
	fillOpacity: 0.7,
	weight: 5
};
const HIGHLIGHT_STYLES = {
	color: COLOR_PALETTE.lineHighlight,
	fillColor: COLOR_PALETTE.default,
	fillOpacity: 0.7
};

const DEFAULT_CENTER = [20.5, 80];
const DEFAULT_BOUNDS = [[40, 65], [5, 100]];

const LeafletMap = (props) => {
	const {
		loaded,
		setLoaded,
		data,
		selectedRegionKey,
		handleSelectMapRegion
	} = props;

	const mapRef = useRef();
	const geoJsonRef = useRef();
	const initialLayerRef = useRef();
	const [selectedLayer, setSelectedLayer] = useState(null);
	const [clickedLayer, setClickedLayer] = useState(null);

	const zoomToRegion = (bounds) => {
		mapRef.current.flyToBounds(bounds);
	};

	const handleMouseoverRegion = (e) => {
		const layer = e.sourceTarget;
		if (selectedLayer && layer.feature.properties.code === selectedLayer.feature.properties.code) return;

		// set the layer styles
		layer.setStyle(HIGHLIGHT_STYLES);
		layer.bringToFront();
	};

	const handleMouseoutRegion = (e) => {
		const layer = e.sourceTarget;
		if (selectedLayer && layer.feature.properties.code === selectedLayer.feature.properties.code) return;

		// reset the layer styles
		layer.setStyle(DEFAULT_STYLES);
		layer.bringToBack();
	};

	const handleClickRegion = (e) => {
		const layer = e.sourceTarget;
		setClickedLayer(e.sourceTarget);
		// change the url query
		if (selectedLayer && layer.feature.properties.code === selectedLayer.feature.properties.code) handleSelectMapRegion(null);
		else handleSelectMapRegion(layer.feature.properties.code);
	};

	useEffect(() => {
		if (!loaded) return;
		// reset previous layer styles, if any
		if (selectedLayer) selectedLayer.setStyle(DEFAULT_STYLES);
		if (selectedRegionKey) {
			let layer = clickedLayer || initialLayerRef.current
			// get info about the layer
			const bounds = layer.getBounds();
			// apply new styles and zoom
			layer.setStyle(LOCK_STYLES);
			zoomToRegion(bounds);
			// save the new layer
			setSelectedLayer(layer);
		} else {
			// zoom to default view
			zoomToRegion(DEFAULT_BOUNDS);
			// empty layer saves
			setSelectedLayer(null);
		}
		setClickedLayer(null);
	}, [loaded, selectedRegionKey]);

	return (
		<MapContainer
			className="LeafletMap"
			center={DEFAULT_CENTER}
			maxBounds={DEFAULT_BOUNDS}
			minZoom={5}
			zoom={6}
			preferCanvas={true}
			scrollWheelZoom={true}
			whenCreated={(mapInstance) => {
				mapRef.current = mapInstance;
				setLoaded(true);
			}}
		>
			<TileLayer
				url={`https://api.mapbox.com/styles/v1/${MAPBOX_USER}/${MAPBOX_STYLE_ID}/tiles/256/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`}
				attribution="Map data &copy; <a href=&quot;https://www.openstreetmap.org/&quot;>OpenStreetMap</a> contributors, <a href=&quot;https://creativecommons.org/licenses/by-sa/2.0/&quot;>CC-BY-SA</a>, Imagery &copy; <a href=&quot;https://www.mapbox.com/&quot;>Mapbox</a>"
			/>
			{loaded && <GeoJSON
				ref={geoJsonRef}
				data={data}
				attribution="&copy; credits due..."
				eventHandlers={{
					mouseover: handleMouseoverRegion,
					mouseout: handleMouseoutRegion,
					click: handleClickRegion
				}}
				onEachFeature={(feature, layer) => {
					console.log(feature.properties.code);
					if (layer && selectedRegionKey && feature.properties.code === selectedRegionKey) {
						// if a region was given at the start, set unique styles for the corresponding layer
						console.log("DICK", layer);
						initialLayerRef.current = layer; // hacky af but this works
					} else {
						// otherwise, set the default layer styles for every layer
						layer.setStyle(DEFAULT_STYLES);
					}
				}}
			/>}
		</MapContainer>
	);
};

export default LeafletMap;