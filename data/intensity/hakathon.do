drop _all
clear
**********************************************************
*The following is to import data collected from CANSIM 379-0030
**********************************************************
import delimited \\scan01\jue_zhang\gdp.csv, varnames(4) asdouble rowrange(4:3982) clear 
replace geography="British Columbia" if geography=="British Columbia (66)"
forval i=4/20{
local j=`i'+1996
rename v`i' gdp`j'
tostring gdp`j', force replace //This is just to keep a consistent format of gdp variable with suppressed values reported as "x" or "..", which are not in a numeric form. 
}
rename northamericanindustryclassificat industry
reshape long gdp, i(geography industry) j(year)//Transfrom the data set from a wide form to a long form, which means the data is stacked by its identification codes (geography and industry) and years. 
split industry, p("[" "]" ) //Extract industry code from the text.
drop industry3

**************
*Map the industry code the sectors identified in energy data set (CANSIM 128-0016)

**Most aggregated sector level*
gen indlev1="Total industrial" if inlist(industry2, "113", "1153", "21","23","31-33")
replace indlev1="Total transportation" if inlist(industry2, "114", "2212", "481", "482", "483")
replace indlev1="Total transportation" if inlist(industry2, "484", "486", "48Z", "488", "447")
replace indlev1="Agriculture" if inlist(industry2, "111","112","1142","115A")
replace indlev1="Residential" if inlist(industry2, "5311" "5311A")
replace indlev1="Public administration" if inlist(industry2, "91")
replace indlev1="Commercial and other institutional" if inlist(industry2, "2211","41","49A","51")
replace indlev1="Commercial and other institutional" if substr(industry2, 1, 2)=="45"
replace indlev1="Commercial and other institutional" if substr(industry2, 1, 2)=="44" & inlist(industry2, "447")

replace indlev1="Commercial and other institutional" if inlist(industry2, "52","531A","532","533","54","55")
replace indlev1="Commercial and other institutional" if inlist(industry2, "56","61","62","71","72","81")

**Secondary aggregated sector level*
gen indlev2="Mining and oil and gas extraction" if inlist(industry2, "21")
replace indlev2="Total manufacturing" if inlist(industry2, "31-33")
replace indlev2="Forestry and logging and support activities for forestry" if inlist(industry2, "113", "1153")
replace indlev2="Construction" if inlist(industry2, "23")
replace indlev2="Railways" if inlist(industry2,"482")
replace indlev2="Total airlines" if inlist(industry2, "481")
replace indlev2="Total marine" if inlist(industry2, "114", "483")
replace indlev2="Pipelines" if inlist(industry2, "2212", "486")
replace indlev2="Road transport and urban transit" if inlist(industry2, "484, 48Z", "488")
replace indlev2="Retail pump sales" if inlist(industry2, "447")

**Least aggregated sector level*
gen indlev3="Pulp and paper manufacturing" if inlist(industry2, "322")
//both "Iron and steel manufacturing" vand "Aluminum and non-ferrous metal manufacturing" belongs to 331
replace indlev3="Primary metal manufacturing" if inlist(industry2, "331")
replace indlev3="Cement manufacturing" if inlist(industry2, "3273")
replace indlev3="Refined petroleum products manufacturing" if inlist(industry2, "324")
replace indlev3="Chemicals and fertilizers manufacturing" if inlist(industry2, "325")
replace indlev3="All other manufacturing" if inlist(substr(industry2, 1, 2), "31","32","33") & (indlev3=="" & indlev2=="" & industry2!="331") 
replace indlev3="Canadian airlines" if inlist(industry2, "481")
replace indlev3="Domestic marine" if inlist(industry2, "114","483")
rename industry2 industrycode
drop industry
rename industry1 industry

save \\scan01\jue_zhang\gdp.dta, replace

drop _all
clear
use \\scan01\jue_zhang\gdp.dta
destring gdp, force gen(gdpnumer)
	*Collapse the data set by sector, geography, and year. Sectors are categorized into three different hirarchies. 
	forval i=1/3{
	preserve
	collapse (sum) gdpnumer, by(geography year value indlev`i')
	save \\scan01\jue_zhang\gdp_indlev`i'.dta, replace
	restore
	} 

**********************************************************
*The following is to import data collected from CANSIM 128-0016
**********************************************************
drop _all
clear
import delimited \\scan01\jue_zhang\energyuse.csv, varnames(15) rowrange(15:3539) clear
forval i=4/20{
local j=`i'+1996
rename v`i' energy`j'
} 
rename supplyanddemandcharacteristics sector
split geography, p("(")
split sector, p("(")
split fueltype, p("(")
drop geography sector sector2 fueltype fueltype2
rename sector1 sector
rename geography1 geography 
rename fueltype1 fueltype

