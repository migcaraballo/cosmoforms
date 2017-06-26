/**
 * Created by mig.c
 * Version 1.0.0-beta
 */
var cosmoProps;
var overrideSchema;
var origData;
var refObject = {};
var pathOuts = "";
var qMap = {};
var defaultCollapseState = true;

var schemaName = "default";
booleanOptionList = [
    [ { "label": "True", "value": true }, { "label": "False", "value": false } ]
];

function cosmoForm(props){
    cosmoProps = props;

    var errorMsg = validateConfig(cosmoProps);
    if(errorMsg != ""){
        alert(errorMsg);
        return;
    }
    else{
        checkForDebug(cosmoProps);

        // load schemas
        loadOverrideSchema(cosmoProps.override_schema_url);

        if(cosmoProps.data_url != undefined || cosmoProps.data_url != ''){
            // make call to get data & create form
            $.get(
                cosmoProps.data_url,
                function(data){
                    processReturnedJson(data);
                }
            );
        }
        else{
            processReturnedJson(cosmoProps.data);
        }

        $("<div id='cosmo-form-model' class='modal fade'></div>").insertAfter("#"+ cosmoProps.target_form_id);
    }
}

function processReturnedJson(jsObj){
    var outputHtml = "";
    var default_props = cosmoProps.default_props;
    origData = jsObj;

    // check if data is not array
    if(tp(jsObj) != "array"){

        $.each(jsObj, function(root_key,root_val){
            //log("[rk: "+ root_key +"] (rv = "+ root_val +")");
            var rootType = tp(root_val);
            setRef(root_key, root_val);

            // if not array OR object, later will handle specific inputs with overrides_schema
            if(rootType != "array" && rootType != "object" ){
                var jspath = root_key;
                pathout(root_key, jsObj);

                var innerHtml = genInputField(root_key, root_val, default_props, rootType, schemaName, jspath);
                outputHtml += genFormGroup2(innerHtml, getLabel(root_key, jspath));
            }
            else if(rootType == "array"){
                var tmpHtml = handleArrayFields(root_key, root_val, root_key, schemaName, jsObj, default_props);
                outputHtml += tmpHtml;
            }
            else{ // else it's an object
                var genHtml = genHandleObject2(root_val, root_key);
                outputHtml += genSubPanel2(root_key, genHtml, defaultCollapseState, "sp_"+root_key);
            }
        });

        var saveBtnHtml = genButton("Save", "button", "btn btn-primary", "margin-right: 10px", "save");
        $("#"+ cosmoProps.target_form_id).on("click", "#save", function(e){
            e.preventDefault();

            var formSerial = $("#"+ cosmoProps.target_form_id).serializeArray();

            if(cosmoProps.debug){
                outputDebug(cosmoProps, stringIt(formSerial), stringIt(genDataOutput(formSerial)));
            }

            /* submit form */
            submitForm2(formSerial);

        });

        var cancelBtn = genButton("Cancel", "button", "btn btn-danger", "margin-left: 10px", "cancelBtn");
        $("#"+ cosmoProps.target_form_id).on("click", "#cancelBtn", function(e){
            cosmoProps.cancel_action();
        });

        var resetBtnHtml = genButton("Reset", "reset", "btn btn-default");
        var addPropBtnHtml = genButton("Add Field", "button", "btn btn-info", "margin-left: 10px", "addprop");

        outputHtml += genButtonFormGroup2( [saveBtnHtml, resetBtnHtml, cancelBtn, addPropBtnHtml], "root-btn-group");

        $("#"+ cosmoProps.target_form_id).on("click", "#addprop", function(e){
            openDialog("Add Field To Root", addFieldDialog("root", "root-btn-group"), "");
        });
    }
    else{
        outputHtml += genListErrorMessage();
    }

    /* set form html */
    $("#"+ cosmoProps.target_form_id).html(outputHtml);


    /* debug */
    if(cosmoProps.debug){
        var formSerial = $("#"+ cosmoProps.target_form_id).serializeArray();
        outputDebug(cosmoProps, stringIt(formSerial), stringIt(genDataOutput(formSerial)));
    }
}

function submitForm2(formSerialized){
    // remove form errors if present
    $("#cosmo-form-errors").remove();

    $.ajax({
        type: "POST",
        url: cosmoProps.submit_url,
        data: stringIt(genDataOutput(formSerialized)),
        contentType: "application/json",
        dataType: "json",
        success: cosmoProps.success_action,
        error: errorAction
    });
}

function errorAction(responseObject){
    if(responseObject.responseText != "" || responseObject.responseText != undefined){
        try {
            var jo = JSON.parse(responseObject.responseText);
            // log("form errors: "+ jo.form_errors);

            if(jo.form_errors != undefined){
                $("#"+ cosmoProps.target_form_id).prepend(genErrors(jo.form_errors));
                $("html, body").animate(
                    {scrollTop: $("body").offset().top}, 500
                );
            }
        } catch (e) {
            $("#"+ cosmoProps.target_form_id).prepend(genErrors(["General Submit Error"]));
            $("html, body").animate(
                {scrollTop: $("body").offset().top}, 500
            );
        }

    }
}

