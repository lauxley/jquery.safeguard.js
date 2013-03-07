jquery.safegard.js
==================

jquery.safegard.js is a modular jquery plugin that save the current state of a form in the local storage to prevent loss of data.

Usage
-----

Safeguard is fairly easy to use :

`$('#my-form').safeguard();`

By default safeguard will save datas on the onchange event,  
and will automatically recover it when the form is initialized if the form have not been submited.  
But you can change this behavior usings configs:  

`$('#my-form').safeguard({ "save_mode" : "timer",
                           "save_timer" : 10 });`

In this case, the form datas will be saved automatically every 10 seconds.


Available configs
-----------------

* local_key 
 
    **default** : "safeguard-",  
    Change the suffix used to store the datas in the local storage.
    You should change this to something dynamic if you have several forms in the same page using safeguard.

* editor_plugin

    **default** : null  
    Used to handle wysiwygs.  
    The plugin for tinyMCE is included in the code as example/convenience, use "editor_plugin : safeguard_tinymce" to use it.

* save_mode

    **default** : "change"  
    Change when the datas will be saved,  
    two values for now :
    * "change" bind the save on the "onchange" event of the inputs 
    * "timer" save the form on a regular basis 
  
* save_timer

    **default** : 0  
    It only makes sense if save_mode is set to "timer", the value is in seconds.  
    Note that if you want to handle the save yourself, you can set save_mode to "timer" and save_timer to 0.

* selector

    **default** : null  
    if this is set, only elements of the form matching this (using the jQuery method is()) will be saved/loaded.

* recover_mode

    **default** : "silent"  
    Change how the datas will be recovered,  
    valid values are "silent", "alert" and "custom".  
    * In "silent" mode, if datas are present in the storage when safeguard is initialized, they will be used to fill the form, without user input.  
    * In "alert" mode, a confirm window will appear asking for the user if he wishes to recover the datas.  
    * The "custom" mode let you bind the data recovery as you wish (example on the way).  
  
* confirm_label

    **default** : "You have unsaved datas, do you want to retrieve them ?"  
    change the sentence displayed in the confirm window when the recover_mode is set to "alert".

* max_age  

    **default** : 1 day (60*60*24 seconds)  
    The number of seconds a key (and thus a form) will stay in the local storage before being purged.
    Set to 0 if you never want to flush the datas automatically (you can still do it yourself by calling .safeguard('flush', key)).

* time

  **default** : new Date().getTime() (= the current client date)  
  Use this config in case you want to use server side times.  
  you can use the getTime method of safeguard to get the time at which the datas have been saved.  

* history

    **default** : 1  
    When history is set to X (X being non-zero), the save method will push the current state in a list of form states, up to a length of X.  
    Note that untill we find a good and generic way to handle this, the load method will still recover the last state, unless you pass it an integer being the index in the history.  
    It is your responsability to create an interface to recover data from this list.  
    Also, It is not recommanded to use the save_mode "change" because in this case the history will grow very quickly.
    Another convenient method is getDatas, like load, you can pass it an optional integer.

* flush_on_submit
* flush_on_reset
  
    **default** : true  
    These 2 settings if set to false tells safeguard to not flush datas respectivelly when the user submit or reset the form,  
    Note that in this case, it is your responsability to flush the datas (with .safeguard('flush', key)) when you feel comfortable to do so,  
    probably in the confirm view. 

* init_callback 
    **default** : null  
    function of the form : my_callback(safeguad_obj, has_items)  
    will be called at the end of the safeguard initialisation, and is particularly usefull in case of a custom recovery mode (see the example below).  

Example snippet
---------------

Here is a small example of how to use a custom recovery mode, and some other stuff :

Let's assume we have a form in the page with a title input, a content textarea with a tinyMCE bind,  
and any other input that we don't want to save (a password for example). 

```javascript
    // don't do anything untill tinyMCE is loaded ! 
    // note : don't bind settings.oninit of tinyMCE after the DOM have been loaded
    // because in some cases, it will be set too late and thus won't fire.
    tinyMCE.settings.oninit = function() { 
        $('#my_form').safeguard('init', 
                     {"recover_mode": "custom", // tells safeguard that we will handle the recovery by ourselves. 
                      "editor_plugin":safeguard_tinymce, // tells safeguard that some fields in the form are tinyMCE bound. 
                      "selector":"#id_title,#id_content" // used as a whitelist, we could also do something like 
                                                         // "[id!=id_password]" if we prefer a blacklist style selector. 
                      "init_callback" : function (safeguarded_form, has_items) {
                                                 if (has_items) { // check if there are saved datas at initialization time 
                                                    $("#content").append("<a class='safeguard-btn'>Recover datas</a>"); // add a button if it is the case 
                                                    $(".safeguard-btn").bind("click", function() { safeguarded_form.safeguard('load'); }); // bind the click on the button to load the saved datas 
                                                 }
                                        }
    });

```

Wysiwygs pluggin
----------------

Let's take a quick look at the implementation of the tinyMCE plugin :

```javascript
var safeguard_tinymce = {
    isConcerned : function(el) {
        return (tinyMCE.get(el.attr("id")) !== undefined);
    },
    getVal : function(el) {
        return tinyMCE.get(el.attr("id")).getContent();
    },
    setVal : function(el, val) {
        tinyMCE.get(el.attr("id")).setContent(val);
    },
    onChange : function(el, cb) {
        // NOTE : for this to work you need to call the init method of safeguard AFTER the initialization of tinyMCE
        tinyMCE.get(el.attr("id")).onChange.add(cb);
   }
};
```
This is pretty straightforward, we need 4 methods, to hook the functionalities of safeguard with those of the wysiwyg.
* isConcerned returns a boolean, true if the given field is bound to the wysiwyg, false otherwise.
* getVal returns the content of the wysiwyg.
* setVal call the wysiwyg's method to set its content with the given value.
* onChange is passed a form field and a function, its role is to bind the change event of the wysiwyg linked to the form field with the given function.


TODO
----

* add a custom mode for save_mode ? (it feels hackish to use save_mode "timer" and save_timer 0)
* comments
* use the window.history.pushState to make the back button of the browser cancel the loading of datas from the localeStorage
* improve the time management (for now the time is only calculated on script initialisation, but we could use a custom function that calculate the difference between the system date and the given date...)
