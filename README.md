#![alt text](cos_bw_sm.jpg "") CosmoForms [V1.0.0-beta]

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
- ability to integrate wtih backend
- apply field name overrides
- apply form field type overrides


### Dependencies

CosmoForms requires 3 external libraries to work. 
The following list are those libraries along with the version which was used for testing. 

- [JsonPath](http://goessner.net/articles/JsonPath/) Main Page[Downloads](https://code.google.com/archive/p/jsonpath/downloads)(tested: 0.8.0)
- [Bootstrap](http://getbootstrap.com/)(tested: 3.3.7)
- [JQuery](https://jquery.com/) (tested: 3.2.1)


### Usage 


### Sample Template


### Handling Form Submission Success


### Handling Form Submission Errors


### Handling Form Cancel


### Limitations


### Upcoming Changes