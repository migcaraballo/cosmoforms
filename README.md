# ![cos](cos_bw_sm.jpg?raw=true "") CosmoForms v1.0.0-beta

### About

CosmoForms is a javascript framework that dynamically builds html forms with bootstrap and jQuery based on the json data it receives. 
With CosmoForms, there is no complex API to learn, simply call a function, giving it certain properties, and the framework will do the rest.

You can get up and running with CosmoForms fairly easy, and usually, in less than 5 minutes.


### Intention

CosmoForms solves a common problem for many non-UI developers. 
At the same time, it allows for easy modification of schemaless data.
The process of getting form data from browser to database usually involves a few steps.
At the very minimum, it requires that the data be captured, converted to a specific format, then stored in a database. 
A lot of repetitive code usually arises out of these simple steps and there are plenty of frameworks that help deal with
this already. However, these frameworks are usually implemented as part of a more complex framework or, in a specific technology for both backend and frontend,
 thus tying both disciplines together to some degree.
 
CosmoForms intends to keep things simple. **Json in, Json out**. Whatever Json the framework receives, it outputs along with modifications. 


##### This means 2 things: 
 1. Your backend should have an endpoint that receives Json  data.
 2. Your backend doesn't have to do much translation/conversion code, specially if it already works with Json-type data.
 

### Features

- Minimal code to get up and running
- default form building out of the box
- ability to integrate with backend
- apply field name overrides
- apply form field type overrides


### Dependencies

CosmoForms requires 3 external libraries to work. 
The following list are those libraries along with the version that was used for testing.