reshape long energy, i(geography sector fueltype) j(year) //Transform the data set from wide to long format. 
replace sector=strtrim(sector) //make sure no redundant space in each string. 
replace sector="Primary metal manufacturing" if inlist(sector,"Aluminum and non-ferrous metal manufacturing","Iron and steel manufacturing") //both "Iron and steel manufacturing" vand "Aluminum and non-ferrous metal manufacturing" belongs to 331
save \\scan01\jue_zhang\energyuse.dta, replace

***************************************************************
*The following is to join evergyuse data with gdp data by geography, sector, and year.
***************************************************************
drop _all
clear
use \\scan01\jue_zhang\energyuse.dta
rename energy EnergeyFinalDemand
destring EnergeyFinalDemand, gen(EnergeyFinalDemandnumer) force
collapse (sum) EnergeyFinalDemandnumer, by(geography sector fueltype year)
*Sectors are categorized into three different hirarchies, so run join codes three times with respect to each hirarchy. 
forval i=1/3{
preserve
gen indlev`i'=sector
joinby indlev`i' geography year using \\scan01\jue_zhang\gdp_indlev`i'.dta, unmatched(both) update
tab indlev`i' if _merge==3
drop indlev`i'
gen lev`i'=(_merge==3)
keep if _merge==3
drop _merge
save \\scan01\jue_zhang\energy_gdp_indlev`i'.dta, replace
restore
}

drop _all
clear
use \\scan01\jue_zhang\energy_gdp_indlev1.dta
append using \\scan01\jue_zhang\energy_gdp_indlev2.dta
append using \\scan01\jue_zhang\energy_gdp_indlev3.dta

label var lev1 "highly aggregated industry level"
label var lev2 "midium aggregated industry level"
label var lev3 "least aggregated industry level"

rename value gdpvalue
gen EnergyGDPintensity=((EnergeyFinalDemandnumer*23.8845896627)/(gdpnumer*1000000))*1000
/*
sum EnergyGDP*
gsort -EnergyGDPintensity
gen temp=(EnergyGDPintensity>1) // Check how many intensity value is greater than 1
tab temp //2445 out of 41735 with intensity greater than 1, which is around 6 percent of the sample
*************
*Weird, why there are some EnergyGDPintensity greater than 0*
*/
save \\scan01\jue_zhang\energy_gdp.dta, replace

 export delimited using "Z:\energy_gdp.csv", replace

**************************************************************************************
*The data set above is sliced into sector and industry level. However, we also need the one at provincial level only.
*Also, note that the chain gdp value is used in this data set, so that we can not obtain pronvicial level gdp by aggregating the sectoral gdp within a particular province. 
*The following is to add the provincial level data to the previous one. 
******************************************************************************
drop _all
clear
import delimited \\scan01\jue_zhang\gdpprovince.csv, varnames(4) asdouble rowrange(4:17) clear
replace geography="British Columbia" if geography=="British Columbia (66)"
forval i=4/20{
local j=`i'+1996
rename v`i' gdp`j'
tostring gdp`j', force replace
}
rename northamericanindustryclassificat sectors
reshape long gdp, i(geography) j(year)
rename value gdpvalue
destring gdp, gen(gdpnumer)
save \\scan01\jue_zhang\gdpprovince.dta, replace

drop _all
clear
import delimited \\scan01\jue_zhang\energyprovince.csv, varnames(15) asdouble rowrange(15:31) clear
forval i=4/20{
local j=`i'+1996
rename v`i' energy`j'
} 
rename supplyanddemandcharacteristics sector
reshape long energy, i(geography) j(year)
rename energy EnergeyFinalDemandnumer
save \\scan01\jue_zhang\energyprovince.dta, replace

drop _all
clear
use \\scan01\jue_zhang\energyprovince.dta
merge 1:1 year geography using \\scan01\jue_zhang\gdpprovince.dta
keep if _merge==3
drop _merge
gen EnergyGDPintensity=((EnergeyFinalDemandnumer*23.8845896627)/(gdpnumer*1000000))*1000
drop gdp
append using \\scan01\jue_zhang\energy_gdp.dta
save \\scan01\jue_zhang\energy_gdp_v2.dta
export delimited using "Z:\energy_gdp_v2.csv", replace
