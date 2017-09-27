sap.ui.define(["sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"./utilities",
	"sap/ui/core/routing/History"
], function(BaseController, MessageBox, Utilities, History) {
	"use strict";

	return BaseController.extend("com.sap.build.standard.zapp006.controller.List", {
		handleRouteMatched: function(oEvent) {

			var oParams = {};

			if (oEvent.mParameters.data.context) {
				this.sContext = oEvent.mParameters.data.context;
				var oPath;
				if (this.sContext) {
					oPath = {
						path: "/" + this.sContext,
						parameters: oParams
					};
					this.getView().bindObject(oPath);
				}
			}

		},
		_onTableItemPress: function(oEvent) {

			var oBindingContext = oEvent.getParameter("listItem").getBindingContext();

			return new Promise(function(fnResolve) {
				this.doNavigate("ItemEdit", oBindingContext, fnResolve, "");
			}.bind(this)).catch(function(err) {
				if (err !== undefined) {
					MessageBox.error(err.message);
				}
			});

		},
		doNavigate: function(sRouteName, oBindingContext, fnPromiseResolve, sViaRelation) {

			var sPath = (oBindingContext) ? oBindingContext.getPath() : null;
			var oModel = (oBindingContext) ? oBindingContext.getModel() : null;

			var sEntityNameSet;
			if (sPath !== null && sPath !== "") {
				if (sPath.substring(0, 1) === "/") {
					sPath = sPath.substring(1);
				}
				sEntityNameSet = sPath.split("(")[0];
			}
			var sNavigationPropertyName;
			var sMasterContext = this.sMasterContext ? this.sMasterContext : sPath;

			if (sEntityNameSet !== null) {
				sNavigationPropertyName = sViaRelation || this.getOwnerComponent().getNavigationPropertyForNavigationWithContext(sEntityNameSet,
					sRouteName);
			}
			if (sNavigationPropertyName !== null && sNavigationPropertyName !== undefined) {
				if (sNavigationPropertyName === "") {
					this.oRouter.navTo(sRouteName, {
						context: sPath,
						masterContext: sMasterContext
					}, false);
				} else {
					oModel.createBindingContext(sNavigationPropertyName, oBindingContext, null, function(bindingContext) {
						if (bindingContext) {
							sPath = bindingContext.getPath();
							if (sPath.substring(0, 1) === "/") {
								sPath = sPath.substring(1);
							}
						} else {
							sPath = "undefined";
						}

						// If the navigation is a 1-n, sPath would be "undefined" as this is not supported in Build
						if (sPath === "undefined") {
							this.oRouter.navTo(sRouteName);
						} else {
							this.oRouter.navTo(sRouteName, {
								context: sPath,
								masterContext: sMasterContext
							}, false);
						}
					}.bind(this));
				}
			} else {
				this.oRouter.navTo(sRouteName);
			}

			if (typeof fnPromiseResolve === "function") {
				fnPromiseResolve();
			}
		},
		_onSearchFieldLiveChange: function(oEvent) {
			var sControlId = "sap_Worklist_Page_0-content-sap_m_IconTabBar-1-items-sap_m_IconTabFilter-1-content-build_simple_Table-1";
			var oControl = this.getView().byId(sControlId);

			// Get the search query, regardless of the triggered event ('query' for the search event, 'newValue' for the liveChange one).
			var sQuery = oEvent.getParameter("query") || oEvent.getParameter("newValue");
			var sSourceId = oEvent.getSource().getId();

			return new Promise(function(fnResolve) {
				var aFinalFilters = [];

				var aFilters = [];
				// 1) Search filters (with OR)
				if (sQuery && sQuery.length > 0) {

					aFilters.push(new sap.ui.model.Filter("CiudadOrigen", sap.ui.model.FilterOperator.Contains, sQuery));

					aFilters.push(new sap.ui.model.Filter("CiudadDestino", sap.ui.model.FilterOperator.Contains, sQuery));

					aFilters.push(new sap.ui.model.Filter("Estado", sap.ui.model.FilterOperator.Contains, sQuery));

					aFilters.push(new sap.ui.model.Filter("StatusText", sap.ui.model.FilterOperator.Contains, sQuery));

					aFilters.push(new sap.ui.model.Filter("StatusIcon", sap.ui.model.FilterOperator.Contains, sQuery));

					aFilters.push(new sap.ui.model.Filter("Aprobador", sap.ui.model.FilterOperator.Contains, sQuery));

				}

				var aFinalFilters = aFilters.length > 0 ? [new sap.ui.model.Filter(aFilters, false)] : [];
				var oBindingOptions = this.updateBindingOptions(sControlId, {
					filters: aFinalFilters
				}, sSourceId);
				var oBindingInfo = oControl.getBindingInfo("items");
				oControl.bindAggregation("items", {
					model: oBindingInfo.model,
					path: oBindingInfo.path,
					parameters: oBindingInfo.parameters,
					template: oBindingInfo.template,
					sorter: oBindingOptions.sorters,
					filters: oBindingOptions.filters
				});
			}.bind(this)).catch(function(err) {
				if (err !== undefined) {
					MessageBox.error(err.message);
				}
			});

		},
		updateBindingOptions: function(sCollectionId, oBindingData, sSourceId) {
			this.mBindingOptions[sCollectionId] = this.mBindingOptions[sCollectionId] || {};

			var aSorters = oBindingData.sorters === undefined ? this.mBindingOptions[sCollectionId].sorters : oBindingData.sorters;
			var oGroupby = oBindingData.groupby === undefined ? this.mBindingOptions[sCollectionId].groupby : oBindingData.groupby;

			// 1) Update the filters map for the given collection and source
			this.mBindingOptions[sCollectionId].sorters = aSorters;
			this.mBindingOptions[sCollectionId].groupby = oGroupby;
			this.mBindingOptions[sCollectionId].filters = this.mBindingOptions[sCollectionId].filters || {};
			this.mBindingOptions[sCollectionId].filters[sSourceId] = oBindingData.filters || [];

			// 2) Reapply all the filters and sorters
			var aFilters = [];
			for (var key in this.mBindingOptions[sCollectionId].filters) {
				aFilters = aFilters.concat(this.mBindingOptions[sCollectionId].filters[key]);
			}

			// Add the groupby first in the sorters array
			if (oGroupby) {
				aSorters = aSorters ? [oGroupby].concat(aSorters) : [oGroupby];
			}

			var aFinalFilters = aFilters.length > 0 ? [new sap.ui.model.Filter(aFilters, true)] : undefined;
			return {
				filters: aFinalFilters,
				sorters: aSorters
			};

		},
		_onButtonPress2: function() {

			return new Promise(function(fnResolve, fnReject) {
				var bHasPendingChanges = false;
				var oModel;

				oModel = this.getView().getModel();
				bHasPendingChanges = oModel && oModel.hasPendingChanges();

				if (bHasPendingChanges) {
					var sUserMessage = "Please save your changes, first";
					fnReject(new Error(sUserMessage));
				} else {
					var oNewEntityInstance = Utilities.getDefaultValuesForItemCrea();
					oNewEntityInstance.ID = "id-" + new Date().getTime();

					oModel = this.getView().getModel();
					var oNewBindingContext = oModel.createEntry("SolicitudesSet", {
						properties: oNewEntityInstance
					});

					this.doNavigate("ItemCrea", oNewBindingContext, fnResolve);
				}
			}.bind(this)).catch(function(err) {
				if (err !== undefined) {
					MessageBox.error(err.message);
				}
			});

		},
		_onButtonPress3: function(oEvent) {

			this.mSettingsDialogs = this.mSettingsDialogs || {};
			var sSourceId = oEvent.getSource().getId();
			var oDialog = this.mSettingsDialogs["ViewSettingsDialog1"];

			var confirmHandler = function(oConfirmEvent) {
				var self = this;
				var sFilterString = oConfirmEvent.getParameter('filterString');
				var oBindingData = {};

				/* Grouping */
				if (oConfirmEvent.getParameter("groupItem")) {
					var sPath = oConfirmEvent.getParameter("groupItem").getKey();
					oBindingData.groupby = new sap.ui.model.Sorter(sPath, oConfirmEvent.getParameter("groupDescending"), true);
				} else {
					// Reset the group by
					oBindingData.groupby = null;
				}

				/* Sorting */
				if (oConfirmEvent.getParameter("sortItem")) {
					var sPath = oConfirmEvent.getParameter("sortItem").getKey();
					oBindingData.sorters = [new sap.ui.model.Sorter(sPath, oConfirmEvent.getParameter("sortDescending"))];
				}

				/* Filtering */
				oBindingData.filters = [];
				// The list of filters that will be applied to the collection
				var oFilter;
				var vValueLT, vValueGT;

				vValueLT = oDialog.getModel().getProperty("/FechaInicio/vValueLT");
				vValueGT = oDialog.getModel().getProperty("/FechaInicio/vValueGT");
				if (vValueLT !== "" || vValueGT !== "") {
					oFilter = this.getCustomFilter("FechaInicio", vValueLT, vValueGT);
					oBindingData.filters.push(oFilter);
					sFilterString = sFilterString ? sFilterString + ', ' : 'Filtered by: ';
					sFilterString += this.getCustomFilterString(false, "FechaInicio", oFilter.sOperator, vValueLT, vValueGT);
				}

				vValueLT = oDialog.getModel().getProperty("/FechaFin/vValueLT");
				vValueGT = oDialog.getModel().getProperty("/FechaFin/vValueGT");
				if (vValueLT !== "" || vValueGT !== "") {
					oFilter = this.getCustomFilter("FechaFin", vValueLT, vValueGT);
					oBindingData.filters.push(oFilter);
					sFilterString = sFilterString ? sFilterString + ', ' : 'Filtered by: ';
					sFilterString += this.getCustomFilterString(false, "FechaFin", oFilter.sOperator, vValueLT, vValueGT);
				}

				// Simple filters (String)
				var mSimpleFilters = {},
					sKey;
				for (sKey in oConfirmEvent.getParameter("filterKeys")) {
					var aSplit = sKey.split("___");
					var sPath = aSplit[1];
					var sValue1 = aSplit[2];
					var oFilterInfo = new sap.ui.model.Filter(sPath, "EQ", sValue1);

					// Creating a map of filters for each path
					if (!mSimpleFilters[sPath]) {
						mSimpleFilters[sPath] = [oFilterInfo];
					} else {
						mSimpleFilters[sPath].push(oFilterInfo);
					}
				}

				for (var path in mSimpleFilters) {
					// All filters on a same path are combined with a OR
					oBindingData.filters.push(new sap.ui.model.Filter(mSimpleFilters[path], false));
				}

				aCollections.forEach(function(oCollectionItem) {
					var oCollection = self.getView().byId(oCollectionItem.id);
					var oBindingInfo = oCollection.getBindingInfo(oCollectionItem.aggregation);
					var oBindingOptions = this.updateBindingOptions(oCollectionItem.id, oBindingData, sSourceId);
					oCollection.bindAggregation(oCollectionItem.aggregation, {
						model: oBindingInfo.model,
						path: oBindingInfo.path,
						parameters: oBindingInfo.parameters,
						template: oBindingInfo.template,
						sorter: oBindingOptions.sorters,
						filters: oBindingOptions.filters
					});

					// Display the filter string if necessary
					if (typeof oCollection.getInfoToolbar === "function") {
						var oToolBar = oCollection.getInfoToolbar();
						if (oToolBar && oToolBar.getContent().length === 1) {
							oToolBar.setVisible(!!sFilterString);
							oToolBar.getContent()[0].setText(sFilterString);
						}
					}
				}, this);
			}.bind(this);

			function resetFiltersHandler() {

				oDialog.getModel().setProperty("/FechaInicio/vValueLT", "");
				oDialog.getModel().setProperty("/FechaInicio/vValueGT", "");

				oDialog.getModel().setProperty("/FechaFin/vValueLT", "");
				oDialog.getModel().setProperty("/FechaFin/vValueGT", "");

			}

			function updateDialogData() {
				var mParams = {
					context: oReferenceCollection.getBindingContext(),
					success: function(oData) {
						var oJsonModelDialogData = {};
						// Loop through each entity
						oData.results.forEach(function(oEntity) {
							// Add the distinct properties in a map
							for (var oKey in oEntity) {
								if (!oJsonModelDialogData[oKey]) {
									oJsonModelDialogData[oKey] = [oEntity[oKey]];
								} else if (oJsonModelDialogData[oKey].indexOf(oEntity[oKey]) === -1) {
									oJsonModelDialogData[oKey].push(oEntity[oKey]);
								}
							}
						});

						var oDialogModel = oDialog.getModel();

						oJsonModelDialogData["FechaInicio"] = {
							vValueLT: (oDialogModel && oDialogModel.getProperty("/FechaInicio")) ? oDialogModel.getProperty("/FechaInicio/vValueLT") : "",
							vValueGT: (oDialogModel && oDialogModel.getProperty("/FechaInicio")) ? oDialogModel.getProperty("/FechaInicio/vValueGT") : ""
						};

						oJsonModelDialogData["FechaFin"] = {
							vValueLT: (oDialogModel && oDialogModel.getProperty("/FechaFin")) ? oDialogModel.getProperty("/FechaFin/vValueLT") : "",
							vValueGT: (oDialogModel && oDialogModel.getProperty("/FechaFin")) ? oDialogModel.getProperty("/FechaFin/vValueGT") : ""
						};

						if (!oDialogModel) {
							oDialogModel = new sap.ui.model.json.JSONModel();
							oDialog.setModel(oDialogModel);
						}
						oDialogModel.setData(oJsonModelDialogData);
						oDialog.open();
					}
				};

				var sPath = oReferenceCollection.getBindingInfo(aCollections[0].aggregation).path;
				oModel.read(sPath, mParams);
			}

			if (!oDialog) {
				oDialog = sap.ui.xmlfragment({
					fragmentName: "com.sap.build.standard.zapp006.view.ViewSettingsDialog1"
				}, this);
				oDialog.attachEvent("confirm", confirmHandler);
				oDialog.attachEvent("resetFilters", resetFiltersHandler);

				this.mSettingsDialogs["ViewSettingsDialog1"] = oDialog;
			}

			var aCollections = [];

			aCollections.push({
				id: "sap_Worklist_Page_0-content-sap_m_IconTabBar-1-items-sap_m_IconTabFilter-1-content-build_simple_Table-1",
				aggregation: "items"
			});

			var oReferenceCollection = this.getView().byId(aCollections[0].id);
			var oSourceBindingContext = oReferenceCollection.getBindingContext();
			var oModel = oSourceBindingContext ? oSourceBindingContext.getModel() : this.getView().getModel();

			// toggle compact style
			jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), oDialog);
			updateDialogData();

		},
		getCustomFilter: function(sPath, vValueLT, vValueGT) {
			if (vValueLT !== "" && vValueGT !== "") {
				return new sap.ui.model.Filter([
					new sap.ui.model.Filter(sPath, sap.ui.model.FilterOperator.GT, vValueGT),
					new sap.ui.model.Filter(sPath, sap.ui.model.FilterOperator.LT, vValueLT)
				], true);
			}
			if (vValueLT !== "") {
				return new sap.ui.model.Filter(sPath, sap.ui.model.FilterOperator.LT, vValueLT);
			}
			return new sap.ui.model.Filter(sPath, sap.ui.model.FilterOperator.GT, vValueGT);

		},
		getCustomFilterString: function(bIsNumber, sPath, sOperator, vValueLT, vValueGT) {
			switch (sOperator) {
				case sap.ui.model.FilterOperator.LT:
					return sPath + (bIsNumber ? ' (Less than ' : ' (Before ') + vValueLT + ')';
				case sap.ui.model.FilterOperator.BT:
					return sPath + ' (Between ' + vValueGT + ' and ' + vValueLT + ')';
				case sap.ui.model.FilterOperator.GT:
					return sPath + (bIsNumber ? ' (More than ' : ' (After ') + vValueGT + ')';
			}

		},
		filterCountFormatter: function(sValue1, sValue2) {
			return sValue1 !== "" || sValue2 !== "" ? 1 : 0;

		},
		_onTableItemPress1: function(oEvent) {

			var oBindingContext = oEvent.getParameter("listItem").getBindingContext();

			return new Promise(function(fnResolve) {
				this.doNavigate("ApprovViaje", oBindingContext, fnResolve, "");
			}.bind(this)).catch(function(err) {
				if (err !== undefined) {
					MessageBox.error(err.message);
				}
			});

		},
		_onSearchFieldLiveChange1: function(oEvent) {
			var sControlId =
				"sap_Worklist_Page_0-content-sap_m_IconTabBar-1-items-sap_m_IconTabFilter-2-content-build_simple_Table-1502816187882";
			var oControl = this.getView().byId(sControlId);

			// Get the search query, regardless of the triggered event ('query' for the search event, 'newValue' for the liveChange one).
			var sQuery = oEvent.getParameter("query") || oEvent.getParameter("newValue");
			var sSourceId = oEvent.getSource().getId();

			return new Promise(function(fnResolve) {
				var aFinalFilters = [];

				var aFilters = [];
				// 1) Search filters (with OR)
				if (sQuery && sQuery.length > 0) {

					aFilters.push(new sap.ui.model.Filter("CiudadOrigen", sap.ui.model.FilterOperator.Contains, sQuery));

					aFilters.push(new sap.ui.model.Filter("CiudadDestino", sap.ui.model.FilterOperator.Contains, sQuery));

					aFilters.push(new sap.ui.model.Filter("NomSol", sap.ui.model.FilterOperator.Contains, sQuery));

					aFilters.push(new sap.ui.model.Filter("TipoSol", sap.ui.model.FilterOperator.Contains, sQuery));

				}

				var aFinalFilters = aFilters.length > 0 ? [new sap.ui.model.Filter(aFilters, false)] : [];
				var oBindingOptions = this.updateBindingOptions(sControlId, {
					filters: aFinalFilters
				}, sSourceId);
				var oBindingInfo = oControl.getBindingInfo("items");
				oControl.bindAggregation("items", {
					model: oBindingInfo.model,
					path: oBindingInfo.path,
					parameters: oBindingInfo.parameters,
					template: oBindingInfo.template,
					sorter: oBindingOptions.sorters,
					filters: oBindingOptions.filters
				});
			}.bind(this)).catch(function(err) {
				if (err !== undefined) {
					MessageBox.error(err.message);
				}
			});

		},
		_onButtonPress4: function(oEvent) {

			oEvent = jQuery.extend(true, {}, oEvent);
			return new Promise(function(fnResolve) {
					fnResolve(true);
				})
				.then(function(result) {
					return new Promise(function(fnResolve) {
						sap.m.MessageBox.confirm("Esta seguro que desea Aprobar la solicitud?", {
							title: "Aprobar Solicitud",
							actions: ["Si", "No"],
							onClose: function(sActionClicked) {
								fnResolve(sActionClicked === "Si");
							}
						});
					});

				}.bind(this))
				.then(function(result) {
					if (result === false) {
						return false;
					} else {
						return new Promise(function(fnResolve) {
							var aChangedEntitiesPath, oChangedBindingContext;
							var oModel = this.oModel;
							if (oModel && oModel.hasPendingChanges()) {
								aChangedEntitiesPath = Object.keys(oModel.mChangedEntities);

								for (var j = 0; j < aChangedEntitiesPath.length; j++) {
									oChangedBindingContext = oModel.getContext("/" + aChangedEntitiesPath[j]);
									if (oChangedBindingContext && oChangedBindingContext.bCreated) {
										oModel.deleteCreatedEntry(oChangedBindingContext);
									}
								}
								oModel.resetChanges();
							}
							fnResolve();
						}.bind(this));

					}
				}.bind(this))
				.then(function(result) {
					if (result === false) {
						return false;
					} else {
						return new Promise(function(fnResolve) {
							var aChangedEntitiesPath, oChangedBindingContext;
							var oModel = this.oModel;
							if (oModel && oModel.hasPendingChanges()) {
								aChangedEntitiesPath = Object.keys(oModel.mChangedEntities);

								for (var j = 0; j < aChangedEntitiesPath.length; j++) {
									oChangedBindingContext = oModel.getContext("/" + aChangedEntitiesPath[j]);
									if (oChangedBindingContext && oChangedBindingContext.bCreated) {
										oModel.deleteCreatedEntry(oChangedBindingContext);
									}
								}
								oModel.resetChanges();
							}
							fnResolve();
						}.bind(this));

					}
				}.bind(this)).catch(function(err) {
					if (err !== undefined) {
						MessageBox.error(err.message);
					}
				});
		},
		_onButtonPress5: function(oEvent) {

			var sDialogName = "Dialog3";
			this.mDialogs = this.mDialogs || {};
			var oDialog = this.mDialogs[sDialogName];
			var oSource = oEvent.getSource();
			var oBindingContext = oSource.getBindingContext();
			var sPath = (oBindingContext) ? oBindingContext.getPath() : null;
			var oView;
			if (!oDialog) {
				this.getOwnerComponent().runAsOwner(function() {
					oView = sap.ui.xmlview({
						viewName: "com.sap.build.standard.zapp006.view." + sDialogName
					});
					this.getView().addDependent(oView);
					oView.getController().setRouter(this.oRouter);
					oDialog = oView.getContent()[0];
					this.mDialogs[sDialogName] = oDialog;
				}.bind(this));
			}

			return new Promise(function(fnResolve) {
				oDialog.attachEventOnce("afterOpen", null, fnResolve);
				oDialog.open();
				if (oView) {
					oDialog.attachAfterOpen(function() {
						oDialog.rerender();
					});
				} else {
					oView = oDialog.getParent();
				}

				var oModel = this.getView().getModel();
				if (oModel) {
					oView.setModel(oModel);
				}
				if (sPath) {
					var oParams = oView.getController().getBindingParameters();
					oView.bindObject({
						path: sPath,
						parameters: oParams
					});
				}
			}.bind(this)).catch(function(err) {
				if (err !== undefined) {
					MessageBox.error(err.message);
				}
			});

		},
		_onButtonPress6: function(oEvent) {

			this.mSettingsDialogs = this.mSettingsDialogs || {};
			var sSourceId = oEvent.getSource().getId();
			var oDialog = this.mSettingsDialogs["ViewSettingsDialog2"];

			var confirmHandler = function(oConfirmEvent) {
				var self = this;
				var sFilterString = oConfirmEvent.getParameter('filterString');
				var oBindingData = {};

				/* Grouping */
				if (oConfirmEvent.getParameter("groupItem")) {
					var sPath = oConfirmEvent.getParameter("groupItem").getKey();
					oBindingData.groupby = new sap.ui.model.Sorter(sPath, oConfirmEvent.getParameter("groupDescending"), true);
				} else {
					// Reset the group by
					oBindingData.groupby = null;
				}

				/* Sorting */
				if (oConfirmEvent.getParameter("sortItem")) {
					var sPath = oConfirmEvent.getParameter("sortItem").getKey();
					oBindingData.sorters = [new sap.ui.model.Sorter(sPath, oConfirmEvent.getParameter("sortDescending"))];
				}

				/* Filtering */
				oBindingData.filters = [];
				// The list of filters that will be applied to the collection
				var oFilter;
				var vValueLT, vValueGT;

				vValueLT = oDialog.getModel().getProperty("/FechaInicio/vValueLT");
				vValueGT = oDialog.getModel().getProperty("/FechaInicio/vValueGT");
				if (vValueLT !== "" || vValueGT !== "") {
					oFilter = this.getCustomFilter("FechaInicio", vValueLT, vValueGT);
					oBindingData.filters.push(oFilter);
					sFilterString = sFilterString ? sFilterString + ', ' : 'Filtered by: ';
					sFilterString += this.getCustomFilterString(false, "FechaInicio", oFilter.sOperator, vValueLT, vValueGT);
				}

				vValueLT = oDialog.getModel().getProperty("/FechaFin/vValueLT");
				vValueGT = oDialog.getModel().getProperty("/FechaFin/vValueGT");
				if (vValueLT !== "" || vValueGT !== "") {
					oFilter = this.getCustomFilter("FechaFin", vValueLT, vValueGT);
					oBindingData.filters.push(oFilter);
					sFilterString = sFilterString ? sFilterString + ', ' : 'Filtered by: ';
					sFilterString += this.getCustomFilterString(false, "FechaFin", oFilter.sOperator, vValueLT, vValueGT);
				}

				// Simple filters (String)
				var mSimpleFilters = {},
					sKey;
				for (sKey in oConfirmEvent.getParameter("filterKeys")) {
					var aSplit = sKey.split("___");
					var sPath = aSplit[1];
					var sValue1 = aSplit[2];
					var oFilterInfo = new sap.ui.model.Filter(sPath, "EQ", sValue1);

					// Creating a map of filters for each path
					if (!mSimpleFilters[sPath]) {
						mSimpleFilters[sPath] = [oFilterInfo];
					} else {
						mSimpleFilters[sPath].push(oFilterInfo);
					}
				}

				for (var path in mSimpleFilters) {
					// All filters on a same path are combined with a OR
					oBindingData.filters.push(new sap.ui.model.Filter(mSimpleFilters[path], false));
				}

				aCollections.forEach(function(oCollectionItem) {
					var oCollection = self.getView().byId(oCollectionItem.id);
					var oBindingInfo = oCollection.getBindingInfo(oCollectionItem.aggregation);
					var oBindingOptions = this.updateBindingOptions(oCollectionItem.id, oBindingData, sSourceId);
					oCollection.bindAggregation(oCollectionItem.aggregation, {
						model: oBindingInfo.model,
						path: oBindingInfo.path,
						parameters: oBindingInfo.parameters,
						template: oBindingInfo.template,
						sorter: oBindingOptions.sorters,
						filters: oBindingOptions.filters
					});

					// Display the filter string if necessary
					if (typeof oCollection.getInfoToolbar === "function") {
						var oToolBar = oCollection.getInfoToolbar();
						if (oToolBar && oToolBar.getContent().length === 1) {
							oToolBar.setVisible(!!sFilterString);
							oToolBar.getContent()[0].setText(sFilterString);
						}
					}
				}, this);
			}.bind(this);

			function resetFiltersHandler() {

				oDialog.getModel().setProperty("/FechaInicio/vValueLT", "");
				oDialog.getModel().setProperty("/FechaInicio/vValueGT", "");

				oDialog.getModel().setProperty("/FechaFin/vValueLT", "");
				oDialog.getModel().setProperty("/FechaFin/vValueGT", "");

			}

			function updateDialogData() {
				var mParams = {
					context: oReferenceCollection.getBindingContext(),
					success: function(oData) {
						var oJsonModelDialogData = {};
						// Loop through each entity
						oData.results.forEach(function(oEntity) {
							// Add the distinct properties in a map
							for (var oKey in oEntity) {
								if (!oJsonModelDialogData[oKey]) {
									oJsonModelDialogData[oKey] = [oEntity[oKey]];
								} else if (oJsonModelDialogData[oKey].indexOf(oEntity[oKey]) === -1) {
									oJsonModelDialogData[oKey].push(oEntity[oKey]);
								}
							}
						});

						var oDialogModel = oDialog.getModel();

						oJsonModelDialogData["FechaInicio"] = {
							vValueLT: (oDialogModel && oDialogModel.getProperty("/FechaInicio")) ? oDialogModel.getProperty("/FechaInicio/vValueLT") : "",
							vValueGT: (oDialogModel && oDialogModel.getProperty("/FechaInicio")) ? oDialogModel.getProperty("/FechaInicio/vValueGT") : ""
						};

						oJsonModelDialogData["FechaFin"] = {
							vValueLT: (oDialogModel && oDialogModel.getProperty("/FechaFin")) ? oDialogModel.getProperty("/FechaFin/vValueLT") : "",
							vValueGT: (oDialogModel && oDialogModel.getProperty("/FechaFin")) ? oDialogModel.getProperty("/FechaFin/vValueGT") : ""
						};

						if (!oDialogModel) {
							oDialogModel = new sap.ui.model.json.JSONModel();
							oDialog.setModel(oDialogModel);
						}
						oDialogModel.setData(oJsonModelDialogData);
						oDialog.open();
					}
				};

				var sPath = oReferenceCollection.getBindingInfo(aCollections[0].aggregation).path;
				oModel.read(sPath, mParams);
			}

			if (!oDialog) {
				oDialog = sap.ui.xmlfragment({
					fragmentName: "com.sap.build.standard.zapp006.view.ViewSettingsDialog2"
				}, this);
				oDialog.attachEvent("confirm", confirmHandler);
				oDialog.attachEvent("resetFilters", resetFiltersHandler);

				this.mSettingsDialogs["ViewSettingsDialog2"] = oDialog;
			}

			var aCollections = [];

			aCollections.push({
				id: "sap_Worklist_Page_0-content-sap_m_IconTabBar-1-items-sap_m_IconTabFilter-2-content-build_simple_Table-1502816187882",
				aggregation: "items"
			});

			var oReferenceCollection = this.getView().byId(aCollections[0].id);
			var oSourceBindingContext = oReferenceCollection.getBindingContext();
			var oModel = oSourceBindingContext ? oSourceBindingContext.getModel() : this.getView().getModel();

			// toggle compact style
			jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), oDialog);
			updateDialogData();

		},
		_onTableItemPress2: function(oEvent) {

			var oBindingContext = oEvent.getParameter("listItem").getBindingContext();

			return new Promise(function(fnResolve) {
				this.doNavigate("InformeViaje", oBindingContext, fnResolve, "");
			}.bind(this)).catch(function(err) {
				if (err !== undefined) {
					MessageBox.error(err.message);
				}
			});

		},
		_onSearchFieldLiveChange2: function(oEvent) {
			var sControlId =
				"sap_Worklist_Page_0-content-sap_m_IconTabBar-1-items-sap_m_IconTabFilter-1503086265060-content-build_simple_Table-1";
			var oControl = this.getView().byId(sControlId);

			// Get the search query, regardless of the triggered event ('query' for the search event, 'newValue' for the liveChange one).
			var sQuery = oEvent.getParameter("query") || oEvent.getParameter("newValue");
			var sSourceId = oEvent.getSource().getId();

			return new Promise(function(fnResolve) {
				var aFinalFilters = [];

				var aFilters = [];
				// 1) Search filters (with OR)
				if (sQuery && sQuery.length > 0) {

					aFilters.push(new sap.ui.model.Filter("CiudadOrigen", sap.ui.model.FilterOperator.Contains, sQuery));

					aFilters.push(new sap.ui.model.Filter("CiudadDestino", sap.ui.model.FilterOperator.Contains, sQuery));

					aFilters.push(new sap.ui.model.Filter("Estado", sap.ui.model.FilterOperator.Contains, sQuery));

					aFilters.push(new sap.ui.model.Filter("StatusText", sap.ui.model.FilterOperator.Contains, sQuery));

					aFilters.push(new sap.ui.model.Filter("StatusIcon", sap.ui.model.FilterOperator.Contains, sQuery));

					aFilters.push(new sap.ui.model.Filter("TipoSol", sap.ui.model.FilterOperator.Contains, sQuery));

					aFilters.push(new sap.ui.model.Filter("NomSol", sap.ui.model.FilterOperator.Contains, sQuery));

				}

				var aFinalFilters = aFilters.length > 0 ? [new sap.ui.model.Filter(aFilters, false)] : [];
				var oBindingOptions = this.updateBindingOptions(sControlId, {
					filters: aFinalFilters
				}, sSourceId);
				var oBindingInfo = oControl.getBindingInfo("items");
				oControl.bindAggregation("items", {
					model: oBindingInfo.model,
					path: oBindingInfo.path,
					parameters: oBindingInfo.parameters,
					template: oBindingInfo.template,
					sorter: oBindingOptions.sorters,
					filters: oBindingOptions.filters
				});
			}.bind(this)).catch(function(err) {
				if (err !== undefined) {
					MessageBox.error(err.message);
				}
			});

		},
		_onButtonPress7: function(oEvent) {

			this.mSettingsDialogs = this.mSettingsDialogs || {};
			var sSourceId = oEvent.getSource().getId();
			var oDialog = this.mSettingsDialogs["ViewSettingsDialog3"];

			var confirmHandler = function(oConfirmEvent) {
				var self = this;
				var sFilterString = oConfirmEvent.getParameter('filterString');
				var oBindingData = {};

				/* Grouping */
				if (oConfirmEvent.getParameter("groupItem")) {
					var sPath = oConfirmEvent.getParameter("groupItem").getKey();
					oBindingData.groupby = new sap.ui.model.Sorter(sPath, oConfirmEvent.getParameter("groupDescending"), true);
				} else {
					// Reset the group by
					oBindingData.groupby = null;
				}

				/* Sorting */
				if (oConfirmEvent.getParameter("sortItem")) {
					var sPath = oConfirmEvent.getParameter("sortItem").getKey();
					oBindingData.sorters = [new sap.ui.model.Sorter(sPath, oConfirmEvent.getParameter("sortDescending"))];
				}

				/* Filtering */
				oBindingData.filters = [];
				// The list of filters that will be applied to the collection
				var oFilter;
				var vValueLT, vValueGT;

				vValueLT = oDialog.getModel().getProperty("/FechaInicio/vValueLT");
				vValueGT = oDialog.getModel().getProperty("/FechaInicio/vValueGT");
				if (vValueLT !== "" || vValueGT !== "") {
					oFilter = this.getCustomFilter("FechaInicio", vValueLT, vValueGT);
					oBindingData.filters.push(oFilter);
					sFilterString = sFilterString ? sFilterString + ', ' : 'Filtered by: ';
					sFilterString += this.getCustomFilterString(false, "FechaInicio", oFilter.sOperator, vValueLT, vValueGT);
				}

				vValueLT = oDialog.getModel().getProperty("/FechaFin/vValueLT");
				vValueGT = oDialog.getModel().getProperty("/FechaFin/vValueGT");
				if (vValueLT !== "" || vValueGT !== "") {
					oFilter = this.getCustomFilter("FechaFin", vValueLT, vValueGT);
					oBindingData.filters.push(oFilter);
					sFilterString = sFilterString ? sFilterString + ', ' : 'Filtered by: ';
					sFilterString += this.getCustomFilterString(false, "FechaFin", oFilter.sOperator, vValueLT, vValueGT);
				}

				// Simple filters (String)
				var mSimpleFilters = {},
					sKey;
				for (sKey in oConfirmEvent.getParameter("filterKeys")) {
					var aSplit = sKey.split("___");
					var sPath = aSplit[1];
					var sValue1 = aSplit[2];
					var oFilterInfo = new sap.ui.model.Filter(sPath, "EQ", sValue1);

					// Creating a map of filters for each path
					if (!mSimpleFilters[sPath]) {
						mSimpleFilters[sPath] = [oFilterInfo];
					} else {
						mSimpleFilters[sPath].push(oFilterInfo);
					}
				}

				for (var path in mSimpleFilters) {
					// All filters on a same path are combined with a OR
					oBindingData.filters.push(new sap.ui.model.Filter(mSimpleFilters[path], false));
				}

				aCollections.forEach(function(oCollectionItem) {
					var oCollection = self.getView().byId(oCollectionItem.id);
					var oBindingInfo = oCollection.getBindingInfo(oCollectionItem.aggregation);
					var oBindingOptions = this.updateBindingOptions(oCollectionItem.id, oBindingData, sSourceId);
					oCollection.bindAggregation(oCollectionItem.aggregation, {
						model: oBindingInfo.model,
						path: oBindingInfo.path,
						parameters: oBindingInfo.parameters,
						template: oBindingInfo.template,
						sorter: oBindingOptions.sorters,
						filters: oBindingOptions.filters
					});

					// Display the filter string if necessary
					if (typeof oCollection.getInfoToolbar === "function") {
						var oToolBar = oCollection.getInfoToolbar();
						if (oToolBar && oToolBar.getContent().length === 1) {
							oToolBar.setVisible(!!sFilterString);
							oToolBar.getContent()[0].setText(sFilterString);
						}
					}
				}, this);
			}.bind(this);

			function resetFiltersHandler() {

				oDialog.getModel().setProperty("/FechaInicio/vValueLT", "");
				oDialog.getModel().setProperty("/FechaInicio/vValueGT", "");

				oDialog.getModel().setProperty("/FechaFin/vValueLT", "");
				oDialog.getModel().setProperty("/FechaFin/vValueGT", "");

			}

			function updateDialogData() {
				var mParams = {
					context: oReferenceCollection.getBindingContext(),
					success: function(oData) {
						var oJsonModelDialogData = {};
						// Loop through each entity
						oData.results.forEach(function(oEntity) {
							// Add the distinct properties in a map
							for (var oKey in oEntity) {
								if (!oJsonModelDialogData[oKey]) {
									oJsonModelDialogData[oKey] = [oEntity[oKey]];
								} else if (oJsonModelDialogData[oKey].indexOf(oEntity[oKey]) === -1) {
									oJsonModelDialogData[oKey].push(oEntity[oKey]);
								}
							}
						});

						var oDialogModel = oDialog.getModel();

						oJsonModelDialogData["FechaInicio"] = {
							vValueLT: (oDialogModel && oDialogModel.getProperty("/FechaInicio")) ? oDialogModel.getProperty("/FechaInicio/vValueLT") : "",
							vValueGT: (oDialogModel && oDialogModel.getProperty("/FechaInicio")) ? oDialogModel.getProperty("/FechaInicio/vValueGT") : ""
						};

						oJsonModelDialogData["FechaFin"] = {
							vValueLT: (oDialogModel && oDialogModel.getProperty("/FechaFin")) ? oDialogModel.getProperty("/FechaFin/vValueLT") : "",
							vValueGT: (oDialogModel && oDialogModel.getProperty("/FechaFin")) ? oDialogModel.getProperty("/FechaFin/vValueGT") : ""
						};

						if (!oDialogModel) {
							oDialogModel = new sap.ui.model.json.JSONModel();
							oDialog.setModel(oDialogModel);
						}
						oDialogModel.setData(oJsonModelDialogData);
						oDialog.open();
					}
				};

				var sPath = oReferenceCollection.getBindingInfo(aCollections[0].aggregation).path;
				oModel.read(sPath, mParams);
			}

			if (!oDialog) {
				oDialog = sap.ui.xmlfragment({
					fragmentName: "com.sap.build.standard.zapp006.view.ViewSettingsDialog3"
				}, this);
				oDialog.attachEvent("confirm", confirmHandler);
				oDialog.attachEvent("resetFilters", resetFiltersHandler);

				this.mSettingsDialogs["ViewSettingsDialog3"] = oDialog;
			}

			var aCollections = [];

			aCollections.push({
				id: "sap_Worklist_Page_0-content-sap_m_IconTabBar-1-items-sap_m_IconTabFilter-1503086265060-content-build_simple_Table-1",
				aggregation: "items"
			});

			var oReferenceCollection = this.getView().byId(aCollections[0].id);
			var oSourceBindingContext = oReferenceCollection.getBindingContext();
			var oModel = oSourceBindingContext ? oSourceBindingContext.getModel() : this.getView().getModel();

			// toggle compact style
			jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), oDialog);
			updateDialogData();

		},
		onInit: function() {

			this.mBindingOptions = {};
			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.oRouter.getTarget("List").attachDisplay(jQuery.proxy(this.handleRouteMatched, this));

			this.oModel = this.getOwnerComponent().getModel();

			this.mBindingOptions = {};

			var oBindingData, aPropertyFilters, oBindingOptions;

			oBindingData = {};

			oBindingData.filters = [];

			aPropertyFilters = [];

			aPropertyFilters.push(new sap.ui.model.Filter("TipoSol", "EQ", "Plan de viaje"));

			oBindingData.filters.push(new sap.ui.model.Filter(aPropertyFilters, false));

			oBindingOptions = this.updateBindingOptions(
				"sap_Worklist_Page_0-content-sap_m_IconTabBar-1-items-sap_m_IconTabFilter-1-content-build_simple_Table-1", oBindingData);
			var oBindingInfo = this.getView().byId(
				"sap_Worklist_Page_0-content-sap_m_IconTabBar-1-items-sap_m_IconTabFilter-1-content-build_simple_Table-1").getBindingInfo("items");
			this.getView().byId("sap_Worklist_Page_0-content-sap_m_IconTabBar-1-items-sap_m_IconTabFilter-1-content-build_simple_Table-1").bindAggregation(
				"items", {
					model: oBindingInfo.model,
					path: oBindingInfo.path,
					parameters: oBindingInfo.parameters,
					template: oBindingInfo.template,
					sorter: oBindingOptions.sorters,
					filters: oBindingOptions.filters
				});
			oBindingData = {};

			oBindingData.filters = [];

			aPropertyFilters = [];

			aPropertyFilters.push(new sap.ui.model.Filter("Estado", "EQ", "Pendiente"));

			oBindingData.filters.push(new sap.ui.model.Filter(aPropertyFilters, false));

			oBindingOptions = this.updateBindingOptions(
				"sap_Worklist_Page_0-content-sap_m_IconTabBar-1-items-sap_m_IconTabFilter-2-content-build_simple_Table-1502816187882",
				oBindingData);
			var oBindingInfo = this.getView().byId(
				"sap_Worklist_Page_0-content-sap_m_IconTabBar-1-items-sap_m_IconTabFilter-2-content-build_simple_Table-1502816187882").getBindingInfo(
				"items");
			this.getView().byId(
				"sap_Worklist_Page_0-content-sap_m_IconTabBar-1-items-sap_m_IconTabFilter-2-content-build_simple_Table-1502816187882").bindAggregation(
				"items", {
					model: oBindingInfo.model,
					path: oBindingInfo.path,
					parameters: oBindingInfo.parameters,
					template: oBindingInfo.template,
					sorter: oBindingOptions.sorters,
					filters: oBindingOptions.filters
				});

		}
	});
}, /* bExport= */ true);