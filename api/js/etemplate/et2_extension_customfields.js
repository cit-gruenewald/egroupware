"use strict";
/**
 * EGroupware eTemplate2 - JS Custom fields object
 *
 * @license http://opensource.org/licenses/gpl-license.php GPL - GNU General Public License
 * @package etemplate
 * @subpackage api
 * @link http://www.egroupware.org
 * @author Nathan Gray
 * @copyright Nathan Gray 2011
 * @version $Id$
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
/*egw:uses
    lib/tooltip;
    /vendor/bower-asset/jquery/dist/jquery.js;
    et2_core_xml;
    et2_core_DOMWidget;
    et2_core_inputWidget;
*/
var et2_core_widget_1 = require("./et2_core_widget");
var et2_core_inheritance_1 = require("./et2_core_inheritance");
var et2_core_valueWidget_1 = require("./et2_core_valueWidget");
var et2_customfields_list = /** @class */ (function (_super) {
    __extends(et2_customfields_list, _super);
    function et2_customfields_list(_parent, _attrs, _child) {
        var _this = _super.call(this, _parent, _attrs, et2_core_inheritance_1.ClassWithAttributes.extendAttributes(et2_customfields_list._attributes, _child || {})) || this;
        _this.legacyOptions = ["type_filter", "private", "fields"]; // Field restriction & private done server-side
        _this.rows = {};
        _this.widgets = {};
        _this.detachedNodes = [];
        // Some apps (infolog edit) don't give ID, so assign one to get settings
        if (!_this.id) {
            _this.id = _attrs.id = et2_customfields_list.DEFAULT_ID;
            // Add all attributes hidden in the content arrays to the attributes
            // parameter
            _this.transformAttributes(_attrs);
            // Create a local copy of the options object
            _this.options = et2_cloneObject(_attrs);
        }
        // Create the table body and the table
        _this.tbody = jQuery(document.createElement("tbody"));
        _this.table = jQuery(document.createElement("table"))
            .addClass("et2_grid et2_customfield_list");
        _this.table.append(_this.tbody);
        if (!_this.options.fields)
            _this.options.fields = {};
        if (typeof _this.options.fields === 'string') {
            var fields = _this.options.fields.split(',');
            _this.options.fields = {};
            for (var i = 0; i < fields.length; i++) {
                _this.options.fields[fields[i]] = true;
            }
        }
        if (_this.options.type_filter && typeof _this.options.type_filter == "string") {
            _this.options.type_filter = _this.options.type_filter.split(",");
        }
        if (_this.options.type_filter) {
            var already_filtered = !jQuery.isEmptyObject(_this.options.fields);
            for (var field_name in _this.options.customfields) {
                // Already excluded?
                if (already_filtered && !_this.options.fields[field_name])
                    continue;
                if (!_this.options.customfields[field_name].type2 || _this.options.customfields[field_name].type2.length == 0 ||
                    _this.options.customfields[field_name].type2 == '0') {
                    // No restrictions
                    _this.options.fields[field_name] = true;
                    continue;
                }
                var types = typeof _this.options.customfields[field_name].type2 == 'string' ? _this.options.customfields[field_name].type2.split(",") : _this.options.customfields[field_name].type2;
                _this.options.fields[field_name] = false;
                for (var i = 0; i < types.length; i++) {
                    if (jQuery.inArray(types[i], _this.options.type_filter) > -1) {
                        _this.options.fields[field_name] = true;
                    }
                }
            }
        }
        _this.setDOMNode(_this.table[0]);
        return _this;
    }
    et2_customfields_list.prototype.destroy = function () {
        _super.prototype.destroy.call(this);
        this.rows = {};
        this.widgets = {};
        this.detachedNodes = [];
        this.tbody = null;
    };
    /**
     * What does this do?  I don't know, but when everything is done the second
     * time, this makes it work.  Otherwise, all custom fields are lost.
     */
    et2_customfields_list.prototype.assign = function (_obj) {
        this.loadFields();
    };
    et2_customfields_list.prototype.getDOMNode = function (_sender) {
        // Check whether the _sender object exists inside the management array
        if (this.rows && _sender.id && this.rows[_sender.id]) {
            return this.rows[_sender.id];
        }
        return _super.prototype.getDOMNode.call(this, _sender);
    };
    /**
     * Initialize widgets for custom fields
     */
    et2_customfields_list.prototype.loadFields = function () {
        if (!this.options || !this.options.customfields)
            return;
        // Already set up - avoid duplicates in nextmatch
        if (this.getType() == 'customfields-list' && !this.isInTree())
            return;
        if (!jQuery.isEmptyObject(this.widgets))
            return;
        // Check for global setting changes (visibility)
        var global_data = this.getArrayMgr("modifications").getRoot().getEntry('~custom_fields~');
        if (global_data && global_data.fields && !this.options.fields)
            this.options.fields = global_data.fields;
        // For checking app entries
        var apps = this.egw().link_app_list();
        // Create the table rows
        for (var field_name in this.options.customfields) {
            // Skip fields if we're filtering
            if (this.getType() != 'customfields-list' && !jQuery.isEmptyObject(this.options.fields) && !this.options.fields[field_name])
                continue;
            var field = this.options.customfields[field_name];
            var id = et2_customfields_list.PREFIX + field_name;
            // Need curlies around ID for nm row expansion
            if (this.id == '$row') {
                id = "{" + this.id + "}" + "[" + et2_customfields_list.PREFIX + field_name + "]";
            }
            else if (this.id != et2_customfields_list.DEFAULT_ID) {
                // Prefix this ID to avoid potential ID collisions
                id = this.id + "[" + id + "]";
            }
            // Avoid creating field twice
            if (!this.rows[id]) {
                var row = jQuery(document.createElement("tr"))
                    .appendTo(this.tbody)
                    .addClass(this.id + '_' + id);
                var cf = jQuery(document.createElement("td"))
                    .appendTo(row);
                if (!field.type)
                    field.type = 'text";';
                var setup_function = '_setup_' + (apps[field.type] ? 'link_entry' : field.type.replace("-", "_"));
                var attrs = {
                    'id': id,
                    'statustext': field.help,
                    'needed': field.needed,
                    'readonly': this.getArrayMgr("readonlys").isReadOnly(id, null, this.options.readonly),
                    'value': this.options.value[et2_customfields_list.PREFIX + field_name]
                };
                // Can't have a required readonly, it will warn & be removed later, so avoid the warning
                if (attrs.readonly === true)
                    delete attrs.needed;
                if (this.options.onchange) {
                    attrs.onchange = this.options.onchange;
                }
                if (this[setup_function]) {
                    var no_skip = this[setup_function].call(this, field_name, field, attrs);
                    if (!no_skip)
                        continue;
                }
                if (this.getType() == 'customfields-list') {
                    // No label, cust widget
                    attrs.readonly = true;
                    // Widget tooltips don't work in nextmatch because of the creation / binding separation
                    // Set title to field label so browser will show something
                    // Add field label & help as data attribute to row, so it can be stylied with CSS (title should be disabled)
                    row.attr('title', field.label);
                    row.attr('data-label', field.label);
                    row.attr('data-field', field_name);
                    row.attr('data-help', field.help);
                    this.detachedNodes.push(row[0]);
                }
                else {
                    // Label in first column, widget in 2nd
                    cf.text(field.label + "");
                    cf = jQuery(document.createElement("td"))
                        .appendTo(row);
                }
                this.rows[id] = cf[0];
                // Set any additional attributes set in options, but not for widgets that pass actual options
                if (['select', 'radio', 'radiogroup', 'checkbox', 'button'].indexOf(field.type) == -1 && !jQuery.isEmptyObject(field.values)) {
                    var w = et2_registry[attrs.type ? attrs.type : field.type];
                    for (var attr_name in field.values) {
                        if (typeof w._attributes[attr_name] != "undefined") {
                            attrs[attr_name] = field.values[attr_name];
                        }
                    }
                }
                // Create widget
                var widget = this.widgets[field_name] = et2_createWidget(attrs.type ? attrs.type : field.type, attrs, this);
            }
            // Field is not to be shown
            if (!this.options.fields || jQuery.isEmptyObject(this.options.fields) || this.options.fields[field_name] == true) {
                jQuery(this.rows[field_name]).show();
            }
            else {
                jQuery(this.rows[field_name]).hide();
            }
        }
    };
    /**
     * Read needed info on available custom fields from various places it's stored.
     */
    et2_customfields_list.prototype.transformAttributes = function (_attrs) {
        _super.prototype.transformAttributes.call(this, _attrs);
        // Add in settings that are objects
        // Customized settings for this widget (unlikely)
        var data = this.getArrayMgr("modifications").getEntry(this.id);
        // Check for global settings
        var global_data = this.getArrayMgr("modifications").getRoot().getEntry('~custom_fields~', true);
        if (global_data) {
            for (var key_1 in data) {
                // Don't overwrite fields with global values
                if (global_data[key_1] && key_1 !== 'fields') {
                    data[key_1] = jQuery.extend(true, {}, data[key_1], global_data[key_1]);
                }
            }
        }
        for (var key in data) {
            _attrs[key] = data[key];
        }
        for (var key_2 in global_data) {
            if (typeof global_data[key_2] != 'undefined' && !_attrs[key_2])
                _attrs[key_2] = global_data[key_2];
        }
        if (this.id) {
            // Set the value for this element
            var contentMgr = this.getArrayMgr("content");
            if (contentMgr != null) {
                var val = contentMgr.getEntry(this.id);
                _attrs["value"] = {};
                if (val !== null) {
                    if (this.id.indexOf(et2_customfields_list.PREFIX) === 0 && typeof data.fields != 'undefined' && data.fields[this.id.replace(et2_customfields_list.PREFIX, '')] === true) {
                        _attrs['value'][this.id] = val;
                    }
                    else {
                        // Only set the values that match desired custom fields
                        for (var key_3 in val) {
                            if (key_3.indexOf(et2_customfields_list.PREFIX) == 0) {
                                _attrs["value"][key_3] = val[key_3];
                            }
                        }
                    }
                    //_attrs["value"] = val;
                }
                else {
                    // Check for custom fields directly in record
                    for (var key in _attrs.customfields) {
                        _attrs["value"][et2_customfields_list.PREFIX + key] = contentMgr.getEntry(et2_customfields_list.PREFIX + key);
                    }
                }
            }
        }
    };
    et2_customfields_list.prototype.loadFromXML = function (_node) {
        this.loadFields();
        // Load the nodes as usual
        _super.prototype.loadFromXML.call(this, _node);
    };
    et2_customfields_list.prototype.set_value = function (_value) {
        if (!this.options.customfields)
            return;
        for (var field_name in this.options.customfields) {
            // Skip fields if we're filtering
            if (!jQuery.isEmptyObject(this.options.fields) && !this.options.fields[field_name])
                continue;
            // Make sure widget is created, and has the needed function
            if (!this.widgets[field_name] || !this.widgets[field_name].set_value)
                continue;
            var value = _value[et2_customfields_list.PREFIX + field_name] ? _value[et2_customfields_list.PREFIX + field_name] : null;
            // Check if ID was missing
            if (value == null && this.id == et2_customfields_list.DEFAULT_ID && this.getArrayMgr("content").getEntry(et2_customfields_list.PREFIX + field_name)) {
                value = this.getArrayMgr("content").getEntry(et2_customfields_list.PREFIX + field_name);
            }
            switch (this.options.customfields[field_name].type) {
                case 'date':
                    // Date custom fields are always in Y-m-d, which seldom matches user's preference
                    // which fails when sent to date widget.  This is only used for nm rows, when possible
                    // this is fixed server side
                    if (value && isNaN(value)) {
                        value = jQuery.datepicker.parseDate("yy-mm-dd", value);
                    }
                    break;
            }
            this.widgets[field_name].set_value(value);
        }
    };
    /**
     * et2_IInput so the custom field can be it's own widget.
     */
    et2_customfields_list.prototype.getValue = function () {
        // Not using an ID means we have to grab all the widget values, and put them where server knows to look
        if (this.id != et2_customfields_list.DEFAULT_ID) {
            return null;
        }
        var value = {};
        for (var field_name in this.widgets) {
            if (this.widgets[field_name].getValue && !this.widgets[field_name].options.readonly) {
                value[et2_customfields_list.PREFIX + field_name] = this.widgets[field_name].getValue();
            }
        }
        return value;
    };
    et2_customfields_list.prototype.isDirty = function () {
        var dirty = true;
        for (var field_name in this.widgets) {
            if (this.widgets[field_name].isDirty) {
                dirty = dirty && this.widgets[field_name].isDirty();
            }
        }
        return dirty;
    };
    et2_customfields_list.prototype.resetDirty = function () {
        for (var field_name in this.widgets) {
            if (this.widgets[field_name].resetDirty) {
                this.widgets[field_name].resetDirty();
            }
        }
    };
    et2_customfields_list.prototype.isValid = function () {
        // Individual customfields will handle themselves
        return true;
    };
    /**
     * Adapt provided attributes to match options for widget
     *
     * rows > 1 --> textarea, with rows=rows and cols=len
     * !rows    --> input, with size=len
     * rows = 1 --> input, with size=len, maxlength=len
     */
    et2_customfields_list.prototype._setup_text = function (field_name, field, attrs) {
        // No label on the widget itself
        delete (attrs.label);
        field.type = 'textbox';
        attrs.rows = field.rows > 1 ? field.rows : null;
        if (field.len) {
            attrs.size = field.len;
            if (field.rows == 1)
                attrs.maxlength = field.len;
        }
        return true;
    };
    et2_customfields_list.prototype._setup_ajax_select = function (field_name, field, attrs) {
        var attributes = ['get_rows', 'get_title', 'id_field', 'template'];
        if (field.values) {
            for (var i = 0; i < attributes.length; i++) {
                if (typeof field.values[attributes[i]] !== 'undefined') {
                    attrs[attributes[i]] = field.values[attributes[i]];
                }
            }
        }
        return true;
    };
    et2_customfields_list.prototype._setup_float = function (field_name, field, attrs) {
        // No label on the widget itself
        delete (attrs.label);
        field.type = 'float';
        if (field.len) {
            attrs.size = field.len;
        }
        return true;
    };
    et2_customfields_list.prototype._setup_select = function (field_name, field, attrs) {
        // No label on the widget itself
        delete (attrs.label);
        attrs.rows = field.rows;
        // select_options are now send from server-side incl. ones defined via a file in EGroupware root
        attrs.tags = field.tags;
        return true;
    };
    et2_customfields_list.prototype._setup_select_account = function (field_name, field, attrs) {
        attrs.empty_label = egw.lang('Select');
        if (field.account_type) {
            attrs.account_type = field.account_type;
        }
        return this._setup_select(field_name, field, attrs);
    };
    et2_customfields_list.prototype._setup_date = function (field_name, field, attrs) {
        attrs.data_format = field.values && field.values.format ? field.values.format : 'Y-m-d';
        return true;
    };
    et2_customfields_list.prototype._setup_date_time = function (field_name, field, attrs) {
        attrs.data_format = field.values && field.values.format ? field.values.format : 'Y-m-d H:i:s';
        return true;
    };
    et2_customfields_list.prototype._setup_htmlarea = function (field_name, field, attrs) {
        attrs.config = field.config ? field.config : {};
        attrs.config.toolbarStartupExpanded = false;
        if (field.len) {
            attrs.config.width = field.len + 'px';
        }
        attrs.config.height = (((field.rows > 0 && field.rows != 'undefined') ? field.rows : 5) * 16) + 'px';
        // We have to push the config modifications into the modifications array, or they'll
        // be overwritten by the site config from the server
        var data = this.getArrayMgr("modifications").getEntry(et2_customfields_list.PREFIX + field_name);
        if (data)
            jQuery.extend(data.config, attrs.config);
        return true;
    };
    et2_customfields_list.prototype._setup_radio = function (field_name, field, attrs) {
        // 'Empty' label will be first
        delete (attrs.label);
        if (field.values && field.values['']) {
            attrs.label = field.values[''];
            delete field.values[''];
        }
        field.type = 'radiogroup';
        attrs.options = field.values;
        return true;
    };
    et2_customfields_list.prototype._setup_checkbox = function (field_name, field, attrs) {
        // Read-only checkbox is just text
        if (attrs.readonly) {
            attrs.ro_true = field.label;
        }
        return true;
    };
    /**
     * People set button attributes as
     * label: javascript
     */
    et2_customfields_list.prototype._setup_button = function (field_name, field, attrs) {
        // No label on the widget itself
        delete (attrs.label);
        attrs.label = field.label;
        if (this.getType() == 'customfields-list') {
            // No buttons in a list, it causes problems with detached nodes
            return false;
        }
        // Simple case, one widget for a custom field
        if (!field.values || typeof field.values != 'object' || Object.keys(field.values).length == 1) {
            for (var key_4 in field.values) {
                attrs.label = key_4;
                attrs.onclick = field.values[key_4];
            }
            if (!attrs.label) {
                attrs.label = 'No "label=onclick" in values!';
                attrs.onclick = function () { return false; };
            }
            return !attrs.readonly;
        }
        else {
            // Complicated case, a single custom field you get multiple widgets
            // Handle it all here, since this is the exception
            var row = jQuery('tr', this.tbody).last();
            var cf = jQuery('td', row);
            // Label in first column, widget in 2nd
            cf.text(field.label + "");
            cf = jQuery(document.createElement("td"))
                .appendTo(row);
            for (var key in field.values) {
                var button_attrs = jQuery.extend({}, attrs);
                button_attrs.label = key;
                button_attrs.onclick = field.values[key];
                button_attrs.id = attrs.id + '_' + key;
                // This controls where the button is placed in the DOM
                this.rows[button_attrs.id] = cf[0];
                // Do not store in the widgets list, one name for multiple widgets would cause problems
                /*this.widgets[field_name] = */ et2_createWidget(attrs.type ? attrs.type : field.type, button_attrs, this);
            }
            return false;
        }
    };
    et2_customfields_list.prototype._setup_link_entry = function (field_name, field, attrs) {
        if (field.type === 'filemanager') {
            return this._setup_filemanager(field_name, field, attrs);
        }
        // No label on the widget itself
        delete (attrs.label);
        attrs.type = "link-entry";
        attrs.only_app = field.type;
        return true;
    };
    et2_customfields_list.prototype._setup_filemanager = function (field_name, field, attrs) {
        attrs.type = 'vfs-upload';
        delete (attrs.label);
        if (this.getType() == 'customfields-list') {
            // No special UI needed?
            return true;
        }
        else {
            // Complicated case, a single custom field you get multiple widgets
            // Handle it all here, since this is the exception
            var row = jQuery('tr', this.tbody).last();
            var cf = jQuery('td', row);
            // Label in first column, widget in 2nd
            cf.text(field.label + "");
            cf = jQuery(document.createElement("td"))
                .appendTo(row);
            // Create upload widget
            var widget = this.widgets[field_name] = et2_createWidget(attrs.type ? attrs.type : field.type, attrs, this);
            // This controls where the widget is placed in the DOM
            this.rows[attrs.id] = cf[0];
            jQuery(widget.getDOMNode(widget)).css('vertical-align', 'top');
            // Add a link to existing VFS file
            var select_attrs = jQuery.extend({}, attrs, 
            // Filemanager select
            {
                label: '',
                mode: widget.options.multiple ? 'open-multiple' : 'open',
                method: 'EGroupware\\Api\\Etemplate\\Widget\\Link::ajax_link_existing',
                method_id: attrs.path,
                button_label: egw.lang('Link')
            }, { type: 'vfs-select' });
            select_attrs.id = attrs.id + '_vfs_select';
            // This controls where the button is placed in the DOM
            this.rows[select_attrs.id] = cf[0];
            // Do not store in the widgets list, one name for multiple widgets would cause problems
            widget = et2_createWidget(select_attrs.type, select_attrs, this);
            jQuery(widget.getDOMNode(widget)).css('vertical-align', 'top').prependTo(cf);
        }
        return false;
    };
    /**
     * Set which fields are visible, by name
     *
     * Note: no # prefix on the name
     *
     */
    et2_customfields_list.prototype.set_visible = function (_fields) {
        for (var name_1 in _fields) {
            if (this.rows[et2_customfields_list.PREFIX + name_1]) {
                if (_fields[name_1]) {
                    jQuery(this.rows[et2_customfields_list.PREFIX + name_1]).show();
                }
                else {
                    jQuery(this.rows[et2_customfields_list.PREFIX + name_1]).hide();
                }
            }
            this.options.fields[name_1] = _fields[name_1];
        }
    };
    /**
     * Code for implementing et2_IDetachedDOM
     */
    et2_customfields_list.prototype.getDetachedAttributes = function (_attrs) {
        _attrs.push("value", "class");
    };
    et2_customfields_list.prototype.getDetachedNodes = function () {
        return this.detachedNodes ? this.detachedNodes : [];
    };
    et2_customfields_list.prototype.setDetachedAttributes = function (_nodes, _values) {
        // Individual widgets are detected and handled by the grid, but the interface is needed for this to happen
        // Show the row if there's a value, hide it if there is no value
        for (var i = 0; i < _nodes.length; i++) {
            // toggle() needs a boolean to do what we want
            var key = _nodes[i].getAttribute('data-field');
            jQuery(_nodes[i]).toggle(_values.fields[key] && _values.value[et2_customfields_list.PREFIX + key] ? true : false);
        }
    };
    et2_customfields_list._attributes = {
        'customfields': {
            'name': 'Custom fields',
            'description': 'Auto filled',
            'type': 'any'
        },
        'fields': {
            'name': 'Custom fields',
            'description': 'Auto filled',
            'type': 'any'
        },
        'value': {
            'name': 'Custom fields',
            'description': 'Auto filled',
            'type': "any"
        },
        'type_filter': {
            'name': 'Field filter',
            "default": "",
            "type": "any",
            "description": "Filter displayed custom fields by their 'type2' attribute"
        },
        'private': {
            ignore: true,
            type: 'boolean'
        },
        'sub_app': {
            'name': 'sub app name',
            'type': "string",
            'description': "Name of sub application"
        },
        // Allow onchange so you can put handlers on the sub-widgets
        'onchange': {
            "name": "onchange",
            "type": "string",
            "default": et2_no_init,
            "description": "JS code which is executed when the value changes."
        }
    };
    et2_customfields_list.PREFIX = '#';
    et2_customfields_list.DEFAULT_ID = "custom_fields";
    return et2_customfields_list;
}(et2_core_valueWidget_1.et2_valueWidget));
exports.et2_customfields_list = et2_customfields_list;
et2_core_widget_1.et2_register_widget(et2_customfields_list, ["customfields", "customfields-list"]);
//# sourceMappingURL=et2_extension_customfields.js.map