function genErrors(formErrorsList){
    var eh = "<div id='cosmo-form-errors' class='panel panel-danger'>";
        eh += "<div class='panel-heading'>Errors</div>";

            eh += "<div class='panel-body'>";
                eh += "<ul>";
                $.each(formErrorsList, function(idx, val){
                    eh += "<li>"+ val +"</li>";
                });
                eh += "</ul>";
            eh += "</div>";

    eh += "</div>";
    return eh;
}

function genHandleObject2(objVal, parentKey, child_key){
    var outHtml = "";
    var rtObjCtr = 0;

    $.each(objVal, function(k,v){
        var spId = "";

        if(child_key != undefined){
            spId = parentKey +"["+ child_key +"]."+ k;
        }
        else{
            spId = parentKey +"."+ k;
        }

        pathout(spId, origData);
        setRef(spId, v);

        if(tp(v) == "object"){
            var tmpOutHtml = "";

            var spObjCtr = 0;
            $.each(v, function(sk,sv){
                var sKey = spId +"."+ sk;

                var to = genInputField(sKey, sv, null, tp(sv), null, sKey);
                tmpOutHtml += genFormGroup2(to, getLabel(sk, sKey));
            });

            var subObjBtn = genButton("Add To: "+ k, "button", "btn btn-primary", "margin-top: 10px", "sobtn-"+ spId);
            tmpOutHtml += genButtonFormGroup2([subObjBtn], "sob_bg_"+ spId);

            $("#"+ cosmoProps.target_form_id).on("click", "[id='sobtn-"+ spId +"']", function(){
                openDialog(
                    "Add To: "+ parentKey +": "+ k,
                    addFieldDialog(spId, "sob_bg_"+ spId),
                    null);
            });

            tmpOutHtml = genSubPanel2(k, tmpOutHtml, true, parentKey +"_"+ child_key +"_"+ k);
            outHtml += tmpOutHtml;
        }
        else if(tp(v) == "array"){
            var aSpHtml = "";

            $.each(v, function(aIdx, av){
                var tmpName = spId +"["+ aIdx +"]";
                var inArHtml = genInputField(tmpName, av, null, tp(av), null, tmpName);

                aSpHtml += inArHtml;
            });

            var arBtn = genButton("Add To: "+ k, "button", "btn btn-primary", "margin-top:10px", "bt-"+ spId);
            arBtn = genButtonFormGroup2(arBtn, "btn_grp_"+ spId);
            aSpHtml += arBtn;

            $("#"+ cosmoProps.target_form_id).on("click", "[id='bt-"+ spId +"']", function(){
                var arFgCount = $("[id*='sp_arsp_"+ convertBrackets(spId) +"'] .panel-body .input-group").length;
                log("sub-arr count: "+ arFgCount);

                var tmpName = spId +"["+ (arFgCount) +"]";
                var tmpNewInput = genInputField(tmpName, "", null, "string", null, tmpName);

                if(arFgCount == 0){
                    $("[id='btn_grp_"+ spId+"']").before(tmpNewInput);
                }
                else{
                    $("[id*='sp_arsp_"+ convertBrackets(spId) +"'] .panel-body .input-group").last().after(tmpNewInput);
                }

                $("[id='"+ tmpName +"']").focus();
            });

            aSpHtml = genSubPanel2(getLabel(k, spId), aSpHtml, true, "arsp_"+ convertBrackets(spId));
            outHtml += aSpHtml;
        }
        else{
            var out = genInputField(spId,v, null, tp(v), null, spId);
            outHtml += genFormGroup2(out, getLabel(k, spId));

            if(rtObjCtr++ == (Object.keys(objVal).length - 1)){
                if(child_key != undefined || child_key != null){
                    btnId = "bt-"+ parentKey +"["+ child_key +"]";

                    objBtn = genButton("Add To: "+ getLabel(child_key, child_key), "button", "btn btn-primary", "margin-top: 10px", btnId);

                    $("#"+ cosmoProps.target_form_id).on("click", "[id='"+ btnId +"']", function(e){
                        openDialog("Add Field to: "+ parentKey +": "+ getLabel(child_key, child_key), addFieldDialog(parentKey +"["+ child_key +"]", "sp-obj-btn-"+ parentKey +"["+ child_key +"]"), null);
                    });

                    outHtml += genButtonFormGroup2([objBtn], "sp-obj-btn-"+ parentKey +"["+ child_key +"]");
                }
                else{
                    objBtn = genButton("Add To: "+ parentKey, "button", "btn btn-primary", "margin-top: 10px", "bt-"+ parentKey);

                    $("#"+ cosmoProps.target_form_id).on("click", "#bt-"+ parentKey, function(){
                        openDialog("Add Field to: "+ parentKey, addFieldDialog(parentKey, "sp-obj-btn-"+ parentKey), null);
                    });

                    outHtml += genButtonFormGroup2([objBtn], "sp-obj-btn-"+ parentKey);
                }
            }
        }
    });

    return outHtml;
}

