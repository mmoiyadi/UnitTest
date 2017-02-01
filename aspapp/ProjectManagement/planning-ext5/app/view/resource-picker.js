/**
 * stl.view.ResourcePicker
 *
 * Input widget for a list of { resourceId, units } pairs.  e.g.: QA, 3 hours; Dev, 2.5 hours
 * Value (val config property) is an array of objects, e.g. [ { resourceId: "1", units: 3 }, { resourceId: "2", units: 2.5} ]
 * Used in task and subtask UI for the "resources" property editor
 */
stl.view.ResourcePicker = function(cfg) {
    $.extend(this, cfg);
    if (!this.val) {
        this.val = [];
    }
    if (typeof(this.defaultUnits) === "undefined") {
        this.defaultUnits = 4;
    }
    if (!this.blankItemTemplate) {
        this.blankItemTemplate = { resourceId: "", units: 1 };
    }
    this.$el = $(this.el);
    this.$el.data("resourcePicker", this);
    if (this.inputModeOnly) {
        this.renderInputMode();
    } else {
        this.renderReadOnly();
    }
};

$.extend(stl.view.ResourcePicker.prototype, (function () {

    var NEW_RESOURCE_ID = "__NEW_RESOURCE__",
        TAB_KEY = 9,
        AFTER_SCROLL_FOCUS_TIMEOUT = 250;

    return ({
        renderReadOnly: function () {
            var me = this,
                text = stl.view.ResourcePicker.getReadOnlyText(this.val, this.project),
                $readOnlyText = $('<span class="resource-picker-readonly-text"></span>');
            $readOnlyText.text(text)
            this.$el
                .empty()
                .addClass("resource-picker")
                .append($readOnlyText);
            var $tabstop = $('<a href="javascript:;" class="resource-picker-tab-stop">#</a>');
            if (this.val === null || this.val.length === 0) {
                this.$el.addClass("empty");
            } else {
                this.$el.removeClass("empty");
            }
            if (this.readOnly) {
                this.$el.addClass("readonly");
            } else {
                this.$el.removeClass("readonly");
            }
            $tabstop.on("focus", this.onTabStopFocus.bind(this));
            this.$el.append($tabstop);
            this.$el.on("click", this.onElementClick.bind(this));
            this.isInEditMode = false;
            this.$el.trigger("resize");
        },

        onTabStopFocus: function (evt) {
            this.renderInputMode();
            evt.stopPropagation();
        },

        onElementClick: function (evt) {
            if (!this.isInEditMode && !this.readOnly) {
                this.renderInputMode();
            }
            evt.stopPropagation();
        },

        renderInputMode: function () {
            var me = this,
                resourceIdsUsed = {},
                allResources = this.getAvailableResourceOptions(),
                htmlParts = ['<div class="resource-picker-table"><div style="display:none;"class="no-match-resources">'+NO_MATCH_RESOURCE_SEARCH+'</div>'].concat(allResources.map(this.getInputTableRowHtml)),
                elOffset = this.$el.offset();
            htmlParts.push('</div>');
            this.$el.empty();
            if (!this.$popup) {
                this.$popup = $([
                    '<div class="resource-picker-popup ui-widget-content">',
                        '<div class="resource-picker-search"><input type="text" name="search" placeholder="Search.."></div>',
                        '<div class="resource-picker-scroll"></div>',
                        '<div class="resource-picker-buttons">',
                            '<button class="save-button btn">',
                            OK_BUTTON,
                            '</button>',
                            '<button class="cancel-button btn">',
                            CANCEL_BUTTON,
                            '</button>',
                        '</div>',
                    '</div>'
                ].join(""));
                this.$popup.resizable({
                    minHeight: 200,
                    minWidth:350,
                    maxWidth:window.innerWidth-elOffset.left || document.body.clientWidth-elOffset.left,
                    maxHeight:window.innerHeight-elOffset.top || document.body.clientHeight-elOffset.top,
                    resize: function( event, ui ) {
                        $(event.target).find(".resource-picker-scroll").css("height", Math.round( ui.size.height-60 ));
                    }
                });
            }
            this.addSearchHandlers(this.$popup);
            this.$popup.find(".resource-picker-scroll")
                .html(htmlParts.join(''))
                .on("scroll", this.onPopupScroll.bind(this));
            this.$popup.find(".resource-picker-table")
                //.html(htmlParts.join(''))
                .on("scroll", this.onPopupScroll.bind(this));
            if(stl.app.honourConfigForGlobalResources() == false)
                this.addPlaceholderItem();
            var $items = this.$popup.find(".resource-picker-item");
            this.initItemInputs($items);
            if (this.val && this.val != NONE_RESOURCE) {
                this.val.forEach(function (resourceAssignment) {
                    var $row = this.$popup.find(".resource-picker-item[data-resource-id=" + resourceAssignment.resourceId + "]");
                    $row.find(".resource-assigned input").attr("checked", true);
                    $row.find(".units input").val(resourceAssignment.units);
                } .bind(this));
            }
            this.$popup.find(".save-button").off("click").on("click", this.onSaveButtonClick.bind(this));
            this.$popup.find(".cancel-button").off("click").on("click", this.onCancelButtonClick.bind(this));
            this.$popup.find("button").on({
                "focus": function (evt) {
                    me.cancelClose();
                },
                "blur": function (evt) {
                    me.triggerClose();
                }
            });
            this.$popup.on("click", this.onPopupClick.bind(this));
            setTimeout(function () {
                $(document.body).append(this.$popup);
                this.$popup.show()
                    .offset({
                        top: elOffset.top,
                        left: elOffset.left
                    });
                if(window.innerHeight < (this.$popup[0].offsetTop+this.$popup[0].offsetHeight)){
                    this.$popup.offset({top:window.innerHeight - this.$popup[0].offsetHeight});
                }
                //this.$popup[0].scrollIntoView(false);
                this.$popup.find(".resource-picker-item .resource-assigned input").first().focus();
            } .bind(this), 0);
            this.isInEditMode = true;
            this.$el.trigger("resize");
        },

        onPopupClick: function (evt) {
            evt.stopPropagation();
        },

        onPopupScroll: function() {
            // IE10 changes focus during a scroll, so abort any close that was about to happen, and re-focus
            // within the popup after the scroll is complete (to re-enable blur tracking for auto-close)
            this.cancelClose();
            if (!this.scrollCompleteDelegate) {
                this.scrollCompleteDelegate = this.onPopupScrollComplete.bind(this);
            }
            if (this.scrollCompleteTimeout) {
                window.clearTimeout(this.scrollCompleteTimeout);
            }
            this.scrollCompleteTimeout = window.setTimeout(this.scrollCompleteDelegate, AFTER_SCROLL_FOCUS_TIMEOUT);
        },

        // When a scroll is complete, set focus somewhere inside the popup so that we can track blur again to auto-close
        onPopupScrollComplete: function() {
            this.$popup.find(".save-button").focus();
        },

        saveAndExitInputMode: function () {
            $('.resource-picker-search input').val("");            
            this.$popup.hide();
            this.val = this.getValue(true);
            this.$el.trigger("change", this.val);
            this.renderReadOnly();
            this.$el.trigger("editcomplete");
        },

        onSaveButtonClick: function () {
            this.cancelClose();
            this.saveAndExitInputMode();
        },

        onCancelButtonClick: function () {
            this.cancelClose();
            this.$popup.hide();
            this.renderReadOnly();
        },

        getInputTableRowHtml: function (resource) {
            return [
                '<div class="resource-picker-item" data-resource-id="', resource.id, '">',
                    '<div class="resource-assigned"><input type="checkbox" /></div>',
                    '<div class="resource"><input type="text" class="resource-input" disabled="disabled" lowerCase="',
                        resource.text!=undefined || resource.text!=null?resource.text.toLowerCase():"",
                    '" value="',
                        resource.text,
                    '"/></div>',
                    '<div class="units"><input type="text" value="" /></div>',
                '</div>'
            ].join('');
        },

        initItemInputs: function ($items) {
            var me = this,
                $checkboxes = $items.find(".resource-assigned input"),
                $resourceInputs = $items.find(".resource input.resource-input"),
                $unitsInputs = $items.find(".units input");
            $unitsInputs
                .on("focus", function (evt) {
                    me.cancelClose();
                    var $input = $(this);
                    window.setTimeout(function () {
                        $input.select();
                    }, 10);
                })
                .on("blur", function (evt) {
                    var $target = $(evt.target),
                        empty = ($target.val() === "");
                    var num = $target.val();
                    
                    var parsedNum = stl.app.Validator.parseDecimalValue(num, stl.app.NumberDecimalSeparator);

                    if (!empty && (!parsedNum || parsedNum <= 0)) {
                        $target.val("1");
                    } else {
                        $target.val(parsedNum);
                    }
                    me.triggerClose();
                })
                .on("keyup", function (evt) {
                    var intRegex = /^\d+$/;
                    var $target = $(evt.target),
                        empty = ($target.val() === "");
                    var num = $target.val();
                    /*if (!intRegex.test(num) || $target.val() == "0") {
                        $target.val("");
                    }*/ 

                })
                .on("keypress", function (evt) {
                    if (evt.which == 13) {
                        evt.preventDefault();
                    }
                })
                .on("change", function (evt) {
                    // If units typed in, make sure row is checked
                    var $target = $(evt.target),
                        empty = ($target.val() === "");
                    if(empty)
                        $target.closest(".resource-picker-item").find(".resource-assigned input")
                        .prop("checked", !empty);
                });
            $checkboxes
                .on("change", function (evt) {
                    // Set units to 1 on initial checkbox check
                    if ($(evt.target).is(":checked")) {
                        var $units = $(evt.target).closest(".resource-picker-item").find(".units input");
                        if ($units.val() === "" && !$units.is(":focus")) {
                            $units.val("1");
                        }
                    }
                })
                .on("focus", function (evt) {
                    me.cancelClose();
                })
                .on("blur", function (evt) {
                    me.triggerClose();
                })
                .on("mousedown", function (evt) {
                    evt.stopPropagation();
                });
            // Clicking anywhere on the row toggles the checkbox - can't use mousedown due to delay and interference with blur
            $items.on("mousedown", function (evt) {
                var $row = $(evt.target).closest(".resource-picker-item"),
                    isPlaceholder = $row.hasClass("new-item-placeholder");
                // Toggle on/off for existing resources, only toggle on for placeholder rows.                var $target = $(evt.target),
                var empty = ($(evt.target).val() === "");
                var isTargetName = $(evt.target).hasClass("resource-input");
                if(isTargetName  && !$row.find(".resource-assigned input").is(":checked")){
                    $row.find(".resource-assigned input").trigger("click");
                }
                else if (empty && !$row.find(".resource-assigned input").is(":checked")) {
                    $row.find(".resource-assigned input").trigger("click");
                }
                setTimeout(function () {
                    // If it's an existing resource, need to make sure focus stays on some element in this row
                    // so popup remains open
                    if (!isPlaceholder) {
                        $row.find(".units input").focus();
                    }
                }, 10);
            });
            $resourceInputs.on({
                "focus": function (evt) {
                    me.cancelClose();
                },
                "keypress": this.onResourceInputChange.bind(this),
                "keydown": this.onResourceInputChange.bind(this)
            });
            // TODO units input should accept only numeric values
        },

        onResourceInputKeyDown: function (evt) {
            if (evt.which === TAB_KEY) {
                var $item = $(evt.target).closest(".resource-picker-item");
                if ($item.hasClass("new-item-placeholder") && $item.find("input.resource-input").select2("val") == "") {
                    // TABbed on empty last row; close editor
                    this.saveAndExitInputMode();
                }
            }
        },

        /**
        * When any element in the picker is blurred, get ready to close the picker
        * after a very brief delay.  The delay is so that we can cancel the close if
        * focus is moved to another element in the picker.
        */
        triggerClose: function () {
            if (!this.saveAndExitInputModeDelegate) {
                this.saveAndExitInputModeDelegate = this.saveAndExitInputMode.bind(this);
            }
            if (this.pendingCloseTimeout) {
                window.clearTimeout(this.pendingCloseTimeout);
            }
            this.pendingCloseTimeout = window.setTimeout(this.saveAndExitInputModeDelegate, 250);
        },

        /**
        * When any input element in the picker is focused, abort any close that might
        * be pending due to a previous blur event.
        */
        cancelClose: function () {
            if (this.pendingCloseTimeout) {
                window.clearTimeout(this.pendingCloseTimeout);
            }
        },

        onResourceInputChange: function (evt) {

            if (evt.type == KEYPRESS) {
                if (evt.which == 13) {
                    evt.preventDefault();
                }
                else {
                    return;
                }
            }

            var $item = $(evt.target).closest(".resource-picker-item");
            if ($item.hasClass("new-item-placeholder")) {
                // Add another "new" selector
                $item.removeClass("new-item-placeholder");
                this.addPlaceholderItem();
            }
            // If we don't stop this, listeners on this.$el "change" event will receive this event
            // for some reason, even though they're listening on a different element
            evt.stopPropagation();
        },

        addPlaceholderItem: function () {
            this.$popup.find(".resource-picker-table").append(this.getInputTableRowHtml(this.blankItemTemplate));
            var $newItem = this.$popup.find('.resource-picker-item').last();
            $newItem.hide();
            this.initItemInputs($newItem);
            $newItem.addClass("new-item-placeholder");
            $newItem.find(".resource-input").attr("placeholder", ADD_RESOURCE_PLACEHOLDER).removeAttr("disabled");
            $newItem.fadeIn();
        },

        onDeleteClick: function (evt) {
            var $item = $(evt.target).closest(".resource-picker-item"),
                index = this.$popup.find(".resource-picker-item").index($item);
            this.val.splice(index, 1);
            $item.remove();
        },

        getValue: function (showInfo) {
            if (this.isInEditMode) {
                this.val = $.map(this.$popup.find(".resource-picker-item:not(.new-item-placeholder)"), function (item) {
                    var $item = $(item),
                        checked = $item.find(".resource-assigned input").is(":checked"),
                        resourceId = $item.data("resource-id"),
                        units = $item.find(".units input").val();
                    if (checked) {
                        // Create a new resource
                        if (!stl.view.ResourcePicker.isResourcePickerPopupVisible(this.$popup)) {
                            if ((resourceId === null && $item.find(".resource-input").val().trim() != "") || (resourceId === "" && $item.find(".resource-input").val().trim() != "")) {
                                var isDuplicateName = stl.model.Project.getProject().isResourceNameDuplicate($item.find(".resource-input").val().toString(), null);
                                var phaseWithSameName = stl.model.Project.getProject().getPhaseWithSameNameIfExists($item.find(".resource-input").val().toString());
                                var isDuplicateVirtualRes = phaseWithSameName != null ? true : false ;

                                if (!isDuplicateName && !isDuplicateVirtualRes) {
                                    var newResource = this.project.createResource.call(this.project,
                                        $item.find(".resource-input").val(),
                                        null,
                                        units);
                                    $item.data("resource-id", newResource.uid);
                                    resourceId = newResource.uid;
                                }
                                else {
                                    //showInfo is boolean passed from saveAndExitInputMode to show the error message. 
                                    //Getvalue called multiple times. Toensure messge shows only once
                                    if (showInfo) {
                                        if(isDuplicateName){
                                            PPI_Notifier.error(RESOURCE_NAME_DUPLICATE, ERR_TYPE_RES_ASSIGNMENT);
                                        }
                                        else if(isDuplicateVirtualRes){
                                            if(phaseWithSameName.IsGlobal){
                                                msg = getStringWithArgs(DIVISION_PHASE_NAME_DUPLICATE,phaseWithSameName.Divisions.join());
                                                PPI_Notifier.error(msg, ERR_TYPE_RES_ASSIGNMENT);
                                            }
                                            else
                                                PPI_Notifier.error(PROJECT_PHASE_NAME_DUPLICATE, ERR_TYPE_RES_ASSIGNMENT);
                                        }
                                    }
                                }
                            }
                        }
                        if (resourceId != null && resourceId != "") {
                            if (!isDuplicateName && !isDuplicateVirtualRes && $item.find(".resource-input").val().trim() != "") {
                                return { resourceId: resourceId, units: units };
                            }

                        }
                    }
                } .bind(this));
            }
            return this.val;
        },

        setValue: function (value) {
            this.val = value;
            if (this.isInEditMode || this.inputModeOnly) {
                this.renderInputMode();
            } else {
                this.renderReadOnly();
            }
        },

        getAvailableResourceOptions: function () {
            var choosableOptions = [];
            this.project.getAvailableResources().forEach(function (res) {
                if (res.Name.toLowerCase() !== TIME_BUFFER_LOWERCASE) {
                    choosableOptions.push({
                        id: res.uid,
                        text: res.Name
                    });
                }
            });
            return choosableOptions;
        },

        setReadOnly: function (readOnly) {
            this.readOnly = readOnly;
            this.renderReadOnly();
        },
        addSearchHandlers:function($popup){
            var me = this;
            $popup.find(".resource-picker-search input").on("focus",function(evt){
                me.cancelClose();
            });
            $popup.find(".resource-picker-search input").on("blur",function(evt){

                me.triggerClose();
            });
            $popup.find(".resource-picker-search input").on("keyup",function(evt){
                $popup.find(".resource-picker-item").hide();
                $popup.find(".no-match-resources").hide();
                var txt = $popup.find('.resource-picker-search input').val();
                var matches=[];              
                if(txt == ""){
                    $popup.find('.resource-picker-item').show();
                }
                else{
                    matches = $popup.find('.resource-picker-item .resource input[lowerCase*="'+txt.toLowerCase()+'"]');                
                    if(txt != "" && matches.length == 0)
                        $popup.find(".no-match-resources").show();
                    else
                        matches.parent().parent().show();
                }
            });
        }

    });

})());

stl.view.ResourcePicker.getReadOnlyText = function(val, project) {
    var resourcesById = project.getAvailableResourcesByUid();
    if (val === null || val.length === 0) {
        return NONE_RESOURCE;
    }
    return val.map(function(pair) {
        var resource = resourcesById[pair.resourceId],
            resourceName = resource ? resource.Name : MISSING_RESOURCE;
        return resourceName + "(" + (pair.units || 0) + ")";
    }).join(', ');
};

stl.view.ResourcePicker.isResourcePickerPopupVisible = function (resPicker) {
    var isVisible = false;
    var resourcePicker = resPicker;
    isVisible = ($(resourcePicker).css("display") == "block");
    return isVisible;
};
stl.view.ResourcePicker.closeResourcePicker = function (respicker) {
    respicker.triggerClose();
};