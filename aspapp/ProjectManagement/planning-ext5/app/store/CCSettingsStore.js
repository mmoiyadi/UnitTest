var CCSettingsStore = new function (CC_Settings_Data) {
    this.PopulateStore = function (CC_Settings_Data) {

        this.HorizonDate = CC_Settings_Data.HorizonDate;
        if (typeof (CC_Settings_Data.LastIDCCedHorizonDate) != "undefined") {
            this.LastIDCCedHorizonDate = CC_Settings_Data.LastIDCCedHorizonDate;
        }
        if (CC_Settings_Data.IsApplyInNextRun != "undefined" && typeof (CC_Settings_Data.IsApplyInNextRun) != "undefined" && CC_Settings_Data.IsApplyInNextRun != null) {
            this.IsApplyInNextRun = CC_Settings_Data.IsApplyInNextRun;
        }
        else {
            this.IsApplyInNextRun = false;
        }

        this.PercentageCCCB = CC_Settings_Data.PercentageCCCB != null ? CC_Settings_Data.PercentageCCCB : stl.app.commonSettingValue('DEFAULT_CCCB_BUFFER_PERCENT_SIZE');
        this.PercentageCCFB = CC_Settings_Data.PercentageCCFB != null ? CC_Settings_Data.PercentageCCFB : stl.app.commonSettingValue('DEFAULT_CCFB_BUFFER_PERCENT_SIZE');
        this.PercentageCMSB = CC_Settings_Data.PercentageCMSB != null ? CC_Settings_Data.PercentageCMSB : stl.app.commonSettingValue('DEFAULT_CMSB_BUFFER_PERCENT_SIZE');
        this.FixedCCCB = CC_Settings_Data.FixedCCCB != null ? CC_Settings_Data.FixedCCCB : stl.app.commonSettingValue('DEFAULT_CCCB_BUFFER_FIXED_SIZE');
        this.FixedCCFB = CC_Settings_Data.FixedCCFB != null ? CC_Settings_Data.FixedCCFB : stl.app.commonSettingValue('DEFAULT_CCFB_BUFFER_FIXED_SIZE');
        this.FixedCMSB = CC_Settings_Data.FixedCMSB != null ? CC_Settings_Data.FixedCMSB : stl.app.commonSettingValue('DEFAULT_CMSB_BUFFER_FIXED_SIZE');
        this.RoundOffDuration = CC_Settings_Data.RoundOffDuration != null ? CC_Settings_Data.RoundOffDuration : stl.app.defaultDurationReductionRoundingValue();
        // In case of IsApplyInNextRun false, ReduceTaskDuration is passed as 0 to BE.
        // This should not update this.ReduceTaskDuration value to 0 after IDCC.
        if(!this.IsApplyInNextRun && CC_Settings_Data.ReduceTaskDuration != 0)
            this.ReduceTaskDuration = CC_Settings_Data.ReduceTaskDuration;

        if(CC_Settings_Data.ReduceTaskDuration == null) 
            this.ReduceTaskDuration = stl.app.commonSettingValue('DURATION_REDUCTION_PERCENT');

        this.IsDateProvided = CC_Settings_Data.IsDateProvided != null ? CC_Settings_Data.IsDateProvided : false;
        this.FeedingBuffersPolicyVal = CC_Settings_Data.FeedingBuffersPolicyVal != null ? CC_Settings_Data.FeedingBuffersPolicyVal : stl.app.defaultFeedingBufferPolicyValue();
    };
	//save cc settings value to DB 
    this.GetCCSettings = function () {
        var CC_Settings = {};
        CC_Settings.HorizonDate = this.HorizonDate;
        CC_Settings.PercentageCCCB = this.PercentageCCCB;
        CC_Settings.PercentageCCFB = this.PercentageCCFB;
        CC_Settings.PercentageCMSB = this.PercentageCMSB;
        CC_Settings.FixedCCCB = this.FixedCCCB;
        CC_Settings.FixedCCFB = this.FixedCCFB;
        CC_Settings.FixedCMSB = this.FixedCMSB;
        CC_Settings.RoundOffDuration = this.RoundOffDuration;
        CC_Settings.IsApplyInNextRun = this.IsApplyInNextRun;
        CC_Settings.ReduceTaskDuration = this.ReduceTaskDuration;
        CC_Settings.LastIDCCedHorizonDate = this.LastIDCCedHorizonDate;
        CC_Settings.IsDateProvided = this.IsDateProvided;
        CC_Settings.FeedingBuffersPolicyVal = this.FeedingBuffersPolicyVal;

        return CC_Settings;
    };
	//send appropriate cc settings value for IDCC
    this.GetCCSettingsForIDCC = function () {
        var CC_Settings = {};
        CC_Settings.HorizonDate = this.HorizonDate;
        CC_Settings.PercentageCCCB = this.PercentageCCCB;
        CC_Settings.PercentageCCFB = this.PercentageCCFB;
        CC_Settings.PercentageCMSB = this.PercentageCMSB;
        CC_Settings.FixedCCCB = this.FixedCCCB;
        CC_Settings.FixedCCFB = this.FixedCCFB;
        CC_Settings.FixedCMSB = this.FixedCMSB;
        CC_Settings.RoundOffDuration = this.RoundOffDuration;
        CC_Settings.IsApplyInNextRun = this.IsApplyInNextRun;
        if (typeof (CC_Settings.IsApplyInNextRun) == "undefined" || !CC_Settings.IsApplyInNextRun) {
            CC_Settings.ReduceTaskDuration = "0";
        }
        else {
            CC_Settings.ReduceTaskDuration = this.ReduceTaskDuration;
        }

        CC_Settings.IsDateProvided = this.IsDateProvided;
        CC_Settings.FeedingBuffersPolicyVal = this.FeedingBuffersPolicyVal;
        return CC_Settings;
    };

    this.ClearHorizonDate = function () {
        this.HorizonDate = "";
    };
    this.PopulateStoreFromCCSettingsDialog = function (CC_Settings_Data) {
        this.PopulateStore(CC_Settings_Data);
        // In case of 0 value of ReduceTaskDuration & IsApplyInNextRun true, we are not updating it in Populate store.
        // As we need to avoid it when populate store called from other places.
        // Setting it seperatly after  PopulateStore.
        this.ReduceTaskDuration = CC_Settings_Data.ReduceTaskDuration;
    };
}