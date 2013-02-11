jquery.safegard.js
==================

jquery.safegard.js is a modular jquery plugin that save the current state of a form in the local storage to prevent loss of data.

Usage
-----

Safeguard is fairly easy to use :

$('#my-form').safeguard('init');

By default safeguard will save datas on the onchange event,  
and will automatically recover it when the form is initialized if the form have not been submited.  
But you can change this behavior usings configs:  

`$('#my-form').safeguard('init', { 
                                "save_mode" : "timer",
                                "save_timer" : 10
                                });`

In this case, the form datas will be saved automatically every 10 seconds.

AVAILABLE CONFIGS
-----------------

* local_key 
 
    **default** : "safeguard-",  
    Change the suffix used to store the datas in the local storage.

* editor_plugin

    **default** : null  
    Used to handle wysiwygs.  
    The plugin for tinyMCE is included in the code as example/convenience, use "editor_plugin : safeguard_tinymce" to use it.

* save_mode

    **default** : "onchange"  
    Change when the datas will be saved,  
    two values for now : "onchange" and "timer".  

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
    In "silent" mode, if datas are present in the storage when safeguard is initialized, they will be used to fill the form, without user input.  
    In "alert" mode, a confirm window will appear asking for the user if he wishes to recover the datas.  
    The "custom" mode let you bind the data recovery as you wish (example on the way).


TODO
----

* plugin explanation
* custom mode example
* i18n
* figure out the best way to call methods (instead of 'methods.foo.apply(self)')
* comments
* history
