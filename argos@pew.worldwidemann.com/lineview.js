/*
 * Argos - Display the output of arbitrary programs in the GNOME Shell panel
 *
 * Copyright (c) 2016 Philipp Emanuel Weidmann <pew@worldwidemann.com>
 *
 * Nemo vir est qui mundum non reddat meliorem.
 *
 * Released under the terms of the GNU General Public License, version 3
 * (https://gnu.org/licenses/gpl.html)
 */

const Lang = imports.lang;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const GdkPixbuf = imports.gi.GdkPixbuf;
const St = imports.gi.St;
const Clutter = imports.gi.Clutter;

const ArgosLineView = new Lang.Class({
  Name: "ArgosLineView",
  Extends: St.BoxLayout,

  _init: function() {
    this.parent({
      // Value from the default GNOME Shell theme (class "popup-menu-item")
      style: "spacing: 12px;"
    });
  },

  setLine: function(line) {
    this.remove_all_children();

    if (line.hasOwnProperty("iconName")) {
      this.add_child(new St.Icon({
        style_class: "popup-menu-icon",
        icon_name: line.iconName
      }));
    }

    if (line.hasOwnProperty("image") || line.hasOwnProperty("templateImage")) {
      let image = line.hasOwnProperty("image") ? line.image : line.templateImage;

      // Source: https://github.com/GNOME/gnome-maps (mapSource.js)
      let bytes = GLib.Bytes.new(GLib.base64_decode(image));
      let stream = Gio.MemoryInputStream.new_from_bytes(bytes);

      try {
        let pixbuf = GdkPixbuf.Pixbuf.new_from_stream(stream, null);

        // TextureCache.load_gicon returns a square texture no matter what the Pixbuf's
        // actual dimensions are, so we request a size that can hold all pixels of the
        // image and then resize manually afterwards
        let size = Math.max(pixbuf.width, pixbuf.height);
        let texture = St.TextureCache.get_default().load_gicon(null, pixbuf, size, 1);
        texture.set_size(pixbuf.width, pixbuf.height);

        this.add_child(texture);
        // Do not stretch the texture to the height of the container
        this.child_set_property(texture, "y-fill", false);
      } catch (error) {
        log("Unable to load image from Base64 representation: " + error);
      }
    }

    if (line.markup.length > 0) {
      let label = new St.Label({
        y_expand: true,
        y_align: Clutter.ActorAlign.CENTER
      });

      this.add_child(label);

      let clutterText = label.get_clutter_text();
      clutterText.use_markup = true;
      clutterText.text = line.markup;
    }
  }
});
