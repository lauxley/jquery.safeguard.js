/*
 * SafeGuard.js is a small JS plugin for jQuery allowing
 * to save/load the datas of a form in/from the local storage
 * 
 * code booted by robin tissot for libération (www.liberation.fr)
 * and hosted here : https://github.com/lauxley/jquery.safegard.js
 */

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

(function($) {
    var defaults = {
        local_key : "safeguard-",
        editor_plugin : null,
        save_mode : "change",
        save_timer : 0,
        selector : null,
        recover_mode : "silent",
        confirm_label : "You have unsaved datas, do you want to retrieve them ?",
        max_age : 60*60*24 // set the expiration timer (in seconds), default is 1 day
        // history : 0 // TODO
    };
    var settings = {};
    var items = [];
    var has_changed = false;

    var methods = {
        getItems : function() {
            if (!items.length) {
                this.each(function() {
                    $.each( $("textarea,input,select", this), function(i, e) {
                        if ($(e).attr("id") !== undefined && (!settings.selector || (settings.selector && $(e).is(settings.selector)))) {
                            items.push(e);
                        }
                    });
                });
            }
            return $(items);
        },

        init : function(config) {
            var self = this;

            function _init_mode_silent() {
                if (self.safeguard('hasItems')) {
                    self.safeguard('load');
                }
            }

            function _init_mode_alert() {
                if (self.safeguard('hasItems')) {
                    if (confirm(settings.confirm_label)) {
                        self.safeguard('load');
                    }
                }
            }

            function _save() {
                if (self.has_changed) {
                    self.safeguard('save');
                    self.has_changed = false;
                }
            }

            function _has_changed() {
                self.has_changed = true;
                if (settings.save_mode == "change") {
                    _save();
                }
            }

            function _set_timer() {
                self.data('timer', setInterval(_save, settings.save_timer*1000));
            }

            function _unbind() {
                clearInterval(self.data("timer"));
                self.safeguard('flush');
            }

            if (config === undefined) config = {};
            settings = $.extend({}, defaults);
            if (config) { $.extend(settings, config); }
            
            $.each(self.safeguard('getItems'), function(i, e) {
                if (settings.editor_plugin && settings.editor_plugin.isConcerned($(e))) {
                    settings.editor_plugin.onChange($(e), _has_changed);
                } else {
                    $(e).bind("change", _has_changed);
                }
            });
            
            if (settings.save_mode == "timer") {
                if (settings.save_timer) {
                    _set_timer();
                }
            }

            self.bind("submit", _unbind);
            // because the onchange event is not fired in some cases (for instance when pushing the back button in chromium)
            $(window).bind("unload", _save);

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


            self.safeguard('clean');
            return this;
        },

        save : function() {
            function _add(key, val) {
                localStorage[key] = val;
                var is = localStorage[settings.local_key+"index_store"];
                var index_store = JSON.parse(is?is:"{}");
                index_store[key] = new Date().getTime(); // update/create the date for this key
                localStorage[settings.local_key+"index_store"] = JSON.stringify(index_store);
            }
            vals = {};
            var l = $.each(this.safeguard('getItems'), function(i, e) {
                if (settings.editor_plugin && settings.editor_plugin.isConcerned($(this))) {
                    val = settings.editor_plugin.getVal($(e));
                } else {
                    val = $(this).val();
                }
                vals[$(e).attr("id")] = val;
            });
            _add(settings.local_key+document.location.pathname, JSON.stringify(vals));
            return l;  // keep the chainability
        },

        load : function() {
            var = $([]);
            if (this.safeguard('hasItems')) {
                var o = JSON.parse(localStorage[settings.local_key+document.location.pathname]);
                var l = $.each(this.safeguard('getItems'), function(i, e) {
                    if (settings.editor_plugin && settings.editor_plugin.isConcerned($(e))) {
                        settings.editor_plugin.setVal($(e), o[$(e).attr("id")]);
                    } else {
                        $(e).val(o[$(e).attr("id")]);
                    }
                });
            }
            return l; // keep the chainability
        },
        
        flush : function() {
            var key = settings.local_key+document.location.pathname;
            var index_store = JSON.parse(localStorage[settings.local_key+"index_store"]); 
            delete index_store[key];
            localStorage[settings.local_key+"local_store"] = JSON.stringify(index_store);
            localStorage.removeItem(key);
        },

        hasItems : function() {
            return (localStorage[settings.local_key+document.location.pathname] !== undefined);
        },

        clean : function() {
            // look for expired keys
            var index_store = JSON.parse(localStorage[settings.local_key+"index_store"]);
            var d = new Date().getTime();
            for (key in index_store) {
                if (parseInt(d) - parseInt(index_store[key]) > settings.max_age * 1000) {
                    localStorage.removeItem(key);
                    delete index_store[key];
                }
            }
            localStorage[settings.local_key+"index_store"] = JSON.stringify(index_store);
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