function genInputField(name, value, props, type, schemaName, jspath){
    // 1 - determine if there is any matching override schema field
    if(overrideSchema != null || overrideSchema != undefined){
        var npath = normalizePath(overrideSchema, jspath);
        var formField = getPathValue2(overrideSchema, npath +".form_field");

        if(formField != false){
            if(formField == "id"){
                return genStaticControl2(name, value);
            }

            if(formField == "radio"){
                options = getPathValue(overrideSchema, jspath +".options");

                if(options.length > 0){
                    return genRadios2(name, value, options);
                }
                else{
                    return genBooleanRadio(name, value, true);
                }
            }

            if(formField == "select"){
                options = getPathValue(overrideSchema, jspath +".options");

                if(options.length > 0){
                    return genSelect(name, value, options);
                }
                else{
                    return genBooleanSelect(name, value);
                }
            }
        }
        else{
            // default for boolean types
            if(type == "boolean"){
                return genBooleanRadio(name, value, true);
            }

            if(type == "string"){
                if(value.length > 30){
                    // generate textarea
                    return genTextarea2(name, value);
                }
            }
        }

        // return genTextInput(name, value, props);
        return genTextInput2(name, value);

    }
    else{
        // default for boolean types
        if(type == "boolean"){
            return genBooleanRadio(name, value, true);
        }

        if(type == "string" && value.length > 30){
            // generate textarea
            // return genTextarea(name, value, props);
            return genTextarea2(name, value);
        }

        // return genTextInput(name, value, props);
        return genTextInput2(name, value);
    }
}

function openDialog(headerText, bodyHtml, footerHtml){
    ohtml =
    "<div class='modal-dialog'>"+
        "<div class='modal-content'>"+
            "<div class='modal-header'>"+
                "<button type='button' class='close' data-dismiss='modal'>&times;</button>"+
                "<h4 class='modal-title'>"+ headerText +"</h4>"+
            "</div>"+

            "<div class='modal-body'>"+ bodyHtml +"</div>";

            if(footerHtml != undefined){
                ohtml += "<div class='modal-footer'>"+ footerHtml +"</div>";
            }

        ohtml += "</div>";
    ohtml += "</div>";

    // focus on autofocus field
    $('.modal').on('shown.bs.modal', function() {
        $(this).find('[autofocus]').focus();
    });

    $("#cosmo-form-model").html(ohtml);
    $("#cosmo-form-model").modal();

    $("#add-field-type").trigger("change");
}

function addFieldDialog(parent, insertBefore){
    log("Adding to parent: "+ parent);
    var html = "";

    html += "<div id='cosmo-dialog-form'>";

        html += "<div class='form-group'>";
            html += "<label for='add-field-type'>Add Type</label>";

            html += "<select class='form-control' id='add-field-type'>";
                html += "<option>Field</option>";
                html += "<option>List</option>";
                html += "<option>Object</option>";
            html += "</select>";
        html += "</div>";

        html += "<div id='cosmo-dialog-form-body'></div>";

    html += "</div>";


    $("body").on("change", "[id='add-field-type']", {container: parent, before: insertBefore}, function(e){
        var selVal = $("#add-field-type").val();

        if(selVal == "Field"){
            $("#cosmo-dialog-form-body").html(genFormFieldDialogBody(e.data.container, e.data.before));
        }
        else if(selVal == "List"){
            $("#cosmo-dialog-form-body").html(genListFieldDialogBody(e.data.container, e.data.before));
        }
        else if(selVal == "Object"){
            $("#cosmo-dialog-form-body").html(genObjectFieldDialogBody(e.data.container, e.data.before));
        }
        else{
            $("#cosmo-dialog-form-body").html("<p>Select a field type to Add</p>");
        }
    });

    return html;
}

function genFormFieldDialogBody(parent, insertBefore){
    var html = "";

    html += "<div class='form-group' style='margin: 0 5px 0 5px'>";
        html += "<label>Field Name</label>";
        html += "<input type='text' class='form-control' id='fn-"+ parent +"' name='fn-"+ parent +"' autofocus>";
    html += "</div>";

    html += "<div class='form-group' style='margin: 10px 5px 0 5px'>";
        html += "<label>Field Value</label>";
        html += "<input type='text' class='form-control' id='fv-"+ parent +"' name='fv-"+ parent +"'>";
    html += "</div>";

    html += "<div style='margin: 10px 5px 0 5px'>";
        html += "<button id='btn-"+ parent +"' type='button' class='btn btn-primary'>Add</button>";
        html += "<button type='reset' class='btn btn-default' data-dismiss='modal' style='margin-left:10px'>Cancel</button>";
    html += "</div>";

    html += "</div>";

    $("body").on("click", ("[id='btn-"+ parent +"']"), function(e){
        var key = $("[id='fn-"+ parent +"']").val();
        var val = $("[id='fv-"+ parent +"']").val();

        if( (key != "" && key != undefined) && (val != undefined && val != "")){

            if(parent == "root"){
                t1 = genInputField( (key), val, null, tp(val), null, (key) );
                t1 = genFormGroup2(t1, key);
            }
            else{
                t1 = genInputField( (parent +"."+ key), val, null, tp(val), null, (parent +"."+ key) );
                t1 = genFormGroup2(t1, key);
            }

            $(t1).insertBefore("[id='"+ insertBefore +"']");
        }

        $("#cosmo-form-model").html('');
        $("#cosmo-form-model").modal('hide');
    });

    return html;
}

