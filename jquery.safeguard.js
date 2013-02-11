/*
 * SafeGuard.js is a small JS plugin for jQuery allowing
 * to save/load the datas of a form in/from the local storage
 * 
 * code booted by robin tissot for libération (www.liberation.fr)
 * and hosted here : https://github.com/lauxley/jquery.safegard.js
 */

var safeguard_tinymce = {
    isConcerned : function(el) {
        return (tinyMCE.get(el.attr("id")) != undefined);
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

(function($) {
    var defaults = {
        local_key : "safeguard-",
        editor_plugin : null,
        save_mode : "change",
        save_timer : 0,
        selector : null,
        recover_mode : "silent"
        // history : 0 // TODO
    };
    var settings = {};

    var methods = {
        getItems : function() {
            var items = [];
            this.each(function() {
                $.each( $("textarea,input", this), function(i, e) {
                    if ($(e).attr("id") != undefined && (!settings.selector || (settings.selector && $(e).is(settings.selector)))) {
                        items.push(e);
                    }
                });
            });
            return $(items);
        },

        init : function(config) {
            var self = this;

            function _init_mode_silent() {
                if (methods.hasItems.apply(self)) {
                    methods.load.apply(self);
                }
            }

            function _init_mode_alert() {
                if (methods.hasItems.apply(self)) {
                    if (confirm("You have unsaved datas, do you want to retrieve them ?")) {
                        methods.load.apply(self);
                    }
                }
            }

            if (config == undefined) config = {};
            settings = $.extend({}, defaults);
            if (config) { $.extend(settings, config); }
            
            switch (settings.save_mode) {
                case "change":
                    $.each(methods.getItems.apply(this), function(i, e) {
                        if (settings.editor_plugin && settings.editor_plugin.isConcerned($(e))) {
                            settings.editor_plugin.onChange($(e), function() { methods.save.apply(self); });
                        } else {
                            $(e).bind("change", function() { methods.save.apply(self); });
                        }
                    });
                    break;
                case "timer":
                    if (settings.save_timer) {
                        self.data('timer', setInterval(function() { methods.save.apply(self); }, settings.save_timer*1000));
                    }
                    break;
                default:
                    $.error("Not Implemented save mode : "+settings.save_mode);
            }

            self.bind("submit", function(e) { 
                clearInterval(self.data("timer"));
                methods.clear.apply(self);
            });

            switch (settings.recover_mode) {
                case "silent":
                    _init_mode_silent();
                    break;
                case "alert":
                    _init_mode_alert();
                    break;
                case "custom":
                    break;
                default:
                    $.error("Not Implemented recover mode : "+settings.recover_mode);
            }

            return this;
        },

        save : function() {
            return $.each(methods.getItems.apply(this), function(i, e) {
                console.log('saving', e);
                if (settings.editor_plugin && settings.editor_plugin.isConcerned($(this))) {
                    val = settings.editor_plugin.getVal($(e));
                } else {
                    val = $(this).val();
                }
                var key = settings.local_key + $(e).attr("id");
                if (val == undefined || val == "") {
                    localStorage.removeItem(key);
                } else {
                    localStorage[key] = val;
                }
            });
        },

        load : function() {
            return $.each(methods.getItems.apply(this), function(i, e) {
                key = settings.local_key + $(e).attr("id");
                if (localStorage[key]) {
                    if (settings.editor_plugin && settings.editor_plugin.isConcerned($(e))) {
                        settings.editor_plugin.setVal($(e), localStorage[key]);
                    } else {
                        $(this).val(localStorage[key]);
                    }
                }
            });
        },
        
        clear : function() {
            return this.each(methods.getItems.apply(this), function(i, e) {
                var key = settings.local_key+$(e).attr("id");
                localStorage.removeItem(key);
            });
        },

        hasItems : function() {
            var res = false;
            $.each( methods.getItems.apply(this), function(i, e) {
                if (localStorage[settings.local_key + $(e).attr("id")]) {
                    res = true;
                }
            });
            return res;
        }
    };

    $.fn.safeguard = function(method) {
        if (localStorage) {
            if ( methods[method] ) {
                return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
            } else if ( typeof method === 'object' || ! method ) {
                return methods.init.apply( this, arguments );
            } else {
                $.error( 'Method ' +  method + ' does not exist on jQuery.safeguard' );
            }
        }
   };

})(jQuery);
