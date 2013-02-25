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
        max_age : 60*60*24, // set the expiration timer (in seconds), default is 1 day
        time : Math.round(new Date().getTime() / 1000), // in case you would want to pass a server time
        history : 1,
        flush_on_submit : true,
        flush_on_reset : true
    };
    var settings = {};
    var items = [];
    var has_changed = false;

    var getHKey = function(url) {
        return settings.local_key + (url!==undefined?url:document.location.pathname);
    };

    var getStoreKey = function() {
        return settings.local_key + "index_store";
    };

    var getStore = function(url) {
        try {
            return JSON.parse(localStorage[getStoreKey()])[getHKey(url)];
        } catch (TypeError) {
            return null;
        }
    };

    var setStore = function(data, url) {
        var store = JSON.parse(localStorage[getStoreKey()]?localStorage[getStoreKey()]:"{}");
        store[getHKey(url)] = data;
        localStorage[getStoreKey()] = JSON.stringify(store);
    };

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

        getDatas : function(index) {
            var state_list = JSON.parse(localStorage[getHKey()]);
            if (index) {
                return state_list.slice(index, index + 1)[0]; 
            } else {
                return state_list.shift();
            }
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

            self.bind("submit", function() {
                clearInterval(self.data("timer"));
                if (settings.flush_on_submit) {
                    self.safeguard('flush');
                } else {
                    self.safeguard('invalidate');
                }
            });
            self.bind("reset", function() {
                clearInterval(self.data("timer"));
                if (settings.flush_on_reset) {
                    self.safeguard('flush');
                } else {
                    self.safeguard('invalidate');
                }
            });

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
                var state_list = JSON.parse(localStorage[key]?localStorage[key]:"[]");
                state_list.unshift(val);
                while (state_list.length > settings.history) {
                    state_list.pop();
                }
                localStorage[key] = JSON.stringify(state_list);
                setStore({'time':settings.time, 'valid':true});
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
            _add(getHKey(), vals);
            return l;  // keep the chainability
        },

        load : function(index) {
            var l = $([]);
            var o = this.safeguard('getDatas', index);
            var l = $.each(this.safeguard('getItems'), function(i, e) {
                if (settings.editor_plugin && settings.editor_plugin.isConcerned($(e))) {
                    settings.editor_plugin.setVal($(e), o[$(e).attr("id")]);
                } else {
                    $(e).val(o[$(e).attr("id")]);
                }
            });
            return l; // keep the chainability
        },
        
        flush : function(url) {
            var key = getHKey(url);
            var index_store = JSON.parse(localStorage[getStoreKey()]?localStorage[getStoreKey()]:"{}");
            if (index_store) {
                delete index_store[key];
                localStorage[getStoreKey()] = JSON.stringify(index_store);
            }
            localStorage.removeItem(key);
        },

        setValidity : function(val, url) {
            var store = getStore(url);
            if (store) {
                store["valid"] = val;
                setStore(store);
            }
        },

        invalidate : function(url) {
            this.safeguard('setValidity', false, url);
        },

        validate : function(url) {
            this.safeguard('setValidity', true, url);
        },

        isValid : function(url) {
            var store = getStore(url);
            if (store) {
                return store['valid'];
            } else {
                return false;
            }
        },

        hasItems : function() {
            return (localStorage[getHKey()] !== undefined && this.safeguard('isValid'));
        },

        clean : function() {
            // look for expired keys
            var d = settings.time;
            var index_store = JSON.parse(localStorage[getStoreKey()]?localStorage[getStoreKey()]:"{}");
            if (index_store) {
                for (key in index_store) {
                    if (parseInt(d) - parseInt(index_store[key]['time']) > settings.max_age) {
                        localStorage.removeItem(key);
                        delete index_store[key];
                    }
                }
                localStorage[getStoreKey()] = JSON.stringify(index_store);
            }
        },
        
        getTime : function() {
            var store = getStore();
            if (store) {
                return parseInt(store['time']);
            } else {
                return null;
            }
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