function genListFieldDialogBody(parent, insertBefore){
    var html = "";

    html += "<div class='form-group' style='margin: 0 5px 0 5px'>";
        html += "<label>List Name</label>";
        html += "<input type='text' class='form-control' id='fn-"+ parent +"' name='fn-"+ parent +"' autofocus>";
    html += "</div>";

    html += "<div class='form-group' style='margin: 5px 5px 0 5px'>";
        html += "<input type='text' class='form-control' id='fv-"+ parent +"' name='fv-"+ parent +"' placeholder='initial list item value'>";
    html += "</div>";


    html += "<div style='margin: 10px 5px 0 5px'>";
        html += "<button id='btn-list-"+ parent +"' type='button' class='btn btn-primary'>Add</button>";
        html += "<button type='reset' class='btn btn-default' data-dismiss='modal' style='margin-left:10px'>Cancel</button>";
    html += "</div>";

    $("body").on("click", "[id='btn-list-"+ parent +"']", function(e){
        // var key = $("[id='fn-"+ parent +"']").val() +"[0]";
        var key = $("[id='fn-"+ parent +"']").val();
        var val = $("[id='fv-"+ parent +"']").val();

        log(key +" = "+ val);

        if(key != undefined || val != undefined){

            if(parent == "root"){
                t1 = handleArrayFields(key, [val], key, null, {}, null);
            }
            else{
                t1 = handleArrayFields((parent +"."+ key), [val], (parent +"."+ key), null, {}, null);
            }

            $(t1).insertBefore("[id='"+ insertBefore +"']");
        }

        $("#cosmo-form-model").html('');
        $("#cosmo-form-model").modal('hide');

    });

    return html;
}

function genObjectFieldDialogBody(parent, insertBefore){
    var html = "";

    html += "<div class='form-group' style='margin: 0 5px 0 5px'>";
        html += "<label>Object Name</label>";
        html += "<input type='text' class='form-control' id='on-"+ parent +"' name='on-"+ parent +"' autofocus>";
    html += "</div>";

    html += "<div class='form-group' style='margin: 0 5px 0 5px'>";
        html += "<label>Field Name</label>";
        html += "<input type='text' class='form-control' id='fn-"+ parent +"' name='fn-"+ parent +"'>";
    html += "</div>";

    html += "<div class='form-group' style='margin: 10px 5px 0 5px'>";
        html += "<label>Field Value</label>";
        html += "<input type='text' class='form-control' id='fv-"+ parent +"' name='fv-"+ parent +"'>";
    html += "</div>";

    html += "<div style='margin: 10px 5px 0 5px'>";
        html += "<button id='btn-obj-"+ parent +"' type='button' class='btn btn-primary'>Add</button>";
        html += "<button type='reset' class='btn btn-default' data-dismiss='modal' style='margin-left:10px'>Cancel</button>";
    html += "</div>";

    $("body").on("click", "[id='btn-obj-"+ parent +"']", function(e){
        var objName = $("[id='on-"+ parent +"']").val();
        var key = $("[id='fn-"+ parent +"']").val();
        var val = $("[id='fv-"+ parent +"']").val();

        if((objName != "" && objName != undefined) && (key != "" && key != undefined) && (val != undefined && val != "")){

            var t1 = "";

            if(parent == "root"){
                var jso = {};
                jso[key] = val;
                t1 = genHandleObject2(jso, objName);
                t1 = genSubPanel2(objName, t1, true, "rt_sp_"+ objName);
            }
            else{
                var jso = {};
                jso[key] = val;
                t1 = genHandleObject2(jso, parent, objName);
                t1 = genSubPanel2(objName, t1, true, "rt_sp_"+ objName);
            }

            $(t1).insertBefore("[id='"+ insertBefore +"']");
        }

        $("#cosmo-form-model").html('');
        $("#cosmo-form-model").modal('hide');
    });

    return html;
}

function genArrayObjectFieldDialogBody(parent, child_key, insertBefore){
    var html = "";

    html += "<div class='form-group' style='margin: 0 5px 0 5px'>";
    html += "<label>Field Name</label>";
    html += "<input type='text' class='form-control' id='fn-"+ parent +"' name='fn-"+ parent +"'>";
    html += "</div>";

    html += "<div class='form-group' style='margin: 10px 5px 0 5px'>";
    html += "<label>Field Value</label>";
    html += "<input type='text' class='form-control' id='fv-"+ parent +"' name='fv-"+ parent +"'>";
    html += "</div>";

    html += "<div style='margin: 10px 5px 0 5px'>";
    html += "<button id='btn-ls-obj-"+ parent +"-"+ child_key +"' type='button' class='btn btn-primary'>Add</button>";
    html += "<button type='reset' class='btn btn-default' data-dismiss='modal' style='margin-left:10px'>Cancel</button>";
    html += "</div>";

    $("body").on("click", "[id='btn-ls-obj-"+ parent +"-"+ child_key +"']", function(e){
        var key = $("[id='fn-"+ parent +"']").val();
        var val = $("[id='fv-"+ parent +"']").val();

        if((key != "" && key != undefined) && (val != undefined && val != "")){
            var t1 = "";

            if(parent == "root"){
                var jso = {};
                jso[key] = val;
                t1 = genHandleObject2(jso, objName);
                t1 = genSubPanel2(objName, t1, true, "rt_sp_"+ objName);
            }
            else{
                var jso = {};
                jso[key] = val;
                t1 = genHandleObject2(jso, parent, child_key);
                t1 = genSubPanel2(child_key, t1, true, (parent +"_"+ child_key +"_subpanel"));
            }

            $(t1).insertBefore("[id='"+ insertBefore +"']");
        }

        $("#cosmo-form-model").html('');
        $("#cosmo-form-model").modal('hide');
    });

    return html;
}

