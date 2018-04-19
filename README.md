# statcan_energyflows_hackathon
Repository for the scripts, files and documentation used for the hackathon by Team 2. The main products are the Sankey javascript visualization, available
both localy and hosted on AWS, as well as the Power BI tool.
# Sankey Examples
Some links to other work for inspiration.

__sankey diagram particle flow example__: https://bl.ocks.org/micahstubbs/ae0946f9efe18fc4f67460e7387abc0b

__sankey diagram crossfilter example__: http://bl.ocks.org/tonmcg/570fb0409b6c59768229d5631bc3d77e

# Deployed Sankey
__url for hosted json data__: http://myjson.com/12n2mb

__hosted site URL__: http://energyflowstatcan.s3-website-us-east-1.amazonaws.com/

# Data files
The _/data_ directory contains several files:
* _/data/sankey/_ contains data files used to generate Sankey diagram:
  * _CAN15_Mapped.csv_
    * This file contains a portion of the CANSIM Table 128-0016 - _Supply and demand of primary and secondary energy in terajoules_
    * It only contains the 2015, Canada level data.
     * Some transformations have alreadt been applied.
     * This is the main file that is used to generate the Sankey.
     * This file was generated by the organizers of the hackathon.
  * _1270007mapped.csv_
    * This file contains a portion of the CANSIM Table 127-0007 _Electric power generation, by class of electricity producer_
    * Data is for Canada-level and 2015 only
    * Data has been transformed to conform with the format of CAN15_Mapped.csv
  * _Imputations.csv_
    * This file contains observations from CAN15_Mapped.csv that have been imputed as 33
     * It contains new, better imputations
     * Imputation methods are documented in /refs/Decisions taken on imputed values.docx
* _/data/intensity/_ contains the data files that were used to generate the PowerBI report:
  * _gdp.csv_
    * A subset of CANSIM Table 379-0030
    * Contains GDP by year (2000-2016), by province and industry
  * _gdpprovince.csv_
    * A subset of CANSIM Table 379-0030
    * Contains GDP by year (2000-2016) and by province
  * _energyuse.csv_
     * A subset of CANSIM Table 128-0016
     * Contains energy use by industry, province, and year (2000-2016)
  * _energyprovince.csv_
    * A subset of CANSIM Table 128-0016
    * Contains energy use by province and year (2000-2016)
# Scripts
The _/transforms_ directory contains a couple of scripts for that take in raw input data and output files that feed into further analysis.
* _/transforms/create_intensity_data.do_
  * This Stata .do file operates on the datasets in _/data/intensity/_ and outputs _energy_gdp_v2.csv_ which feeds into the Power BI visualization tool.
* _/transforms/create_sankey_data.ipynb_
  * This Python script, formatted as a Jupter notebook, operates on the datasets in _/data/sankey/_ and outputs _energy_flows.json_ which feeds into Javascript Sankey visualization.