- [JsonPath](http://goessner.net/articles/JsonPath/) Main Page [Downloads](https://code.google.com/archive/p/jsonpath/downloads) (tested: 0.8.0)
- [Bootstrap](http://getbootstrap.com/) (tested: 3.3.7)
- [JQuery](https://jquery.com/) (tested: 3.2.1)


### Usage 

##### Download:

- cosmoforms-1.0.0-beta.min.js (minified) OR
- cosmoforms-1.0.0-beta.js (source)

##### Configuration

This assumes you have downloaded and installed JavaScript files in a folder called "js" accessible to your page.
```
<script src="js/cosmoforms-1.0.0-beta.js"></script>
```

##### After Body Tag:
```
<!-- cosmoForms -->
<script src="js/cosmoforms-1.0.0-beta.min.js"></script>

<script>
    var thisPage = "test_cosmoforms.html?cosmodebug=true";
    var submitUrl = thisPage;
    var dataUrl = "data/sm_test_input.json";

    /* backend integration (demo) */
    var dataUrl = "/some/backend/endpoint";

    function successAction(responseObject){
        location.href = thisPage;
    }

    function cancelAction(){
        location.href = thisPage;
    }

    cosmoForm({
        "target_form_id" : "cosmo-form",
        "data_url" : dataUrl,
        "override_schema_url" : "schemas/test_override_schema.json",
        "submit_url" : submitUrl,
        "success_action": successAction,
        "cancel_action": cancelAction
    });

```

##### Property Details
```
cosmoForm({
    "target_form_id" : "cosmo-form",
    "data_url" : "url/to/endpoint/with/data",
    "override_schema_url" : "schemas/sample_override_schema.json",
    "submit_url" : "url/to/post/endpoint",
    "success_action": Success Action Function,
    "cancel_action": Cancel Action Function
});
```
- **target_form_id**: ID of the form tag where CosmoForms will insert it's generated form html
- **data_url**: URL that will load data from the backend. Usually an endpoint or pointer to file
- **override_schema_url**: URL of override schema json 
- **submit_url**: URL used for form submissions
- **success_action**: callback function used after form is successfully submitted
- **cancel_action**: callback function used when "Cancel" button is clicked on form

### Sample Template

```
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewp+ort" content="width=device-width, initial-scale=1">

        <title>Cosmo Forms</title>

        <!-- Bootstrap CSS -->
        <link href="css/bootstrap.min.css" rel="stylesheet">

        <!--[if lt IE 9]>
            <script src="https://oss.maxcdn.com/html5shiv/3.7.3/html5shiv.min.js"></script>
            <script src="https://oss.maxcdn.com/respond/1.4.2/respond.min.js"></script>
        <![endif]-->

    </head>

    <body>
        <div class="container">
            <h2>Cosmo Forms</h2>

            <div class="row">
                <div class="col-xs-12">
                    <form id="cosmo-form"></form>
                </div>
            </div>
        </div>
    </body>

    <!-- jQuery -->
    <script src="https://code.jquery.com/jquery-3.2.1.min.js"></script>

    <!-- Bootstrap -->
    <script src="js/bootstrap.min.js"></script>

    <!-- JsonPath -->
    <script src="js/jsonpath-0.8.0.js"></script>

    <!-- cosmoForms -->
    <script src="js/cosmoforms-1.0.0-beta.min.js"></script>

    <script>
        var thisPage = "test_cosmoforms.html?cosmodebug=true";
        var submitUrl = thisPage;
        var dataUrl = "data/sm_test_input.json";

        /* backend integration (demo) */
        var dataUrl = "/some/backend/endpoint";

        function successAction(responseObject){
            location.href = thisPage;
        }

        function cancelAction(){
            location.href = thisPage;
        }

        cosmoForm({
            "target_form_id" : "cosmo-form",
            "data_url" : dataUrl,
            "override_schema_url" : "schemas/test_override_schema.json",
            "submit_url" : submitUrl,
            "success_action": successAction,
            "cancel_action": cancelAction
        });
    </script>
</html>
```
### Defaults
Out of the box, CosmoForms handles some defaults in order to ease development:
- **Numbers, Booleans, Strings:**
    - By default, CosmoForms will try to keep basic data types as-is. This means that if your Json data has actual numbers and booleans, it will keep those data types.
- **Booleans:**
    - if the value of a field can be determined as true/false (True/False), then CosmoForms will, by default generate radio buttons with True/False default values.
        - if you prefer a "select" instead of radio buttons, that is also easily possible by setting "form_field" to "select".
- **Numbers:**
    - By default, CosmoForms will keep numbers as numbers. If a number is wrapped in single/double quotes, it will be treated as a string.
- **Strings:**
    - Strings are handled as Text Fields by default, however, in cases where the Text value of a String is larger than 30 characters, it will automatically convert the field to Textarea. 

### Override Schema File
Override Schema File is simply a Json file that overrides how certain form fields will be displayed/handled in a forms html output.

#### Sample Schema Override File
A sample schema override file is provided in this repo under the "schemas" folder. This can also come from a database exposed via an endpoint if you choose to store override schemas that way instead of file system.

**Fields & Values in Override Schema**
- **"form_field"** (optional):
    - one of the following: 
        - **"id":** read-only field that will be displayed but is immutable
        - **"radio":** will display field values as radio buttons form controls
        - **"select":** will display field values as a select or dropdown form control
        - **"multi-select":** will display field values as multi-select form control
        - **"checkbox":** will display field values as checkbox form controls

- **"label"** (optional): if this field is present, it will apply the value for this field as the form label
- **"options"** (optional): Json Array of "label" & "value" fields which correspond to values used for options with radio, select, multi-select, and checkbox controls.

##### Override Samples
**Handling ID fields:**

ID fields are usually read-only pointers to some key in a database. When you go to update a document, you will usually refer to it by its key. In this example, we are using Mongo DB's default "_id" field.
ID fields (currently) are displayed as read-only text and can not be mutated.
 
 - "_id": the field returned in the Json document.
 - "form_field": the type of field
```
"_id":{
    "form_field": "id",
    "label": "Mongo Key"
}
```

**Using Labels**

Labels are used to supply a different name to a form label. In cases where the form field is named something proprietery, or named something obscure, you may want to supply a friendlier name to those editing the data.
You can use the label field in the schema file to do such things.

In this example, the label "Mongo Key" will be used instead of "_id". 
```
"_id":{
    "form_field": "id",
    "label": "Mongo Key"
}
```

**Using Options**

Options apply to radio, select, multi-select, and checkbox controls. Basically put, it is a Json Array of label & value objects which will be used to generate the options used by the aforementioed form controls. 
 
```
"retired" : {
    "form_field": "select",
    "options" : [
      {
        "label": "Heck Yes!!!",
        "value": true
      },
      {
        "label": "Still Working",
        "value": false
      }
    ]
}
```

### Handling Form Submission Success

Form Submission success maps directly to the jQuery handling of success in the $.ajax function.

 Your function must accept the response object created by jQuery's POST success action handler.

 ```
 "success_action": successAction

 function successAction(responseObject){
     // do something
 }
 ```

### Handling Form Submission Errors

In CosmoForms, form submission errors are automatically handled by the framework's internal error handling functions. At present, there is no ability for user supplied error handling callback functions.

In order to invoke and display form errors, the endpoint for **"success_action"** must also return an array of string errors in a field called **"form_errors"**.


### Handling Form Cancel


Each form generated by CosmoForms will come with a "Cancel" button. When clicked, it will invoke the function named in the "cancel_action" property. No data will be modified, saved, or submitted.

In our demo, this function will take the user back to a listing page.

### Limitations

Like all things in life, CosmoForms has limitations:

- Does not work with root level Json Arrays. That's right. If data_url points to a Json Array, then it will not work. Try it so you can see the pretty error message.
- Input Json should be as flat as possible, meaning not to many nested objects. Currently, CosmoForms only supports around 2 to 3 nested objects.
- CosmoForms only works with Json data. Sorry XML.
- At present, only Bootstrap's Vertical From layout is supported.


### Upcoming Changes

- Implement client-side validation callbacks
- Ability to remove/delete lists and objects
- Ability to rename fields


updated