function handleArrayFields(root_key, root_val, jspath, schemaName, data, default_props){
    var outputHtml = "";

    var ntmp = normalizePath(overrideSchema, root_key);
    var schemaPathVal = getPathValue(overrideSchema, ntmp +".form_field");

    if(schemaPathVal == "multi-select"){
        var options = getPathValue(overrideSchema, ntmp +".options");

        var tmpHtml = genMultiSelect(root_key, root_val, options);
        tmpHtml = genFormGroup2(tmpHtml, getLabel(root_key, root_key));
        return tmpHtml;
    }
    else if(schemaPathVal == "checkbox"){
        var options = getPathValue(overrideSchema, ntmp +".options");
        var tmpHtml = genCheckboxes(root_key, root_val, options);
        tmpHtml = genFormGroup2(tmpHtml, getLabel(root_key, root_key));
        return tmpHtml;
    }
    else{
        // handle root fields that are arrays
        $.each(root_val, function(child_key, child_val){

            /* Handle OBJECT Elements */
            if(tp(child_val) == "object"){
                var spObjHtml = genHandleObject2(child_val, root_key, child_key);
                var subPanelId = root_key +"_"+ child_key +"_subpanel";

                var tmpTmpHtml = genSubPanel2(child_key, spObjHtml, defaultCollapseState, subPanelId);
                outputHtml += tmpTmpHtml;

                /* this block is to add button to nested objects to create more nested blocks */
                if(child_key == (root_val.length-1)){
                    var grpBtn = genButton("Add To: "+ getLabel(root_key, root_key), "button", "btn btn-primary", "margin-top: 10px", "bt-"+ root_key);
                    outputHtml +=  genButtonFormGroup2( [grpBtn], "subobjbtngrp_"+ root_key);

                    $("#"+ cosmoProps.target_form_id).on("click", "[id='"+ ("bt-"+ root_key) +"']", function(){
                        // 1 - count elements
                        var count = $("div[id^='spc_"+ root_key +"_'] div[id$='_subpanel_id'] ").length;

                        openDialog("Add To: "+ root_key +" : "+ count,
                            genArrayObjectFieldDialogBody(root_key , count, "subobjbtngrp_"+ root_key),
                            null);
                    });
                }
            }
            /* Handle standard array elements */
            else{
                jspath = root_key +"["+ child_key +"]";
                pathout(jspath, origData);
                setRef(jspath, child_val);

                var out = genInputField(jspath, child_val, default_props, tp(child_val), schemaName);

                if(out != undefined || out != null){
                    outputHtml += out;
                }

                // if last element in array, add button
                if(child_key == (root_val.length-1)){

                    // generate button
                    var btnHtml = genButton("Add "+ getLabel(root_key, jspath), "button", "btn btn-primary", "margin-top: 10px", "bt-"+ normalizePath("", jspath));

                    // attach event handler
                    $("#"+ cosmoProps.target_form_id).on("click", "[id='bt-"+ normalizePath("", jspath) +"']", function(){
                        // log("seltr: "+ seltr);
                        log("seltr: "+ "input[id^='"+ (root_key+"[") +"']");

                        // 1 - count elements
                        var count = $("input[id^='"+ (root_key+"[") +"']").length;

                        // 2 - generate new field
                        var tmpIn = genInputField(root_key +"["+ (count) +"]", "", default_props, "string", schemaName, jspath);

                        // 3 - append it to existing list
                        var parentEle = $("input[id^='"+ (root_key+"["+ (count-1) +"]") +"']").parent();
                        $(parentEle).after(tmpIn);

                        $("[id='"+ root_key +"["+ (count) +"]" +"']").focus();
                    });

                    outputHtml += genButtonFormGroup2( [btnHtml], "bgrp_"+ normalizePath(child_key, jspath));
                }
            }
        });
    }

    outputHtml = genSubPanel2(root_key, outputHtml, defaultCollapseState, convertBrackets(root_key +"_sp")); //outputs brackets [ ]
    return outputHtml;
}

function genFormGroup2(innerHtml, labelValue){
    var html = "<div class='form-group'>";
        if(labelValue != "" || labelValue != undefined){
            html += "<label>"+ labelValue +"</label>";
        }
        html += innerHtml;
    html += "</div>";

    return html;
}

