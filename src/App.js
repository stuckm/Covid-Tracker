import React, { useState, useEffect } from "react";
import { MenuItem, FormControl, Select,Card,CardContent } from "@material-ui/core";
import InfoBox from "./InfoBox";
import Map from "./Map";
import Table from "./Table";
import LineGraph from "./LineGraph"
import {sortData} from "./util";
import {prettyPrintStat} from "./util";
import "./App.css";
import "leaflet/dist/leaflet.css";


function App() {
  //list of country names and codes
  const [countries, setCountries] = useState([]);
  //current selected country defaults to worldwide
  const [country, setCountry] = useState("worldwide");
  //country data used in .app_stats. on intial mount this is worldwide data
  const [countryInfo, setCountryInfo] = useState({});
  //table data that is used in Table.js
  const [tableData, setTableData] = useState([]);
  //Center of map view
  const [mapCenter, setMapCenter] = useState({ lat: 34.80746, lng: -40.4796});
  //map zoom level
  const [mapZoom, setMapZoom] = useState(3);
  //country data used to generate circles
  const [mapCountries, setMapCountries] = useState([]);
  const [casesType,setCasesType] = useState("cases");

  //set worldwide data for inital mount
  useEffect(() => {
    fetch("https://disease.sh/v3/covid-19/all")
    .then((response) => response.json())
    .then((data) => {
      setCountryInfo(data);
    });
  }, []);

//get country names for drop down list and country data for table and map circles
  useEffect(() => {
    const getCountriesData = async () => {
      await fetch("https://disease.sh/v3/covid-19/countries")
        .then((response) => response.json())
        .then((data) => {
          const countries = data.map((country) => ({
            name: country.country,
            value: country.countryInfo.iso2,
          }));
          //sort data based on cases using util.js
          const sortedData = sortData(data);
          //set the table data with the sorted data
          setTableData(sortedData);
          //set the map data using all country data to generate circles
          setMapCountries(data);
          //generated dropdown list of all countries
          setCountries(countries);
        });
    };
    getCountriesData();
  }, []);

  //when dropdown list is changed info in .app_stats is updated and map view is adjusted 
  const onCountryChange = async (e) => {
    //grab the country from the value of the selected dropdown
    const countryCode = e.target.value;
    //if country code is worldwide show all data otherwise grab data using country code
     const url = countryCode === "worldwide" ? "https://disease.sh/v3/covid-19/all" : `https://disease.sh/v3/covid-19/countries/${countryCode}`
    await fetch(url)
    .then(response => response.json())
    .then(data => {
      //change the value in the drop down
      setCountry(countryCode);
      //sets country info that is displayed in .app_stats
      setCountryInfo(data);
      //set map view to country info lat and long
      setMapCenter([data.countryInfo.lat, data.countryInfo.long]);
      //set map zoom to 3
      setMapZoom(3);
    })
  };

  return (
    <div className="app">
      <div className="app_left">
        <div className="app_header">
          <h1>COVID-19 Tracker</h1>
          <FormControl>
            <Select
              variant="outlined"
              onChange={onCountryChange}
              value={country}
            >
              <MenuItem value="worldwide">Worldwide</MenuItem>
              {countries.map((country) => (
                <MenuItem value={country.value}>{country.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
        <div className="app_stats">
          <InfoBox title="Coronavirus Cases" cases={prettyPrintStat(countryInfo.todayCases)} total={prettyPrintStat(countryInfo.cases)} onClick={(e) => setCasesType("cases")} active={casesType === "cases"} isRed/>
          <InfoBox title="Recovered" cases={prettyPrintStat(countryInfo.todayRecovered)} total={prettyPrintStat(countryInfo.recovered)} onClick={(e) => setCasesType("recovered")} active={casesType === "recovered"}/>
          <InfoBox title="Deaths" cases={prettyPrintStat(countryInfo.todayDeaths)} total={prettyPrintStat(countryInfo.deaths)} onClick={(e) => setCasesType("deaths")} active={casesType === "deaths"} isRed/>
        </div>
        <Map 
        casesType={casesType}
        countries ={mapCountries}
        center={mapCenter}
        zoom={mapZoom}
        />
      </div>

      <Card className="app_right">
        <CardContent>
          <h2>Live Cases by Country</h2>
          <Table countries={tableData} />
          <h3 className="graph_title">Worldwide new {casesType}</h3>
          <LineGraph className="app_graph" casesType={casesType}/>
        </CardContent>

      </Card>
    </div>
  );
}

export default App;
