jquery.safegard.js
==================

jquery.safegard.js is a modular jquery plugin that save the current state of a form in the local storage to prevent loss of data.

Usage
-----

Safeguard is fairly easy to use :

`$('#my-form').safeguard('init');`

By default safeguard will save datas on the onchange event,  
and will automatically recover it when the form is initialized if the form have not been submited.  
But you can change this behavior usings configs:  

`$('#my-form').safeguard('init', { 
                                "save_mode" : "timer",
                                "save_timer" : 10
                                });`

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
                     }); 
        if ($('#my_form').safeguard('hasItems')) { // check if there are saved datas at initialization time 
            $("#content").append("<a class='safeguard-btn'>Recover datas</a>"); // add a button if it is the case 
            $(".safeguard-btn").bind("click", function() { $('#article_form').safeguard('load'); }); // bind the click on the button to load the saved datas 
        } 
    };

```

TODO
----

* plugin explanation
* add a custom mode for save_mode ? (it feels hackish to use save_mode "timer" and save_timer 0)
* comments
* history
* use the window.history.pushState to make the back button of the browser cancel the loading of datas from the localeStorage