function genSubPanel2(panelHeader, panelbody, collapsable, subPanelId){
    var respHtml = "";

    if(collapsable){
        respHtml += "<div id='spp_"+ subPanelId +"' class='panel-group'>" +
                        "<div class='panel panel-default'>" +
                            "<div class='panel-heading'>" +
                                "<a data-toggle='collapse' href='#spc_"+ subPanelId +"_id'>" +
                                    "<h4 class='panel-title'>"+ getLabel(panelHeader, panelHeader) +"</h4>" +
                                "</a>" +
                            "</div>" +

                            "<div id='spc_"+ subPanelId +"_id' class='panel-collapse collapse in'>" +
                                "<div class='panel-body'>" +
                                    panelbody +
                                "</div>" +
                            "</div>" +
                        "</div>" +
                    "</div>";
    }
    else{
        var panel = "<div id='"+ panelHeader +"' class='panel panel-default'>" +
                    "<div class='panel-heading'>"+ panelHeader +"</div>" +
                    "<div class='panel-body'>"+ panelbody +"</div>" +
                "</div>";

        respHtml = panel;
    }
    return respHtml;
}

function genStaticControl2(name, value){
    var html = "<div>";
        html += "<p class='form-control-static'>"+ value +"</p>";
        html += "<input type='hidden' name='"+ name +"' value='"+ value +"'/>";
    html += "</div>";
    return html;
}

function genTextInput2(name, value){
    var html = "";

    html += "<div class='input-group form-group'>";
        html += "<input type='text' id='"+ name +"' name='"+ name +"' value='"+ value +"' class='form-control'>";
        html += "<span class='input-group-btn'>";
            html += genRemoveBtn(name);
        html += "</span>";
    html += "</div>";

    return html;
}

function genTextarea2(name, value){
    return "<textarea class='form-control' rows='3' id='"+ name +"'>"+ value +"</textarea>";
}

function genButton(btn_text, btn_type, btn_class, style, id){
    return "<button id='"+ id +"' type='"+ btn_type +"' class='"+ btn_class +"' style='"+ style +"'>"+ btn_text +"</button>";
}

function genButtonFormGroup2(btn_htmls, id){
    var btnGroupHtml = "<div id='"+ id +"' class='form-group'>";

        btnGroupHtml += "<div>";
        for(i=0; i < btn_htmls.length; i++){
            btnGroupHtml += btn_htmls[i];
        }
        btnGroupHtml += "</div>";

    btnGroupHtml += "</div>";
    return btnGroupHtml;
}

function genBooleanRadio(name, value, inline){
    return genRadios2(name, value, booleanOptionList);
}

function genRadios2(name, value, options){
    var html = "";

    $.each(options, function(key,val){

        if(tp(val) == "array"){
            $.each(val, function(sk,sv){
                html += "<div class='radio'>";
                    html += "<label style='margin:0 10px 0 10px'>";
                        html += "<input type='radio' id='"+ name +"' name='"+ name +"' value='"+ sv.value +"' "+ shouldBeChecked(value, sv.value) +"/> "+ sv.label;
                    html += "</label>";
                html += "</div>";
            });
        }
    });

    return html;
}

function genBooleanSelect(name, selectedValue){
    return genSelect(name, selectedValue, booleanOptionList);
}

function genSelect(name, selectedValue, optionList){
    var html = "<select id='"+ name +"' name='"+ name +"' class='form-control'>";

    if(tp(optionList) == "array"){
        $.each(optionList, function(k,v){

            if(tp(v) == "array"){
                $.each(v, function(sk, sv){
                    if(tp(sv) == "object"){
                        sel = shouldBeSelected(selectedValue, sv.value);
                        html += "<option value='"+ sv.value +"' "+ sel +">"+ sv.label +"</option>";
                    }
                });
            }
        });
    }

    html += "</select>";
    return html;
}

function genMultiSelect(name, selectedValues, options){
    var html = "<select multiple='multiple' id='"+ name +"' name='"+ name +"' style='height: 100%' class='form-control' size="+ (options[0].length) +">";

    $.each(options, function(rk, rv){
        $.each(rv, function(sk,sv){
            html += "<option value='"+ sv.value +"' "+ shouldMultiBeSelected(selectedValues, sv.value) +">"+ sv.label +"</option>";
        });
    });

    html += "</select>";
    return html;
}

function genCheckboxes(name, selectedValues, options) {
    var html = "";

    $.each(options, function(rk, rv){
        $.each(rv, function(sk,sv){
            html += "<div class='checkbox'>";
                html += "<label>";
                    html += "<input type='checkbox' id='"+ name +"' name='"+ name +"' value='"+ sv.value +"' "+ shouldMultiBeChecked(selectedValues, sv.value) +">"+ sv.label;
                html += "</label>";
            html += "</div>";
        });
    });

    return html;
}

function getLabel(defaultLabel, overridePath){
    var tnpath = normalizePath(overrideSchema, overridePath);
    var overLabel = getPathValue(overrideSchema, tnpath +".label");

    if(overLabel != undefined && overLabel != false){
        return getPathValue(overrideSchema, tnpath +".label");
    }
    return defaultLabel;
}

