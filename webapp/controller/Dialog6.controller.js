sap.ui.define(["sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"./utilities",
	"sap/ui/core/routing/History"
], function(BaseController, MessageBox, Utilities, History) {
	"use strict";

	return BaseController.extend("com.sap.build.standard.zapp006.controller.Dialog6", {
		setRouter: function(oRouter) {
			this.oRouter = oRouter;

		},
		getBindingParameters: function() {
			return {};

		},
		_onButtonPress28: function(oEvent) {

			oEvent = jQuery.extend(true, {}, oEvent);
			return new Promise(function(fnResolve) {
					fnResolve(true);
				})
				.then(function(result) {
					var oView = this.getView();
					var oController = this;

					return new Promise(function(fnResolve, fnReject) {
						var oModel = oController.oModel;

						var fnResetChangesAndReject = function(sMessage) {
							oModel.resetChanges();
							fnReject(new Error(sMessage));
						};
						var fnSync = function() {
							oModel.detachRequestCompleted(fnRefreshCompleted);
							oModel.detachRequestFailed(fnRefreshFailed);
						};
						var fnRefreshCompleted = function() {
							fnSync();
							fnResolve();
						};
						var fnRefreshFailed = function() {
							fnSync();
							fnReject(new Error("refresh failed"));
						};
						var fnResolveAfterRefresh = function() {
							oModel.attachRequestCompleted(fnRefreshCompleted);
							oModel.attachRequestFailed(fnRefreshFailed);
							oModel.refresh(true, true);
						};

						if (oModel && oModel.hasPendingChanges()) {
							oModel.submitChanges({
								success: function(oResponse) {
									var oBatchResponse = oResponse.__batchResponses[0];
									var oChangeResponse = oBatchResponse.__changeResponses && oBatchResponse.__changeResponses[0];
									if (oChangeResponse && oChangeResponse.data) {
										var sNewContext = oModel.getKey(oChangeResponse.data);
										oView.unbindObject();
										oView.bindObject({
											path: "/" + sNewContext
										});
										if (window.history && window.history.replaceState) {
											window.history.replaceState(undefined, undefined, window.location.hash.replace(encodeURIComponent(oController.sContext),
												encodeURIComponent(sNewContext)));
										}
										fnResolveAfterRefresh();
									} else if (oChangeResponse && oChangeResponse.response) {
										fnResetChangesAndReject(oChangeResponse.message);
									} else if (!oChangeResponse && oBatchResponse.response) {
										fnResetChangesAndReject(oBatchResponse.message);
									} else {
										fnResolveAfterRefresh();
									}
								},
								error: function(oError) {
									fnReject(new Error(oError.message));
								}
							});
						} else {
							fnResolve();
						}
					});

				}.bind(this))
				.then(function(result) {
					if (result === false) {
						return false;
					} else {

						var oBindingContext = oEvent.getSource().getBindingContext();

						return new Promise(function(fnResolve) {

							this.doNavigate("List", oBindingContext, fnResolve, "");
						}.bind(this));

					}
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
		_onButtonPress29: function() {
			var oDialog = this.getView().getContent()[0];

			return new Promise(function(fnResolve) {
				oDialog.attachEventOnce("afterClose", null, fnResolve);
				oDialog.close();
			});

		},
		onInit: function() {
			this.mBindingOptions = {};
			this._oDialog = this.getView().getContent()[0];

			this.oModel = this.getOwnerComponent().getModel();

		},
		onExit: function() {
			this._oDialog.destroy();

		}
	});
}, /* bExport= */ true);