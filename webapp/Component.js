sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"com/sap/build/standard/zapp006/model/models",
	"com/sap/build/standard/zapp006/localService/mockserver"
], function(UIComponent, Device, models, server) {
	"use strict";

	// TODO remove the following demo code
	// ---------------------------- TEMP MOCKSERVER CODE------------------------------------------
	server.init();
	// ---------------------------- END TEMP MOCKSERVER CODE--------------------------------------

	var navigationWithContext = {
		"SolicitudesSet": {
			"Details": "",
			"ItemEdit": "",
			"ItemCrea": "",
			"ItemEditGastos": "",
			"DetailsGastos": "",
			"ApprovViaje": "",
			"ApprovGasto": "",
			"InformeViaje": "",
			"Dialog11": "",
			"Dialog10": "",
			"Dialog2": "GastosEstimados",
			"Dialog5": "",
			"Dialog8": "Documentos",
			"Dialog4": "Documentos",
			"Dialog6": "",
			"Dialog1": "GastosEstimados"
		},
		"GastosEstimadosSet": {
			"Dialog2": "",
			"Dialog1": ""
		},
		"DocumentosSet": {
			"Dialog8": "",
			"Dialog4": ""
		}
	};

	return UIComponent.extend("com.sap.build.standard.zapp006.Component", {

		metadata: {
			manifest: "json"
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function() {
			// set the device model
			this.setModel(models.createDeviceModel(), "device");
			// set the FLP model
			this.setModel(models.createFLPModel(), "FLP");

			// set the dataSource model
			this.setModel(new sap.ui.model.json.JSONModel({
				"uri": "\"/here/goes/your/serviceUrl/\""
			}), "dataSource");

			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);

			// create the views based on the url/hash
			this.getRouter().initialize();
		},

		createContent: function() {
			var app = new sap.m.App({
				id: "App"
			});
			var appType = "App";
			var appBackgroundColor = "#FFFFFF";
			if (appType === "App" && appBackgroundColor) {
				app.setBackgroundColor(appBackgroundColor);
			}

			return app;
		},

		getNavigationPropertyForNavigationWithContext: function(sEntityNameSet, targetPageName) {
			var entityNavigations = navigationWithContext[sEntityNameSet];
			return entityNavigations == null ? null : entityNavigations[targetPageName];
		}
	});

});