function genRemoveBtn(idToRemove){
    var sel = "rm-"+ idToRemove;
    var html = genButton(" X ", "button", "btn btn-danger", "", sel);

    $("#"+ cosmoProps.target_form_id).on("click", "[id='"+ sel +"']", function(){
        var isDis = $("[id='"+ idToRemove +"']").prop('disabled');
        if(!isDis){
            $("[id='"+ idToRemove +"']").prop('disabled', true);
            $(this).text(" + ");
            $(this).removeClass('btn-danger').addClass('btn-info');
        }
        else{
            $("[id='"+ idToRemove +"']").prop('disabled', false);
            $(this).text(" X ");
            $(this).removeClass('btn-default').addClass('btn-danger');
        }
    });

    return html;
}

function loadOverrideSchema(schemaUrl){
    $.ajax({
        url: schemaUrl,
        dataType: "json",
        async: false,
        success: function (data) {
            overrideSchema = data;
        }
    });
}

function shouldMultiBeSelected(options, staticVal){
    var objArry = options;

    for(i=0; i<objArry.length; i++){
        if(objArry[i] == staticVal){
            return "selected";
        }
    }
    return "";
}

function shouldMultiBeChecked(options, staticVal){
    var objArry = options;

    for(i=0; i<objArry.length; i++){
        if(objArry[i] == staticVal){
            return "checked";
        }
    }
    return "";
}

function shouldBeChecked(passedInVal, staticVal){
    return passedInVal == staticVal ? "checked":"";
}

function shouldBeSelected(passedInVal, staticVal){
    return passedInVal == staticVal ? "selected":"";
}

function validateConfig(cosmoProps){

    if(cosmoProps.override_schema_url == undefined || cosmoProps.override_schema_url == ""){
        console.warn("[cosmo forms] Warn: no override_schema_url provided, using defaults");
    }

    if(isMapEmpty(cosmoProps)){
        return "Fatal Error: Missing Configuration Properties";
    }
    else if(cosmoProps.target_form_id == undefined || cosmoProps.target_form_id == ""){
        return "Sever Error: target_form_id is missing or invalid";
    }
    else if(cosmoProps.data_url == undefined || cosmoProps.data_url == ""){
        // return "Sever Error: data_url is missing or invalid";
    }
    else if(cosmoProps.submit_url == undefined || cosmoProps.submit_url == ""){
        return "Sever Error: submit_url is missing or invalid";
    }

    return "";
}

function genListErrorMessage(){
    return genErrorMessage("General Error", "ERROR: lists of objects as inputs, are not currently supported.");
}

function genErrorMessage(title, msg){
    title = title != undefined ? title : "Error";

    var html = "<h3>"+ title +"</h3>";
    html += "<hr noshade='noshade' style='border-bottom: 2px solid red'/>";
    html += "<p>"+ msg +"</p>";
    return html;
}

function genDataOutput(formObj){
    var postObj = {};

    // for each input field/value, apply proper type casting
    $.each(formObj, function(rootIdx,rv){
        var vtype = refObject[rv.name];

        if(rv.value != null || rv.value != undefined){
            if(vtype == "array"){
                if(postObj[rv.name] == undefined){
                    postObj[rv.name] = [];
                    postObj[rv.name].push(rv.value);
                }
                else{
                    postObj[rv.name].push(rv.value);
                }
            }
            else if(vtype == "number"){
                postObj[rv.name] = Number(rv.value);
            }
            else if(vtype == "boolean"){
                postObj[rv.name] = JSON.parse(rv.value);
            }
            else{
                if(isStrNumeric(rv.value)){
                    postObj[rv.name] = Number(rv.value);
                }
                else if(isStrBool(rv.value)){
                    postObj[rv.name] = toBool(rv.value);
                }
                else if(isObjectNotaion(rv.value)){
                    postObj[rv.name] = {};
                }
                else{
                    postObj[rv.name] = rv.value;
                }
            }
        }
    });

    $.each(refObject, function (k, v) {
        found = formObj.some(function(elm){
            return elm.name.includes(k);
        });

        if(v == "object" && !found){
            log("adding obj: "+ k);
            postObj[k] = {};
        }

        if(v == "array" && !found){
            log("adding arr: "+ k);
            postObj[k] = [];
        }
    });

    log("postObj = "+ JSON.stringify(postObj));

    var ufObj = unflatten(postObj);
    var clnObj = cleanObj(ufObj);
    return clnObj;
}

function isStrBool(val){
    val = val.trim().toLowerCase();
    return (val === "true" || val === "false");
}

function isStrNumeric(val){
    if(val == ""){
        return false;
    }

    return !isNaN(val);
}

function isObjectNotaion(val){
    if(val == "{}"){
        return true;
    }

    return false;
}

function toBool(strVal){
    strVal = strVal.toLowerCase();
    if(strVal == "true"){
        return true;
    }
    else if(strVal == "false"){
        return false;
    }
    else{
        return undefined;
    }
}

function cleanObj(jsObj){
    $.each(jsObj, function(k,v){
        if(tp(v) == "array"){
            for(i = v.length-1; i >= 0; i--){
                var trimVi = v[i];
                if(trimVi == null || trimVi == undefined || trimVi == ""){
                    v.splice(i, 1);
                }
            }
        }
    });

    return jsObj;
}

