sap.ui.define([
	"./utilities"
], function() {
	"use strict";

	// class providing static utility methods to retrieve entity default values.

	return {
		getDefaultValuesForItemCrea: function() {
			return {
				"ID": "",
				"NumeroSol": "",
				"CiudadDestino": "",
				"FechaInicio": null,
				"FechaFin": null,
				"Motivo": "",
				"ObservacionViaje": "",
				"Adelanto": true,
				"CentroCoste": "",
				"ObservacionLiquidacion": "",
				"Moneda": "PEN",
				"ObsAtencionViaje": "",
				"ObsAtencionLiqui": "",
				"FlagAlimentacion": false,
				"FlagDesayuno": true,
				"FlagAlmuerzo": true,
				"FlagCena": true,
				"FlagHospedaje": false,
				"FlagOtros": false,
				"MontoOtros": "0",
				"FlagAdelanto": true,
				"CiudadOrigen": "Lima"
			};
		}
	};
});