function unflatten(jsonObj){
    "use strict";
    if (Object(jsonObj) !== jsonObj || Array.isArray(jsonObj))
        return jsonObj;
    var regex = /\.?([^.\[\]]+)|\[(\d+)\]/g,
        resultholder = {};
    for (var p in jsonObj) {
        var cur = resultholder,
            prop = "",
            m;
        while (m = regex.exec(p)) {
            cur = cur[prop] || (cur[prop] = (m[2] ? [] : {}));
            prop = m[2] || m[1];
        }
        cur[prop] = jsonObj[p];
    }
    return resultholder[""];
}

function checkForDebug(cosmoProps){
    if(cosmoProps.debug == undefined || cosmoProps.debug == null){
        var debug = getParam("cosmodebug");
        cosmoProps.debug =  debug != undefined ? debug:false;
    }
    else{
        // if debug prop set but not boolean, default to false
        cosmoProps.debug = tp(cosmoProps.debug) == "boolean" ? cosmoProps.debug : false;
    }
}

function getParam(key){
    if(isMapEmpty(qMap)){
        var params = location.search.substr(1).split('&');
        for(n=0; n < params.length; n++){
            qp = params[n].split("=");
            qMap[qp[0]] = qp[1];
        }
    }

    return qMap[key];
}

function outputDebug(cosmoProps, formData, prePostData){

    if(cosmoProps.debug){

        if($("#comso-debug-data").length == 0){
            var outputHtml =  "<div id='comso-debug-data' class='row'></div>";
            $("#"+ cosmoProps.target_form_id).append(outputHtml);

            $("#cosmo-form-data").css("word-wrap", "break-word");
            $("#cosmo-form-data").css("border", "1px solid red");
            $("#cosmo-form-data").css("padding", "5px");

            $("#cosmo-refobj-data").css("word-wrap", "break-word");
            $("#cosmo-refobj-data").css("border", "1px solid green");
            $("#cosmo-refobj-data").css("padding", "5px");

            $("#cosmo-form-serial").css("word-wrap", "break-word");
            $("#cosmo-form-serial").css("border", "1px solid black");
            $("#cosmo-form-serial").css("padding", "5px");

            $("#cosmo-path-debug").css("word-wrap", "break-word");
            $("#cosmo-path-debug").css("border", "1px solid blue");
            $("#cosmo-path-debug").css("padding", "5px");
        }

        outputHtml = "<div id='cosmo-form-data' class='col-xs-10'>" +
            "<h4>Generated Form Data</h4>" +
            "<div>"+ prePostData +"</div>" +
            "</div>";
        outputHtml += "<div id='cosmo-refobj-data' class='col-xs-10'>" +
            "<h4>RefObject</h4>"+
            "<div>"+ JSON.stringify(refObject) +"</div>" +
            "</div>";
        outputHtml += "<div id='cosmo-form-serial' class='col-xs-10'>" +
            "<h4>Serialized From Data</h4>" +
            "<div>"+ formData +"</div>" +
            "</div>";
        outputHtml += "<div id='cosmo-path-debug' class='col-xs-12'>" +
            "<h4>Paths</h4>" +
            "<div>"+ pathOuts +"</div>"+
            "</div>";

        $("#comso-debug-data").html(outputHtml);

        $("#cosmo-form-data").css("word-wrap", "break-word");
        $("#cosmo-form-data").css("padding", "5px");
        //
        $("#cosmo-refobj-data").css("word-wrap", "break-word");
        $("#cosmo-refobj-data").css("padding", "5px");
        //
        $("#cosmo-form-serial").css("word-wrap", "break-word");
        $("#cosmo-form-serial").css("padding", "5px");
        //
        $("#cosmo-path-debug").css("word-wrap", "break-word");
        $("#cosmo-path-debug").css("padding", "5px");
    }
}

function isMapEmpty(obj){
    for(x in obj){ return false; }
    return true;
}

function getPathValue(schema, path, replace){
    return jsonPath(schema, "$."+ path);
}

function getPathValue2(schema, path){
    var extVal = jsonPath(schema, "$."+ path);
    if(tp(extVal) == "array" && extVal.length == 1){
        return extVal[0];
    }
    return extVal;
}

function normalizePath(schema, path){
    rg = /\[\d\]/g;
    npath = '';

    if(rg.test(path)){
        npath = path.replace(rg, '');
    }
    else{
        npath = path;
    }

    return npath;
}

function convertBrackets(val){
    var v1 = val.replace("[", "_");
    v1 = v1.replace("]", "_");
    v1 = v1.replace(".", "_");
    return v1;
}

function stringIt(obj){
    return JSON.stringify(obj);
}

function tp(n){
    return jQuery.type(n);
}

function setRef(field, value){
    refObject[field] = tp(value);
}

function log(logmsg){
    console.log(logmsg);
}

/**
 * only do this if debug=true
 * @param path
 * @param jsonObj
 */
function pathout(path, jsonObj){
    pathOuts += (path +" = "+ jsonPath(jsonObj, path) +"<br/>");
}